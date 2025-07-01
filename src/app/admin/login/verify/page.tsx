import { RefreshCw } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-4 text-foreground">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Verifying session...</h1>
        <p className="text-muted-foreground">Please wait while we securely log you in.</p>
      </div>
    </div>
  );
}
