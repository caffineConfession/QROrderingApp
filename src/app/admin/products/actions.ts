
"use server";

import prisma from "@/lib/prisma";
import { ItemCategory, ItemServingType } from "@prisma/client";
import * as z from "zod";
import { revalidatePath } from "next/cache";

// Schemas for validation
export const ProductFormSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  description: z.string().optional(),
  category: z.nativeEnum(ItemCategory),
  isAvailable: z.boolean().default(true),
  imageHint: z.string().optional(),
});
export type ProductFormData = z.infer<typeof ProductFormSchema>;

export const MenuItemFormSchema = z.object({
  servingType: z.nativeEnum(ItemServingType),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  stockQuantity: z.coerce.number().int().min(0, "Stock quantity must be a non-negative integer.").default(0),
  isAvailable: z.boolean().default(true),
});
export type MenuItemFormData = z.infer<typeof MenuItemFormSchema>;


// Product Actions
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    });
    return { success: true, products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products." };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        menuItems: {
          orderBy: { servingType: 'asc'}
        }
      }
    });
    if (!product) return { success: false, error: "Product not found." };
    return { success: true, product };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return { success: false, error: "Failed to fetch product." };
  }
}

export async function createProductAction(data: ProductFormData) {
  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data.", issues: validation.error.issues };
  }

  try {
    const product = await prisma.product.create({
      data: validation.data,
    });
    revalidatePath("/admin/products");
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product." };
  }
}

export async function updateProductAction(id: string, data: ProductFormData) {
  const validation = ProductFormSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data.", issues: validation.error.issues };
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: validation.data,
    });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath(`/admin/products/${id}/menu`);
    return { success: true, product };
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return { success: false, error: "Failed to update product." };
  }
}

export async function deleteProductAction(id: string) {
    try {
        // Consider implications: if product has orders, simple delete might fail due to FK constraints or be undesirable.
        // Soft delete (mark as unavailable or archived) is often safer.
        // For now, attempting a hard delete which will fail if OrderItems reference it and onDelete is RESTRICT.
        // Schema has onDelete: Cascade for MenuItem -> Product, but OrderItem -> Product is RESTRICT by default.
        // For a true hard delete, you might need to delete related OrderItems or change FK constraints.
        // For now, let's assume we just mark it unavailable via updateProductAction for safety.
        // If a true delete is needed, it would require more logic or schema adjustments.
        
        // To actually delete:
        // await prisma.menuItem.deleteMany({ where: { productId: id } }); // Delete associated menu items first
        // await prisma.product.delete({ where: { id } });
        
        // For now, we'll just mark as unavailable as a safer "delete"
        await prisma.product.update({
            where: { id },
            data: { isAvailable: false }
        });

        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        console.error(`Error "deleting" (marking unavailable) product ${id}:`, error);
        return { success: false, error: "Failed to delete product." };
    }
}


// Menu Item Actions (associated with a Product)
export async function getMenuItemsForProduct(productId: string) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { productId },
      orderBy: { servingType: "asc" },
    });
    return { success: true, menuItems };
  } catch (error) {
    console.error(`Error fetching menu items for product ${productId}:`, error);
    return { success: false, error: "Failed to fetch menu items." };
  }
}

export async function getMenuItemById(id: string) {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { product: true }
    });
    if (!menuItem) return { success: false, error: "Menu item not found." };
    return { success: true, menuItem };
  } catch (error) {
    console.error(`Error fetching menu item ${id}:`, error);
    return { success: false, error: "Failed to fetch menu item." };
  }
}

export async function createMenuItemAction(productId: string, data: MenuItemFormData) {
  const validation = MenuItemFormSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data.", issues: validation.error.issues };
  }

  const dataToSave = { ...validation.data };
  if (dataToSave.stockQuantity <= 0) {
    dataToSave.isAvailable = false;
  }

  try {
    const menuItem = await prisma.menuItem.create({
      data: {
        ...dataToSave,
        productId: productId,
      },
    });
    revalidatePath(`/admin/products/${productId}/menu`);
    revalidatePath("/admin/products"); // Revalidate product list to update menu item counts
    return { success: true, menuItem };
  } catch (error: any) {
    console.error("Error creating menu item:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('productId_servingType')) {
      return { success: false, error: "This serving type already exists for this product." };
    }
    return { success: false, error: "Failed to create menu item." };
  }
}

export async function updateMenuItemAction(id: string, productId: string, data: MenuItemFormData) {
  const validation = MenuItemFormSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data.", issues: validation.error.issues };
  }

  const dataToSave = { ...validation.data };
  if (dataToSave.stockQuantity <= 0) {
    dataToSave.isAvailable = false;
  }

  try {
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: dataToSave,
    });
    revalidatePath(`/admin/products/${productId}/menu`);
    revalidatePath(`/admin/products/${productId}/menu/${id}/edit`);
    return { success: true, menuItem };
  } catch (error: any) {
    console.error(`Error updating menu item ${id}:`, error);
     if (error.code === 'P2002' && error.meta?.target?.includes('productId_servingType')) {
      return { success: false, error: "This serving type already exists for this product." };
    }
    return { success: false, error: "Failed to update menu item." };
  }
}

export async function deleteMenuItemAction(id: string, productId: string) {
    try {
        await prisma.menuItem.delete({
            where: { id },
        });
        revalidatePath(`/admin/products/${productId}/menu`);
        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        console.error(`Error deleting menu item ${id}:`, error);
        return { success: false, error: "Failed to delete menu item. It might be part of an existing order." };
    }
}

