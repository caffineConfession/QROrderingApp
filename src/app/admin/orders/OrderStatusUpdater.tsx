
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatus } from "@/types";
import { updateOrderStatusAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, RefreshCw } from "lucide-react";

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  switch (currentStatus) {
    case OrderStatus.PENDING_PREPARATION:
      return [OrderStatus.PREPARING, OrderStatus.CANCELLED];
    case OrderStatus.PREPARING:
      return [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED];
    case OrderStatus.READY_FOR_PICKUP:
      return [OrderStatus.COMPLETED];
    default:
      return []; // No actions if completed or cancelled
  }
};

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const availableNextStatuses = getNextStatuses(currentStatus);

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (isLoading || isPending) return;
    setIsLoading(true);
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, newStatus);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Order ${orderId.substring(0,8)} status changed to ${newStatus.replace(/_/g, ' ')}.`,
        });
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Could not update order status.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    });
  };

  if (currentStatus === OrderStatus.COMPLETED || currentStatus === OrderStatus.CANCELLED) {
    return <span className="text-xs text-muted-foreground italic">{currentStatus.replace(/_/g, ' ')}</span>;
  }

  if (availableNextStatuses.length === 0) {
     return <span className="text-xs text-muted-foreground italic">No actions</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading || isPending}>
          {isLoading || isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Update Status"}
          {!isLoading && !isPending && <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change Status To:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableNextStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleUpdateStatus(status)}
            disabled={isLoading || isPending}
            className="cursor-pointer"
          >
            {status.replace(/_/g, ' ')}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
