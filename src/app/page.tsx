"use client";

import { useState, useMemo } from 'react';
import type { MenuItem, ItemServingType, CartItem, CustomerDetails, PaymentMethod } from '@/types';
import { MENU_CATEGORIES, COFFEE_FLAVORS, SHAKE_FLAVORS, PRICES } from '@/lib/constants';
import Header from '@/components/Header';
import MenuItemCard from '@/components/MenuItemCard';
import OrderCart from '@/components/OrderCart';
import CheckoutForm from '@/components/CheckoutForm';
import FlavorSuggester from '@/components/FlavorSuggester';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AppState = "menu" | "checkout" | "confirmation";

export default function HomePage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appState, setAppState] = useState<AppState>("menu");
  const [orderDetails, setOrderDetails] = useState<any>(null); // Store confirmed order details
  const { toast } = useToast();

  const handleAddToCart = (item: MenuItem, servingType: ItemServingType, price: number) => {
    const cartItemId = `${item.id}-${servingType}`;
    setCartItems(prevItems => {
      const existingItem = prevItems.find(ci => ci.cartItemId === cartItemId);
      if (existingItem) {
        return prevItems.map(ci =>
          ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prevItems, { ...item, servingType, quantity: 1, price, cartItemId }];
    });
    toast({
      title: "Added to cart!",
      description: `${item.name} (${servingType}) has been added to your cart.`,
      variant: "default",
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

  const handleSubmitOrder = (customerDetails: CustomerDetails, paymentMethod: PaymentMethod) => {
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalOrder = {
      ...customerDetails,
      items: cartItems,
      totalAmount,
      paymentMethod,
      orderId: `CAFFICO-${Date.now()}`, // Mock order ID
      timestamp: new Date(),
    };
    
    console.log("Order Submitted:", finalOrder);
    setOrderDetails(finalOrder); // Save order details for confirmation page
    setAppState("confirmation");
    setCartItems([]); // Clear cart

    // Mock sending receipt
    toast({
      title: "Order Placed Successfully!",
      description: `Your order #${finalOrder.orderId} has been placed. A receipt will be sent to ${customerDetails.email}.`,
      duration: 7000,
    });
  };

  const coffeeItems = useMemo(() => COFFEE_FLAVORS, []);
  const shakeItems = useMemo(() => SHAKE_FLAVORS, []);
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
                  <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">{MENU_CATEGORIES.COFFEE}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {coffeeItems.map(item => (
                      <MenuItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  <h2 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary pb-2">{MENU_CATEGORIES.SHAKES}</h2>
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
            />
          </div>
        )}

        {appState === "confirmation" && orderDetails && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Card className="shadow-xl rounded-xl p-6 md:p-10">
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-500 mb-6" />
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">Thank You for Your Order!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <p className="text-lg">Your order <span className="font-semibold text-accent">#{orderDetails.orderId}</span> has been placed successfully.</p>
                <p>A confirmation email with your receipt has been sent to <span className="font-semibold text-accent">{orderDetails.email}</span>.</p>
                {orderDetails.paymentMethod === "Cash" && (
                  <Alert className="mt-4 bg-yellow-50 border-yellow-300">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-700">Cash Payment</AlertTitle>
                    <AlertDescription className="text-yellow-600">
                      Please pay ₹{orderDetails.totalAmount.toFixed(2)} in cash at the counter. Your order will be processed upon payment confirmation.
                    </AlertDescription>
                  </Alert>
                )}
                <Separator className="my-6"/>
                <h3 className="text-xl font-semibold mb-2">Order Summary:</h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {orderDetails.items.map((item: CartItem) => (
                    <li key={item.cartItemId} className="flex justify-between text-sm p-2 bg-muted/50 rounded-md">
                      <span>{item.name} ({item.servingType}) x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                  <span>Total:</span>
                  <span>₹{orderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="mt-8">
                <Button onClick={() => { setAppState("menu"); setOrderDetails(null); }} className="w-full" size="lg">
                  Place Another Order
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
