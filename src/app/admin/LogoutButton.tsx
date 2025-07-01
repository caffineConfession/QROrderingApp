
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
        await logoutAction();
      } catch (error: any) {
        if (error.digest?.includes('NEXT_REDIRECT')) {
            console.log("Server initiated logout redirect.");
            // This is the expected path, let the browser handle the redirect.
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
