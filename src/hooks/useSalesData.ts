
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
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Sale> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchInitialSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const { sales: initialSales, lastVisible: newLastVisible } = await getSales(undefined, dateRange, staffId);
      setSales(initialSales);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
        setHasMore(false);
      }
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
  
  const loadMoreSales = useCallback(async () => {
    if (!lastVisible || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { sales: newSales, lastVisible: newLastVisible } = await getSales(lastVisible, dateRange, staffId);
      setSales(prevSales => [...prevSales, ...newSales]);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
        setHasMore(false);
      }
    } catch (err: any) {
       const errorMessage = err.message || "An unknown error occurred while fetching more sales.";
       setError(errorMessage);
       toast({
        variant: "destructive",
        title: "Error Fetching More Sales",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange, staffId]);
  

  useEffect(() => {
    if (fetchAllInitially) {
      fetchInitialSales();
    }
  }, [fetchAllInitially, fetchInitialSales]);
  
  // Refetch when dependencies change
  useEffect(() => {
      fetchInitialSales();
  }, [dateRange, staffId, fetchInitialSales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    hasMore,
    loadMoreSales,
    refetchSales: fetchInitialSales,
  };
}
