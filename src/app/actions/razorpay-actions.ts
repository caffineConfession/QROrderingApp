
"use server";

import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance: Razorpay | null = null;

if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } catch (error) {
    console.error("Failed to initialize Razorpay instance:", error);
    // razorpayInstance will remain null
  }
} else {
  console.error(
    "Razorpay Key ID or Key Secret is not defined in environment variables. Razorpay instance will not be initialized. Actions requiring Razorpay will fail."
  );
}

export async function createRazorpayOrderAction(
  amountInPaise: number, // Amount in paise
  currency: string,
  internalOrderId: string // Caffico's internal order ID
): Promise<{ success: boolean; error?: string; razorpayOrderId?: string; amount?: number; currency?: string; orderId?: string }> {
  if (!razorpayInstance) {
    return { success: false, error: "Razorpay API keys not configured or instance not initialized on the server." };
  }
  try {
    const options = {
      amount: amountInPaise,
      currency,
      receipt: internalOrderId, // Using internal order ID as receipt
      notes: {
        internalOrderId: internalOrderId,
      }
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);

    if (!razorpayOrder) {
      return { success: false, error: "Failed to create Razorpay order." };
    }

    // Store the razorpayOrderId in our database linked to our internalOrderId
    await prisma.order.update({
      where: { id: internalOrderId },
      data: { gatewayOrderId: razorpayOrder.id },
    });

    return {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: internalOrderId, // Return internal orderId for client context
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Failed to create Razorpay order: ${errorMessage}` };
  }
}

export async function verifyRazorpayPaymentAction(data: {
  razorpay_payment_id: string;
  razorpay_order_id: string; // This is Razorpay's order_id
  razorpay_signature: string;
  internalOrderId: string; // This is Caffico's internal order_id
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  if (!razorpayInstance || !razorpayKeySecret) { // Also check razorpayKeySecret for HMAC
    return { success: false, error: "Razorpay Key Secret not configured or instance not initialized on the server." };
  }
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, internalOrderId } = data;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret) // razorpayKeySecret must be defined here
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid, update order status in DB
      const updatedOrder = await prisma.order.update({
        where: { id: internalOrderId, gatewayOrderId: razorpay_order_id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PENDING_PREPARATION,
          gatewayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        },
      });

      if (!updatedOrder) {
         return { success: false, error: "Failed to update order. Order not found or Razorpay order ID mismatch." };
      }
      
      revalidatePath('/admin/orders');
      revalidatePath(`/order/confirmation/${internalOrderId}`); // If you have such a page

      return { success: true, orderId: internalOrderId };
    } else {
      // Log failed verification attempt for security monitoring
      console.warn(`Payment verification failed for order ${internalOrderId}. Signatures did not match.`);
      return { success: false, error: "Payment verification failed: Invalid signature." };
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Payment verification error: ${errorMessage}` };
  }
}
