
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-management/UserTable";
import { UserDialog } from "@/components/user-management/UserDialog";
import type { ManagedUser, UserRole } from "@/lib/types";
import { useAuth, mockUsersCredentials, availableRoles as allRoles } from "@/contexts/AuthContext"; // Import mock data
import { PlusCircle, UsersCog, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useRouter } from "next/navigation";
import { AccessDenied } from "@/components/AccessDenied";

export default function UserManagementPage() {
  const { currentUser: loggedInUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loggedInUser) {
      // Still loading or not logged in
      if (loggedInUser === null) router.replace("/"); // Explicitly not logged in
      return;
    }
    if (loggedInUser.role !== "admin") {
      router.replace("/app/dashboard"); // Or appropriate non-admin page
      return;
    }

    // Initialize users from mockUsersCredentials
    const initialUsers = Object.entries(mockUsersCredentials).map(([username, creds]) => ({
      id: username,
      username: username,
      name: creds.name,
      role: creds.role,
      password_hashed_or_plain: creds.password_hashed_or_plain, // Store this for "mock" persistence
    }));
    setUsers(initialUsers);
    setIsLoading(false);
  }, [loggedInUser, router]);


  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    // Prevent deleting the currently logged-in admin or the last admin
    if (userId === loggedInUser?.username) {
      toast({ variant: "destructive", title: "Action Prohibited", description: "You cannot delete your own account." });
      return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
            toast({ variant: "destructive", title: "Action Prohibited", description: "Cannot delete the last admin account." });
            return;
        }
    }

    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    // In a real app, here you would also update mockUsersCredentials or call an API
    // For this simulation, the change is only in local state of this page.
    // To reflect in AuthContext for demo, one might need to "re-initialize" AuthContext or make mockUsersCredentials mutable (not ideal for module-level const).
    toast({ title: "User Deleted", description: `User ${userId} has been removed.` });
  };

  const handleSaveUser = (userToSave: ManagedUser) => {
    // Basic validation
    if (!userToSave.username.trim() || !userToSave.name.trim() || (userToSave.id === "" && !userToSave.password?.trim())) {
      toast({ variant: "destructive", title: "Validation Error", description: "Username, Name, and Password (for new users) are required." });
      return;
    }
    
    if (userToSave.id === "") { // Adding new user
      if (users.some(u => u.username.toLowerCase() === userToSave.username.toLowerCase())) {
        toast({ variant: "destructive", title: "Username Exists", description: "This username is already taken." });
        return;
      }
      const newUser: ManagedUser = {
        ...userToSave,
        id: userToSave.username, // Use username as ID
        password_hashed_or_plain: userToSave.password, // Store plain password for mock
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast({ title: "User Added", description: `User ${newUser.username} created successfully.` });
    } else { // Editing existing user
      setUsers(prevUsers => prevUsers.map(u => (u.id === userToSave.id ? {
        ...u, // Keep existing properties like id, username
        name: userToSave.name,
        role: userToSave.role,
        // Update password only if a new one was provided
        password_hashed_or_plain: userToSave.password ? userToSave.password : u.password_hashed_or_plain,
      } : u)));
      toast({ title: "User Updated", description: `User ${userToSave.username} updated successfully.` });
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };
  
  if (isLoading || loggedInUser === undefined) {
    return <GlobalPreloaderScreen message="Loading user management..." />;
  }

  if (loggedInUser === null || loggedInUser.role !== "admin") {
    // AccessDenied will handle redirection if user is null or not admin
    return <AccessDenied message="You do not have permission to access User Management." />;
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Add, edit, or remove user accounts."
        icon={UsersCog}
        action={
          <Button onClick={handleAddUser}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
          </Button>
        }
      />
      <div className="mb-6 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-lg">
        <div className="flex items-start">
            <ShieldAlert className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Important Note</h3>
                <p className="text-xs text-yellow-800/80 dark:text-yellow-300/80">
                    User management changes (add, edit, delete) are simulated for this demonstration and apply to this page's view.
                    Actual login credentials in `AuthContext` are based on the initial `mockUsersCredentials` and are not dynamically updated by these actions in this mock environment.
                    A full backend integration is required for persistent user management affecting login behavior.
                </p>
            </div>
        </div>
      </div>

      <UserTable
        users={users}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        currentUserUsername={loggedInUser.username}
      />

      {isUserDialogOpen && (
        <UserDialog
          open={isUserDialogOpen}
          onOpenChange={setIsUserDialogOpen}
          onSave={handleSaveUser}
          user={editingUser}
          availableRoles={allRoles}
          existingUsernames={users.map(u => u.username)}
        />
      )}
    </>
  );
}
