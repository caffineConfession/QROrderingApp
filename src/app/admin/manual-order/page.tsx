
"use client";

import { useState, useMemo, useEffect, startTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MinusCircle, Trash2, UserPlus, ShoppingBag, Coffee, Sparkles, Edit3, DollarSign, RefreshCw, ClipboardList, CheckCircle, ImageOff } from "lucide-react";
import { ALL_MENU_ITEMS } from '@/lib/constants'; // ProductConstantItem
import type { ProductConstantItem, ManualOrderCartItem, CustomizationType, ItemServingType, PendingCashOrderView } from '@/types';
import { PaymentMethod } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { createManualOrderAction, getPendingCashOrdersAction, confirmCashPaymentAction } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';


const CUSTOMIZATION_OPTIONS: CustomizationType[] = ["normal", "sweet", "bitter"];

export default function AdminManualOrderPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<ManualOrderCartItem[]>([]);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod.Cash | PaymentMethod.UPI>(PaymentMethod.Cash);
  
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);
  const [isFetchingPendingOrders, setIsFetchingPendingOrders] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<string | null>(null); 

  const [pendingCashOrders, setPendingCashOrders] = useState<PendingCashOrderView[]>([]);

  const fetchPendingOrders = async () => {
    setIsFetchingPendingOrders(true);
    try {
      const result = await getPendingCashOrdersAction();
      if (result.success && result.orders) {
        setPendingCashOrders(result.orders as PendingCashOrderView[]);
      } else {
        toast({ title: "Error", description: result.error || "Could not fetch pending orders.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch pending orders.", variant: "destructive" });
    } finally {
      setIsFetchingPendingOrders(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const availableProducts = useMemo<ProductConstantItem[]>(() => {
    return ALL_MENU_ITEMS; // Already in ProductConstantItem structure
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return availableProducts;
    return availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoryDisplay.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableProducts]);

  const addToCart = (product: ProductConstantItem, servingType: ItemServingType) => {
    const price = product.prices[servingType];
    const cartItemId = `${product.id}-${servingType}-${Date.now()}`; 

    setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(item => 
            item.productId === product.id && 
            item.servingType === servingType &&
            item.customization === "normal" 
        );

        if (existingItemIndex > -1) {
            const updatedCart = [...prevCart];
            updatedCart[existingItemIndex] = {
                ...updatedCart[existingItemIndex],
                quantity: updatedCart[existingItemIndex].quantity + 1,
            };
            return updatedCart;
        } else {
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
                imageUrl: product.imageUrl, // Added imageUrl
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

  const updateCustomization = (cartItemId: string, customization: CustomizationType) => {
    setCart(cart => cart.map(item => item.cartItemId === cartItemId ? { ...item, customization } : item));
  };
  
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const handlePlaceManualOrder = async () => {
    if (cart.length === 0) {
      toast({ title: "Cannot place an empty order.", variant: "destructive" });
      return;
    }
    if (!customerName.trim() && !customerPhone.trim()) {
       toast({ title: "Please enter customer name or phone for manual orders.", variant: "destructive" });
       return;
    }
    setIsSubmittingManualOrder(true);
    
    const orderData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod: manualPaymentMethod,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        servingType: item.servingType,
        customization: item.customization,
      })),
      totalAmount: cartTotal,
    };
    
    try {
      const result = await createManualOrderAction(orderData);
      if (result.success && result.orderId) {
        toast({ title: "Manual Order Placed Successfully!", description: `Order ID: ${result.orderId}`});
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setManualPaymentMethod(PaymentMethod.Cash);
      } else {
        toast({ title: "Failed to place manual order", description: result.error || "Unknown error", variant: "destructive"});
      }
    } catch (error) {
      toast({ title: "Error placing manual order", description: "An unexpected error occurred.", variant: "destructive"});
    } finally {
      setIsSubmittingManualOrder(false);
    }
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    setIsConfirmingPayment(orderId);
    try {
        const result = await confirmCashPaymentAction(orderId);
        if (result.success) {
            toast({ title: "Payment Confirmed!", description: `Order ${orderId} marked as paid.` });
            startTransition(() => {
                 fetchPendingOrders();
            });
        } else {
            toast({ title: "Payment Confirmation Failed", description: result.error || "Could not confirm payment.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Error", description: "An error occurred while confirming payment.", variant: "destructive" });
    } finally {
        setIsConfirmingPayment(null);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center"><UserPlus className="mr-3 h-7 w-7 text-primary" /> Manual Order & Cash Collection</CardTitle>
          </div>
          <CardDescription>Create new orders or confirm cash payments for customer online orders.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Pending Customer Cash Payments</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchPendingOrders} disabled={isFetchingPendingOrders}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingPendingOrders ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>These orders were placed by customers online choosing 'Cash' payment. Confirm payment below.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-3">
            {isFetchingPendingOrders && <p className="text-muted-foreground text-center py-4">Loading pending orders...</p>}
            {!isFetchingPendingOrders && pendingCashOrders.length === 0 && (
              <Alert>
                <Coffee className="h-4 w-4" />
                <AlertTitle>All Clear!</AlertTitle>
                <AlertDescription>No pending cash payments from customers at the moment.</AlertDescription>
              </Alert>
            )}
            {!isFetchingPendingOrders && pendingCashOrders.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCashOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0,15)}...</TableCell>
                      <TableCell>{order.customerName || 'N/A'}<br/><span className="text-xs text-muted-foreground">{order.customerPhone}</span></TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{order.itemsSummary}</TableCell>
                      <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleTimeString()} - {new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmCashPayment(order.id)}
                          disabled={isConfirmingPayment === order.id}
                        >
                          {isConfirmingPayment === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4"/>}
                          Confirm Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Create New Manual Order</CardTitle>
              <Input 
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-3"> {/* Increased height */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                       <div className="relative w-full h-36 bg-muted">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" onError={(e) => e.currentTarget.style.display = 'none'}/>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                               <ImageOff size={30} />
                            </div>
                          )}
                       </div>
                      <CardHeader className="p-3">
                         <CardTitle className="text-base font-semibold">{product.name}</CardTitle>
                         <CardDescription className="text-xs">{product.categoryDisplay}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2 flex-grow">
                        {SERVING_TYPES.map(type => (
                           <Button 
                            key={type}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                            onClick={() => addToCart(product, type as ItemServingType)}
                           >
                            <span>{type} - ₹{product.prices[type as ItemServingType]}</span>
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

        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-primary"/>Current Manual Order</CardTitle>
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
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.servingType} - ₹{item.price}</p>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}><MinusCircle className="h-3 w-3"/></Button>
                              <span className="text-sm">{item.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}><PlusCircle className="h-3 w-3"/></Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={item.customization}
                              onValueChange={(value: CustomizationType) => updateCustomization(item.cartItemId, value)}
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
                  <Label htmlFor="customerName" className="flex items-center mb-1 text-sm"><UserPlus className="mr-1 h-3 w-3"/>Customer Name</Label>
                  <Input id="customerName" placeholder="Optional" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="flex items-center mb-1 text-sm"><UserPlus className="mr-1 h-3 w-3"/>Customer Phone</Label>
                  <Input id="customerPhone" placeholder="Optional" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1 block flex items-center text-sm"><DollarSign className="mr-1 h-3 w-3"/>Payment Method</Label>
                  <RadioGroup value={manualPaymentMethod} onValueChange={(value: string) => setManualPaymentMethod(value as PaymentMethod.Cash | PaymentMethod.UPI)} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={PaymentMethod.Cash} id="cash"/>
                      <Label htmlFor="cash" className="font-normal text-sm">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={PaymentMethod.UPI} id="upi"/>
                      <Label htmlFor="upi" className="font-normal text-sm">UPI</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3 items-stretch pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handlePlaceManualOrder} 
                disabled={cart.length === 0 || isSubmittingManualOrder}
              >
                {isSubmittingManualOrder ? "Submitting..." : "Place Manual Order & Confirm Payment"}
                <Sparkles className="ml-2 h-5 w-5"/>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
