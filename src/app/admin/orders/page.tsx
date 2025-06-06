
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, AlertCircle, RefreshCw } from "lucide-react";
import { getProcessableOrdersAction, type ProcessableOrder } from "./actions";
import OrderStatusUpdater from "./OrderStatusUpdater";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrderStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";

const POLLING_INTERVAL = 15000; // 15 seconds

function AdminOrdersLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[120px]" /><Skeleton className="h-3 w-[100px] mt-1" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
          <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-[120px]" /></TableCell>
        </TableRow>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ProcessableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad) {
      setIsPolling(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getProcessableOrdersAction();
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || "Failed to fetch orders.");
        if (isInitialLoad) setOrders([]); // Clear orders on initial load error
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
      setError("An unexpected error occurred while fetching orders.");
      if (isInitialLoad) setOrders([]);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true); // Initial fetch

    const intervalId = setInterval(() => {
      fetchOrders(false); // Subsequent polling fetches
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" />
              Manage Orders
            </CardTitle>
            {isPolling && <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />}
          </div>
          <CardDescription>
            View, process, and track customer orders. This list updates automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
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
                <AdminOrdersLoadingSkeleton />
              </TableBody>
            </Table>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Orders</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : !orders?.length ? (
            <Alert>
              <ShoppingBag className="h-4 w-4" />
              <AlertTitle>No Orders to Process</AlertTitle>
              <AlertDescription>
                There are currently no paid orders awaiting processing. Check back soon!
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[calc(100vh_-_280px)] rounded-md border"> {/* Adjusted height */}
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
                      <TableCell className="font-medium truncate max-w-[100px]" title={order.id}>
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {order.customerName || "N/A"}
                        {order.customerPhone && (
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[250px]">
                        {order.items.map(item => 
                          `${item.productName} (${item.servingType}) x ${item.quantity}${item.customization !== 'normal' ? ` [${item.customization}]` : ''}`
                        ).join(', ')}
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
                          {order.status.replace(/_/g, " ")}
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
