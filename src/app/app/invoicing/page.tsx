
"use client"; 

import { ReceiptText, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react"; 
import { useRouter } from "next/navigation"; 
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useSalesData } from "@/hooks/useSalesData"; // Import the hook
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  const { currentUser } = useAuth(); 
  const router = useRouter(); 
  const { sales, isLoading, error, refetchSales } = useSalesData(); // Use the hook

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
      {isLoading && (
        <Card className="shadow-none border-0">
          <CardContent className="p-6 flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading invoices...</p>
          </CardContent>
        </Card>
      )}
      {error && !isLoading && (
        <Card className="shadow-none border-0">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error Loading Invoices</AlertTitle>
              <AlertDescription>
                Could not load invoice data. Please try again.
                <p className="text-xs mt-1">Details: {error}</p>
              </AlertDescription>
            </Alert>
            <Button onClick={() => refetchSales()} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}
      {!isLoading && !error && (
        <InvoiceDataTable initialSales={sales} />
      )}
    </>
  );
}
