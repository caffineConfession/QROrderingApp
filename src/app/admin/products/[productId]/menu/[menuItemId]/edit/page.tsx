
import MenuItemForm from "../../../components/MenuItemForm"; // Adjusted path
import { getMenuItemById, updateMenuItemAction, type MenuItemFormData } from "../../../actions"; // Adjusted path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditMenuItemPageProps {
  params: { productId: string; menuItemId: string };
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const { productId, menuItemId } = params;
  const { success, menuItem, error } = await getMenuItemById(menuItemId);

  if (!success || !menuItem) {
    return (
       <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2"/>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Menu item not found."}</p>
           <Button asChild variant="outline" className="mt-4">
            <Link href={`/admin/products/${productId}/menu`}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Menu Items</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: MenuItemFormData) => {
    "use server";
    return updateMenuItemAction(menuItemId, productId, data);
  };
  
  const initialData: MenuItemFormData & { id: string } = {
    id: menuItem.id,
    servingType: menuItem.servingType,
    price: menuItem.price,
    stockQuantity: menuItem.stockQuantity,
    isAvailable: menuItem.isAvailable,
  };

  return (
    <MenuItemForm
      productId={productId}
      productName={menuItem.product.name} // Assuming product is included in getMenuItemById
      initialData={initialData}
      onSubmit={handleSubmit}
      isEditMode={true}
    />
  );
}

