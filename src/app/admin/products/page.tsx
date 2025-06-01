
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, PlusCircle, Edit, Trash2, Eye, AlertCircle } from "lucide-react";
import { getProducts } from "./actions"; // Assuming you have a deleteProductAction
import { ItemCategory as PrismaItemCategory } from "@prisma/client";
import { MENU_CATEGORIES_MAP } from "@/types";

// Re-enable dynamic fetching
export const dynamic = 'force-dynamic'; 

export default async function AdminProductsPage() {
  const { success, products, error } = await getProducts();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><Package className="mr-3 h-6 w-6 text-primary" /> Menu & Product Management</CardTitle>
            <CardDescription>Manage your cafe's products, their serving types, prices, and stock.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
             <div className="text-red-600 p-4 border border-red-300 bg-red-50 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2"/> {error}
            </div>
          )}
          {!error && !products?.length && (
            <p className="text-muted-foreground">No products found. Add your first product to get started!</p>
          )}
          {!error && products && products.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Menu Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{MENU_CATEGORIES_MAP[product.category as keyof typeof MENU_CATEGORIES_MAP] || product.category}</TableCell>
                    <TableCell className="truncate max-w-xs">{product.description || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={product.isAvailable ? "default" : "destructive"}>
                        {product.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>{product._count.menuItems}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${product.id}/menu`}>
                          <Eye className="mr-1 h-3 w-3" /> View Menu Items
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Edit className="mr-1 h-3 w-3" /> Edit Product
                        </Link>
                      </Button>
                      {/* Delete button can be added here, linking to an action or confirmation dialog */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
