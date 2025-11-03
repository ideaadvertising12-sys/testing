

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getSales } from "@/lib/firestoreService";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { DateRange } from "react-day-picker";
import { startOfYear } from "date-fns";

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
    setHasMore(true); // Reset pagination state on refetch
    
    try {
      const { sales: fetchedSales, lastVisible: newLastVisible } = await getSales(undefined, dateRange, staffId);
      
      setSales(fetchedSales);
      setLastVisible(newLastVisible);
      if (!newLastVisible || fetchedSales.length < PAGE_SIZE) {
        setHasMore(false); 
      }
      
      if (fetchAllInitially && !dateRange && !staffId) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedSales));
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
  }, [toast, dateRange, staffId, fetchAllInitially]);

  useEffect(() => {
    if (fetchAllInitially) {
        const loadData = async () => {
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
    } else {
      const fetchPaginatedInitial = async () => {
        setIsLoading(true);
        setError(null);
        setHasMore(true);
        try {
            const { sales: initialSales, lastVisible: newLastVisible } = await getSales(undefined, dateRange, staffId);
            setSales(initialSales);
            setLastVisible(newLastVisible);
            if (!newLastVisible || initialSales.length < PAGE_SIZE) {
                setHasMore(false);
            }
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred fetching initial sales.";
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
      };
      fetchPaginatedInitial();
    }
  }, [fetchAllInitially, dateRange, staffId, refetchSales, toast]);

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
