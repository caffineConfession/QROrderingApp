
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackagePlus, PlusCircle, Edit, Trash2, ArrowLeft, AlertCircle, Coffee, ShoppingBag } from "lucide-react";
import { getProductById, deleteMenuItemAction } from "../../actions"; // Assuming actions.ts is in ../../
import { ItemServingType as PrismaItemServingType } from "@prisma/client";
import { ScrollArea } from "@/components/ui/scroll-area";

// Re-enable dynamic fetching
export const dynamic = 'force-dynamic'; 

interface ManageMenuItemsPageProps {
  params: { productId: string };
}

export default async function ManageMenuItemsPage({ params }: ManageMenuItemsPageProps) {
  const { productId } = params;
  const { success, product, error: productError } = await getProductById(productId);

  if (productError || !success || !product) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2"/>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{productError || "Product not found."}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm" className="mb-4">
        <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4"/>Back to All Products</Link>
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center">
              {product.category === "COFFEE" ? <Coffee className="mr-3 h-6 w-6 text-primary"/> : <ShoppingBag className="mr-3 h-6 w-6 text-primary"/> }
              Manage Menu Items for: {product.name}
            </CardTitle>
            <CardDescription>Add, edit, or remove serving types, prices, and stock for this product.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/admin/products/${productId}/menu/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Menu Item
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!product.menuItems || product.menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PackagePlus className="mx-auto h-12 w-12 mb-4"/>
              <p>No menu items (serving types/prices) defined for this product yet.</p>
              <p>Click "Add Menu Item" to get started.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serving Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Quantity</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.servingType}</TableCell>
                      <TableCell>₹{item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.stockQuantity}</TableCell>
                      <TableCell>
                        <Badge variant={item.isAvailable ? "default" : "destructive"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/products/${productId}/menu/${item.id}/edit`}>
                            <Edit className="mr-1 h-3 w-3" /> Edit
                          </Link>
                        </Button>
                         {/* For delete, you'd typically use a form + server action or a client-side confirmation */}
                         {/* This is a simplified example for now, ideally use a small form or dialog for DELETE */}
                        <form action={async () => {
                            "use server";
                            await deleteMenuItemAction(item.id, productId);
                         }} className="inline-block">
                           <Button type="submit" variant="destructive" size="sm" >
                                <Trash2 className="mr-1 h-3 w-3" /> Delete
                           </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

