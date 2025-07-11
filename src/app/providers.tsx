
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FullscreenProvider } from '@/contexts/FullscreenContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <FullscreenProvider>
          <div className="flex flex-col h-full">
            <main className="flex-grow overflow-y-auto">
              {children}
            </main>
          </div>
          <div className="toaster-wrapper-for-print-hide">
            <Toaster />
          </div>
        </FullscreenProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
