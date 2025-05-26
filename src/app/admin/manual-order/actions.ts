
"use server";

import prisma from "@/lib/prisma";
import type { ManualOrderSubmitData, PendingCashOrderView } from "@/types";
// Import enums used in Prisma queries from @prisma/client
import { OrderStatus, PaymentStatus, OrderSource, PaymentMethod, ItemCategory as PrismaItemCategory } from "@prisma/client";
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
    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod, // This is PaymentMethod from @prisma/client
        paymentStatus: PaymentStatus.PAID, // This is PaymentStatus from @prisma/client
        status: OrderStatus.PENDING_PREPARATION, // This is OrderStatus from @prisma/client
        orderSource: OrderSource.STAFF_MANUAL, // This is OrderSource from @prisma/client
        takenById: session.userId,
        items: {
          create: data.items.map((item) => {
            const productInfo = ALL_MENU_ITEMS_FLAT.find(p => p.id === item.productId);
            if (!productInfo) {
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            return {
              productId: item.productId,
              productName: productInfo.name,
              category: productInfo.category, // This should be PrismaItemCategory
              servingType: item.servingType, // This is ItemServingType from @prisma/client
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
              customization: item.customization, // This is CustomizationType from @prisma/client
            };
          }),
        },
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/manual-order");

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error("Error creating manual order:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to create order: ${error.message}` };
    }
    return { success: false, error: "Failed to create order due to an unexpected error." };
  }
}


export async function getPendingCashOrdersAction(): Promise<{ success: boolean; orders?: PendingCashOrderView[]; error?: string; }> {
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.Cash, // Prisma's PaymentMethod
        paymentStatus: PaymentStatus.PENDING, // Prisma's PaymentStatus
        orderSource: OrderSource.CUSTOMER_ONLINE, // Prisma's OrderSource
        status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION, // Prisma's OrderStatus
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
        const orderToUpdate = await prisma.order.findUnique({
            where: {
              id: orderId,
              paymentMethod: PaymentMethod.Cash, // Prisma's PaymentMethod
              paymentStatus: PaymentStatus.PENDING, // Prisma's PaymentStatus
              status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION, // Prisma's OrderStatus
            }
        });

        if (!orderToUpdate) {
            const orderExists = await prisma.order.findUnique({ where: { id: orderId }});
            if (!orderExists) return { success: false, error: "Order not found." };
            if (orderExists.paymentStatus === PaymentStatus.PAID) return { success: false, error: "Order already paid."};
            // Ensure comparison uses Prisma's OrderStatus enum or its string value
            if (orderExists.status !== OrderStatus.AWAITING_PAYMENT_CONFIRMATION.toString()) return { success: false, error: `Order status is ${orderExists.status}, cannot confirm payment.`};
            return { success: false, error: "Order not eligible for payment confirmation." };
        }

        await prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
                paymentStatus: PaymentStatus.PAID, // Prisma's PaymentStatus
                status: OrderStatus.PENDING_PREPARATION, // Prisma's OrderStatus
                processedById: session.userId,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/admin/manual-order");
        revalidatePath("/admin/orders");

        return { success: true };
    } catch (error) {
        console.error("Error confirming cash payment:", error);
        if (error instanceof Error) {
            return { success: false, error: `Failed to confirm payment: ${error.message}` };
        }
        return { success: false, error: "Failed to confirm payment due to an unexpected error." };
    }
}
