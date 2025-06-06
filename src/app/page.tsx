
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { CartItemClient, CustomerDetails, PaymentMethod, AllRatingsSubmissionData, ProductWithMenuDetails, MenuItemDetail as PrismaMenuItemDetail } from '@/types';
import { MENU_CATEGORIES_MAP, ItemCategory } from '@/types'; 
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import OrderCart from '@/components/OrderCart';
import CheckoutForm from '@/components/CheckoutForm';
import FlavorSuggester from '@/components/FlavorSuggester';
import Footer from '@/components/Footer';
import RatingForm from '@/components/RatingForm'; 
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Star, ShoppingBag, Coffee } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { submitCustomerOrderAction } from '@/app/actions/order-actions';
import { submitAllRatingsAction } from '@/app/actions/rating-actions'; 
import { getDisplayMenuAction } from '@/app/actions/menu-actions';


type AppState = "menu" | "checkout" | "confirmation";

interface ConfirmedOrderDetails extends CustomerDetails {
  items: CartItemClient[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderId: string;
  timestamp: Date;
}

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartItemClient[]>([]);
  const [appState, setAppState] = useState<AppState>("menu");
  const [orderDetails, setOrderDetails] = useState<ConfirmedOrderDetails | null>(null); 
  const { toast } = useToast();
  const [isSubmittingInternalOrder, setIsSubmittingInternalOrder] = useState(false);
  const [hasRated, setHasRated] = useState(false); 

