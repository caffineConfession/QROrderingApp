
import type { ProductConstantItem } from '@/types'; // Updated to use ProductConstantItem
import { ItemCategory, ItemServingType } from '@/types'; // Using enums

export const COFFEE_FLAVORS_BASE: Omit<ProductConstantItem, 'prices' | 'categoryDisplay'>[] = [
  { id: "prod_cff_van", name: "Vanilla Cold Coffee", category: ItemCategory.COFFEE, imageHint: "vanilla coffee", imageUrl: "/images/products/prod_cff_van.png" },
  { id: "prod_cff_org", name: "Original Cold Coffee", category: ItemCategory.COFFEE, imageHint: "coffee", imageUrl: "/images/products/prod_cff_org.png" },
  { id: "prod_cff_hzn", name: "Hazelnut Cold Coffee", category: ItemCategory.COFFEE, imageHint: "hazelnut coffee", imageUrl: "/images/products/prod_cff_hzn.png" },
  { id: "prod_cff_moc", name: "Mocha Cold Coffee", category: ItemCategory.COFFEE, imageHint: "mocha coffee", imageUrl: "/images/products/prod_cff_moc.png" },
  { id: "prod_cff_crm", name: "Caramel Cold Coffee", category: ItemCategory.COFFEE, imageHint: "caramel coffee", imageUrl: "/images/products/prod_cff_crm.png" },
  { id: "prod_cff_cho", name: "Chocolate Cold Coffee", category: ItemCategory.COFFEE, imageHint: "chocolate coffee", imageUrl: "/images/products/prod_cff_cho.png" },
];

export const SHAKE_FLAVORS_BASE: Omit<ProductConstantItem, 'prices' | 'categoryDisplay'>[] = [
  { id: "prod_shk_cho", name: "Chocolate Shake", category: ItemCategory.SHAKES, imageHint: "chocolate shake", imageUrl: "/images/products/prod_shk_cho.png" },
  { id: "prod_shk_kit", name: "KitKat Shake", category: ItemCategory.SHAKES, imageHint: "kitkat shake", imageUrl: "/images/products/prod_shk_kit.png" },
  { id: "prod_shk_oro", name: "Oreo Shake", category: ItemCategory.SHAKES, imageHint: "oreo shake", imageUrl: "/images/products/prod_shk_oro.png" },
  { id: "prod_shk_str", name: "Strawberry Shake", category: ItemCategory.SHAKES, imageHint: "strawberry shake", imageUrl: "/images/products/prod_shk_str.png" },
  { id: "prod_shk_ocf", name: "Oreo Coffee Shake", category: ItemCategory.SHAKES, imageHint: "oreo coffee shake", imageUrl: "/images/products/prod_shk_ocf.png" },
];

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

export const ALL_MENU_ITEMS: ProductConstantItem[] = [
  ...COFFEE_FLAVORS_BASE.map(item => ({
    ...item,
    categoryDisplay: "Blended Cold Coffee",
    prices: PRICES[item.category],
  })),
  ...SHAKE_FLAVORS_BASE.map(item => ({
    ...item,
    categoryDisplay: "Shakes",
    prices: PRICES[item.category],
  })),
];
