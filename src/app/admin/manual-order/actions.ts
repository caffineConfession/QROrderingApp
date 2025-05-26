
"use server";

import prisma from "@/lib/prisma";
import type { ManualOrderSubmitData } from "@/types";
import { OrderStatus, PaymentStatus, OrderSource, PaymentMethod, ItemCategory } from "@/types";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { COFFEE_FLAVORS_BASE, SHAKE_FLAVORS_BASE } from '@/lib/constants'; // Ensure correct import path

// Helper to get product info - needed for the server action.
// This should match the structure in constants.ts
const ALL_MENU_ITEMS_FLAT = [
  ...COFFEE_FLAVORS_BASE.map(item => ({ ...item, category: ItemCategory.COFFEE })),
  ...SHAKE_FLAVORS_BASE.map(item => ({ ...item, category: ItemCategory.SHAKES })),
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
        paymentMethod: data.paymentMethod, // Cash or UPI
        paymentStatus: PaymentStatus.PAID, // Assume payment confirmed on spot for manual orders
        status: OrderStatus.PENDING_PREPARATION, // Ready for kitchen
        orderSource: OrderSource.STAFF_MANUAL,
        takenById: session.userId, // Link to the admin who took the order
        items: {
          create: data.items.map((item) => {
            // Find product details from constants to get category and name
            const productInfo = ALL_MENU_ITEMS_FLAT.find(p => p.id === item.productId);
            if (!productInfo) {
                // This should ideally not happen if product IDs are validated client-side
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            return {
              productId: item.productId,
              productName: productInfo.name,
              category: productInfo.category, // This should be the enum value, e.g. ItemCategory.COFFEE
              servingType: item.servingType,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
              customization: item.customization,
            };
          }),
        },
      },
    });

    // Optionally, revalidate paths if you have a live order feed somewhere
    revalidatePath("/admin/orders"); // If order processors see this list
    revalidatePath("/admin/manual-order"); // To clear any forms or update UI

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error("Error creating manual order:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to create order: ${error.message}` };
    }
    return { success: false, error: "Failed to create order due to an unexpected error." };
  }
}


// Placeholder function to simulate fetching pending cash orders
// In a real app, this would query the database for orders with
// orderSource: CUSTOMER_ONLINE, paymentMethod: Cash, paymentStatus: PENDING
export async function getPendingCashOrdersAction(): Promise<{ success: boolean; orders?: any[]; error?: string; }> {
  // MOCK DATA for now
  // This should query:
  // prisma.order.findMany({
  //   where: {
  //     paymentMethod: PaymentMethod.Cash,
  //     paymentStatus: PaymentStatus.PENDING,
  //     orderSource: OrderSource.CUSTOMER_ONLINE,
  //     status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION,
  //   },
  //   select: { id: true, customerName: true, customerPhone: true, totalAmount: true, createdAt: true, items: { select: { productName: true, quantity: true, servingType: true, customization: true}}},
  //   orderBy: { createdAt: 'asc' }
  // })
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  try {
    // MOCK IMPLEMENTATION
    const mockOrders = [
      { id: "MOCK_CASH_001", customerName: "Mock Customer Cash", customerPhone: "9876543210", totalAmount: 280, orderDate: new Date(Date.now() - 1000 * 60 * 15) , itemsSummary: "Vanilla Coffee (Cup) x 1, Oreo Shake (Cone) x 1" },
      { id: "MOCK_CASH_002", customerName: "Mock Cash Buyer", customerPhone: "9876500000", totalAmount: 150, orderDate: new Date(Date.now() - 1000 * 60 * 5), itemsSummary: "Original Coffee (Cup) x 1" },
    ];
    return {
      success: true,
      orders: mockOrders
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
        const updatedOrder = await prisma.order.updateMany({ // use updateMany if you are not sure if the order exists or want to avoid error if it doesn't
            where: {
              id: orderId,
              // orderSource: OrderSource.CUSTOMER_ONLINE, // Only online customer orders are confirmed this way
              paymentMethod: PaymentMethod.Cash,
              paymentStatus: PaymentStatus.PENDING,
              status: OrderStatus.AWAITING_PAYMENT_CONFIRMATION,
            },
            data: {
                paymentStatus: PaymentStatus.PAID,
                status: OrderStatus.PENDING_PREPARATION, // Now ready for the kitchen
                // processedById: session.userId, // Or a different field for who confirmed payment
                updatedAt: new Date(),
            },
        });

        if (updatedOrder.count === 0) {
            // Check if the order exists but was already processed or not eligible
            const orderExists = await prisma.order.findUnique({ where: { id: orderId }});
            if (!orderExists) return { success: false, error: "Order not found." };
            if (orderExists.paymentStatus === PaymentStatus.PAID) return { success: false, error: "Order already paid."};
            return { success: false, error: "Order not eligible for payment confirmation or already processed." };
        }

        revalidatePath("/admin/manual-order"); // To refresh the list of pending orders
        revalidatePath("/admin/orders"); // So order processors see it

        return { success: true };
    } catch (error) {
        console.error("Error confirming cash payment:", error);
        if (error instanceof Error) {
            return { success: false, error: `Failed to confirm payment: ${error.message}` };
        }
        return { success: false, error: "Failed to confirm payment due to an unexpected error." };
    }
}
