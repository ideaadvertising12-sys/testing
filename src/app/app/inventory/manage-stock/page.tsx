
"use client";

import { PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ManageStockForm } from "@/components/inventory/ManageStockForm";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";

export default function ManageStockPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales"); 
    }
  }, [currentUser, router]);

  if (!currentUser) {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <AppLogo size="lg" />
        <p className="mt-4 text-lg text-muted-foreground">Loading stock management...</p>
      </div>
    );
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Stock management is not available for your role. Redirecting..." />;
  }
  
  return (
    <>
      <PageHeader 
        title="Manage Stock / Transactions" 
        description="Add, remove, or transfer product stock."
        icon={PlusSquare}
      />
      <ManageStockForm />
    </>
  );
}

