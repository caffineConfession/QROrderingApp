
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manage Orders</CardTitle>
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardDescription>View, process, and track customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Order management functionality (real-time updates, status changes from "received" to "delivered") will be implemented here.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is accessible to Order Processors and Business Managers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
