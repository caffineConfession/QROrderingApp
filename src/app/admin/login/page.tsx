
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound, Mail, ShieldAlert, LockKeyhole, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { loginAction, resetPasswordAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormSchema = z.infer<typeof loginSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  confirmationString: z.string().min(1, { message: "Confirmation string is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
});
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter(); // Keep router for other potential uses like router.replace
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      toast({
        title: "Login Required",
        description: decodeURIComponent(errorParam),
        variant: "destructive",
      });
      // Clear the error from URL to prevent re-toasting on refresh
      router.replace('/admin/login', { scroll: false }); 
    }
  }, [searchParams, toast, router]);

  const loginForm = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: "",
      confirmationString: "",
      newPassword: "",
    },
  });

  const onLoginSubmit: SubmitHandler<LoginFormSchema> = async (data) => {
    setIsLoading(true);
    try {
      console.log("[Client Login] Submitting login data for:", data.email);
      // The loginAction will either redirect or return an error object.
      // It no longer returns { success: true } if redirecting.
      const result = await loginAction(data); 

      // If 'result' is defined, it means loginAction returned an error object.
      if (result && result.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
      } else if (result && !result.success) {
        // Fallback for other non-success scenarios without specific error
         toast({
          title: "Login Failed",
          description: "An unknown issue occurred during login.",
          variant: "destructive",
        });
      }
      // If loginAction successfully redirects, this part of the code (after await) 
      // might not be reached, or the component might unmount.
      // No explicit client-side redirect (router.push or window.location.href) is needed here
      // as the server action handles it.

    } catch (error: any) {
      // This catch block is primarily for network errors or if loginAction throws
      // an error that is *not* NEXT_REDIRECT.
      // NEXT_REDIRECT errors are typically handled internally by Next.js and result in navigation.
      console.error("[Client Login] Error during login submission process:", error);
      if (error.digest?.includes('NEXT_REDIRECT')) {
        // This is an expected internal error when redirect() is called from a server action.
        // Next.js should handle this by performing the redirect. No user-facing toast is needed.
        console.log("[Client Login] NEXT_REDIRECT caught. Server should handle redirection.");
      } else {
        toast({
          title: "Login System Error",
          description: `An unexpected error occurred: ${error.message || "Please try again."}`,
          variant: "destructive",
        });
      }
    } finally {
      // Only set isLoading to false if we're still on the page (i.e., redirect didn't happen or failed)
      // It's generally safe to call it, but helps manage button state if error occurs before redirect.
      setIsLoading(false);
    }
  };

  const onResetPasswordSubmit: SubmitHandler<ResetPasswordFormData> = async (data) => {
    setIsLoading(true);
    try {
      const result = await resetPasswordAction(data);
      if (result.success) {
        toast({
          title: "Password Reset Successful",
          description: result.message || "You can now login with your new password.",
          variant: "default",
        });
        resetPasswordForm.reset();
        setShowResetForm(false);
      } else {
        toast({
          title: "Password Reset Failed",
          description: result.error || "Could not reset password. Please check your input.",
          variant: "destructive",
        });
      }
    } catch (error: any) { 
      console.error("[Client ResetPassword] Error during password reset submission:", error);
      toast({
        title: "Password Reset System Error",
        description: error.message || "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-grow items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        {!showResetForm ? (
          <Form {...loginForm} key="login-form-provider">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-primary">Admin Login</CardTitle>
                <CardDescription>Access the Caffico Express admin panel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" /> Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><KeyRound className="mr-2 h-4 w-4 text-primary" /> Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => setShowResetForm(true)} disabled={isLoading}>
                  Forgot Password?
                </Button>
              </CardFooter>
            </form>
          </Form>
        ) : (
          <Form {...resetPasswordForm} key="reset-form-provider">
            <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-primary">Reset Admin Password</CardTitle>
                <CardDescription>Enter your email, the confirmation phrase, and your new password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={resetPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-primary" /> Your Admin Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetPasswordForm.control}
                  name="confirmationString"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-primary" /> Confirmation Phrase</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter the magic words" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><LockKeyhole className="mr-2 h-4 w-4 text-primary" /> New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 8 characters" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => setShowResetForm(false)} disabled={isLoading}>
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          </Form>
        )}
         {showResetForm && (
            <p className="text-xs text-muted-foreground p-4 text-center">
                Note: The confirmation phrase is "Dhruv the great". This method is for emergency use.
            </p>
        )}
      </Card>
    </div>
  );
}
