
"use client";

import type { CustomerDetails } from '@/types';
import { PaymentMethod } from '@/types'; // Added this import
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

const checkoutSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(/^\d{10}$/, { message: "Please enter a valid 10-digit phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  paymentMethod: z.enum([PaymentMethod.Cash, PaymentMethod.Razorpay], { required_error: "Please select a payment method." }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  totalAmount: number;
  onSubmitOrder: (customerDetails: CustomerDetails, paymentMethod: PaymentMethod.Cash | PaymentMethod.Razorpay) => void;
  onBackToCart: () => void;
  isSubmitting: boolean;
}

export default function CheckoutForm({ totalAmount, onSubmitOrder, onBackToCart, isSubmitting }: CheckoutFormProps) {
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      paymentMethod: PaymentMethod.Cash,
    },
  });

  const handleSubmit: SubmitHandler<CheckoutFormData> = (data) => {
    onSubmitOrder(
      { name: data.name, phone: data.phone, email: data.email },
      data.paymentMethod
    );
  };

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl">Customer Details & Payment</CardTitle>
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
                    <Input placeholder="Your Name" {...field} disabled={isSubmitting} />
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
                    <Input type="tel" placeholder="10-digit Mobile Number" {...field} disabled={isSubmitting} />
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
                    <Input type="email" placeholder="your.email@example.com" {...field} disabled={isSubmitting} />
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
                          <RadioGroupItem value={PaymentMethod.Cash} id="cash" disabled={isSubmitting}/>
                        </FormControl>
                        <Label htmlFor="cash" className="font-normal flex items-center cursor-pointer">
                          <CircleDollarSign className="mr-2 h-5 w-5 text-green-500" /> Pay with Cash
                        </Label>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={PaymentMethod.Razorpay} id="razorpay" disabled={isSubmitting}/>
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
            <Button type="button" variant="outline" onClick={onBackToCart} className="w-full sm:w-auto" disabled={isSubmitting}>
              Back to Cart
            </Button>
            <Button type="submit" className="w-full sm:w-auto" size="lg" disabled={isSubmitting}>
             {isSubmitting ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />} 
             {isSubmitting ? "Processing..." : "Confirm Order"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
