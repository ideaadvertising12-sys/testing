
"use client";

import { Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductDataTable } from "@/components/products/ProductDataTable";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "cashier") {
      router.replace("/app/inventory"); // Redirect cashier to inventory page
    }
  }, [userRole, router]);

  if (userRole === "cashier") {
    return <AccessDenied message="Product management is not available for your role. You can view stock levels in Inventory." />;
  }

  return (
    <>
      <PageHeader 
        title="Product Management" 
        description="Add, view, and manage your products."
        icon={Package}
      />
      <ProductDataTable />
    </>
  );
}
