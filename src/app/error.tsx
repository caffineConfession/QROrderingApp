
"use client"; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
// Navbar and Footer are now in RootLayout

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Root Error Boundary Caught:", error);
  }, [error]);

  return (
    // The Navbar and Footer will be rendered by the RootLayout
    <div className="flex-grow flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-destructive/20 p-3 rounded-full w-fit">
              <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">Oops! Something went wrong.</CardTitle>
          <CardDescription>
            We encountered an unexpected issue. Please try again, or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm text-left my-4">
              <p className="font-semibold">Error details (Development Mode):</p>
              <pre className="whitespace-pre-wrap break-all">{error.message}</pre>
              {error.stack && <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{error.stack}</pre>}
            </div>
          )}
           <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            size="lg"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
