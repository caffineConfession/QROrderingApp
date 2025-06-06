
import type { Metadata } from "next";
import Link from "next/link";
import { Home, ShoppingBag, BarChart3, Users, Coffee, ListPlus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cookies, headers } from "next/headers"; // Imported headers
import { redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";
import type { AdminRole } from "@/types";
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
import { cn } from "@/lib/utils";


export const metadata: Metadata = {
  title: "Caffico Admin",
  description: "Admin panel for Caffico Express",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NavLink: React.FC<{ href: string; icon: React.ElementType; label: string; currentPath: string | null; roles?: AdminRole[] , sessionRole?: AdminRole | null}> = ({ href, icon: Icon, label, currentPath, roles, sessionRole }) => {
  if (roles && sessionRole && !roles.includes(sessionRole)) {
    return null;
  }

  // Refined isActive logic:
  // Exact match OR starts with for non-dashboard routes.
  // Dashboard should only be an exact match to avoid highlighting it for all /admin/* routes.
  const isActive = currentPath === href || (href !== "/admin/dashboard" && currentPath?.startsWith(href) === true);


  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};


export default async function AdminLayout({ children }: AdminLayoutProps) {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  if (!session?.role) {
    // If the user is not authenticated and not on the login page,
    // they might be trying to access a protected admin page directly.
    // The middleware should handle redirection to login for protected routes.
    // This layout will wrap the login page as well if no session.
    // For pages like login, we don't want to render the full admin sidebar.
    // The middleware handles redirecting to login if not authenticated and trying to access protected page.
    // So, if session is null here, it means we are either on the login page,
    // or middleware failed (unlikely if configured correctly).
    // Thus, we render children directly (which would be the login page).
    return <>{children}</>;
  }
  
  const headersList = headers();
  const pathname = headersList.get('x-next-pathname') || headersList.get('next-url'); // next-url is another common header for path

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
              <NavLink href="/admin/dashboard" icon={Home} label="Dashboard" currentPath={pathname} sessionRole={session.role}/>
              { (session.role === ADMIN_ROLES.ORDER_PROCESSOR || session.role === ADMIN_ROLES.BUSINESS_MANAGER) &&
                <NavLink href="/admin/orders" icon={ShoppingBag} label="Orders" currentPath={pathname} roles={[ADMIN_ROLES.ORDER_PROCESSOR, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
               { (session.role === ADMIN_ROLES.MANUAL_ORDER_TAKER || session.role === ADMIN_ROLES.BUSINESS_MANAGER) &&
                <NavLink href="/admin/manual-order" icon={Users} label="Manual Order" currentPath={pathname} roles={[ADMIN_ROLES.MANUAL_ORDER_TAKER, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
              { session.role === ADMIN_ROLES.BUSINESS_MANAGER &&
                <NavLink href="/admin/products" icon={Package} label="Menu Management" currentPath={pathname} roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
              { session.role === ADMIN_ROLES.BUSINESS_MANAGER &&
                <NavLink href="/admin/analytics" icon={BarChart3} label="Analytics" currentPath={pathname} roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
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
           {/* Mobile Nav Trigger - Consider if needed, or rely on default browser back/forward */}
          {/* <Button variant="outline" size="icon" className="shrink-0 md:hidden">
             <Menu className="h-5 w-5" />
             <span className="sr-only">Toggle navigation menu</span>
          </Button> */}
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
              {session.email && <DropdownMenuLabel className="font-normal text-xs text-muted-foreground -mt-2">{session.email}</DropdownMenuLabel> }
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
