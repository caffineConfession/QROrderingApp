
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!razorpayWebhookSecret) {
    console.error("Razorpay Webhook Secret is not defined.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  // IMPORTANT: Razorpay needs the raw body for signature verification.
  // Next.js 13+ App Router: req.text() or req.blob() for raw body.
  const bodyText = await req.text(); 

  if (!signature) {
    return NextResponse.json({ error: "Signature missing." }, { status: 400 });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', razorpayWebhookSecret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn("Invalid Razorpay webhook signature.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    // Signature is valid, process the event
    const event = JSON.parse(bodyText); // Now parse the verified body
    console.log("Received Razorpay webhook event:", event.event, event.payload);

    // Handle specific events, e.g., 'payment.captured' or 'order.paid'
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const orderEntity = event.payload.order?.entity; // order might not be present in all payment events
      
      let internalOrderId: string | null = null;

      // Try to get internalOrderId from notes if available (preferred)
      if (paymentEntity.notes?.internalOrderId) {
        internalOrderId = paymentEntity.notes.internalOrderId;
      } else if (orderEntity?.receipt) { // Fallback to receipt if orderEntity exists
        internalOrderId = orderEntity.receipt;
      } else {
        // If neither, try to find order by gatewayOrderId (Razorpay order_id)
        const orderFoundByGatewayId = await prisma.order.findFirst({
            where: { gatewayOrderId: paymentEntity.order_id },
            select: { id: true }
        });
        if (orderFoundByGatewayId) {
            internalOrderId = orderFoundByGatewayId.id;
        }
      }

      if (!internalOrderId) {
        console.error("Could not determine internal order ID from Razorpay webhook.", paymentEntity);
        return NextResponse.json({ error: "Internal order ID missing in webhook payload." }, { status: 400 });
      }
      
      // Check current status to avoid processing multiple times for the same event
      const currentOrder = await prisma.order.findUnique({
        where: { id: internalOrderId },
        select: { paymentStatus: true }
      });

      if (currentOrder && currentOrder.paymentStatus !== PaymentStatus.PAID) {
        await prisma.order.update({
          where: { id: internalOrderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.PENDING_PREPARATION,
            gatewayPaymentId: paymentEntity.id,
            gatewayOrderId: paymentEntity.order_id, // Ensure gatewayOrderId is also updated if not already
            updatedAt: new Date(),
          },
        });
        console.log(`Webhook: Order ${internalOrderId} updated to PAID and PENDING_PREPARATION.`);
        revalidatePath('/admin/orders');
        revalidatePath(`/order/confirmation/${internalOrderId}`);
      } else if (currentOrder && currentOrder.paymentStatus === PaymentStatus.PAID) {
        console.log(`Webhook: Order ${internalOrderId} already marked as PAID. Ignoring event.`);
      } else if (!currentOrder) {
         console.error(`Webhook: Order ${internalOrderId} not found in database.`);
         // Potentially return 404 or 400 if order ID definitely should exist
      }
    } else {
      console.log("Received unhandled Razorpay event:", event.event);
    }

    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown webhook processing error";
    return NextResponse.json({ error: `Webhook processing error: ${errorMessage}` }, { status: 500 });
  }
}
