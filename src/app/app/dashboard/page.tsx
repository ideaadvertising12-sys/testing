import { DollarSign, Package, Users, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { placeholderStats, placeholderSalesChartData, placeholderMonthlySalesData } from "@/lib/placeholder-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { placeholderProducts } from "@/lib/placeholder-data";

export default function DashboardPage() {
  const topSellingProducts = [...placeholderProducts]
    .sort((a,b) => (b.price * (150 - b.stock)) - (a.price * (150 - a.stock)) ) // Mock sales volume
    .slice(0,5);

  return (
    <>
      <PageHeader title="Dashboard Overview" description="Welcome back! Here's what's happening with MilkPOS." icon={Activity} />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Total Revenue" 
          value={`$${placeholderStats.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={DollarSign}
          description="+20.1% from last month"
          iconColor="text-green-500"
        />
        <StatsCard 
          title="Total Customers" 
          value={placeholderStats.totalCustomers}
          icon={Users}
          description="+5 from last week"
          iconColor="text-blue-500"
        />
        <StatsCard 
          title="Low Stock Items" 
          value={placeholderStats.lowStockItems}
          icon={TrendingDown}
          description="Needs reordering soon"
          iconColor="text-orange-500"
        />
         <StatsCard 
          title="Revenue Today" 
          value={`$${placeholderStats.revenueToday.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          icon={TrendingUp}
          description="Compared to yesterday"
          iconColor="text-indigo-500"
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
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{150 - product.stock}</TableCell> 
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <RecentActivity />
    </>
  );
}
