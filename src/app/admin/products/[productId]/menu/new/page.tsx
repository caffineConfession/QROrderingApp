
import MenuItemForm from "../../../components/MenuItemForm"; // Adjusted path
import { createMenuItemAction, type MenuItemFormData } from "../../../actions"; // Adjusted path
import { getProductById } from "../../../actions"; // Adjusted path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NewMenuItemPageProps {
  params: { productId: string };
}

export default async function NewMenuItemPage({ params }: NewMenuItemPageProps) {
  const { productId } = params;
  const { product, error } = await getProductById(productId);

  if (error || !product) {
     return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2"/>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Product not found. Cannot add menu item."}</p>
           <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: MenuItemFormData) => {
    "use server";
    return createMenuItemAction(productId, data);
  };

  return (
    <div>
      <MenuItemForm
        productId={productId}
        productName={product.name}
        onSubmit={handleSubmit}
        isEditMode={false}
      />
    </div>
  );
}

