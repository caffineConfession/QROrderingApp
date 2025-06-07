
"use client";

import React, { useState } from 'react';
import type { CartItemClient } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Trash2, ShoppingCart, ImageOff, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface OrderCartProps {
  cartItems: CartItemClient[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  isSheet?: boolean; // To indicate if it's used in a Sheet (Navbar cart)
}

const CartItemDisplay: React.FC<{ item: CartItemClient }> = ({ item }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[50px] h-[50px] bg-muted rounded-md overflow-hidden flex-shrink-0">
        {imageError || !item.imageUrl ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff size={24} />
          </div>
        ) : (
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            width={50} 
            height={50} 
            style={{ objectFit: "cover" }}
            className="rounded-md"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div>
        <p className="font-semibold text-sm">{item.name} <span className="text-xs text-muted-foreground">({item.servingType})</span></p>
        <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)} x {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
};


export default function OrderCart({ cartItems, onUpdateQuantity, onRemoveItem, onProceedToCheckout, isSheet = false }: OrderCartProps) {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <Card className={`shadow-lg rounded-xl ${isSheet ? 'border-0 shadow-none' : ''}`}>
        {!isSheet && (
            <CardHeader>
            <CardTitle className="flex items-center text-xl"><ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Your Cart</CardTitle>
            </CardHeader>
        )}
        <CardContent className={isSheet ? 'pt-0' : ''}>
          <p className="text-muted-foreground text-center py-8">Your cart is empty. Add some items to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-lg rounded-xl ${isSheet ? 'border-0 shadow-none bg-transparent' : ''}`}>
       {!isSheet && (
            <CardHeader>
                <CardTitle className="flex items-center text-xl"><ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Your Cart</CardTitle>
            </CardHeader>
       )}
      <CardContent className="p-0">
        <ScrollArea className={`${isSheet ? 'h-[calc(100vh-200px)]' : 'h-[300px]'} p-4`}> {/* Adjust height for sheet */}
          {cartItems.map((item, index) => (
            <React.Fragment key={item.cartItemId}>
              <div className="flex items-center justify-between py-3">
                <CartItemDisplay item={item} />
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-5 sm:w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(item.cartItemId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {index < cartItems.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </ScrollArea>
      </CardContent>
      {/* Footer is conditional for Sheet mode, handled by Navbar for Sheet */}
      {!isSheet && (
        <CardFooter className="flex flex-col gap-4 p-4 border-t">
            <div className="flex justify-between w-full text-lg font-semibold">
            <span>Total:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <Button onClick={onProceedToCheckout} className="w-full" size="lg" disabled={cartItems.length === 0}>
            Proceed to Checkout
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                Product images are for illustration purposes only. Actual product size and looks may vary.
            </p>
        </CardFooter>
      )}
    </Card>
  );
}
