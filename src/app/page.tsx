
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { ProductMenuItem, ItemServingType, CartItemClient, CustomerDetails, PaymentMethod, AllRatingsSubmissionData } from '@/types';
import { MENU_CATEGORIES_MAP, ItemCategory } from '@/types'; 
import { ALL_MENU_ITEMS } from '@/lib/constants'; 
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import OrderCart from '@/components/OrderCart';
import CheckoutForm from '@/components/CheckoutForm';
import FlavorSuggester from '@/components/FlavorSuggester';
import Footer from '@/components/Footer';
import RatingForm from '@/components/RatingForm'; // Added RatingForm
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { submitCustomerOrderAction } from '@/app/actions/order-actions';
import { submitAllRatingsAction } from '@/app/actions/rating-actions'; // Added rating action


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
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [hasRated, setHasRated] = useState(false); // Track if rating submitted for current order

  const handleAddToCart = (item: ProductMenuItem, servingType: ItemServingType, price: number) => {
    const cartItemId = `${item.id}-${servingType}-${Date.now()}`; 
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        ci => ci.id === item.id && ci.servingType === servingType && ci.customization === "normal"
      );
      if (existingItemIndex > -1) {
        return prevItems.map((ci, index) =>
          index === existingItemIndex ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevItems, { ...item, servingType, quantity: 1, price, cartItemId, customization: "normal" }];
    });
    toast({
      title: "Added to cart!",
      description: `${item.name} (${servingType}) has been added to your cart.`,
    });
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
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
    setAppState("checkout");
  };

  const handleSubmitOrder = async (customerDetails: CustomerDetails, paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay) => {
    setIsSubmittingOrder(true);
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const orderData = {
      customerDetails,
      items: cartItems,
      totalAmount,
      paymentMethod,
    };

    try {
      const result = await submitCustomerOrderAction(orderData);
      if (result.success && result.orderId && result.paymentMethod) {
        const finalOrder: ConfirmedOrderDetails = {
          ...customerDetails,
          items: cartItems,
          totalAmount,
          paymentMethod: result.paymentMethod,
          orderId: result.orderId,
          timestamp: new Date(),
        };
        setOrderDetails(finalOrder);
        setAppState("confirmation");
        setCartItems([]); 
        setHasRated(false); // Reset rating status for new order
        toast({
          title: "Order Placed Successfully!",
          description: `Your order #${finalOrder.orderId.substring(0,8)}... has been placed. ${
            finalOrder.paymentMethod === "Cash" 
            ? "Please pay at the counter." 
            : `A receipt will be sent to ${customerDetails.email}.`
          }`,
          duration: 7000,
        });
      } else {
        toast({
          title: "Order Submission Failed",
          description: result.error || "Could not place your order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Order Error",
        description: "An unexpected error occurred while placing your order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRatingsSubmitted = async (ratingsData: AllRatingsSubmissionData) => {
    const result = await submitAllRatingsAction(ratingsData);
    if (result.success) {
      toast({
        title: "Feedback Received!",
        description: "Thanks for sharing your thoughts with us!",
      });
      setHasRated(true); // Mark that rating has been submitted
    } else {
      toast({
        title: "Rating Submission Failed",
        description: result.error || "Could not submit your ratings. Please try again.",
        variant: "destructive",
      });
    }
    return result; // Return result for RatingForm to handle its state
  };


  const coffeeItems = useMemo(() => ALL_MENU_ITEMS.filter(item => item.category === ItemCategory.COFFEE), []);
  const shakeItems = useMemo(() => ALL_MENU_ITEMS.filter(item => item.category === ItemCategory.SHAKES), []);
  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);


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
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">{MENU_CATEGORIES_MAP.COFFEE}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {coffeeItems.map(item => (
                      <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">{MENU_CATEGORIES_MAP.SHAKES}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {shakeItems.map(item => (
                      <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                    ))}
                  </div>
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
              onSubmitOrder={handleSubmitOrder}
              onBackToCart={() => setAppState("menu")}
              isSubmitting={isSubmittingOrder}
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
                    <AlertTitle className="text-blue-700">Online Payment Pending</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      Your order is awaiting payment confirmation via Razorpay. If you haven't completed the payment, please do so.
                       A receipt will be sent to <span className="font-semibold text-accent">{orderDetails.email}</span> upon successful payment.
                    </AlertDescription>
                  </Alert>
                )}
                 {orderDetails.paymentMethod !== "Cash" && orderDetails.paymentMethod !== "Razorpay" && (
                    <p>A confirmation email with your receipt will be sent to <span className="font-semibold text-accent">{orderDetails.email}</span>.</p>
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
