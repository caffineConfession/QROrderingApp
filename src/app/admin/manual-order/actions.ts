
"use server";

import prisma from "@/lib/prisma";
import type { ManualOrderSubmitData } from "@/types";
import { OrderStatus, PaymentStatus, OrderSource, PaymentMethod } from "@/types";
import { cookies }Galia from "next/headers";
import { decryptSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
            // In a full DB setup, you might fetch product from DB by item.productId
            const productInfo = ALL_MENU_ITEMS_FLAT.find(p => p.id === item.productId);
            if (!productInfo) {
                // This should ideally not happen if product IDs are validated client-side
                throw new Error(`Product with ID ${item.productId} not found.`);
            }
            return {
              productId: item.productId,
              productName: productInfo.name, 
              category: productInfo.category,
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
  //   },
  //   select: { id: true, customerName: true, customerPhone: true, totalAmount: true, createdAt: true, items: { select: { productName: true, quantity: true, servingType: true, customization: true}}},
  //   orderBy: { createdAt: 'asc' }
  // })
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return {
    success: true,
    orders: [
      { id: "CUST_CASH_001", customerName: "Customer Cash Uno", customerPhone: "9876543210", totalAmount: 280, orderDate: new Date(Date.now() - 1000 * 60 * 15) , itemsSummary: "Vanilla Coffee (Cup) x 1, Oreo Shake (Cone) x 1" },
      { id: "CUST_CASH_002", customerName: "Cash Buyer Dos", customerPhone: "9876500000", totalAmount: 150, orderDate: new Date(Date.now() - 1000 * 60 * 5), itemsSummary: "Original Coffee (Cup) x 1" },
    ]
  };
}

export async function confirmCashPaymentAction(orderId: string): Promise<{ success: boolean; error?: string }> {
    const sessionCookie = cookies().get("admin_session")?.value;
    const session = await decryptSession(sessionCookie);

    if (!session?.userId) {
        return { success: false, error: "Unauthorized. Admin session not found." };
    }
    
    try {
        const updatedOrder = await prisma.order.update({
            where: { id: orderId, paymentMethod: PaymentMethod.Cash, paymentStatus: PaymentStatus.PENDING },
            data: {
                paymentStatus: PaymentStatus.PAID,
                status: OrderStatus.PENDING_PREPARATION, // Now ready for the kitchen
                // processedById: session.userId, // Or a different field for who confirmed payment
                updatedAt: new Date(),
            },
        });

        if (!updatedOrder) {
            return { success: false, error: "Order not found or already processed." };
        }
        
        revalidatePath("/admin/manual-order"); // To refresh the list of pending orders
        revalidatePath("/admin/orders"); // So order processors see it

        return { success: true };
    } catch (error) {
        console.error("Error confirming cash payment:", error);
        return { success: false, error: "Failed to confirm payment." };
    }
}


// Helper to get product info - needed for the server action.
// Ideally, your products would be in the DB. For now, we use constants.
const COFFEE_FLAVORS_PRODUCTS = [
  { id: "cff-van", name: "Vanilla", category: ItemCategory.COFFEE, imageHint: "vanilla coffee" },
  { id: "cff-org", name: "Original", category: ItemCategory.COFFEE, imageHint: "coffee" },
  { id: "cff-hzn", name: "Hazelnut", category: ItemCategory.COFFEE, imageHint: "hazelnut coffee" },
  { id: "cff-moc", name: "Mocha", category: ItemCategory.COFFEE, imageHint: "mocha coffee" },
  { id: "cff-crm", name: "Caramel", category: ItemCategory.COFFEE, imageHint: "caramel coffee" },
  { id: "cff-cho", name: "Chocolate", category: ItemCategory.COFFEE, imageHint: "chocolate coffee" },
];

const SHAKE_FLAVORS_PRODUCTS = [
  { id: "shk-cho", name: "Chocolate", category: ItemCategory.SHAKES, imageHint: "chocolate shake" },
  { id: "shk-kit", name: "KitKat", category: ItemCategory.SHAKES, imageHint: "kitkat shake" },
  { id: "shk-oro", name: "Oreo", category: ItemCategory.SHAKES, imageHint: "oreo shake" },
  { id: "shk-str", name: "Strawberry", category: ItemCategory.SHAKES, imageHint: "strawberry shake" },
  { id: "shk-ocf", name: "Oreo Coffee", category: ItemCategory.SHAKES, imageHint: "oreo coffee shake" },
];
const ALL_MENU_ITEMS_FLAT = [...COFFEE_FLAVORS_PRODUCTS, ...SHAKE_FLAVORS_PRODUCTS];
