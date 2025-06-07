
"use client";

import type { CartItemClient, ProductWithMenuDetails, PrismaMenuItemDetail, CustomizationType, ItemCategory } from '@/types';
import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItemClient[];
  addToCart: (product: ProductWithMenuDetails, selectedMenuItem: PrismaMenuItemDetail) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<CartItemClient[]>([]);
  const { toast } = useToast();

  const addToCart = useCallback((product: ProductWithMenuDetails, selectedMenuItem: PrismaMenuItemDetail) => {
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
        if (updatedItem.quantity > selectedMenuItem.stockQuantity) {
          toast({
            title: "Stock Limit Reached",
            description: `Cannot add more ${product.name} (${selectedMenuItem.servingType}). Max available: ${selectedMenuItem.stockQuantity}.`,
            variant: "destructive",
          });
          return prevItems;
        }
        return prevItems.map((ci, index) =>
          index === existingItemIndex ? updatedItem : ci
        );
      }
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
        category: product.category as ItemCategory,
        servingType: selectedMenuItem.servingType,
        price: selectedMenuItem.price,
        quantity: 1,
        customization: "normal" as CustomizationType,
        imageHint: product.imageHint || null,
        imageUrl: product.imageUrl || null,
        isAvailable: selectedMenuItem.isAvailable,
        stockQuantity: selectedMenuItem.stockQuantity,
      }];
    });
    toast({
      title: "Added to cart!",
      description: `${product.name} (${selectedMenuItem.servingType}) has been added.`,
    });
  }, [toast]);

  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemId === cartItemId) {
          if (newQuantity < 1) {
            return item; 
          }
          if (newQuantity > item.stockQuantity) {
            toast({
              title: "Stock Limit Reached",
              description: `Max available quantity for ${item.name} (${item.servingType}) is ${item.stockQuantity}.`,
              variant: "destructive",
            });
            return { ...item, quantity: item.stockQuantity };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  }, [toast]);

  const removeFromCart = useCallback((cartItemId: string) => {
    const removedItem = cartItems.find(item => item.cartItemId === cartItemId);
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    if (removedItem) {
      toast({
        title: "Item removed",
        description: `${removedItem.name} (${removedItem.servingType}) removed from cart.`,
        variant: "destructive",
      });
    }
  }, [cartItems, toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalAmount, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}
