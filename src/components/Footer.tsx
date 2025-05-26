
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="py-8 mt-16 px-4 text-center border-t bg-muted/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-left md:text-center">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Caffico Express</h3>
            <p className="text-sm text-muted-foreground">Your daily caffeine confession, delivered fresh and fast.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Connect With Us</h3>
            <a
              href="https://www.instagram.com/reel/DI9Ez9Qhqh2/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="mr-2 h-5 w-5" />
              @caffico
            </a>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Caffico Express. All rights reserved.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Enjoy your caffeine confession!
        </p>
      </div>
    </footer>
  );
}
