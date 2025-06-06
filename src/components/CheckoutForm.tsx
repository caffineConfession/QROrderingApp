
"use client";

import type { CustomerDetails } from '@/types';
import { PaymentMethod } from '@/types'; 
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Phone, Mail, CreditCard, CircleDollarSign, Send, RefreshCw } from 'lucide-react';
import Script from 'next/script';
import { createRazorpayOrderAction, verifyRazorpayPaymentAction } from '@/app/actions/razorpay-actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';


const checkoutSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  paymentMethod: z.enum([PaymentMethod.Cash, PaymentMethod.Razorpay], { required_error: "Please select a payment method." }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  totalAmount: number; 
  onSubmitOrder: (customerDetails: CustomerDetails, paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay) => Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
    paymentMethod?: PaymentMethod; 
    totalAmount?: number; 
  }>;
  onBackToCart: () => void;
  isSubmittingInternalOrder: boolean; 
  onPaymentSuccess: (orderDetails: { orderId: string, paymentMethod: PaymentMethod, customerDetails: CustomerDetails, totalAmount: number }) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutForm({
  totalAmount,
  onSubmitOrder,
  onBackToCart,
  isSubmittingInternalOrder,
  onPaymentSuccess,
}: CheckoutFormProps) {
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      paymentMethod: PaymentMethod.Cash,
    },
  });

  const handleRazorpayPayment = async (
    cafficoOrder: { orderId: string, totalAmount: number },
    customerDetails: CustomerDetails
  ) => {
    setIsProcessingPayment(true);

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      toast({
        title: "Razorpay Configuration Error",
        description: "Razorpay Key ID is not configured. Please inform the site administrator.",
        variant: "destructive",
        duration: 7000,
      });
      setIsProcessingPayment(false);
      return;
    }

    try {
      // 1. Create Razorpay Order
      const razorpayOrderResponse = await createRazorpayOrderAction(
        cafficoOrder.totalAmount * 100, // Amount in paise
        "INR",
        cafficoOrder.orderId
      );

      if (!razorpayOrderResponse.success || !razorpayOrderResponse.razorpayOrderId) {
        toast({ title: "Payment Error", description: razorpayOrderResponse.error || "Could not initiate Razorpay order.", variant: "destructive" });
        setIsProcessingPayment(false);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId, // Use the validated key
        amount: razorpayOrderResponse.amount, 
        currency: razorpayOrderResponse.currency,
        name: "Caffico Express",
        description: `Order #${cafficoOrder.orderId.substring(0,8)}`,
        image: "https://placehold.co/100x100.png?text=Caffico", 
        order_id: razorpayOrderResponse.razorpayOrderId,
        handler: async function (response: any) {
          // 3. Verify Payment on server
          const verificationResult = await verifyRazorpayPaymentAction({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            internalOrderId: cafficoOrder.orderId,
          });

          if (verificationResult.success && verificationResult.orderId) {
            onPaymentSuccess({
              orderId: verificationResult.orderId,
              paymentMethod: PaymentMethod.Razorpay,
              customerDetails,
              totalAmount: cafficoOrder.totalAmount,
            });
          } else {
            toast({ title: "Payment Verification Failed", description: verificationResult.error || "Please contact support.", variant: "destructive" });
          }
          setIsProcessingPayment(false);
        },
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.phone,
        },
        notes: {
          address: "Caffico Express Order",
          internalOrderId: cafficoOrder.orderId,
        },
        theme: {
          color: "#42A5F5", 
        },
        modal: {
            ondismiss: function() {
                toast({ title: "Payment Cancelled", description: "You closed the payment window.", variant: "default" });
                setIsProcessingPayment(false);
            }
        }
      };
      
      if (!window.Razorpay) {
        toast({
          title: "Payment Error",
          description: "Razorpay SDK not loaded. Please refresh the page or check your internet connection.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
          toast({
            title: "Payment Failed",
            description: response.error.description || "Your payment could not be processed.",
            variant: "destructive"
          });
          setIsProcessingPayment(false);
      });
      rzp.open();

    } catch (error) {
      console.error("Razorpay processing error:", error);
      toast({ title: "Payment Error", description: "An unexpected error occurred with Razorpay.", variant: "destructive" });
      setIsProcessingPayment(false);
    }
  };


  const handleSubmit: SubmitHandler<CheckoutFormData> = async (data) => {
    const customerDetails: CustomerDetails = { name: data.name, phone: data.phone, email: data.email };
    
    const internalOrderResult = await onSubmitOrder(customerDetails, data.paymentMethod);

    if (!internalOrderResult.success || !internalOrderResult.orderId || internalOrderResult.totalAmount === undefined) {
      toast({ title: "Order Creation Failed", description: internalOrderResult.error || "Could not create your order.", variant: "destructive" });
      return;
    }

    if (internalOrderResult.paymentMethod === PaymentMethod.Cash) {
      onPaymentSuccess({
        orderId: internalOrderResult.orderId,
        paymentMethod: PaymentMethod.Cash,
        customerDetails,
        totalAmount: internalOrderResult.totalAmount,
      });
    } else if (internalOrderResult.paymentMethod === PaymentMethod.Razorpay) {
      await handleRazorpayPayment(
        { orderId: internalOrderResult.orderId, totalAmount: internalOrderResult.totalAmount },
        customerDetails
      );
    }
  };
  
  const isLoading = isSubmittingInternalOrder || isProcessingPayment;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Customer Details &amp; Payment</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-primary" /> Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary" /> Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="10-digit Mobile Number" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" /> Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Select Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 pt-2"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={PaymentMethod.Cash} id="cash" disabled={isLoading}/>
                          </FormControl>
                          <Label htmlFor="cash" className="font-normal flex items-center cursor-pointer">
                            <CircleDollarSign className="mr-2 h-5 w-5 text-green-500" /> Pay with Cash
                          </Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={PaymentMethod.Razorpay} id="razorpay" disabled={isLoading}/>
                          </FormControl>
                          <Label htmlFor="razorpay" className="font-normal flex items-center cursor-pointer">
                             <CreditCard className="mr-2 h-5 w-5 text-blue-500" /> Pay Online (Razorpay)
                          </Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="text-lg font-bold pt-4 border-t">
                Total Amount: ₹{totalAmount.toFixed(2)}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 p-4">
              <Button type="button" variant="outline" onClick={onBackToCart} className="w-full sm:w-auto" disabled={isLoading}>
                Back to Cart
              </Button>
              <Button type="submit" className="w-full sm:w-auto" size="lg" disabled={isLoading}>
               {isLoading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />} 
               {isLoading ? (isProcessingPayment ? "Processing Payment..." : "Placing Order...") : "Confirm Order"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
