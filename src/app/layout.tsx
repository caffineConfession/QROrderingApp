
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from '@/components/Navbar'; // Import the new Navbar
import { CartProvider } from '@/contexts/CartContext'; // Import CartProvider
import Footer from '@/components/Footer'; // Import Footer

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Caffico Express',
  description: 'Order your favorite coffee and shakes from Caffico!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider> {/* Wrap with CartProvider */}
            <Navbar /> {/* Add the Navbar here */}
            <main className="flex-grow"> {/* Add flex-grow to main content area */}
              {children}
            </main>
            <Footer /> {/* Add Footer here */}
            <Toaster />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
