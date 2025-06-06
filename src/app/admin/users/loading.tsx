
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center"><Users className="mr-3 h-6 w-6 text-primary" /> Admin User Management</CardTitle>
            <Skeleton className="h-4 w-[300px] mt-1" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-8 w-[150px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
