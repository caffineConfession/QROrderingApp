
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
            <CardHeader>
                 <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="mt-4 text-xl">Admin Panel Error</CardTitle>
                <CardDescription>
                An error occurred in the admin section. You can try to refresh or go back.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {process.env.NODE_ENV === 'development' && error?.message && (
                <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm text-left my-2">
                    <p className="font-semibold">Error details (Dev Mode):</p>
                    <pre className="whitespace-pre-wrap break-all">{error.message}</pre>
                </div>
                )}
                <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="w-full"
                >
                Try again
                </Button>
                 <Button
                    variant="outline"
                    onClick={() => window.history.back()} // Simple way to go back
                    className="w-full"
                >
                    Go Back
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
