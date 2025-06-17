
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useState, FormEvent, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

const InjectedHeadContent = () => (
  <>
    <title>NGroup Products</title>
    <meta name="description" content="Point of Sale system for milk products." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
  </>
);

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        router.replace("/app/dashboard");
      } else if (currentUser.role === "cashier") {
        router.replace("/app/sales");
      }
    }
  }, [currentUser, router]);

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
  
  if (currentUser) {
      return (
        <>
          <GlobalPreloaderScreen message="Redirecting..." />
          <InjectedHeadContent />
        </>
      );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
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
      <InjectedHeadContent />
    </>
  );
}
