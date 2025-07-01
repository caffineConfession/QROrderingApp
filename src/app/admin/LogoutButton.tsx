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
      // logoutAction will trigger a redirect, which throws an error.
      // We expect this, and the browser will handle the navigation.
      await logoutAction();
    } catch (error: any) {
      // If the error is the expected redirect, do nothing.
      if (error.digest === 'NEXT_REDIRECT') {
        return;
      }
      // If it's any other error, show a toast.
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
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
