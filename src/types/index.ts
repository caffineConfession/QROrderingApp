

export const MENU_CATEGORIES = {
  COFFEE: "Blended Cold Coffee",
  SHAKES: "Shakes",
} as const;

export type ItemCategory = typeof MENU_CATEGORIES[keyof typeof MENU_CATEGORIES];
export type ItemServingType = "Cone" | "Cup";
export type CustomizationType = "normal" | "sweet" | "bitter";


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

// For client-side manual order creation
export interface ManualOrderCartItem {
  cartItemId: string; // Unique client-side ID for this cart entry
  productId: string;
  name: string;
  category: ItemCategory;
  servingType: ItemServingType;
  price: number; // price for this specific serving type
  quantity: number;
  customization: CustomizationType;
  imageHint: string;
}


export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

export type PaymentMethod = "Cash" | "Razorpay" | "UPI"; // Added UPI

export interface Order extends CustomerDetails {
  items: CartItem[]; // This might need to refer to a more generic OrderItem type if structure differs
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderId?: string; // Generated upon successful order
  timestamp?: Date;
}

export const ADMIN_ROLES_ENUM = {
  MANUAL_ORDER_TAKER: "MANUAL_ORDER_TAKER",
  ORDER_PROCESSOR: "ORDER_PROCESSOR",
  BUSINESS_MANAGER: "BUSINESS_MANAGER",
} as const;

export type AdminRole = typeof ADMIN_ROLES_ENUM[keyof typeof ADMIN_ROLES_ENUM];

// Matches Prisma enum AdminRole
export { ADMIN_ROLES_ENUM as ADMIN_ROLES };


export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}
