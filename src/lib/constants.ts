import type { MenuItem, ItemCategory, ItemServingType } from '@/types';
import { MENU_CATEGORIES } from '@/types';

export const COFFEE_FLAVORS: MenuItem[] = [
  { id: "cff-van", name: "Vanilla", category: MENU_CATEGORIES.COFFEE, imageHint: "vanilla coffee" },
  { id: "cff-org", name: "Original", category: MENU_CATEGORIES.COFFEE, imageHint: "coffee" },
  { id: "cff-hzn", name: "Hazelnut", category: MENU_CATEGORIES.COFFEE, imageHint: "hazelnut coffee" },
  { id: "cff-moc", name: "Mocha", category: MENU_CATEGORIES.COFFEE, imageHint: "mocha coffee" },
  { id: "cff-crm", name: "Caramel", category: MENU_CATEGORIES.COFFEE, imageHint: "caramel coffee" },
  { id: "cff-cho", name: "Chocolate", category: MENU_CATEGORIES.COFFEE, imageHint: "chocolate coffee" },
];

export const SHAKE_FLAVORS: MenuItem[] = [
  { id: "shk-cho", name: "Chocolate", category: MENU_CATEGORIES.SHAKES, imageHint: "chocolate shake" },
  { id: "shk-kit", name: "KitKat", category: MENU_CATEGORIES.SHAKES, imageHint: "kitkat shake" },
  { id: "shk-oro", name: "Oreo", category: MENU_CATEGORIES.SHAKES, imageHint: "oreo shake" },
  { id: "shk-str", name: "Strawberry", category: MENU_CATEGORIES.SHAKES, imageHint: "strawberry shake" },
  { id: "shk-ocf", name: "Oreo Coffee", category: MENU_CATEGORIES.SHAKES, imageHint: "oreo coffee shake" },
];

export const ALL_MENU_ITEMS: MenuItem[] = [...COFFEE_FLAVORS, ...SHAKE_FLAVORS];

export const PRICES: Record<ItemCategory, Record<ItemServingType, number>> = {
  [MENU_CATEGORIES.COFFEE]: {
    Cone: 130,
    Cup: 150,
  },
  [MENU_CATEGORIES.SHAKES]: {
    Cone: 180,
    Cup: 200,
  },
};

export const SERVING_TYPES: ItemServingType[] = ["Cone", "Cup"];
