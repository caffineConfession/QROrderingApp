
"use client";

import React, { useState } from 'react'; // Added useState
import type { CartItemClient } from '@/types'; // Corrected type import name
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Trash2, ShoppingCart, ImageOff } from 'lucide-react';
import Image from 'next/image';

interface OrderCartProps {
  cartItems: CartItemClient[]; // Corrected type
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
}

const CartItemDisplay: React.FC<{ item: CartItemClient }> = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const imageSrc = item.imageUrl || `https://placehold.co/60x60.png?text=${encodeURIComponent(item.name)}`;

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
            objectFit="cover"
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


export default function OrderCart({ cartItems, onUpdateQuantity, onRemoveItem, onProceedToCheckout }: OrderCartProps) {
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Your cart is empty. Add some items to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Your Cart</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] p-4">
          {cartItems.map((item, index) => (
            <React.Fragment key={item.cartItemId}>
              <div className="flex items-center justify-between py-3">
                <CartItemDisplay item={item} />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
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
      <CardFooter className="flex flex-col gap-4 p-4 border-t">
        <div className="flex justify-between w-full text-lg font-semibold">
          <span>Total:</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
        <Button onClick={onProceedToCheckout} className="w-full" size="lg">
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  );
}
