"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FullscreenProvider } from '@/contexts/FullscreenContext';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showFooter, setShowFooter] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // This will be handled by the intersection observer
    setShowFooter(false);
  }, []);

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <title>NGroup Products</title>
        <meta name="description" content="Point of Sale system for milk products." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <FullscreenProvider>
              <div className="flex flex-col h-full">
                <main className="flex-grow overflow-y-auto relative">
                  {children}
                  {/* Footer Sentinel - detects when we're near the bottom */}
                  <div 
                    id="footer-sentinel"
                    className="absolute bottom-0 h-1 w-full"
                    style={{ visibility: 'hidden' }}
                  />
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
        <FooterObserver onVisibilityChange={setShowFooter} />
      </body>
    </html>
  );
}

function FooterObserver({ onVisibilityChange }: { onVisibilityChange: (visible: boolean) => void }) {
  useEffect(() => {
    const sentinel = document.getElementById('footer-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibilityChange(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onVisibilityChange]);

  return null;
}