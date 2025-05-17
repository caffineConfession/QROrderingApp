
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function AdminManualOrderPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manual Order Entry</CardTitle>
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardDescription>Create new orders for walk-in customers or phone orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The interface for manual order creation (selecting items, customer details, cash payment) will be implemented here.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is accessible to Manual Order Takers and Business Managers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
