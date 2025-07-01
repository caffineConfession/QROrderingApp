"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logoutAction } from "./login/actions";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LogoutButton() {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logoutAction();
    } catch (error: any) {
      if (error.constructor.name !== 'RedirectError') {
         toast({
            title: "Logout Failed",
            description: "Could not log out. Please try again.",
            variant: "destructive",
          });
      }
    }
  };

  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </DropdownMenuItem>
  );
}
