
export const MENU_CATEGORIES = {
  COFFEE: "Blended Cold Coffee",
  SHAKES: "Shakes",
} as const;

export type ItemCategory = typeof MENU_CATEGORIES[keyof typeof MENU_CATEGORIES];
export type ItemServingType = "Cone" | "Cup";

export interface MenuItem {
  id: string;
  name: string; // Flavor, e.g., Vanilla, Chocolate
  category: ItemCategory;
  imageHint: string; // for data-ai-hint
}

export interface CartItem extends MenuItem {
  servingType: ItemServingType;
  quantity: number;
  price: number; // price per unit for this specific serving type
  cartItemId: string; // Unique ID for the cart item instance (e.g., `${id}-${servingType}`)
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

export type PaymentMethod = "Cash" | "Razorpay";

export interface Order extends CustomerDetails {
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderId?: string; // Generated upon successful order
  timestamp?: Date;
}
