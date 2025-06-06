
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { CreateAdminUserSchema, UpdateAdminUserSchema, type CreateAdminUserFormData, type UpdateAdminUserFormData } from "../actions";
import { AdminRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save, UserPlus, Edit } from "lucide-react";

type UserFormData = CreateAdminUserFormData | UpdateAdminUserFormData;

interface UserFormProps {
  initialData?: Partial<CreateAdminUserFormData> & { id?: string }; // id is optional for create
  onSubmitAction: (data: UserFormData) => Promise<{ success: boolean; error?: string; user?: any; issues?: any[] }>;
  isEditMode: boolean;
}

export default function UserForm({ initialData, onSubmitAction, isEditMode }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const formSchema = isEditMode ? UpdateAdminUserSchema : CreateAdminUserSchema;

  const form = useForm<UserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      email: "",
      password: "", // Only for create mode, will be ignored by UpdateAdminUserSchema
      role: AdminRole.MANUAL_ORDER_TAKER,
    },
  });

  const { formState: { isSubmitting } } = form;

  const handleFormSubmit: SubmitHandler<UserFormData> = async (data) => {
    const result = await onSubmitAction(data);
    if (result.success) {
      toast({
        title: isEditMode ? "User Updated" : "User Created",
        description: `Admin user ${data.email} has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.push("/admin/users");
      router.refresh(); 
    } else {
      let description = result.error || "An unexpected error occurred.";
      if (result.issues) {
        description = result.issues.map(issue => issue.message).join(" ");
      }
      toast({
        title: "Error",
        description: description,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-xl mx-auto shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
            {isEditMode ? <Edit className="mr-2 h-5 w-5 text-primary"/> : <UserPlus className="mr-2 h-5 w-5 text-primary"/>}
            {isEditMode ? "Edit Admin User" : "Add New Admin User"}
        </CardTitle>
        <CardDescription>
          {isEditMode ? "Update the details for this admin user." : "Fill in the details to create a new admin account."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditMode && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min. 8 characters" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AdminRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditMode && (
                <FormDescription className="text-xs text-muted-foreground pt-2">
                    To change a user's password, please advise them to use a "Forgot Password" feature (if implemented) or contact a super-administrator for a manual reset process.
                </FormDescription>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4"/>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              {isEditMode ? "Save Changes" : "Create User"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
