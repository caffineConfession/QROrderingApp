
import type { Metadata } from "next";
import Link from "next/link";
import { Home, ShoppingBag, BarChart3, Users, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
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


export const metadata: Metadata = {
  title: "Caffico Admin",
  description: "Admin panel for Caffico Express",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NavLink: React.FC<{ href: string; icon: React.ElementType; label: string; currentPath: string; roles?: AdminRole[] , sessionRole?: AdminRole | null}> = ({ href, icon: Icon, label, currentPath, roles, sessionRole }) => {
  if (roles && sessionRole && !roles.includes(sessionRole)) {
    return null;
  }
  // Note: currentPath logic might need improvement for dynamic active states across all admin pages.
  // For now, it's a simplified check. A more robust solution might involve using `next/headers`
  // or passing the pathname explicitly if possible in server components.
  const isActive = currentPath === href || (currentPath.startsWith(href) && href !== "/admin/dashboard");

  return (
    <Link href={href} legacyBehavior>
      <a
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
          isActive ? "bg-muted text-primary" : ""
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </Link>
  );
};


export default async function AdminLayout({ children }: AdminLayoutProps) {
  const sessionCookie = cookies().get("admin_session")?.value;
  const session = await decryptSession(sessionCookie);

  // If there's no session role, it implies the middleware allowed access to a public admin page (i.e., /admin/login).
  // In this case, just render the children (the login page itself) without the admin shell.
  // The login page is designed to be standalone.
  // The middleware protects other admin pages.
  if (!session?.role) {
    return <>{children}</>;
  }
  
  // If a session and role exist, proceed to render the full admin layout.
  // The `pathname` from `next/headers` could be used here for more accurate active link styling.
  // For now, we'll use a simplified currentPath for NavLink.
  // Example: const pathname = headers().get('x-next-pathname') || "/admin/dashboard";
  const currentPath = "/admin/dashboard"; // Placeholder, ideally get current path dynamically

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
              <NavLink href="/admin/dashboard" icon={Home} label="Dashboard" currentPath={currentPath} sessionRole={session.role}/>
              { (session.role === ADMIN_ROLES.ORDER_PROCESSOR || session.role === ADMIN_ROLES.BUSINESS_MANAGER) &&
                <NavLink href="/admin/orders" icon={ShoppingBag} label="Orders" currentPath={currentPath} roles={[ADMIN_ROLES.ORDER_PROCESSOR, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
               { (session.role === ADMIN_ROLES.MANUAL_ORDER_TAKER || session.role === ADMIN_ROLES.BUSINESS_MANAGER) &&
                <NavLink href="/admin/manual-order" icon={Users} label="Manual Order" currentPath={currentPath} roles={[ADMIN_ROLES.MANUAL_ORDER_TAKER, ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
              }
              { session.role === ADMIN_ROLES.BUSINESS_MANAGER &&
                <NavLink href="/admin/analytics" icon={BarChart3} label="Analytics" currentPath={currentPath} roles={[ADMIN_ROLES.BUSINESS_MANAGER]} sessionRole={session.role}/>
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
          {/* Mobile Nav Trigger (optional, if you want a hamburger menu for mobile) */}
          {/* <Button variant="outline" size="icon" className="shrink-0 md:hidden"> <Menu className="h-5 w-5" /> <span className="sr-only">Toggle navigation menu</span> </Button> */}
          <div className="w-full flex-1">
            {/* Optional: Search bar or other header elements */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="https://placehold.co/40x40.png" alt="@admin" data-ai-hint="user avatar" />
                  <AvatarFallback>{session.role ? session.role.substring(0,1).toUpperCase() : 'A'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account ({session.role.replace(/_/g, ' ')})</DropdownMenuLabel>
              {session.email && <DropdownMenuLabel className="font-normal text-xs text-muted-foreground -mt-2">{session.email}</DropdownMenuLabel> }
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
              {/* <DropdownMenuItem>Support</DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}
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
