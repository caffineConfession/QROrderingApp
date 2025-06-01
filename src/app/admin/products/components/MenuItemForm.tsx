
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { MenuItemFormData, MenuItemFormSchema } from "../actions";
import { ItemServingType as PrismaItemServingType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

interface MenuItemFormProps {
  productId: string;
  productName: string;
  initialData?: MenuItemFormData & { id?: string };
  onSubmit: (data: MenuItemFormData) => Promise<{ success: boolean; error?: string; menuItem?: any }>;
  isEditMode: boolean;
}

export default function MenuItemForm({ productId, productName, initialData, onSubmit, isEditMode }: MenuItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(MenuItemFormSchema),
    defaultValues: initialData || {
      servingType: PrismaItemServingType.Cup,
      price: 0,
      stockQuantity: 0,
      isAvailable: true,
    },
  });

  const { formState: {isSubmitting} } = form;

  const handleFormSubmit: SubmitHandler<MenuItemFormData> = async (data) => {
    const result = await onSubmit(data);
    if (result.success) {
      toast({
        title: isEditMode ? "Menu Item Updated" : "Menu Item Created",
        description: `Serving type ${data.servingType} for ${productName} has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.push(`/admin/products/${productId}/menu`);
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Menu Item" : `Add New Menu Item to ${productName}`}</CardTitle>
        <CardDescription>
          {isEditMode ? "Update serving type, price, stock, and availability." : "Define a new serving type with its price and stock quantity."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="servingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serving Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a serving type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PrismaItemServingType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditMode && <FormDescription className="text-xs">Serving type cannot be changed after creation.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 150.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="e.g., 100" {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Current available stock for this specific item and serving type.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Available for Purchase
                    </FormLabel>
                     <FormDescription>
                      Uncheck if this specific serving type should not be orderable.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href={`/admin/products/${productId}/menu`}><ArrowLeft className="mr-2 h-4 w-4"/>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              {isEditMode ? "Save Changes" : "Add Menu Item"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

