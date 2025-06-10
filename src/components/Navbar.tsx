
"use client";

import Link from 'next/link';
import { Coffee, ShoppingCart, UserCircle, Menu as MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import OrderCart from '@/components/OrderCart'; // Re-use OrderCart for the sheet content
import { useCart } from '@/contexts/CartContext';
import { Separator } from './ui/separator';
import { useState } from 'react';

export default function Navbar() {
  const { cartItems, totalAmount, totalItems, updateQuantity, removeFromCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-md px-4 md:px-8 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Coffee className="h-8 w-8" />
          <h1 className="text-xl md:text-2xl font-bold">
            Caffico Express
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" asChild className="hover:bg-primary/80">
            <Link href="/">About Us</Link>
          </Button>
          <Button variant="ghost" asChild className="hover:bg-primary/80">
            <Link href="/menu">Menu</Link>
          </Button>
          <Button variant="ghost" asChild className="hover:bg-primary/80">
            <Link href="/admin/login">Admin</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="relative hover:bg-primary/80">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle className="text-2xl">Your Cart</SheetTitle>
                <SheetDescription className="sr-only">A summary of items currently in your shopping cart.</SheetDescription>
              </SheetHeader>
              <Separator />
              <div className="flex-grow overflow-y-auto">
                 {/* OrderCart expects onProceedToCheckout. For Navbar cart, this might just close the sheet or link to /menu */}
                <OrderCart
                  cartItems={cartItems}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                  onProceedToCheckout={() => {
                    // In a real app, this might navigate to a full checkout page or handle differently
                    // For now, let's assume it just means "go to menu page if not there" or similar
                    // If on /menu, OrderCart on that page will handle checkout
                    // This is a simplified handler for the sheet cart
                    if (cartItems.length > 0) {
                       // Potentially navigate to /menu or /checkout if separate page
                       // For now, the main checkout button is on the /menu page's cart
                       // We can add a button in SheetFooter to navigate to /menu
                    }
                  }}
                  isSheet={true} 
                />
              </div>
              {cartItems.length > 0 && (
                 <SheetFooter className="mt-auto border-t pt-4">
                    <Link href="/menu" className="w-full">
                        <Button className="w-full" variant="default" size="lg" disabled={cartItems.length === 0}>
                            Proceed to Checkout (₹{totalAmount.toFixed(2)})
                        </Button>
                    </Link>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/80">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-3/4 p-4">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2 text-xl">
                  <Coffee className="h-7 w-7 text-primary" /> Caffico Express
                </SheetTitle>
                 <SheetDescription className="sr-only">Main navigation menu.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col space-y-3">
                <Button variant="ghost" asChild className="justify-start text-base p-3" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/">About Us</Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start text-base p-3" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/menu">Menu</Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start text-base p-3" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/admin/login">Admin Login</Link>
                </Button>
                <Separator />
                 <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" className="relative justify-start text-base p-3">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Cart
                        {totalItems > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {totalItems}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md flex flex-col">
                      <SheetHeader>
                        <SheetTitle className="text-2xl">Your Cart</SheetTitle>
                        <SheetDescription className="sr-only">A summary of items currently in your shopping cart.</SheetDescription>
                      </SheetHeader>
                      <Separator />
                      <div className="flex-grow overflow-y-auto">
                        <OrderCart
                          cartItems={cartItems}
                          onUpdateQuantity={updateQuantity}
                          onRemoveItem={removeFromCart}
                          onProceedToCheckout={() => {}}
                          isSheet={true}
                        />
                      </div>
                       {cartItems.length > 0 && (
                        <SheetFooter className="mt-auto border-t pt-4">
                            <Link href="/menu" className="w-full">
                                <Button className="w-full" variant="default" size="lg" onClick={() => setMobileMenuOpen(false)} disabled={cartItems.length === 0}>
                                    Proceed to Checkout (₹{totalAmount.toFixed(2)})
                                </Button>
                            </Link>
                        </SheetFooter>
                      )}
                    </SheetContent>
                  </Sheet>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

