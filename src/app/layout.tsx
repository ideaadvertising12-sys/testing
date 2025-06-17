
"use client";

// import type { Metadata } from 'next'; // Metadata export is not allowed in client components.
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FullscreenProvider } from '@/contexts/FullscreenContext';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// export const metadata: Metadata = {
//   title: 'NGroup Products',
//   description: 'Point of Sale system for milk products.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showFooter, setShowFooter] = useState(false);
  const mainElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainElement = mainElementRef.current;

    const handleScrollInteraction = () => {
      if (mainElement) {
        const { scrollTop, scrollHeight, clientHeight } = mainElement;
        // Show footer if scrolled to near bottom (50px threshold) OR if content is not scrollable
        if (scrollHeight - scrollTop - clientHeight < 50 || scrollHeight <= clientHeight) {
          setShowFooter(true);
        } else {
          setShowFooter(false);
        }
      }
    };

    if (mainElement) {
      mainElement.addEventListener('scroll', handleScrollInteraction);
      handleScrollInteraction(); // Initial check
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScrollInteraction);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    <html lang="en" className="h-full" suppressHydrationWarning={true}>
      <head>
        {/* Metadata can be set here directly or via a Head component from next/head if needed for client component */}
        <title>NGroup Products</title>
        <meta name="description" content="Point of Sale system for milk products." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full" suppressHydrationWarning={true}>
        <AppThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <FullscreenProvider>
              <div className="flex flex-col h-full"> {/* Main page wrapper */}
                <main ref={mainElementRef} className="flex-grow overflow-y-auto">
                  {children}
                </main>
                <footer 
                  className={cn(
                    "text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0",
                    "transition-all duration-300 ease-in-out", // Animate opacity and transform
                    showFooter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
                  )}
                >
                  Design, Development, and Hosting by Limidora
                </footer>
              </div>
              <Toaster />
            </FullscreenProvider>
          </AuthProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
