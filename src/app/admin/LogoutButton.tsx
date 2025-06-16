
"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logoutAction } from "./login/actions"; // Ensure path is correct
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // For potential error messages

export default function LogoutButton() {
  const { toast } = useToast();

  const handleLogout = async () => {
    const result = await logoutAction();
    if (result.success) {
      // Use window.location.href for a full page reload to clear session state reliably
      window.location.href = "/admin/login";
    } else {
      toast({
        title: "Logout Failed",
        description: result.error || "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </DropdownMenuItem>
  );
}
