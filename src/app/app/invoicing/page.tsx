
// app/invoicing/page.tsx
"use client";

import { ReceiptText, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useSalesData } from "@/hooks/useSalesData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { 
    sales, 
    isLoading, 
    error, 
    refetchSales,
    totalRevenue 
  } = useSalesData(true); // Real-time polling enabled

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Authenticating..." />;
  }

  const revenueDisplay = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(totalRevenue).replace('LKR', 'Rs.');

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Invoice Management"
        description={
          <div>
            <p>View, search, and manage past sales invoices.</p>
            {!isLoading && !error && ( // Show total revenue only when not loading and no error
              <p className="mt-1 text-sm font-medium text-primary">
                Total Revenue: {revenueDisplay}
              </p>
            )}
          </div>
        }
        icon={ReceiptText}
      />

      {/* InvoiceDataTable now receives sales data directly. Loading/error handled here. */}
      <InvoiceDataTable 
        sales={sales} 
        isLoading={isLoading} 
        error={error}
        onRefetch={refetchSales}
      />
    </div>
  );
}
