
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound, Mail, ShieldAlert, LockKeyhole } from "lucide-react";
import { useState } from "react";
// useRouter is removed as we'll use window.location
import { loginAction, resetPasswordAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormSchema = z.infer<typeof loginSchema>;

// Define ResetPasswordSchema and ResetPasswordFormData here as they are used by this client component
export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  confirmationString: z.string().min(1, { message: "Confirmation string is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
});
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;


export default function AdminLoginPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

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
      const result = await loginAction(data);
      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome! Redirecting to dashboard...`,
          variant: "default",
        });
        // Add a small delay before redirecting
        setTimeout(() => {
          window.location.assign("/admin/dashboard");
        }, 100); // 100ms delay
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false); 
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      console.error("Login error:", error);
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
    } catch (error) {
      toast({
        title: "Password Reset Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      console.error("Password reset error:", error);
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
