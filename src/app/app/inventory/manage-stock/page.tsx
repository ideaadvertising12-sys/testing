
"use client";

import { PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ManageStockForm } from "@/components/inventory/ManageStockForm";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

const InjectedHeadContent = () => (
  <>
    <title>NGroup Products</title>
    <meta name="description" content="Point of Sale system for milk products." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
  </>
);

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
      <>
        <GlobalPreloaderScreen message="Loading stock management..." />
        <InjectedHeadContent />
      </>
     );
  }

  if (currentUser.role === "cashier") {
    return (
      <>
        <AccessDenied message="Stock management is not available for your role. Redirecting..." />
        <InjectedHeadContent />
      </>
    );
  }
  
  return (
    <>
      <PageHeader 
        title="Manage Stock / Transactions" 
        description="Add, remove, or transfer product stock."
        icon={PlusSquare}
      />
      <ManageStockForm />
      <InjectedHeadContent />
    </>
  );
}
