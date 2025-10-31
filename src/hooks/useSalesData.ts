
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestoreService";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { DateRange } from "react-day-picker";

const CACHE_KEY = "salesCache";
const PAGE_SIZE = 50; // Keep pagination for backend efficiency

export function useSalesData(fetchAllInitially: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAllInitially);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Sale> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  const fetchAllSales = useCallback(async () => {
    let allSalesData: Sale[] = [];
    let lastDoc: QueryDocumentSnapshot<Sale> | undefined = undefined;
    let moreToFetch = true;

    while(moreToFetch) {
      const { sales: fetchedSales, lastVisible: newLastVisible } = await getSales(lastDoc, dateRange, staffId);
      allSalesData = [...allSalesData, ...fetchedSales];
      if (newLastVisible) {
        lastDoc = newLastVisible as QueryDocumentSnapshot<Sale>;
      } else {
        moreToFetch = false;
      }
    }
    return allSalesData;
  }, [dateRange, staffId]);

  const refetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allSalesData = await fetchAllSales();
      setSales(allSalesData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(allSalesData));
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
  }, [toast, fetchAllSales]);

  useEffect(() => {
    const loadData = async () => {
        if (!fetchAllInitially) return;
        
        setIsLoading(true);
        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            if (cachedData) {
                setSales(JSON.parse(cachedData).map((s: any) => ({...s, saleDate: new Date(s.saleDate)})));
                setIsLoading(false); // We have data, loading is "done" for the UI
            }
        } catch (e) {
            console.warn("Could not read sales from cache", e);
        }
        await refetchSales(); // Always fetch fresh data
    };

    if (fetchAllInitially) {
      loadData();
    }
  }, [fetchAllInitially, refetchSales]);
  
  useEffect(() => {
    if (dateRange || staffId) {
      refetchSales();
    }
  }, [dateRange, staffId, refetchSales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    // Note: Pagination logic (hasMore, loadMoreSales) is removed as we now fetch all.
    // Kept for potential future re-implementation if needed.
    hasMore: false, 
    loadMoreSales: () => {},
    refetchSales,
  };
}
