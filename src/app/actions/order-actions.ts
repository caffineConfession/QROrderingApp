
"use server";

import prisma from "@/lib/prisma";
import type { CustomerDetails, CartItemClient } from "@/types";
// Import enums used in Prisma queries from @prisma/client
import { ItemCategory as PrismaItemCategory, PaymentMethod, OrderStatus, PaymentStatus, OrderSource } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface SubmitCustomerOrderData {
  customerDetails: CustomerDetails;
  items: CartItemClient[];
  totalAmount: number;
  paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay; // This should be Prisma's enum if used directly in Prisma create
}

export async function submitCustomerOrderAction(
  data: SubmitCustomerOrderData
): Promise<{ success: boolean; orderId?: string; error?: string; paymentMethod?: PaymentMethod }> {
  if (data.items.length === 0) {
    return { success: false, error: "Order must contain at least one item." };
  }

  try {
    // Ensure the paymentMethod from data is compatible with Prisma's PaymentMethod enum
    const prismaPaymentMethod: PaymentMethod = data.paymentMethod === "Cash" ? PaymentMethod.Cash : PaymentMethod.Razorpay;

    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerDetails.name,
        customerPhone: data.customerDetails.phone,
        customerEmail: data.customerDetails.email,
        totalAmount: data.totalAmount,
        paymentMethod: prismaPaymentMethod, // Prisma's PaymentMethod
        paymentStatus: prismaPaymentMethod === PaymentMethod.Cash ? PaymentStatus.PENDING : PaymentStatus.PENDING, // Prisma's PaymentStatus
        status: prismaPaymentMethod === PaymentMethod.Cash ? OrderStatus.AWAITING_PAYMENT_CONFIRMATION : OrderStatus.AWAITING_PAYMENT_CONFIRMATION, // Prisma's OrderStatus
        orderSource: OrderSource.CUSTOMER_ONLINE, // Prisma's OrderSource
        items: {
          create: data.items.map((item) => ({
            productId: item.id,
            productName: item.name,
            category: item.category as unknown as PrismaItemCategory, // Cast ItemCategory from @/types to Prisma's
            servingType: item.servingType, // This is ItemServingType from @prisma/client
            quantity: item.quantity,
            priceAtPurchase: item.price,
            customization: item.customization, // This is CustomizationType from @prisma/client
          })),
        },
      },
    });

    if (prismaPaymentMethod === PaymentMethod.Cash) {
      revalidatePath("/admin/manual-order"); 
    }
    // Potentially revalidate other paths if needed, e.g., a customer's order history page

    return { success: true, orderId: newOrder.id, paymentMethod: prismaPaymentMethod };
  } catch (error) {
    console.error("Error submitting customer order:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to submit order: ${error.message}` };
    }
    return { success: false, error: "Failed to submit order due to an unexpected error." };
  }
}
