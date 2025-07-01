"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { logoutAction } from "./login/actions";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

export default function LogoutButton() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      try {
        // The logoutAction now triggers a redirect, which throws a catchable error.
        await logoutAction();
        // The browser will handle the redirect, so this part of the code might not be reached.
      } catch (error: any) {
        // The `redirect()` from a server action throws an error with a specific digest.
        // We can check for it to confirm the redirect was initiated.
        if (error.digest === 'NEXT_REDIRECT') {
            console.log("Server initiated logout redirect.");
            // Don't show a toast here, just let the browser navigate.
            return;
        }
        // If it's any other error, show a toast.
        toast({
          title: "Logout Failed",
          description: "Could not log out. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" disabled={isPending}>
      <LogOut className="mr-2 h-4 w-4" />
      {isPending ? "Logging out..." : "Logout"}
    </DropdownMenuItem>
  );
}
