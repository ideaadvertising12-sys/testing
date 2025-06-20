"use client";

import { ReceiptText, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useSalesWebSocket } from "@/hooks/useSalesWebSocket";
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
    totalRevenue 
  } = useSalesWebSocket();

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
            <p>View, search, and manage past sales invoices in real-time.</p>
            {!isLoading && !error && (
              <p className="mt-1 text-sm font-medium text-primary">
                Total Revenue: {revenueDisplay}
              </p>
            )}
          </div>
        }
        icon={ReceiptText}
      />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error}. The system will attempt to reconnect automatically.
            {!isLoading && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <InvoiceDataTable 
            sales={sales} 
            isLoading={isLoading} 
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}