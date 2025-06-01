
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ProductFormData, ProductFormSchema } from "../actions";
import { ItemCategory as PrismaItemCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

interface ProductFormProps {
  initialData?: ProductFormData & { id?: string }; // id is optional for create
  onSubmit: (data: ProductFormData) => Promise<{ success: boolean; error?: string; product?: any }>;
  isEditMode: boolean;
}

export default function ProductForm({ initialData, onSubmit, isEditMode }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      category: PrismaItemCategory.COFFEE,
      isAvailable: true,
      imageHint: "",
    },
  });

  const {formState: {isSubmitting}} = form;

  const handleFormSubmit: SubmitHandler<ProductFormData> = async (data) => {
    const result = await onSubmit(data);
    if (result.success) {
      toast({
        title: isEditMode ? "Product Updated" : "Product Created",
        description: `${data.name} has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.push("/admin/products"); // Redirect to product list
      router.refresh(); // ensure list is up to date
    } else {
      toast({
        title: "Error",
        description: result.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Product" : "Add New Product"}</CardTitle>
        <CardDescription>
          {isEditMode ? "Update the details of this product." : "Fill in the details to add a new product to your menu."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vanilla Latte" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the product..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PrismaItemCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0) + category.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Hint (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., vanilla coffee drink" {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Keywords for AI image search (max 2 words, e.g. "latte art").</FormDescription>
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
                      Uncheck if this product should not be orderable by customers.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4"/>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              {isEditMode ? "Save Changes" : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
