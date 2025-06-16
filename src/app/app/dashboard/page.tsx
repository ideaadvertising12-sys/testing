
"use client";

import { Banknote, Package, Users, TrendingDown, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertQuantityTable } from "@/components/dashboard/AlertQuantityTable";
import { placeholderStats, placeholderMonthlySalesData } from "@/lib/placeholder-data";
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
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      // This should be handled by AppLayout, but as a safeguard
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales"); 
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <AppLogo size="lg" />
        <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Dashboard is not available for your role. Redirecting..." />;
  }
  
  const topSellingProducts = [...placeholderProducts]
    .sort((a,b) => (b.price * (150 - b.stock)) - (a.price * (150 - a.stock)) ) 
    .slice(0,5);

  return (
    <>
      <PageHeader title="Dashboard Overview" description="Welcome back! Here's what's happening with NGroup Products." icon={Activity} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Total Revenue" 
          value={`Rs. ${placeholderStats.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={Banknote}
          iconColor="text-green-600" 
        />
        <StatsCard 
          title="Total Customers" 
          value={placeholderStats.totalCustomers}
          icon={Users}
          iconColor="text-blue-600" 
        />
        <StatsCard 
          title="Low Stock Items" 
          value={placeholderStats.lowStockItems}
          icon={AlertTriangle} 
          description="Needs reordering soon"
          iconColor="text-red-600" 
        />
         <StatsCard 
          title="Revenue Today" 
          value={`Rs. ${placeholderStats.revenueToday.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={TrendingUp}
          iconColor="text-emerald-600" 
        />
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
    </>
  );
}

