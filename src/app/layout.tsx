
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
      if (!mainElementRef.current || mainElementRef.current.clientHeight === 0) {
        setShowFooter(false);
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 5);
      const isContentTooShortToScroll = scrollHeight <= clientHeight;

      setShowFooter(isScrolledToBottom || isContentTooShortToScroll);
    };
    
    requestAnimationFrame(handleScrollInteraction); 

    mainElement.addEventListener('scroll', handleScrollInteraction);
    const resizeObserver = new ResizeObserver(handleScrollInteraction);
    resizeObserver.observe(mainElement);

    return () => {
      mainElement.removeEventListener('scroll', handleScrollInteraction);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      {/* head section removed as requested */}
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <FullscreenProvider>
              <div className="flex flex-col h-full">
                <main
                  ref={mainElementRef}
                  className="flex-grow overflow-y-auto"
                >
                  {children}
                </main>
                <footer
                  className={cn(
                    "text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0",
                    "transition-all duration-300 ease-in-out",
                    (!mounted || !showFooter) ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                  style={{
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
