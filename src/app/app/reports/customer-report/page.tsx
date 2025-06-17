
"use client";

import { UserCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

// InjectedHeadContent component removed

export default function CustomerReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <>
        <GlobalPreloaderScreen message="Loading report..." />
        {/* InjectedHeadContent usage removed */}
        <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
      </>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <>
        <AccessDenied message="Customer reports are not available for your role. Redirecting..." />
        {/* InjectedHeadContent usage removed */}
        <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Customer Report" 
        description="Analysis of customer purchasing behavior and payment history."
        icon={UserCheck}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Customer Activity & Sales Report</CardTitle>
          <CardDescription>
            This report will focus on customer-specific data, including their purchase history,
            payment records, and frequency of buying.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Customer report generation is in progress. This section will display detailed customer analytics.
            Key information will include:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>List of all customers with contact details.</li>
            <li>Individual customer purchase history (products bought, dates, amounts).</li>
            <li>Total spending per customer.</li>
            <li>Payment summaries and outstanding balances (if applicable).</li>
            <li>Frequency of purchases and last purchase date.</li>
            <li>Top customers by value or volume.</li>
          </ul>
        </CardContent>
      </Card>
      {/* InjectedHeadContent usage removed */}
      <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
    </>
  );
}
