
"use server";

import prisma from "@/lib/prisma";
import type { Product, MenuItem, ItemCategory as PrismaItemCategory } from "@prisma/client";

export interface MenuItemDetail extends MenuItem {}

export interface ProductWithMenuDetails extends Product {
  menuItems: MenuItemDetail[];
  // imageUrl is already part of Prisma Product, so it will be included by default
}

export async function getDisplayMenuAction(): Promise<{ success: boolean; products?: ProductWithMenuDetails[]; error?: string; }> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isAvailable: true, // Only fetch products that are generally available
      },
      include: {
        menuItems: {
          where: {
            // isAvailable: true, // We might want to show them but disable, so fetch all
          },
          orderBy: {
            servingType: 'asc' // Consistent order
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    // No need to cast to ProductWithMenuDetails if Product already includes imageUrl
    return { success: true, products: products };
  } catch (error) {
    console.error("Error fetching display menu:", error);
    if (error instanceof Error) {
        return { success: false, error: `Failed to fetch menu: ${error.message}` };
    }
    return { success: false, error: "Failed to fetch menu due to an unexpected error." };
  }
}
