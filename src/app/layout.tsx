"use client";

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
    setMounted(true);

    const mainElement = mainElementRef.current;
    if (!mainElement) return;

    const handleScrollInteraction = () => {
      // Ensure the element is actually rendered and has dimensions
      if (!mainElementRef.current || mainElementRef.current.clientHeight === 0) {
        setShowFooter(false);
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      
      const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 5); // 5px threshold
      const isContentTooShortToScroll = scrollHeight <= clientHeight;

      setShowFooter(isScrolledToBottom || isContentTooShortToScroll);
    };

    // Initial check after mount and layout calculation
    // Using requestAnimationFrame to ensure layout has been computed
    const animationFrameId = requestAnimationFrame(handleScrollInteraction);
    
    mainElement.addEventListener('scroll', handleScrollInteraction);
    const resizeObserver = new ResizeObserver(handleScrollInteraction);
    resizeObserver.observe(mainElement);

    return () => {
      cancelAnimationFrame(animationFrameId);
      mainElement.removeEventListener('scroll', handleScrollInteraction);
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <title>NGroup Products</title>
        <meta name="description" content="Point of Sale system for milk products." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full " suppressHydrationWarning>
        <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <FullscreenProvider>
              <div className="flex flex-col h-full">
                <main
                  ref={mainElementRef}
                  className="flex-grow overflow-y-auto pb-16" // Added padding-bottom
                >
                  {children}
                </main>
                <footer
                  className={cn(
                    "fixed bottom-0 left-0 right-0 text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground z-40", // Added z-40
                    "transition-all duration-300 ease-in-out",
                    (!mounted || !showFooter) ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                  style={{
                    transform: (mounted && showFooter) ? 'translateY(0)' : 'translateY(100%)', // Slides up from bottom
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
