
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, BarChart3, UserPlus } from "lucide-react";
import { ADMIN_ROLES, type AdminRole } from "@/types";

export default async function AdminDashboardPage() {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);
  const userRole = session?.role as AdminRole | undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Caffico Admin Dashboard, {userRole?.replace(/_/g, " ") || "Admin"}!</CardTitle>
          <CardDescription>
            Manage orders, customers, and analyze your cafe's performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your role: <span className="font-semibold">{userRole?.replace(/_/g, " ")}</span></p>
          {session?.email && <p className="text-sm text-muted-foreground">Logged in as: {session.email}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        { (userRole === ADMIN_ROLES.ORDER_PROCESSOR || userRole === ADMIN_ROLES.BUSINESS_MANAGER) &&
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Manage Orders
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and process incoming customer orders.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                <Link href="/admin/orders">Go to Orders <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        }

        { (userRole === ADMIN_ROLES.MANUAL_ORDER_TAKER || userRole === ADMIN_ROLES.BUSINESS_MANAGER) &&
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Manual Order Entry
              </CardTitle>
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create new orders for walk-in customers.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                <Link href="/admin/manual-order">Create Order <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        }
        
        { userRole === ADMIN_ROLES.BUSINESS_MANAGER &&
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Business Analytics
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track sales, popular items, and other insights.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                <Link href="/admin/analytics">View Analytics <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        }
      </div>
       {(!userRole || (userRole !== ADMIN_ROLES.ORDER_PROCESSOR && userRole !== ADMIN_ROLES.BUSINESS_MANAGER && userRole !== ADMIN_ROLES.MANUAL_ORDER_TAKER)) && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">You do not have access to specific modules. Please contact an administrator if you believe this is an error.</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
