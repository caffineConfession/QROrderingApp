
"use server";

import prisma from "@/lib/prisma";
import type { ManualOrderSubmitData, PendingCashOrderView } from "@/types";
// Import enums used in Prisma queries from @prisma/client
import { OrderStatus, PaymentStatus, OrderSource, PaymentMethod, ItemCategory as PrismaItemCategory, ItemServingType as PrismaItemServingType } from "@prisma/client";

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
    // Stock is no longer deducted here. It's deducted when order status changes to COMPLETED.
    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod, 
        paymentStatus: PaymentStatus.PAID, // Manual orders are considered paid immediately
        status: OrderStatus.PENDING_PREPARATION, // Ready for preparation
        orderSource: OrderSource.STAFF_MANUAL, 
        takenById: session.userId,
        items: {
          create: data.items.map((item) => {
            const productInfo = ALL_MENU_ITEMS_FLAT.find(p => p.id === item.productId);
            if (!productInfo) {
                // This check remains important for data integrity if constants are the source of truth for product names/categories.
                // If products are fully DB driven, this might fetch from DB instead.
                throw new Error(`Product with ID ${item.productId} not found in local constants.`);
            }
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

    revalidatePath("/admin/orders");
    revalidatePath("/admin/manual-order");
    // No longer revalidating product paths here as stock isn't changed.

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
        // Stock is no longer deducted here. It's deducted when order status changes to COMPLETED.
        const orderToUpdate = await prisma.order.findUnique({
            where: {
              id: orderId,
              paymentMethod: PaymentMethod.Cash, 
              paymentStatus: PaymentStatus.PENDING, 
              status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION, 
            }
            // No longer need to include items for stock deduction here.
        });

        if (!orderToUpdate) {
            const orderExists = await prisma.order.findUnique({ where: { id: orderId }});
            if (!orderExists) return { success: false, error: "Order not found." };
            if (orderExists.paymentStatus === PaymentStatus.PAID) return { success: false, error: "Order already paid."};
            if (orderExists.status !== OrderStatus.AWAITING_PAYMENT_CONFIRMATION) return { success: false, error: `Order status is ${orderExists.status}, cannot confirm payment.`};
            return { success: false, error: "Order not eligible for payment confirmation." };
        }

        await prisma.order.update({
            where: {
              id: orderId,
            },
            data: {
                paymentStatus: PaymentStatus.PAID, 
                status: OrderStatus.PENDING_PREPARATION, // Move to pending preparation
                processedById: session.userId,
                updatedAt: new Date(),
            },
        });
        
        revalidatePath("/admin/manual-order"); // For the pending orders list
        revalidatePath("/admin/orders"); // For the main orders list
        // No longer revalidating product paths here as stock isn't changed.

        return { success: true };

    } catch (error) {
        console.error("Error confirming cash payment:", error);
        if (error instanceof Error) {
            return { success: false, error: `Failed to confirm payment: ${error.message}` };
        }
        return { success: false, error: "Failed to confirm payment due to an unexpected error." };
    }
}
