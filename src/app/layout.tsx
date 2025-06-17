"use client";

// import type { Metadata } from 'next'; // Metadata export is not allowed in client components.
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FullscreenProvider } from '@/contexts/FullscreenContext';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showFooter, setShowFooter] = useState(false); // Start with footer hidden
  const mainElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainElement = mainElementRef.current;

    const handleScrollInteraction = () => {
      if (mainElement && mainElement.clientHeight > 0) { // Ensure element is rendered with height
        const { scrollTop, scrollHeight, clientHeight } = mainElement;
        
        // Condition to show footer:
        // 1. If the content is scrollable AND the user has scrolled to near the bottom.
        // OR
        // 2. If the content is not scrollable (i.e., it's short), then the footer should be shown.
        const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 50);
        const isContentShort = scrollHeight <= clientHeight;

        if (isScrolledToBottom || isContentShort) {
          setShowFooter(true);
        } else {
          setShowFooter(false);
        }
      } else {
         // If element isn't ready (e.g. clientHeight is 0), keep footer hidden.
        setShowFooter(false);
      }
    };

    if (mainElement) {
      mainElement.addEventListener('scroll', handleScrollInteraction);
      const resizeObserver = new ResizeObserver(handleScrollInteraction);
      resizeObserver.observe(mainElement);

      // Perform initial check after layout is stable using requestAnimationFrame
      requestAnimationFrame(() => {
        handleScrollInteraction();
      });

      return () => {
        mainElement.removeEventListener('scroll', handleScrollInteraction);
        resizeObserver.unobserve(mainElement);
      };
    }
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

  return (
    <html lang="en" className="h-full" suppressHydrationWarning={true}>
      <head>
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
