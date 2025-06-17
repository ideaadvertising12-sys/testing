
"use client";

import { Banknote, Package, Users, TrendingDown, TrendingUp, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertQuantityTable } from "@/components/dashboard/AlertQuantityTable";
import { generatePlaceholderStats, placeholderMonthlySalesData } from "@/lib/placeholder-data";
import type { StatsData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { placeholderProducts } from "@/lib/placeholder-data";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

// InjectedHeadContent component removed

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<StatsData | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales"); 
    } else {
      setDashboardStats(generatePlaceholderStats());
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <>
        <GlobalPreloaderScreen message="Loading dashboard..." />
        {/* InjectedHeadContent usage removed */}
        <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
      </>
    );
  }

  if (currentUser.role === "cashier") {
    return (
      <>
        <AccessDenied message="Dashboard is not available for your role. Redirecting..." />
        {/* InjectedHeadContent usage removed */}
        <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
      </>
    );
  }
  
  const topSellingProducts = [...placeholderProducts]
    .sort((a,b) => (b.price * (150 - b.stock)) - (a.price * (150 - a.stock)) ) 
    .slice(0,5);
  
  const renderStatsCard = (title: string, value: string | number | undefined, icon: React.ElementType, iconColor: string, description?: string) => {
    if (dashboardStats === null && (title === "Total Revenue" || title === "Total Customers" || title === "Low Stock Items" || title === "Revenue Today")) {
      return (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Loader2 className={iconColor + " h-5 w-5 animate-spin"} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-foreground">Loading...</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
          </CardContent>
        </Card>
      );
    }
    return (
      <StatsCard
        title={title}
        value={value ?? 'N/A'}
        icon={icon}
        iconColor={iconColor}
        description={description}
      />
    );
  };

  return (
    <>
      <PageHeader title="Dashboard Overview" description="Welcome back! Here's what's happening with NGroup Products." icon={Activity} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {renderStatsCard(
          "Total Revenue",
          dashboardStats ? `Rs. ${dashboardStats.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : undefined,
          Banknote,
          "text-green-600"
        )}
        {renderStatsCard(
          "Total Customers",
          dashboardStats?.totalCustomers,
          Users,
          "text-blue-600"
        )}
        {renderStatsCard(
          "Low Stock Items",
          dashboardStats?.lowStockItems,
          AlertTriangle,
          "text-red-600",
          "Needs reordering soon"
        )}
        {renderStatsCard(
          "Revenue Today",
          dashboardStats ? `Rs. ${dashboardStats.revenueToday.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : undefined,
          TrendingUp,
          "text-emerald-600"
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SalesChart 
            data={placeholderMonthlySalesData} 
            title="Monthly Sales Performance"
            description="Sales figures for the current year."
          />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Top Selling Products</CardTitle>
            <CardDescription>Most popular items this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Sold (Est.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">Rs. {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{150 - product.stock}</TableCell> 
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <AlertQuantityTable />
      {/* InjectedHeadContent usage removed */}
      <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
    </>
  );
}
