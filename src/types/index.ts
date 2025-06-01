

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
export const ADMIN_ROLES = AdminRole; 

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
  UPI = "UPI", // Used for Manual Orders by staff
  Razorpay = "Razorpay", // Used by Customers Online
}

export enum OrderStatus {
  AWAITING_PAYMENT_CONFIRMATION = "AWAITING_PAYMENT_CONFIRMATION", // Customer online cash order before payment
  PENDING_PREPARATION = "PENDING_PREPARATION", // Payment confirmed, ready for kitchen
  PREPARING = "PREPARING", // Kitchen is making the order
  READY_FOR_PICKUP = "READY_FOR_PICKUP", // Order is made, customer can collect
  COMPLETED = "COMPLETED", // Order collected/delivered
  CANCELLED = "CANCELLED", // Order cancelled
}

export enum PaymentStatus {
  PENDING = "PENDING", // Payment initiated but not confirmed (e.g., Cash orders, or online payment not yet verified)
  PAID = "PAID", // Payment successfully confirmed
  FAILED = "FAILED", // Payment attempt failed
  REFUNDED = "REFUNDED", // Payment was refunded
}

export enum OrderSource {
  CUSTOMER_ONLINE = "CUSTOMER_ONLINE", // Order placed by customer via the app/website
  STAFF_MANUAL = "STAFF_MANUAL", // Order placed manually by staff
}


// App-specific types
export interface ProductMenuItem { 
  id: string; 
  name: string;
  category: ItemCategory; 
  categoryDisplay: ItemCategoryValue; 
  imageHint: string;
  prices: Record<ItemServingType, number>; 
}

// Represents an item in the customer's shopping cart on the client-side
export interface CartItemClient extends ProductMenuItem {
  cartItemId: string; 
  servingType: ItemServingType;
  quantity: number;
  price: number; // price per unit for this specific serving type at time of adding to cart
  customization: CustomizationType;
}


export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
}

// Data structure for when a customer submits their order from the main app
export interface OrderToSubmit { 
  customerDetails: CustomerDetails;
  items: { // This structure needs to map from CartItemClient
    productId: string;
    name: string; 
    category: ItemCategory;
    servingType: ItemServingType;
    quantity: number;
    priceAtPurchase: number;
    customization: CustomizationType;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay; // Only these are available to customers online
}


// For client-side manual order creation by staff
export interface ManualOrderCartItem {
  cartItemId: string; 
  productId: string; 
  name: string;
  category: ItemCategory;
  servingType: ItemServingType;
  price: number; 
  quantity: number;
  customization: CustomizationType;
  imageHint: string;
}

// Data structure for when staff submits a manual order
export interface ManualOrderSubmitData {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod.Cash | PaymentMethod.UPI; // Staff can take UPI or Cash
  items: {
    productId: string; 
    quantity: number;
    priceAtPurchase: number; 
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


// Simplified Order type for displaying pending cash payments on manual order page
export interface PendingCashOrderView {
  id: string; 
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  orderDate: Date;
  itemsSummary: string; 
}

// Rating types
export interface ProductRatingSubmission {
  productId: string;
  productName: string; // Denormalized for display consistency
  rating: number; // 1-5
  comment?: string;
}

export interface AllRatingsSubmissionData {
  orderId: string;
  overallRating: number; // 1-5
  overallComment?: string;
  productRatings: ProductRatingSubmission[];
}

export interface ExperienceComment {
  comment: string | null;
  rating: number;
  createdAt: Date;
  customerName: string | null;
}

export interface ProductComment extends ExperienceComment {
  productName: string;
}

