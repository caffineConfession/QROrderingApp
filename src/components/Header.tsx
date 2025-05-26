import Link from 'next/link';
import { Coffee } from 'lucide-react';

export default function Header() {
  return (
    <header className="py-6 px-4 md:px-8 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Coffee className="h-8 w-8" />
          <h1 className="text-2xl md:text-3xl font-bold">
            Caffico <span className="font-light">- caffeine confession</span>
          </h1>
        </Link>
        {/* Future: Theme toggle or other actions */}
      </div>
    </header>
  );
}
