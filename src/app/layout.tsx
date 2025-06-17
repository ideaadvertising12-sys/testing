
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
  const [showFooter, setShowFooter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mainElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true); // Indicate that the component has mounted

    const mainElement = mainElementRef.current;

    const handleScrollInteraction = () => {
      if (mainElement && mainElement.clientHeight > 0) { 
        const { scrollTop, scrollHeight, clientHeight } = mainElement;
        
        const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 50);
        const isContentTooShortToScroll = scrollHeight <= clientHeight;

        if (isScrolledToBottom || isContentTooShortToScroll) {
          setShowFooter(true);
        } else {
          setShowFooter(false);
        }
      } else {
        setShowFooter(false); // Default to hidden if element dimensions aren't reliable yet
      }
    };

    if (mainElement) {
      // Initial check after first paint cycle, now that mounted is true
      const rafId = requestAnimationFrame(() => {
        handleScrollInteraction();
      });

      mainElement.addEventListener('scroll', handleScrollInteraction);
      const resizeObserver = new ResizeObserver(handleScrollInteraction);
      resizeObserver.observe(mainElement);

      return () => {
        cancelAnimationFrame(rafId);
        mainElement.removeEventListener('scroll', handleScrollInteraction);
        resizeObserver.unobserve(mainElement);
      };
    }
  }, []); // Empty dependency array ensures this effect runs once on mount

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
                    "transition-all duration-300 ease-in-out",
                    // Apply hidden styles if not mounted OR if mounted but showFooter is false
                    (!mounted || !showFooter) ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                  style={{
                    // Initial position is translated down by 90%
                    // It moves to translateY(0) only if mounted AND showFooter is true
                    transform: (mounted && showFooter) ? 'translateY(0)' : 'translateY(90%)',
                  }}
                >
                  Design, Development & Hosting by Limidora
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
