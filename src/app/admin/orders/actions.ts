
"use server";

import prisma from "@/lib/prisma";
import { OrderStatus, PaymentStatus, ItemServingType as PrismaItemServingType } from "@prisma/client"; 
import type { AdminRole } from "@/types"; 
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { Order, OrderItem } from "@prisma/client";

export interface ProcessableOrder extends Order {
  items: OrderItem[];
}

export async function getProcessableOrdersAction(): Promise<{
  success: boolean;
  orders?: ProcessableOrder[];
  error?: string;
}> {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.role || (session.role !== "ORDER_PROCESSOR" && session.role !== "BUSINESS_MANAGER")) {
    return { success: false, error: "Unauthorized: Insufficient privileges." };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID, 
        status: {
          in: [
            OrderStatus.PENDING_PREPARATION, 
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
          ],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching processable orders:", error);
     if (error instanceof prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Message:", error.message);
      return { success: false, error: `Failed to fetch orders. Database error: ${error.message}` };
    } else if (error instanceof Error) {
      return { success: false, error: `Failed to fetch orders: ${error.message}` };
    }
    return { success: false, error: "Failed to fetch orders due to an unexpected error." };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus 
): Promise<{ success: boolean; error?: string }> {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.role || (session.role !== "ORDER_PROCESSOR" && session.role !== "BUSINESS_MANAGER")) {
    return { success: false, error: "Unauthorized: Insufficient privileges." };
  }

  const allowedStatusesForUpdate: OrderStatus[] = [
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ];
  if (!allowedStatusesForUpdate.includes(newStatus)) {
    return { success: false, error: "Invalid target status." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ 
        where: { id: orderId },
        include: { items: true } 
      });

      if (!order) {
        throw new Error("Order not found.");
      }

      if (order.status === OrderStatus.PENDING_PREPARATION && newStatus !== OrderStatus.PREPARING && newStatus !== OrderStatus.CANCELLED) {
          throw new Error(`Cannot change status from ${order.status} to ${newStatus}. Expected PREPARING or CANCELLED.`);
      }
      if (order.status === OrderStatus.PREPARING && newStatus !== OrderStatus.READY_FOR_PICKUP && newStatus !== OrderStatus.CANCELLED) {
          throw new Error(`Cannot change status from ${order.status} to ${newStatus}. Expected READY_FOR_PICKUP or CANCELLED.`);
      }
      if (order.status === OrderStatus.READY_FOR_PICKUP && newStatus !== OrderStatus.COMPLETED && newStatus !== OrderStatus.CANCELLED) { 
          throw new Error(`Cannot change status from ${order.status} to ${newStatus}. Expected COMPLETED or CANCELLED.`);
      }
      if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
          throw new Error(`Order is already ${order.status} and cannot be changed.`);
      }
      
      const productIdsToRevalidate = new Set<string>();
      if (newStatus === OrderStatus.COMPLETED) {
        if (!order.items || order.items.length === 0) {
          throw new Error("Order has no items to fulfill.");
        }

        for (const item of order.items) {
          const menuItem = await tx.menuItem.findUnique({
            where: { 
              productId_servingType: {
                productId: item.productId,
                servingType: item.servingType as PrismaItemServingType,
              }
            },
            select: { stockQuantity: true, product: { select: { name: true } } }
          });

          if (!menuItem) {
            throw new Error(`Menu item ${item.productName} (${item.servingType}) not found for stock check.`);
          }
          if (menuItem.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.productName} (${item.servingType}). Available: ${menuItem.stockQuantity}, Ordered: ${item.quantity}.`);
          }
        }

        for (const item of order.items) {
          const servingType = item.servingType as PrismaItemServingType;
          const updatedMenuItem = await tx.menuItem.update({
            where: {
              productId_servingType: {
                productId: item.productId,
                servingType: servingType,
              },
            },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
            select: { stockQuantity: true, isAvailable: true },
          });
          
          productIdsToRevalidate.add(item.productId);

          if (updatedMenuItem.stockQuantity <= 0 && updatedMenuItem.isAvailable) {
            await tx.menuItem.update({
              where: {
                productId_servingType: {
                  productId: item.productId,
                  servingType: servingType,
                },
              },
              data: {
                isAvailable: false,
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          processedById: session.userId, 
          updatedAt: new Date(),
        },
      });

      return { success: true, productIdsToRevalidate: Array.from(productIdsToRevalidate) };
    });

    revalidatePath("/admin/orders");
    if (result.success && result.productIdsToRevalidate && result.productIdsToRevalidate.length > 0) {
        result.productIdsToRevalidate.forEach(productId => {
            revalidatePath(`/admin/products/${productId}/menu`);
        });
        revalidatePath("/admin/products");
    }

    return { success: true };

  } catch (error) {
    console.error("Error updating order status:", error);
    if (error instanceof Error) {
        if (error.message.includes("constraint") || error.message.toLowerCase().includes("stock")) { 
             return { success: false, error: `Failed to update status: ${error.message}` };
        }
        return { success: false, error: `Failed to update status: ${error.message}` };
    }
    return { success: false, error: "Failed to update order status due to an unexpected error." };
  }
}

