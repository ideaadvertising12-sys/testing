
"use client";

import type { UserRole, User } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password_plain: string) => boolean;
  logout: () => void;
  availableRoles: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const availableRoles: UserRole[] = ["admin", "cashier"];

// Define mock users - in a real app, this would come from a database
const mockUsersCredentials: Record<string, { password_hashed_or_plain: string; role: UserRole, name: string }> = {
  "admin": { password_hashed_or_plain: "123", role: "admin", name: "Admin User" },
  "user": { password_hashed_or_plain: "123", role: "cashier", name: "Cashier User" },
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  const login = (usernameInput: string, password_plain: string): boolean => {
    const username = usernameInput.toLowerCase(); // Normalize username
    const userCredentials = mockUsersCredentials[username];
    if (userCredentials && userCredentials.password_hashed_or_plain === password_plain) {
      setCurrentUser({ username: username, role: userCredentials.role, name: userCredentials.name });
      return true;
    }
    setCurrentUser(null); // Ensure logout on failed attempt
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    router.push("/"); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, availableRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

