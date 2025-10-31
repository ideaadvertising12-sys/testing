
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestoreService";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { DateRange } from "react-day-picker";

export function useSalesData(fetchAllInitially: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAllInitially);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const refetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we fetch all. Pagination can be re-added if needed.
      const { sales: fetchedSales } = await getSales(undefined, dateRange, staffId);
      setSales(fetchedSales);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching sales.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Sales",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, dateRange, staffId]);
  

  useEffect(() => {
    if (fetchAllInitially) {
      refetchSales();
    }
  }, [fetchAllInitially, refetchSales]);
  
  // Refetch when dependencies change
  useEffect(() => {
      refetchSales();
  }, [dateRange, staffId, refetchSales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    hasMore: false, // Temporarily disabled
    loadMoreSales: () => {}, // No-op
    refetchSales,
  };
}
