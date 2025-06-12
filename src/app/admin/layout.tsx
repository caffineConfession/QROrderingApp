
import type { Metadata } from "next";
import Link from "next/link";
// Icons used directly in this layout, not passed as props to NavLink
import { Coffee, AlertCircle } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cookies } from "next/headers"; 
import { decryptSession } from "@/lib/session";
import type { AdminSessionPayload } from "@/types"; 
import { ADMIN_ROLES } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogoutButton from "./LogoutButton";
import NavLink from "./NavLink"; // NavLink is now a client component handling its own path, IconName type also imported

export const metadata: Metadata = {
  title: "Caffico Admin",
  description: "Admin panel for Caffico Express",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  let session: AdminSessionPayload | null = null;
  let sessionError: string | null = null;
  const cookieStore = cookies(); 
  const currentPath = cookieStore.get('next-url')?.value || "";
  const isLoginPage = currentPath.endsWith("/admin/login");

  console.log(`[AdminLayout] Request for path: ${currentPath}`);

  try {
    const sessionCookie = cookieStore.get("admin_session")?.value;
    console.log(`[AdminLayout] Admin session cookie value: ${sessionCookie ? '****** (present)' : 'not found'}`);

    if (sessionCookie) {
      session = await decryptSession(sessionCookie);
    }
    console.log(`[AdminLayout] Decrypted session object:`, session);
  } catch (e: any) {
    console.error("[AdminLayout] CRITICAL ERROR during session processing in AdminLayout:", e.message, e.stack);
    sessionError = e.message;
  }


  if (sessionError) {
    console.error(`[AdminLayout] Rendering error state due to session processing error: ${sessionError}`);
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                     <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <CardTitle>Admin Panel Error</CardTitle>
                    <CardDescription>A critical error occurred while trying to load the admin interface.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-destructive mb-2">Details: {sessionError}</p>
                    <p className="text-sm text-muted-foreground mb-4">This might be due to a session problem or a server misconfiguration. Please try logging out and in again, or contact support if the issue persists.</p>
                    <Button asChild className="w-full">
                        <Link href="/admin/login">Go to Login Page</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (!session?.userId || !session?.role) {
    if (!isLoginPage) {
        console.log('[AdminLayout] No session or role found for a protected admin page. Middleware should have redirected. Rendering children (page should handle this).');
    } else {
        console.log('[AdminLayout] On login page and no session/role found (expected). Rendering minimal layout.');
    }
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }
  
  console.log(`[AdminLayout] Session role "${session.role}" found. Rendering full admin layout for path: ${currentPath}`);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
              <Coffee className="h-6 w-6 text-primary" />
              <span className="">Caffico Admin</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink href="/admin/dashboard" iconName="Home" label="Dashboard" sessionRole={session.role}/>
              <NavLink href="/admin/orders" iconName="ShoppingBag" label="Orders" roles={[ADMIN_ROLES.ORDER_PROCESSOR, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              <NavLink href="/admin/manual-order" iconName="Users" label="Manual Order" roles={[ADMIN_ROLES.MANUAL_ORDER_TAKER, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              <NavLink href="/admin/products" iconName="Package" label="Menu Management" roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              <NavLink href="/admin/analytics" iconName="BarChart3" label="Analytics" roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              <NavLink href="/admin/users" iconName="Settings" label="User Management" roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
            </nav>
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground">
                Logged in as: <span className="font-semibold">{session.role.replace(/_/g, ' ')}</span>
                {session.email && <p>({session.email})</p>}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="md:hidden">
             {/* Mobile nav trigger can be added here if needed */}
          </div>
          <div className="w-full flex-1">
            {/* Optional: Search bar or other header elements */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/40x40.png" alt="@admin" data-ai-hint="user avatar"/>
                  <AvatarFallback>{session.role ? session.role.substring(0,1).toUpperCase() : 'A'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account ({session.role.replace(/_/g, ' ')})</DropdownMenuLabel>
              {session.email && <DropdownMenuLabel className="font-normal text-xs text-muted-foreground -mt-2">{session.email}</DropdownMenuLabel>}
              <DropdownMenuSeparator />
              <LogoutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

