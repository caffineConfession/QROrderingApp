
import UserForm from "../../components/UserForm";
import { getAdminUserByIdAction, updateAdminUserAction, type UpdateAdminUserFormData } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminRole } from "@prisma/client";

interface EditAdminUserPageProps {
  params: { userId: string };
}

export default async function EditAdminUserPage({ params }: EditAdminUserPageProps) {
  const { userId } = params;
  const { success, user, error } = await getAdminUserByIdAction(userId);

  if (!success || !user) {
    return (
      <Card className="max-w-xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2"/>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Admin user not found."}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4"/>Back to User List</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Type assertion needed because UserForm expects UserFormData which is a union
  const handleSubmit = async (data: UpdateAdminUserFormData) => {
    "use server";
    return updateAdminUserAction(userId, data);
  };
  
  const initialData = {
    id: user.id,
    email: user.email,
    role: user.role as AdminRole, // Ensure the role from DB is cast to the enum type used in form
    // Password is not part of initialData for edit form for security/simplicity
  };

  return (
    <UserForm
      initialData={initialData}
      onSubmitAction={handleSubmit as any} // Use 'as any' or ensure UserForm can handle specific action types
      isEditMode={true}
    />
  );
}
