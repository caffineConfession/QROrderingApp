
"use server";

import prisma from "@/lib/prisma";
import type { AllRatingsSubmissionData } from "@/types";
import { revalidatePath } from "next/cache";

export async function submitAllRatingsAction(
  data: AllRatingsSubmissionData
): Promise<{ success: boolean; error?: string }> {
  if (data.overallRating < 1 || data.overallRating > 5) {
    return { success: false, error: "Overall rating must be between 1 and 5." };
  }
  for (const pr of data.productRatings) {
    if (pr.rating < 1 || pr.rating > 5) {
      return { success: false, error: `Rating for ${pr.productName} must be between 1 and 5.` };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create overall experience rating
      await tx.experienceRating.create({
        data: {
          orderId: data.orderId,
          rating: data.overallRating,
          comment: data.overallComment,
        },
      });

      // Create product-specific ratings
      if (data.productRatings.length > 0) {
        await tx.productRating.createMany({
          data: data.productRatings.map(pr => ({
            orderId: data.orderId,
            productId: pr.productId,
            productName: pr.productName, // Store denormalized name
            rating: pr.rating,
            comment: pr.comment,
          })),
        });
      }
    });

    revalidatePath("/admin/analytics"); // Revalidate analytics page to show new ratings/comments
    revalidatePath("/"); // Revalidate home page (where confirmation might be)

    return { success: true };
  } catch (error) {
    console.error("Error submitting ratings:", error);
    if (error instanceof prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation (e.g., already rated this order)
      if (error.code === 'P2002') {
        return { success: false, error: "This order has already been rated." };
      }
    }
    return { success: false, error: "Failed to submit ratings due to an unexpected error." };
  }
}
