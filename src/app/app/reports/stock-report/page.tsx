
"use client";

import { Warehouse } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function StockReportPage() {
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
     return <GlobalPreloaderScreen message="Loading report..." />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied message="Stock reports are not available for your role. Redirecting..." />;
  }

  return (
    <>
      <PageHeader 
        title="Stock Report" 
        description="Detailed insights into current inventory levels and stock movements."
        icon={Warehouse}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Inventory & Stock Movement Report</CardTitle>
          <CardDescription>
            This report will provide a comprehensive view of product stock levels, reorder points,
            and detailed history of stock transactions (additions, removals, transfers).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Stock report generation is in progress. This section will display detailed inventory data.
            Key information will include:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
            <li>Current stock levels for all products.</li>
            <li>Products below reorder level.</li>
            <li>History of stock additions, including supplier information (if available).</li>
            <li>Records of stock loaded to vehicles and returned from vehicles.</li>
            <li>Wastage and manual adjustment logs.</li>
            <li>Valuation of current stock.</li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
