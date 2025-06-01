
"use server";

import prisma from "@/lib/prisma";
import type { ManualOrderSubmitData, PendingCashOrderView } from "@/types";
// Import enums used in Prisma queries from @prisma/client
import { OrderStatus, PaymentStatus, OrderSource, PaymentMethod, ItemCategory as PrismaItemCategory, ItemServingType as PrismaItemServingType } from "@prisma/client";
// Keep ItemCategory from "@/types" for data that doesn't directly go into Prisma query with that specific enum name if needed, or alias Prisma's
import type { ItemCategory } from "@/types"; // For productInfo.category mapping if needed

import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { COFFEE_FLAVORS_BASE, SHAKE_FLAVORS_BASE } from '@/lib/constants';

// Assuming COFFEE_FLAVORS_BASE and SHAKE_FLAVORS_BASE use ItemCategory from @/types
const ALL_MENU_ITEMS_FLAT = [
  ...COFFEE_FLAVORS_BASE.map(item => ({ ...item, category: item.category as unknown as PrismaItemCategory })), // Cast if necessary
  ...SHAKE_FLAVORS_BASE.map(item => ({ ...item, category: item.category as unknown as PrismaItemCategory })), // Cast if necessary
];


export async function createManualOrderAction(
  data: ManualOrderSubmitData
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.userId) {
    return { success: false, error: "Unauthorized. Admin session not found." };
  }

  if (data.items.length === 0) {
    return { success: false, error: "Order must contain at least one item." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod, 
          paymentStatus: PaymentStatus.PAID, 
          status: OrderStatus.PENDING_PREPARATION, 
          orderSource: OrderSource.STAFF_MANUAL, 
          takenById: session.userId,
          items: {
            create: data.items.map((item) => {
              const productInfo = ALL_MENU_ITEMS_FLAT.find(p => p.id === item.productId);
              if (!productInfo) {
                  throw new Error(`Product with ID ${item.productId} not found in local constants. Ensure product exists in DB for stock operations.`);
              }
              // Ensure item.servingType is compatible with PrismaItemServingType
              const servingType = item.servingType as PrismaItemServingType;

              return {
                productId: item.productId,
                productName: productInfo.name,
                category: productInfo.category, 
                servingType: servingType, 
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
                customization: item.customization, 
              };
            }),
          },
        },
      });

      // Deduct stock for each item
      for (const item of data.items) {
        const servingType = item.servingType as PrismaItemServingType;
        const menuItem = await tx.menuItem.update({
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
          select: { stockQuantity: true, isAvailable: true }, // Select isAvailable as well
        });

        // If stock is 0 or less and item was available, mark as unavailable
        if (menuItem.stockQuantity <= 0 && menuItem.isAvailable) {
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
      return { success: true, orderId: newOrder.id };
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/manual-order");
    // Also revalidate product menu pages as stock might have changed
    data.items.forEach(item => {
        revalidatePath(`/admin/products/${item.productId}/menu`);
    });
    revalidatePath("/admin/products");


    return result;

  } catch (error) {
    console.error("Error creating manual order:", error);
    if (error instanceof Error) {
        // Check for specific Prisma error related to stock (e.g., if a CHECK constraint was violated)
        if (error.message.includes("constraint")) { // Basic check, Prisma might have more specific error codes
             return { success: false, error: `Failed to create order: Insufficient stock or data issue.` };
        }
        return { success: false, error: `Failed to create order: ${error.message}` };
    }
    return { success: false, error: "Failed to create order due to an unexpected error." };
  }
}


export async function getPendingCashOrdersAction(): Promise<{ success: boolean; orders?: PendingCashOrderView[]; error?: string; }> {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.Cash, 
        paymentStatus: PaymentStatus.PENDING, 
        orderSource: OrderSource.CUSTOMER_ONLINE, 
        status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION, 
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            servingType: true,
            customization: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedOrders: PendingCashOrderView[] = pendingOrders.map(order => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: order.totalAmount,
      orderDate: order.createdAt,
      itemsSummary: order.items.map(item => `${item.productName} (${item.servingType}) x ${item.quantity}`).join(', '),
    }));

    return {
      success: true,
      orders: formattedOrders
    };
  } catch (error) {
    console.error("Error fetching pending cash orders:", error);
    return { success: false, error: "Failed to fetch pending cash orders.", orders: [] };
  }
}

export async function confirmCashPaymentAction(orderId: string): Promise<{ success: boolean; error?: string }> {
    const sessionCookie = cookies().get("admin_session")?.value;
    const session = await decryptSession(sessionCookie);

    if (!session?.userId) {
        return { success: false, error: "Unauthorized. Admin session not found." };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const orderToUpdate = await tx.order.findUnique({
                where: {
                  id: orderId,
                  paymentMethod: PaymentMethod.Cash, 
                  paymentStatus: PaymentStatus.PENDING, 
                  status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION, 
                },
                include: {
                    items: true, // Crucial to get items for stock deduction
                }
            });

            if (!orderToUpdate) {
                // Check current state if not found with specific criteria for better error message
                const orderExists = await tx.order.findUnique({ where: { id: orderId }});
                if (!orderExists) return { success: false, error: "Order not found." };
                if (orderExists.paymentStatus === PaymentStatus.PAID) return { success: false, error: "Order already paid."};
                if (orderExists.status !== OrderStatus.AWAITING_PAYMENT_CONFIRMATION) return { success: false, error: `Order status is ${orderExists.status}, cannot confirm payment.`};
                return { success: false, error: "Order not eligible for payment confirmation." };
            }

            await tx.order.update({
                where: {
                  id: orderId,
                },
                data: {
                    paymentStatus: PaymentStatus.PAID, 
                    status: OrderStatus.PENDING_PREPARATION, 
                    processedById: session.userId,
                    updatedAt: new Date(),
                },
            });

            // Deduct stock for each item in the confirmed order
            const productIdsToRevalidate = new Set<string>();
            for (const item of orderToUpdate.items) {
                const servingType = item.servingType as PrismaItemServingType;
                const menuItem = await tx.menuItem.update({
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

                if (menuItem.stockQuantity <= 0 && menuItem.isAvailable) {
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
            return { success: true, productIdsToRevalidate: Array.from(productIdsToRevalidate) };
        });
        

        revalidatePath("/admin/manual-order"); // For the pending orders list
        revalidatePath("/admin/orders"); // For the main orders list
        if (result.success && result.productIdsToRevalidate) {
            result.productIdsToRevalidate.forEach(productId => {
                revalidatePath(`/admin/products/${productId}/menu`);
            });
            revalidatePath("/admin/products");
        }


        return { success: result.success }; // Remove productIdsToRevalidate from final return

    } catch (error) {
        console.error("Error confirming cash payment:", error);
        if (error instanceof Error) {
             if (error.message.includes("constraint")) { 
                 return { success: false, error: `Failed to confirm payment: Insufficient stock or data issue.` };
            }
            return { success: false, error: `Failed to confirm payment: ${error.message}` };
        }
        return { success: false, error: "Failed to confirm payment due to an unexpected error." };
    }
}

