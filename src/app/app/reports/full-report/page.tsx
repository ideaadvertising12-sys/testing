
"use client";

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FullReportPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/app/dashboard"); // Or a more suitable default page for non-admins
    }
  }, [userRole, router]);

  if (userRole !== "admin") {
    return <AccessDenied message="Full reports are not available for your role. Redirecting..." />;
  }

  return (
    <>
      <PageHeader 
        title="Full Report" 
        description="Comprehensive overview of all sales, revenue, and transaction details."
        icon={ClipboardList}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Full System Report</CardTitle>
          <CardDescription>
            This report will contain a detailed breakdown of all activities including sales transactions (date, price, total revenue), 
            product movements, customer interactions, and potentially more, filterable by date ranges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Full report generation is in progress. This section will display comprehensive data tables and visualizations.
            Key metrics will include:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Overall sales figures and revenue.</li>
            <li>Breakdown by product categories.</li>
            <li>Payment method summaries.</li>
            <li>Transaction logs with timestamps.</li>
            <li>Date and time of all major operations.</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
