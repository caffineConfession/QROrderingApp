
"use server";

import prisma from "@/lib/prisma";
import type { CustomerDetails, CartItemClient } from "@/types";
import { ItemCategory, PaymentMethod, OrderStatus, PaymentStatus, OrderSource } from "@/types";
import { revalidatePath } from "next/cache";

interface SubmitCustomerOrderData {
  customerDetails: CustomerDetails;
  items: CartItemClient[];
  totalAmount: number;
  paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay; // Restrict to customer available methods
}

export async function submitCustomerOrderAction(
  data: SubmitCustomerOrderData
): Promise<{ success: boolean; orderId?: string; error?: string; paymentMethod?: PaymentMethod }> {
  if (data.items.length === 0) {
    return { success: false, error: "Order must contain at least one item." };
  }

  try {
    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerDetails.name,
        customerPhone: data.customerDetails.phone,
        customerEmail: data.customerDetails.email,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === PaymentMethod.Cash ? PaymentStatus.PENDING : PaymentStatus.PENDING, // Razorpay will also be pending initially
        status: data.paymentMethod === PaymentMethod.Cash ? OrderStatus.AWAITING_PAYMENT_CONFIRMATION : OrderStatus.AWAITING_PAYMENT_CONFIRMATION, // Razorpay would also wait for payment
        orderSource: OrderSource.CUSTOMER_ONLINE,
        items: {
          create: data.items.map((item) => ({
            productId: item.id, // ProductMenuItem id is the productId
            productName: item.name,
            category: item.category,
            servingType: item.servingType,
            quantity: item.quantity,
            priceAtPurchase: item.price,
            customization: item.customization,
          })),
        },
      },
    });

    if (data.paymentMethod === PaymentMethod.Cash) {
      revalidatePath("/admin/manual-order"); // To refresh pending cash orders list for admin
    }
    // Potentially revalidate other paths if needed, e.g., a customer's order history page

    return { success: true, orderId: newOrder.id, paymentMethod: data.paymentMethod };
  } catch (error) {
    console.error("Error submitting customer order:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to submit order: ${error.message}` };
    }
    return { success: false, error: "Failed to submit order due to an unexpected error." };
  }
}
