
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types"; // Ensure this path is correct

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: AdminRole[];
  sessionRole?: AdminRole | null; // sessionRole comes from AdminLayout (server component)
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, label, roles, sessionRole }) => {
  const currentPath = usePathname(); // Client-side hook to get current path

  // Role-based visibility check (can remain, as sessionRole is passed down)
  if (roles && sessionRole && !roles.includes(sessionRole)) {
    return null;
  }

  const isActive = currentPath
    ? currentPath === href || (href !== "/admin/dashboard" && currentPath.startsWith(href))
    : false;

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

export default NavLink;
