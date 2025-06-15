
"use client";

import { PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ManageStockForm } from "@/components/inventory/ManageStockForm";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManageStockPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "cashier") {
      router.replace("/app/sales"); 
    }
  }, [userRole, router]);

  if (userRole === "cashier") {
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
