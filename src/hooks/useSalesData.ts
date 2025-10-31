
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestoreService";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { DateRange } from "react-day-picker";

const CACHE_KEY = "salesCache";
const PAGE_SIZE = 50; 

export function useSalesData(fetchAllInitially: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Sale> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  const refetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    
    try {
      // For a full refetch, we want all data, not just the first page.
      // We will fetch pages until hasMore is false.
      let allSales: Sale[] = [];
      let lastDoc: QueryDocumentSnapshot<Sale> | undefined = undefined;
      let moreToFetch = true;

      while(moreToFetch) {
        const { sales: fetchedSales, lastVisible: newLastVisible } = await getSales(lastDoc, dateRange, staffId);
        allSales.push(...fetchedSales);
        if (newLastVisible) {
            lastDoc = newLastVisible;
        } else {
            moreToFetch = false;
        }
      }
      
      setSales(allSales);
      setLastVisible(null); // Reset pagination tracking as we have all data
      setHasMore(false); // We have fetched everything
      
      if (!dateRange && !staffId) { // Only cache if we are fetching all data
        localStorage.setItem(CACHE_KEY, JSON.stringify(allSales));
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

  useEffect(() => {
    if (fetchAllInitially) {
        const loadData = async () => {
            // Only use cache if we are fetching ALL data (no filters)
            if (!dateRange && !staffId) {
                try {
                    const cachedData = localStorage.getItem(CACHE_KEY);
                    if (cachedData) {
                        setSales(JSON.parse(cachedData).map((s: any) => ({...s, saleDate: new Date(s.saleDate)})));
                        setIsLoading(false);
                    }
                } catch (e) {
                    console.warn("Could not read sales from cache", e);
                }
            }
            await refetchSales();
        };
        loadData();
    }
  }, [fetchAllInitially, refetchSales, dateRange, staffId]);

  const loadMoreSales = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { sales: newSales, lastVisible: newLastVisible } = await getSales(lastVisible, dateRange, staffId);
      setSales(prev => [...prev, ...newSales]);
      setLastVisible(newLastVisible);
      if (!newLastVisible || newSales.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching more sales.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More Sales",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange, staffId]);
  
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    hasMore, 
    loadMoreSales,
    refetchSales,
  };
}
