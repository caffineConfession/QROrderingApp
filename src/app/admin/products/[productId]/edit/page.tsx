
import { getProductById, updateProductAction } from "../actions";
import ProductForm from "../components/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditProductPageProps {
  params: { productId: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = params;
  const { success, product, error } = await getProductById(productId);

  if (!success || !product) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2"/>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Product not found."}</p>
          <Button asChild variant="link" className="mt-4">
            <Link href="/admin/products">Back to Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: any) => {
    "use server"; // Ensure this server action part is correctly handled if ProductForm itself makes the call
    return updateProductAction(productId, data);
  };
  
  // Transform product data to match ProductFormData if necessary (especially enums)
  const initialData = {
    name: product.name,
    description: product.description || "",
    category: product.category, // Assuming Prisma enum matches ProductFormData enum
    isAvailable: product.isAvailable,
    imageHint: product.imageHint || "",
    id: product.id
  };


  return (
    <ProductForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isEditMode={true}
    />
  );
}
