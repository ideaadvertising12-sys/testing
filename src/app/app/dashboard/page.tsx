
"use client";

import { Banknote, Users, TrendingUp, Activity, AlertTriangle, Loader2, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertQuantityTable } from "@/components/dashboard/AlertQuantityTable";
import { placeholderMonthlySalesData, placeholderProducts } from "@/lib/placeholder-data"; // Keep placeholderProducts for top selling example
import type { StatsData, Sale } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { useProducts } from "@/hooks/useProducts"; // Import useProducts

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const { customers, isLoading: isLoadingCustomers, error: customersError } = useCustomers();
  const { 
    sales, 
    isLoading: isLoadingSales, 
    error: salesError, 
    totalRevenue: hookTotalRevenue 
  } = useSalesData();
  const { 
    products: allProducts, 
    isLoading: isLoadingProducts, 
    error: productsError 
  } = useProducts();


  const revenueToday = useMemo(() => {
    if (isLoadingSales || !sales || sales.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales
      .filter(sale => {
        const saleDate = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
        return saleDate >= today;
      })
      .reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
  }, [sales, isLoadingSales]);

  const liveLowStockItemsCount = useMemo(() => {
    if (isLoadingProducts || !allProducts || allProducts.length === 0) return 0;
    return allProducts.filter(p => p.stock <= (p.reorderLevel || 10)).length;
  }, [allProducts, isLoadingProducts]);


  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading dashboard..." />;
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Dashboard is not available for your role. Redirecting..." />;
  }

  // Top selling products can remain using placeholder data for now, or be updated similarly if desired
  const topSellingProducts = [...placeholderProducts]
    .sort((a,b) => (b.price * (150 - b.stock)) - (a.price * (150 - a.stock)))
    .slice(0,5);

  const formatCurrency = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Rs. 0.00'; 
    }
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency',
      currency: 'LKR', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value).replace('LKR', 'Rs.'); 
  };

  const renderStatsCard = (
    title: string,
    valueKey: 'liveTotalCustomers' | 'liveTotalRevenue' | 'liveRevenueToday' | 'liveLowStockItems',
    icon: LucideIcon,
    iconColor: string,
    description?: string
  ) => {
    let isLoadingValue = false;
    let hasError: string | null = null;
    let displayValue: string | number = 'N/A';

    switch (valueKey) {
      case 'liveTotalCustomers':
        isLoadingValue = isLoadingCustomers;
        hasError = customersError;
        if (!isLoadingValue && !hasError && customers) {
          displayValue = customers.length.toLocaleString();
        }
        break;
      case 'liveTotalRevenue':
        isLoadingValue = isLoadingSales;
        hasError = salesError;
        if (!isLoadingValue && !hasError && hookTotalRevenue !== undefined) { 
          displayValue = formatCurrency(hookTotalRevenue);
        }
        break;
      case 'liveRevenueToday':
        isLoadingValue = isLoadingSales; 
        hasError = salesError;
        if (!isLoadingValue && !hasError && sales) {
          displayValue = formatCurrency(revenueToday);
        }
        break;
      case 'liveLowStockItems':
        isLoadingValue = isLoadingProducts;
        hasError = productsError;
        if (!isLoadingValue && !hasError && allProducts) {
          displayValue = liveLowStockItemsCount.toString();
        }
        break;
      default:
        // This default case might not be needed if all keys are explicitly handled
        displayValue = 'N/A';
    }

    if (isLoadingValue) {
      return (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Loader2 className={`${iconColor} h-5 w-5 animate-spin`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-foreground">Loading...</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
          </CardContent>
        </Card>
      );
    }

    if (hasError) {
      return (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <AlertTriangle className={`${iconColor} h-5 w-5`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline text-destructive">Error</div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
            {/* <p className="text-xs text-destructive mt-1">{hasError}</p> */}
          </CardContent>
        </Card>
      );
    }

    return (
      <StatsCard
        title={title}
        value={displayValue}
        icon={icon}
        iconColor={iconColor}
        description={description}
      />
    );
  };

  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with NGroup Products."
        icon={Activity}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {renderStatsCard(
          "Total Revenue",
          "liveTotalRevenue",
          Banknote,
          "text-green-600"
        )}
        {renderStatsCard(
          "Total Customers",
          "liveTotalCustomers",
          Users,
          "text-blue-600"
        )}
        {renderStatsCard(
          "Low Stock Items",
          "liveLowStockItems", 
          AlertTriangle,
          "text-destructive",
          "Needs reordering soon"
        )}
        {renderStatsCard(
          "Revenue Today",
          "liveRevenueToday",
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
            <CardDescription>Most popular items this month (placeholder data).</CardDescription>
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
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
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
