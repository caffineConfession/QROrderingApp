
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
  paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay; 
}

export async function submitCustomerOrderAction(
  data: SubmitCustomerOrderData
): Promise<{ success: boolean; orderId?: string; error?: string; paymentMethod?: PaymentMethod; totalAmount?: number }> {
  if (data.items.length === 0) {
    return { success: false, error: "Order must contain at least one item." };
  }

  try {
    const prismaPaymentMethod: PaymentMethod = data.paymentMethod === "Cash" ? PaymentMethod.Cash : PaymentMethod.Razorpay;

    // For Razorpay, status is AWAITING_PAYMENT_CONFIRMATION and paymentStatus is PENDING
    // For Cash, status is also AWAITING_PAYMENT_CONFIRMATION (staff confirms it), paymentStatus PENDING
    const initialOrderStatus = OrderStatus.AWAITING_PAYMENT_CONFIRMATION;
    const initialPaymentStatus = PaymentStatus.PENDING;

    const newOrder = await prisma.order.create({
      data: {
        customerName: data.customerDetails.name,
        customerPhone: data.customerDetails.phone,
        customerEmail: data.customerDetails.email,
        totalAmount: data.totalAmount,
        paymentMethod: prismaPaymentMethod, 
        paymentStatus: initialPaymentStatus, 
        status: initialOrderStatus, 
        orderSource: OrderSource.CUSTOMER_ONLINE, 
        items: {
          create: data.items.map((item) => ({
            productId: item.id,
            productName: item.name,
            category: item.category as unknown as PrismaItemCategory, 
            servingType: item.servingType, 
            quantity: item.quantity,
            priceAtPurchase: item.price,
            customization: item.customization, 
          })),
        },
      },
    });

    if (prismaPaymentMethod === PaymentMethod.Cash) {
      revalidatePath("/admin/manual-order"); 
    }
    
    return { 
      success: true, 
      orderId: newOrder.id, 
      paymentMethod: prismaPaymentMethod,
      totalAmount: newOrder.totalAmount 
    };

  } catch (error) {
    console.error("Error submitting customer order:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to submit order: ${error.message}` };
    }
    return { success: false, error: "Failed to submit order due to an unexpected error." };
  }
}
