
"use client"; // Added "use client"

import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomerDataTable } from "@/components/customers/CustomerDataTable";
import { useAuth } from "@/contexts/AuthContext"; // Added
import { useEffect } from "react"; // Added
import { useRouter } from "next/navigation"; // Added
import { AppLogo } from "@/components/AppLogo"; // Added


export default function CustomersPage() {
  const { currentUser } = useAuth(); // Added
  const router = useRouter(); // Added

  useEffect(() => { // Added
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) { // Added
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <AppLogo size="lg" />
        <p className="mt-4 text-lg text-muted-foreground">Loading customers...</p>
      </div>
    );
  }
  // Customer page is accessible to both admin and cashier, so no specific role check here beyond being logged in.

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="Add, view, and manage your customers."
        icon={Users}
      />
      <CustomerDataTable />
    </>
  );
}

