
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, PlusCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { getAdminUsersAction, deleteAdminUserAction } from "./actions";
import { AdminRole } from "@prisma/client"; // Prisma enum
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";
import { redirect } from "next/navigation";


export const dynamic = 'force-dynamic'; 

export default async function AdminUsersPage() {
  const sessionCookie = cookies().get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);

  if (!session || session.role !== AdminRole.BUSINESS_MANAGER) {
    // This should ideally be caught by middleware, but an extra check here is good.
    // Redirect to dashboard or login if not a business manager.
    redirect('/admin/dashboard'); 
  }
  
  const { success, users, error } = await getAdminUsersAction();

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6 text-primary" /> Admin User Management</CardTitle>
            <CardDescription>Manage admin accounts, roles, and access for Caffico Express.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/users/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching Users</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!error && !users?.length && (
             <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No Admin Users Found</AlertTitle>
                <AlertDescription>Click "Add New User" to create the first admin account (besides your own).</AlertDescription>
            </Alert>
          )}
          {!error && users && users.length > 0 && (
            <ScrollArea className="h-[450px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === AdminRole.BUSINESS_MANAGER ? "default" : "secondary"}>
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Edit className="mr-1 h-3 w-3" /> Edit
                          </Link>
                        </Button>
                        {/* Prevent deleting own account by hiding button or disabling in action */}
                        {session.email !== user.email && (
                           <form action={async () => {
                                "use server";
                                // Ensure this action checks if the current user is trying to delete themselves.
                                await deleteAdminUserAction(user.id);
                            }} className="inline-block">
                               <Button type="submit" variant="destructive" size="sm">
                                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                               </Button>
                            </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
