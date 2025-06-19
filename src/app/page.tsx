
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, FormEvent, useEffect, useRef } from "react"; // Added useRef
import { useToast } from "@/hooks/use-toast";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { cn } from "@/lib/utils"; // Added cn

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [showFooter, setShowFooter] = useState(false);
  const [mounted, setMounted] = useState(false);
  const loginPageContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        router.replace("/app/dashboard");
      } else if (currentUser.role === "cashier") {
        router.replace("/app/sales");
      }
    }
  }, [currentUser, router]);

  useEffect(() => {
    setMounted(true);

    const mainElement = loginPageContentRef.current;
    if (!mainElement) return;

    const handleScrollInteraction = () => {
      // Ensure the element is actually rendered and has dimensions
      if (!loginPageContentRef.current || loginPageContentRef.current.clientHeight === 0) {
        setShowFooter(false);
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = mainElement;
      
      const isScrolledToBottom = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight < 5); // 5px threshold
      const isContentTooShortToScroll = scrollHeight <= clientHeight;

      setShowFooter(isScrolledToBottom || isContentTooShortToScroll);
    };
    
    // Initial check
    const animationFrameId = requestAnimationFrame(handleScrollInteraction);
    
    // Listeners
    mainElement.addEventListener('scroll', handleScrollInteraction);
    const resizeObserver = new ResizeObserver(handleScrollInteraction);
    resizeObserver.observe(mainElement);
    if (document.body) { // Observe body for full page resizes affecting viewport calculations
      resizeObserver.observe(document.body);
    }


    return () => {
      cancelAnimationFrame(animationFrameId);
      mainElement.removeEventListener('scroll', handleScrollInteraction);
      resizeObserver.disconnect();
    };
  }, []); 

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = login(username, password);
    if (success) {
      // Redirection is handled by the useEffect hook above
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password.",
      });
      setPassword("");
    }
  };
  
  if (currentUser === undefined) { // Still determining auth state
    return <GlobalPreloaderScreen message="Initializing..." />;
  }
  
  if (currentUser) { // Logged in, redirecting
      return <GlobalPreloaderScreen message="Redirecting..." />;
  }

  // Not logged in, show login page
  return (
    <>
      <div 
        ref={loginPageContentRef}
        className="flex min-h-screen flex-col items-center justify-center bg-background p-4 pb-20 overflow-y-auto" // Added pb-20 for footer space
      >
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              <AppLogo />
            </div>
            <CardTitle className="text-3xl font-headline">Welcome to NGroup Products</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="admin or user" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full mt-6">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground z-40",
          "transition-all duration-300 ease-in-out",
          (!mounted || !showFooter) ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{
          transform: (mounted && showFooter) ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        Design, Development & Hosting by Limidora
      </footer>
    </>
  );
}
