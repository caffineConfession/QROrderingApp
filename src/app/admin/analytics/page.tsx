
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Business Analytics</CardTitle>
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardDescription>Track sales, popular items, and gain insights into your cafe's performance.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dashboards and reports for sales (daily, weekly, monthly, yearly), average order value, most ordered drinks, etc., will be implemented here.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This section is accessible to Business Managers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
