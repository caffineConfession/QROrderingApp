
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers"; // Corrected import
import { decryptSession } from "@/lib/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, BarChart3, UserPlus, AlertCircle } from "lucide-react";
import type { AdminRole, AdminSessionPayload } from "@/types";
import { ADMIN_ROLES } from "@/types";

export default async function AdminDashboardPage() {
  let session: AdminSessionPayload | null = null;
  let sessionError: string | null = null;

  try {
    const cookieStore = cookies(); 
    const sessionCookie = cookieStore.get("admin_session")?.value;
    if (sessionCookie) {
      session = await decryptSession(sessionCookie);
    }
  } catch (e: any) {
    console.error("[AdminDashboardPage] Error decrypting session:", e.message, e.stack);
    sessionError = e.message;
  }

  const userRole = session?.role as AdminRole | undefined;

  if (sessionError) {
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="text-center">
           <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
          <CardTitle className="text-destructive">Dashboard Error</CardTitle>
          <CardDescription>There was an issue loading your dashboard due to a session problem.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-destructive mb-4">Error details: {sessionError}</p>
          <p className="text-sm text-muted-foreground mb-4">Please try logging out and logging back in. If the problem persists, contact an administrator.</p>
          <Button asChild variant="outline">
            <Link href="/admin/login">Go to Login Page</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!session || !userRole) {
    console.log("[AdminDashboardPage] No session or userRole found. This might be displayed if middleware/layout failed to redirect earlier.");
    return (
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <CardTitle className="flex items-center justify-center"><AlertCircle className="mr-2"/>Access Denied</CardTitle>
          <CardDescription>You need to be logged in with appropriate permissions to view this page.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <Link href="/admin/login">Go to Login Page</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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