  const [products, setProducts] = useState<ProductWithMenuDetails[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoadingMenu(true);
      setMenuError(null);
      try {
        const result = await getDisplayMenuAction();
        if (result.success && result.products) {
          setProducts(result.products);
        } else {
          setMenuError(result.error || "Failed to load menu items.");
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        setMenuError("An unexpected error occurred while fetching the menu.");
        setProducts([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAddToCart = (product: ProductWithMenuDetails, selectedMenuItem: PrismaMenuItemDetail) => {
    const cartItemId = `${product.id}-${selectedMenuItem.servingType}-${Date.now()}`; 
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        ci => ci.productId === product.id && 
              ci.servingType === selectedMenuItem.servingType && 
              ci.customization === "normal" // Assuming 'normal' is default
      );

      if (existingItemIndex > -1) {
        const updatedItem = { 
          ...prevItems[existingItemIndex], 
          quantity: prevItems[existingItemIndex].quantity + 1 
        };
        // Ensure stock check for incrementing quantity as well (simplified here)
        if (updatedItem.quantity > selectedMenuItem.stockQuantity) {
          toast({
            title: "Stock Limit Reached",
            description: `Cannot add more ${product.name} (${selectedMenuItem.servingType}). Max available: ${selectedMenuItem.stockQuantity}.`,
            variant: "destructive",
          });
          return prevItems; // Don't update if stock limit is exceeded
        }
        return prevItems.map((ci, index) =>
          index === existingItemIndex ? updatedItem : ci
        );
      }
      // Add as new item
      if (selectedMenuItem.stockQuantity < 1) {
         toast({
            title: "Out of Stock",
            description: `${product.name} (${selectedMenuItem.servingType}) is currently out of stock.`,
            variant: "destructive",
          });
        return prevItems;
      }
      return [...prevItems, { 
        cartItemId,
        productId: product.id,
        menuItemId: selectedMenuItem.id,
        name: product.name,
        category: product.category,
        servingType: selectedMenuItem.servingType,
        price: selectedMenuItem.price,
        quantity: 1,
        customization: "normal",
        imageHint: product.imageHint || null,
        imageUrl: product.imageUrl || null, // Added imageUrl
        isAvailable: selectedMenuItem.isAvailable, // Availability at time of adding
        stockQuantity: selectedMenuItem.stockQuantity, // Stock at time of adding
      }];
    });
    toast({
      title: "Added to cart!",
      description: `${product.name} (${selectedMenuItem.servingType}) has been added.`,
    });
  };


  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemId === cartItemId) {
          if (newQuantity < 1) {
            // This will be caught by the filter later, but good to be explicit
            return item; // or handle removal directly here
          }
          if (newQuantity > item.stockQuantity) { // Check against stock at time of adding
            toast({
              title: "Stock Limit Reached",
              description: `Max available quantity for ${item.name} (${item.servingType}) is ${item.stockQuantity}.`,
              variant: "destructive",
            });
            return { ...item, quantity: item.stockQuantity }; // Cap at available stock
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0) // Ensure items with quantity 0 are removed
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    const removedItem = cartItems.find(item => item.cartItemId === cartItemId);
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    if (removedItem) {
      toast({
        title: "Item removed",
        description: `${removedItem.name} (${removedItem.servingType}) removed from cart.`,
        variant: "destructive",
      });
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive",
      });
      return;
    }
    // Additional check: verify if any cart item now exceeds available stock (if stock could change)
    // For simplicity, we'll rely on initial add-to-cart checks and the server-side pre-order check.
    setAppState("checkout");
  };

  const handleSubmitInternalOrder = async (customerDetails: CustomerDetails, paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay) => {
    setIsSubmittingInternalOrder(true);
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const orderData = {
      customerDetails,
      items: cartItems.map(ci => ({ // Transform CartItemClient to the structure expected by submitCustomerOrderAction
        productId: ci.productId,
        menuItemId: ci.menuItemId,
        name: ci.name,
        category: ci.category,
        servingType: ci.servingType,
        quantity: ci.quantity,
        priceAtPurchase: ci.price,
        customization: ci.customization,
      })),
      totalAmount,
      paymentMethod,
    };

    try {
      const result = await submitCustomerOrderAction(orderData);
      return result; 
    } catch (error) {
      console.error("Error submitting internal order:", error);
      toast({
        title: "Order Error",
        description: "An unexpected error occurred while placing your order.",
        variant: "destructive",
      });
      return { success: false, error: "An unexpected error occurred." };
    } finally {
      setIsSubmittingInternalOrder(false);
    }
  };

  const handlePaymentSuccess = (
    confirmedOrder: { orderId: string, paymentMethod: PaymentMethod, customerDetails: CustomerDetails, totalAmount: number }
  ) => {
    const finalOrder: ConfirmedOrderDetails = {
      ...confirmedOrder.customerDetails,
      items: cartItems, 
      totalAmount: confirmedOrder.totalAmount,
      paymentMethod: confirmedOrder.paymentMethod,
      orderId: confirmedOrder.orderId,
      timestamp: new Date(),
    };
    setOrderDetails(finalOrder);
    setAppState("confirmation");
    setCartItems([]); 
    setHasRated(false); 
    toast({
      title: "Order Placed Successfully!",
      description: `Your order #${finalOrder.orderId.substring(0,8)}... has been placed. ${
        finalOrder.paymentMethod === "Cash" 
        ? "Please pay at the counter." 
        : `Payment confirmed. A receipt will be sent to ${confirmedOrder.customerDetails.email}.`
      }`,
      duration: 7000,
    });
  };


  const handleRatingsSubmitted = async (ratingsData: AllRatingsSubmissionData) => {
    const result = await submitAllRatingsAction(ratingsData);
    if (result.success) {
      toast({
        title: "Feedback Received!",
        description: "Thanks for sharing your thoughts with us!",
      });
      setHasRated(true); 
    } else {
      toast({
        title: "Rating Submission Failed",
        description: result.error || "Could not submit your ratings. Please try again.",
        variant: "destructive",
      });
    }
    return result; 
  };


  const coffeeItems = useMemo(() => products.filter(item => item.category === ItemCategory.COFFEE), [products]);
  const shakeItems = useMemo(() => products.filter(item => item.category === ItemCategory.SHAKES), [products]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  const renderMenuSection = (titleIcon: React.ReactNode, title: string, items: ProductWithMenuDetails[]) => {
    if (isLoadingMenu) {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2 flex items-center">
            {titleIcon} {title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="w-full max-w-sm shadow-lg rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    if (items.length === 0 && !menuError) { // Don't show "no items" if there was a general menu error
        return (
             <div>
                <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2 flex items-center">
                    {titleIcon} {title}
                </h2>
                <p className="text-muted-foreground">No {title.toLowerCase()} available at the moment. Please check back later!</p>
            </div>
        );
    }

    return (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2 flex items-center">
          {titleIcon} {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map(product => (
            <MenuItemCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {appState === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section id="flavor-suggester">
                <FlavorSuggester />
              </section>
              
              <section id="menu">
                {menuError && (
                    <Alert variant="destructive" className="mb-8">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Menu</AlertTitle>
                        <AlertDescription>{menuError}</AlertDescription>
                    </Alert>
                )}
                {renderMenuSection(<Coffee className="mr-2 h-7 w-7"/>, MENU_CATEGORIES_MAP.COFFEE, coffeeItems)}
                <div className="mt-12">
                  {renderMenuSection(<ShoppingBag className="mr-2 h-7 w-7"/>, MENU_CATEGORIES_MAP.SHAKES, shakeItems)}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-1 lg:sticky lg:top-8 h-fit">
              <OrderCart
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </aside>
          </div>
        )}

        {appState === "checkout" && (
          <div className="max-w-2xl mx-auto">
            <CheckoutForm
              totalAmount={cartTotal}
              onSubmitOrder={handleSubmitInternalOrder}
              onBackToCart={() => setAppState("menu")}
              isSubmittingInternalOrder={isSubmittingInternalOrder}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {appState === "confirmation" && orderDetails && (
          <div className="max-w-3xl mx-auto py-12 space-y-8">
            <Card className="shadow-xl rounded-xl p-6 md:p-10 text-center">
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-500 mb-6" />
              <CardHeader className="p-0">
                <CardTitle className="text-3xl font-bold text-primary">Thank You for Your Order!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left mt-4">
                <p className="text-lg text-center">Your order <span className="font-semibold text-accent">#{orderDetails.orderId.substring(0,8)}...</span> has been placed successfully.</p>
                
                {orderDetails.paymentMethod === "Cash" && (
                  <Alert className="mt-4 bg-yellow-50 border-yellow-300">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-700">Cash Payment Selected</AlertTitle>
                    <AlertDescription className="text-yellow-600">
                      Please pay ₹{orderDetails.totalAmount.toFixed(2)} in cash at the counter. Your order will be processed upon payment confirmation.
                    </AlertDescription>
                  </Alert>
                )}
                 {orderDetails.paymentMethod === "Razorpay" && (
                  <Alert className="mt-4 bg-blue-50 border-blue-300">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Online Payment Successful</AlertTitle>
                    <AlertDescription className="text-blue-600">
                       Your online payment of ₹{orderDetails.totalAmount.toFixed(2)} was successful.
                       A receipt will be sent to <span className="font-semibold text-accent">{orderDetails.email}</span>.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Separator className="my-6"/>
                <h3 className="text-xl font-semibold mb-2 text-center">Order Summary:</h3>
                <ScrollArea className="max-h-60 pr-2">
                  <ul className="space-y-2">
                    {orderDetails.items.map((item: CartItemClient) => (
                      <li key={item.cartItemId} className="flex justify-between text-sm p-2 bg-muted/50 rounded-md">
                        <span>{item.name} ({item.servingType}) x {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                  <span>Total:</span>
                  <span>₹{orderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="mt-8 flex-col space-y-4">
                <Button onClick={() => { setAppState("menu"); setOrderDetails(null); }} className="w-full" size="lg">
                  Place Another Order
                </Button>
              </CardFooter>
            </Card>

            {!hasRated && orderDetails.orderId && (
              <RatingForm
                orderId={orderDetails.orderId}
                orderedItems={orderDetails.items}
                onSubmit={handleRatingsSubmitted}
                onSubmitted={() => setHasRated(true)}
              />
            )}
             {hasRated && (
              <Card className="shadow-lg rounded-xl p-6 text-center">
                <Star className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                <CardTitle className="text-xl text-primary">Thanks for your feedback!</CardTitle>
                <CardDescription>We appreciate you taking the time to rate your experience.</CardDescription>
              </Card>
            )}

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
