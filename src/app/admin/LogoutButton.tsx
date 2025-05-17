
"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logoutAction } from "./login/actions";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/admin/login");
    router.refresh(); // Ensure session state is cleared client-side
  };

  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </DropdownMenuItem>
  );
}
