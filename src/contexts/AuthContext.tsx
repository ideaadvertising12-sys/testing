
"use client";

import type { UserRole } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  availableRoles: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const availableRoles: UserRole[] = ["admin", "cashier"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>("cashier"); // Default to 'cashier'

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, availableRoles }}>
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
