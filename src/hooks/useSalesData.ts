
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestoreService";

// By default, the hook will not fetch all sales unless specifically requested.
export function useSalesData(fetchAll: boolean = false) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll); // Only be in loading state if we are fetching all
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSales = await getSales();
      setSales(fetchedSales);
      setError(null);
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
  }, [toast]);

  useEffect(() => {
    if (fetchAll) {
      refetchSales();
    }
  }, [refetchSales, fetchAll]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    refetchSales,
  };
}
