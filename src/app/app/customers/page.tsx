
"use client"; 

import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomerDataTable } from "@/components/customers/CustomerDataTable";
import { useAuth } from "@/contexts/AuthContext";
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

export default function CustomersPage() {
  const { currentUser } = useAuth(); 
  const router = useRouter(); 

  useEffect(() => { 
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) { 
     return (
      <>
        <GlobalPreloaderScreen message="Loading customers..." />
        <InjectedHeadContent />
      </>
     );
  }

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="Add, view, and manage your customers."
        icon={Users}
      />
      <CustomerDataTable />
      <InjectedHeadContent />
    </>
  );
}
