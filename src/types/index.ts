
export const MENU_CATEGORIES_MAP = {
  COFFEE: "Blended Cold Coffee",
  SHAKES: "Shakes",
} as const;

export type ItemCategoryKey = keyof typeof MENU_CATEGORIES_MAP;
export type ItemCategoryValue = typeof MENU_CATEGORIES_MAP[ItemCategoryKey];


// Prisma Enums - ensure these match your schema
export enum AdminRole {
  MANUAL_ORDER_TAKER = "MANUAL_ORDER_TAKER",
  ORDER_PROCESSOR = "ORDER_PROCESSOR",
  BUSINESS_MANAGER = "BUSINESS_MANAGER",
}
export const ADMIN_ROLES = AdminRole; // Alias for easier usage

export enum ItemCategory {
  COFFEE = "COFFEE",
  SHAKES = "SHAKES",
}

export enum ItemServingType {
  Cone = "Cone",
  Cup = "Cup",
}

export enum CustomizationType {
  normal = "normal",
  sweet = "sweet",
  bitter = "bitter",
}

export enum PaymentMethod {
  Cash = "Cash",
  UPI = "UPI",
  Razorpay = "Razorpay",
}

export enum OrderStatus {
  AWAITING_PAYMENT_CONFIRMATION = "AWAITING_PAYMENT_CONFIRMATION",
  PENDING_PREPARATION = "PENDING_PREPARATION",
  PREPARING = "PREPARING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum OrderSource {
  CUSTOMER_ONLINE = "CUSTOMER_ONLINE",
  STAFF_MANUAL = "STAFF_MANUAL",
}


// App-specific types
export interface ProductMenuItem { // Used for displaying items to select
  id: string; // This will be the actual Product ID from the database or constants
  name: string;
  category: ItemCategory; // Enum
  categoryDisplay: ItemCategoryValue; // User-friendly display name
  imageHint: string;
  prices: Record<ItemServingType, number>; // Prices for "Cone", "Cup"
}

export interface CartItemClient extends ProductMenuItem {
  cartItemId: string; // Unique ID for the cart instance (e.g., `${productId}-${servingType}-${timestamp}`)
  servingType: ItemServingType;
  quantity: number;
  price: number; // price per unit for this specific serving type
  customization: CustomizationType;
}


export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

export interface OrderToSubmit { // From customer app
  customerDetails: CustomerDetails;
  items: {
    productId: string;
    name: string; // name at time of purchase
    category: ItemCategory;
    servingType: ItemServingType;
    quantity: number;
    priceAtPurchase: number;
    customization: CustomizationType;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod; // Cash or Razorpay
  // If Razorpay, payment gateway details might be handled separately or included
}


// For client-side manual order creation by staff
export interface ManualOrderCartItem {
  cartItemId: string; // Unique client-side ID for this cart entry
  productId: string; // Actual product ID
  name: string;
  category: ItemCategory;
  servingType: ItemServingType;
  price: number; // price for this specific serving type
  quantity: number;
  customization: CustomizationType;
  imageHint: string;
}

export interface ManualOrderSubmitData {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod; // Cash or UPI for manual orders
  items: {
    productId: string; // Product ID from constants/DB
    quantity: number;
    priceAtPurchase: number; // Price for the chosen serving type
    servingType: ItemServingType;
    customization: CustomizationType;
  }[];
  totalAmount: number;
}


export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}


// Simplified Order type for displaying pending cash payments
export interface PendingCashOrderView {
  id: string; // Order ID
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  orderDate: Date;
  itemsSummary: string; // e.g., "Vanilla Coffee (Cup) x 1, Chocolate Shake (Cone) x 2"
}
