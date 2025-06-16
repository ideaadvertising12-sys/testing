
"use client";

import { Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductDataTable } from "@/components/products/ProductDataTable";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";

export default function ProductsPage() {
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
        <p className="mt-4 text-lg text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Product management is not available for your role. Redirecting..." />;
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

