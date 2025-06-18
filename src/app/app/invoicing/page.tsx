
"use client"; 

import { ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react"; 
import { useRouter } from "next/navigation"; 
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { placeholderSales } from "@/lib/placeholder-data"; // Import sales data
import type { Sale } from "@/lib/types";

export default function InvoicingPage() {
  const { currentUser } = useAuth(); 
  const router = useRouter(); 
  // In a real app, this data would be fetched or come from a global state/context
  const [salesData] = React.useState<Sale[]>(placeholderSales);

  useEffect(() => { 
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) { 
     return (
      <>
        <GlobalPreloaderScreen message="Loading invoicing..." />
      </>
     );
  }

  return (
    <>
      <PageHeader 
        title="Invoice Management" 
        description="View, search, and manage past sales invoices."
        icon={ReceiptText}
      />
      <InvoiceDataTable initialSales={salesData} />
    </>
  );
}
