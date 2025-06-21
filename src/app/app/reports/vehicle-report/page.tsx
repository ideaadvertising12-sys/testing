"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useVehicles } from "@/hooks/useVehicles";
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Truck, Search, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { StockTransaction, VehicleReportItem } from "@/lib/types";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { VehicleReportDisplay } from "@/components/reports/VehicleReportDisplay";

export default function VehicleReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { transactions: allTransactions, isLoading: isLoadingTransactions } = useStockTransactions();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [reportData, setReportData] = useState<VehicleReportItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const handleGenerateReport = () => {
    if (!selectedVehicleId || !dateRange?.from || !dateRange?.to) {
      alert("Please select a vehicle and a valid date range.");
      return;
    }
    setIsGenerating(true);
    setReportData(null);

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    setSelectedVehicleNumber(vehicle?.vehicleNumber);

    const reportStartDate = startOfDay(dateRange.from);
    const reportEndDate = endOfDay(dateRange.to);

    const filteredTransactions = allTransactions.filter(tx =>
      tx.vehicleId === selectedVehicleId &&
      tx.transactionDate >= reportStartDate &&
      tx.transactionDate <= reportEndDate &&
      (tx.type === 'LOAD_TO_VEHICLE' || tx.type === 'UNLOAD_FROM_VEHICLE')
    );

    const processedData = new Map<string, VehicleReportItem>();

    for (const tx of filteredTransactions) {
      if (!processedData.has(tx.productId)) {
        processedData.set(tx.productId, {
          productId: tx.productId,
          productName: tx.productName,
          productSku: tx.productSku,
          totalLoaded: 0,
          totalUnloaded: 0,
          netChange: 0,
        });
      }

      const item = processedData.get(tx.productId)!;
      if (tx.type === 'LOAD_TO_VEHICLE') {
        item.totalLoaded += tx.quantity;
      } else if (tx.type === 'UNLOAD_FROM_VEHICLE') {
        item.totalUnloaded += tx.quantity;
      }
    }
    
    // Calculate net change
    processedData.forEach(item => {
        item.netChange = item.totalLoaded - item.totalUnloaded;
    });

    setReportData(Array.from(processedData.values()));
    setIsGenerating(false);
  };
  
  const pageIsLoading = isLoadingVehicles || isLoadingTransactions;

  if (pageIsLoading && !currentUser) {
    return <GlobalPreloaderScreen message="Loading..." />;
  }

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Redirecting..." />;
  }
  
  if (currentUser.role !== "admin") {
      return <AccessDenied message="Vehicle reports are not available for your role." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vehicle Report" 
        description="Analyze stock loaded and unloaded from a specific vehicle."
        icon={Truck}
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Report Filters</CardTitle>
          <CardDescription>Select a vehicle and date range to generate the report.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={pageIsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="md:col-span-1"
          />

          <Button 
            onClick={handleGenerateReport} 
            disabled={!selectedVehicleId || !dateRange || isGenerating || pageIsLoading}
            className="h-10"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {isGenerating ? (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      ) : reportData ? (
        <VehicleReportDisplay 
            data={reportData} 
            vehicleNumber={selectedVehicleNumber || ""}
            dateRange={dateRange}
        />
      ) : (
        <Card className="shadow-lg">
            <CardContent className="py-12 text-center text-muted-foreground">
                <p>Please select your filters and click "Generate Report" to view data.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
