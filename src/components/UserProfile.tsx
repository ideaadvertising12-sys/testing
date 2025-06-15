
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { LogOut, Settings, User, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/types";

export function UserProfile() {
  const { userRole, setUserRole, availableRoles } = useAuth();
  // In a real app, user data would come from auth context or props
  const user = { name: userRole === "admin" ? "Admin User" : "Cashier User", email: userRole === "admin" ? "admin@milkpos.com" : "cashier@milkpos.com", avatarUrl: "https://placehold.co/100x100.png" };
  
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
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
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
        <Link href="/" legacyBehavior>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
