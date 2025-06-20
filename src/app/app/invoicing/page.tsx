"use client";

import { ReceiptText, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Sale } from "@/lib/types";

export default function InvoicingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }

    const q = query(collection(db, "sales"), orderBy("saleDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const salesData: Sale[] = [];
        let revenue = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const saleDate = data.saleDate?.toDate() || new Date();
          
          const sale: Sale = {
            id: doc.id,
            customerId: data.customerId,
            customerName: data.customerName,
            items: data.items,
            subTotal: data.subTotal,
            discountPercentage: data.discountPercentage,
            discountAmount: data.discountAmount,
            totalAmount: data.totalAmount,
            paymentMethod: data.paymentMethod,
            cashGiven: data.cashGiven,
            balanceReturned: data.balanceReturned,
            amountPaidOnCredit: data.amountPaidOnCredit,
            remainingCreditBalance: data.remainingCreditBalance,
            saleDate: saleDate,
            staffId: data.staffId,
          };
          
          salesData.push(sale);
          revenue += sale.totalAmount;
        });

        setSales(salesData);
        setTotalRevenue(revenue);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to sales updates:", err);
        setError("Failed to connect to real-time updates");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
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
            {error}. Try refreshing the page.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
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