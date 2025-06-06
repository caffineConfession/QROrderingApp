// src/app/admin/orders/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, AlertCircle, RefreshCw, WifiOff, Wifi } from "lucide-react";
import { getProcessableOrdersAction, type ProcessableOrder } from "./actions";
import OrderStatusUpdater from "./OrderStatusUpdater";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrderStatus } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const ws = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
        setIsLoading(true);
    }
    setError(null);

    try {
      const result = await getProcessableOrdersAction();
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || "Failed to fetch orders.");
        if (showLoadingSpinner) setOrders([]);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
      setError("An unexpected error occurred while fetching orders.");
      if (showLoadingSpinner) setOrders([]);
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders(true); // Initial fetch

    const connectWebSocket = () => {
      // Ensure WebSocket runs only in the browser
      if (typeof window === 'undefined') return;

      setWsStatus('connecting');
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/orders/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setWsStatus('connected');
        toast({ title: "Real-time Sync", description: "Connected for live order updates." });
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          if (message.type === 'ORDERS_UPDATED') {
            // console.log('WebSocket: ORDERS_UPDATED message received', message.payload);
            toast({ title: "Order Update", description: "Order list has been updated.", duration: 2000});
            fetchOrders(false); // Re-fetch orders without full loading spinner
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsStatus('disconnected');
        // Don't toast on every error, could be noisy if server is down
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected. Code:", event.code, "Reason:", event.reason);
        setWsStatus('disconnected');
        if (!event.wasClean) {
             toast({ title: "Real-time Sync Disconnected", description: "Attempting to reconnect...", variant: "destructive" });
            // Implement reconnection logic if desired, e.g., with a timeout
            setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
        }
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        console.log("Closing WebSocket connection");
        ws.current.close(1000, "Component unmounting"); // 1000 is normal closure
      }
    };
  }, [fetchOrders, toast]);
  
  const getWsStatusIndicator = () => {
    switch (wsStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" title="WebSocket Connected" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" title="WebSocket Connecting..." />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" title="WebSocket Disconnected" />;
      default:
        return null;
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-3 h-6 w-6 text-primary" />
              Manage Orders
            </CardTitle>
            <div className="flex items-center gap-2">
                {getWsStatusIndicator()}
                <Button variant="outline" size="sm" onClick={() => fetchOrders(true)} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin': ''}`} />
                    Refresh Manually
                </Button>
            </div>
          </div>
          <CardDescription>
            View, process, and track customer orders. Updates should appear in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && orders.length === 0 ? ( // Show skeleton only on initial hard load
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
            <ScrollArea className="h-[calc(100vh_-_280px)] rounded-md border">
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
