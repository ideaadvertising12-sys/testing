
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from "@/components/AppLogo";

export default function LoginPage() {
  return (
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
          <div> {/* Removed space-y-4 from here */}
            <div className="space-y-2"> {/* Email group */}
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-2 mt-4"> {/* Password group with mt-4 */}
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required placeholder="••••••••" />
            </div>
            <Link href="/app/dashboard" asChild>
              <Button type="submit" className="w-full mt-6"> {/* Login button with mt-6 */}
                Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NGroup Products. All rights reserved.
      </footer>
    </div>
  );
}

