
"use server";

import prisma from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client"; // Changed import
import type { AdminRole } from "@/types"; // AdminRole can still come from types
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { Order, OrderItem } from "@prisma/client";

export interface ProcessableOrder extends Order {
  items: OrderItem[];
}

export async function getProcessableOrdersAction(): Promise<{
  success: boolean;
  orders?: ProcessableOrder[];
  error?: string;
}> {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.role || (session.role !== "ORDER_PROCESSOR" && session.role !== "BUSINESS_MANAGER")) {
    return { success: false, error: "Unauthorized: Insufficient privileges." };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID, // Uses Prisma's PaymentStatus enum
        status: {
          in: [
            OrderStatus.PENDING_PREPARATION, // Uses Prisma's OrderStatus enum
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
          ],
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching processable orders:", error);
    return { success: false, error: "Failed to fetch orders." };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus // Expecting Prisma's OrderStatus enum
): Promise<{ success: boolean; error?: string }> {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.role || (session.role !== "ORDER_PROCESSOR" && session.role !== "BUSINESS_MANAGER")) {
    return { success: false, error: "Unauthorized: Insufficient privileges." };
  }

  // Validate newStatus to prevent arbitrary status changes
  // OrderStatus enum here should be the one from @prisma/client
  const allowedStatuses: OrderStatus[] = [
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ];
  if (!allowedStatuses.includes(newStatus)) {
    return { success: false, error: "Invalid target status." };
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    // Example transition validation (can be expanded)
    if (order.status === OrderStatus.PENDING_PREPARATION && newStatus !== OrderStatus.PREPARING && newStatus !== OrderStatus.CANCELLED) {
        return { success: false, error: `Cannot change status from ${order.status} to ${newStatus}. Expected PREPARING or CANCELLED.` };
    }
    if (order.status === OrderStatus.PREPARING && newStatus !== OrderStatus.READY_FOR_PICKUP && newStatus !== OrderStatus.CANCELLED) {
        return { success: false, error: `Cannot change status from ${order.status} to ${newStatus}. Expected READY_FOR_PICKUP or CANCELLED.` };
    }
    if (order.status === OrderStatus.READY_FOR_PICKUP && newStatus !== OrderStatus.COMPLETED) {
        return { success: false, error: `Cannot change status from ${order.status} to ${newStatus}. Expected COMPLETED.` };
    }
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
        return { success: false, error: `Order is already ${order.status} and cannot be changed.` };
    }


    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        processedById: session.userId, 
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status." };
  }
}
