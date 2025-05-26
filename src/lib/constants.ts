
import type { ProductMenuItem } from '@/types'; // Updated to ProductMenuItem
import { ItemCategory, ItemServingType } from '@/types'; // Using enums

// These represent the "base products" you offer.
// In a real app, these would likely come from a Product table in your database.
// The `id` here should correspond to the `productId` you'd use in OrderItems.

export const COFFEE_FLAVORS_BASE: Omit<ProductMenuItem, 'prices' | 'categoryDisplay'>[] = [
  { id: "prod_cff_van", name: "Vanilla", category: ItemCategory.COFFEE, imageHint: "vanilla coffee" },
  { id: "prod_cff_org", name: "Original", category: ItemCategory.COFFEE, imageHint: "coffee" },
  { id: "prod_cff_hzn", name: "Hazelnut", category: ItemCategory.COFFEE, imageHint: "hazelnut coffee" },
  { id: "prod_cff_moc", name: "Mocha", category: ItemCategory.COFFEE, imageHint: "mocha coffee" },
  { id: "prod_cff_crm", name: "Caramel", category: ItemCategory.COFFEE, imageHint: "caramel coffee" },
  { id: "prod_cff_cho", name: "Chocolate Coffee", category: ItemCategory.COFFEE, imageHint: "chocolate coffee" }, // Renamed to avoid clash if Chocolate Shake exists
];

export const SHAKE_FLAVORS_BASE: Omit<ProductMenuItem, 'prices' | 'categoryDisplay'>[] = [
  { id: "prod_shk_cho", name: "Chocolate Shake", category: ItemCategory.SHAKES, imageHint: "chocolate shake" }, // Renamed for clarity
  { id: "prod_shk_kit", name: "KitKat", category: ItemCategory.SHAKES, imageHint: "kitkat shake" },
  { id: "prod_shk_oro", name: "Oreo", category: ItemCategory.SHAKES, imageHint: "oreo shake" },
  { id: "prod_shk_str", name: "Strawberry", category: ItemCategory.SHAKES, imageHint: "strawberry shake" },
  { id: "prod_shk_ocf", name: "Oreo Coffee Shake", category: ItemCategory.SHAKES, imageHint: "oreo coffee shake" }, // Renamed for clarity
];

// Prices based on category and serving type
export const PRICES: Record<ItemCategory, Record<ItemServingType, number>> = {
  [ItemCategory.COFFEE]: {
    [ItemServingType.Cone]: 130,
    [ItemServingType.Cup]: 150,
  },
  [ItemCategory.SHAKES]: {
    [ItemServingType.Cone]: 180,
    [ItemServingType.Cup]: 200,
  },
};

export const SERVING_TYPES: ItemServingType[] = [ItemServingType.Cone, ItemServingType.Cup];

// Combine base products with their prices to form the full menu list for UI
export const ALL_MENU_ITEMS: ProductMenuItem[] = [
  ...COFFEE_FLAVORS_BASE.map(item => ({
    ...item,
    categoryDisplay: "Blended Cold Coffee", // User-friendly category name
    prices: PRICES[item.category],
  })),
  ...SHAKE_FLAVORS_BASE.map(item => ({
    ...item,
    categoryDisplay: "Shakes", // User-friendly category name
    prices: PRICES[item.category],
  })),
];
