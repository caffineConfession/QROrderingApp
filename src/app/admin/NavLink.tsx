
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types";
import { Home, ShoppingBag, Users, Package, Settings, BarChart3 } from 'lucide-react'; // Ensure Users is imported
import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

// Define the map for icon strings to components
const iconMap: Record<string, ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>> = {
  Home,
  ShoppingBag,
  Users, // For Manual Order and User Management (if icon is Settings, ensure Users is distinct or choose another)
  Package,
  BarChart3,
  Settings, // For User Management if different from Users icon
};

export type IconName = keyof typeof iconMap;

interface NavLinkProps {
  href: string;
  iconName: IconName; // Changed from icon: React.ElementType to iconName: string
  label: string;
  roles?: AdminRole[];
  sessionRole?: AdminRole | null;
}

const NavLink: React.FC<NavLinkProps> = ({ href, iconName, label, roles, sessionRole }) => {
  const currentPath = usePathname(); 
  const IconComponent = iconMap[iconName];

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
      {IconComponent && <IconComponent className="h-4 w-4" />}
      {label}
    </Link>
  );
};

export default NavLink;
