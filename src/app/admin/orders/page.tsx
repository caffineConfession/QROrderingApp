
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, AlertCircle } from "lucide-react"; // Added AlertCircle for error display
import { getProcessableOrdersAction } from "./actions"; // Removed type ProcessableOrder as it's inferred
import OrderStatusUpdater from "./OrderStatusUpdater";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrderStatus } from "@prisma/client"; // Explicitly import OrderStatus from Prisma Client

export const dynamic = 'force-dynamic'; // Ensure data is fetched on each request

export default async function AdminOrdersPage() {
  const { success, orders, error } = await getProcessableOrdersAction();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center"><ShoppingBag className="mr-3 h-6 w-6 text-primary" />Manage Orders</CardTitle>
          </div>
          <CardDescription>View, process, and track customer orders that are paid and ready for action.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Orders</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!error && !orders?.length && (
            <Alert>
              <ShoppingBag className="h-4 w-4" />
              <AlertTitle>No Orders to Process</AlertTitle>
              <AlertDescription>There are currently no paid orders awaiting processing. Check back soon!</AlertDescription>
            </Alert>
          )}
          {!error && orders && orders.length > 0 && (
            <ScrollArea className="h-[600px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ordered At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium truncate max-w-[100px]" title={order.id}>{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        {order.customerName || "N/A"}
                        {order.customerPhone && <div className="text-xs text-muted-foreground">{order.customerPhone}</div>}
                      </TableCell>
                      <TableCell className="text-xs max-w-[250px]">
                        {order.items.map(item => `${item.productName} (${item.servingType}) x ${item.quantity}${item.customization !== 'normal' ? ` [${item.customization}]` : ''}`).join(', ')}
                      </TableCell>
                      <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.status === OrderStatus.COMPLETED ? "default" : 
                            order.status === OrderStatus.CANCELLED ? "destructive" : 
                            "secondary"
                          }
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
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
