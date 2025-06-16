
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ShieldCheck, Sun, Moon, Laptop } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";
import { useTheme } from "next-themes";

export function UserProfile() {
  const { userRole, setUserRole, availableRoles } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const user = { name: userRole === "admin" ? "Admin User" : "Cashier User", email: userRole === "admin" ? "admin@milkpos.com" : "cashier@milkpos.com" };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            {/* <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" /> */}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-primary font-medium pt-1">Role: {userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {/* Theme Switcher */}
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* End Theme Switcher */}

        {/* Temporary Role Switcher for Dev */}
        <DropdownMenuRadioGroup value={userRole} onValueChange={(value) => setUserRole(value as UserRole)}>
            <DropdownMenuLabel className="flex items-center">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Switch Role (Dev)</span>
            </DropdownMenuLabel>
            {availableRoles.map(role => (
                 <DropdownMenuRadioItem key={role} value={role} className="capitalize">
                    {role}
                </DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* End Temporary Role Switcher */}
        <Link href="/" asChild>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
