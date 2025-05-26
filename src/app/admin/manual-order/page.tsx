
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MinusCircle, Trash2, UserPlus, ShoppingBag, Coffee, Sparkles, Edit3, DollarSign } from "lucide-react";
import { COFFEE_FLAVORS, SHAKE_FLAVORS, PRICES, SERVING_TYPES, ALL_MENU_ITEMS } from '@/lib/constants';
import type { MenuItem, ItemServingType, ManualOrderCartItem as ClientCartItem } from '@/types'; // Updated CartItem type
import { MENU_CATEGORIES } from '@/types';
import { useToast } from "@/hooks/use-toast";
// import { createManualOrderAction } from './actions'; // We will create this action later

const CUSTOMIZATION_OPTIONS = ["normal", "sweet", "bitter"] as const;
type CustomizationOption = typeof CUSTOMIZATION_OPTIONS[number];

type ProductForDisplay = MenuItem & {
  prices: Record<ItemServingType, number>;
};

export default function AdminManualOrderPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<ClientCartItem[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI">("Cash");
  const [isLoading, setIsLoading] = useState(false);

  const availableProducts = useMemo<ProductForDisplay[]>(() => {
    return ALL_MENU_ITEMS.map(item => ({
      ...item,
      prices: PRICES[item.category],
    }));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return availableProducts;
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableProducts]);

  const addToCart = (product: ProductForDisplay, servingType: ItemServingType) => {
    const price = product.prices[servingType];
    const cartItemId = `${product.id}-${servingType}-${Date.now()}`; // Ensure unique ID for items that might be added multiple times with different customizations initially

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.productId === product.id && item.servingType === servingType && item.customization === "normal");
      if (existingItemIndex > -1 && prevCart[existingItemIndex].customization === "normal") {
        // If item with normal customization exists, increment its quantity
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        return updatedCart;
      } else {
        // Add as new item
        return [...prevCart, {
          cartItemId,
          productId: product.id,
          name: product.name,
          category: product.category,
          servingType,
          price,
          quantity: 1,
          customization: "normal",
          imageHint: product.imageHint,
        }];
      }
    });
    toast({ title: `${product.name} (${servingType}) added to order.` });
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(cart => cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart => cart.filter(item => item.cartItemId !== cartItemId));
    toast({ title: "Item removed from order.", variant: "destructive" });
  };

  const updateCustomization = (cartItemId: string, customization: CustomizationOption) => {
    setCart(cart => cart.map(item => item.cartItemId === cartItemId ? { ...item, customization } : item));
  };
  
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({ title: "Cannot place an empty order.", variant: "destructive" });
      return;
    }
    if (!customerName.trim() && !customerPhone.trim()) {
       toast({ title: "Please enter customer name or phone.", variant: "destructive" });
       return;
    }
    setIsLoading(true);
    
    const orderData = {
      customerName,
      customerPhone,
      paymentMethod,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        servingType: item.servingType,
        customizationNotes: item.customization,
      })),
      totalAmount: cartTotal,
    };

    console.log("Placing Manual Order:", orderData); // Placeholder for server action
    
    // TODO: Call server action here:
    // try {
    //   const result = await createManualOrderAction(orderData);
    //   if (result.success && result.order) {
    //     toast({ title: "Order Placed Successfully!", description: `Order ID: ${result.order.id}`});
    //     setCart([]);
    //     setCustomerName('');
    //     setCustomerPhone('');
    //     setPaymentMethod('Cash');
    //   } else {
    //     toast({ title: "Failed to place order", description: result.error || "Unknown error", variant: "destructive"});
    //   }
    // } catch (error) {
    //   toast({ title: "Error placing order", description: "An unexpected error occurred.", variant: "destructive"});
    // }


    // Mock success for now
    setTimeout(() => {
      toast({ title: "Order Placed (Mock)!", description: `Total: ₹${cartTotal.toFixed(2)}` });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('Cash');
      setIsLoading(false);
    }, 1000);
  };


  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center"><UserPlus className="mr-3 h-7 w-7 text-primary" /> Manual Order Entry</CardTitle>
          </div>
          <CardDescription>Create new orders for walk-in customers or phone orders.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Coffee className="mr-2 h-5 w-5 text-primary"/>Select Products</CardTitle>
              <Input 
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="p-3">
                         <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                         <CardDescription className="text-xs">{product.category}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        {SERVING_TYPES.map(type => (
                           <Button 
                            key={type}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={() => addToCart(product, type)}
                           >
                            <span>{type} - ₹{product.prices[type]}</span>
                            <PlusCircle className="h-4 w-4"/>
                           </Button>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No products found.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Current Order & Checkout Area */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Current Order</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">Your order is empty.</p>
              ) : (
                <ScrollArea className="h-[300px] pr-2 mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Custom</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.cartItemId}>
                          <TableCell>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.servingType} - ₹{item.price}</p>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}><MinusCircle className="h-3 w-3"/></Button>
                              <span>{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}><PlusCircle className="h-3 w-3"/></Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={item.customization}
                              onValueChange={(value: CustomizationOption) => updateCustomization(item.cartItemId, value)}
                            >
                              <SelectTrigger className="h-8 w-[90px] text-xs">
                                <SelectValue placeholder="Custom" />
                              </SelectTrigger>
                              <SelectContent>
                                {CUSTOMIZATION_OPTIONS.map(opt => (
                                  <SelectItem key={opt} value={opt} className="text-xs">{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.cartItemId)}><Trash2 className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
              <Separator className="my-4"/>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customerName" className="flex items-center mb-1"><UserPlus className="mr-1 h-3 w-3"/>Customer Name</Label>
                  <Input id="customerName" placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="flex items-center mb-1"><UserPlus className="mr-1 h-3 w-3"/>Customer Phone</Label>
                  <Input id="customerPhone" placeholder="Optional" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1 block flex items-center"><DollarSign className="mr-1 h-3 w-3"/>Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(value: "Cash" | "UPI") => setPaymentMethod(value)} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Cash" id="cash"/>
                      <Label htmlFor="cash" className="font-normal">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="UPI" id="upi"/>
                      <Label htmlFor="upi" className="font-normal">UPI</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3 items-stretch">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handlePlaceOrder} 
                disabled={cart.length === 0 || isLoading}
              >
                {isLoading ? "Placing Order..." : "Place Order & Confirm Payment"}
                <Sparkles className="ml-2 h-5 w-5"/>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
