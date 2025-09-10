
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToSales } from "@/lib/firestoreService";

const API_BASE_URL = "/api/sales";

export function useSalesData(realTime = true) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchSales = useCallback(() => {
    setIsLoading(true);
    
    // We only need to set up the subscription. No initial fetch is needed.
    const unsubscribe = subscribeToSales(
      (newSales) => {
        // The data from the listener is already processed by the converter
        setSales(newSales);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err.message || "An unknown error occurred while fetching sales data.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Fetching Sales Data",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    );

    return unsubscribe;

  }, [toast]);

  useEffect(() => {
    if (!realTime) {
        // If realTime is false, perform a one-time fetch.
        const fetchOnce = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(API_BASE_URL);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "Failed to fetch sales data" }));
                    throw new Error(errorData.message || "Failed to fetch sales data");
                }
                const data = await response.json();
                const processedSales = data.map((sale: any) => ({
                    ...sale,
                    saleDate: new Date(sale.saleDate),
                    totalAmount: Number(sale.totalAmount) || 0,
                }));
                setSales(processedSales);
            } catch (err: any) {
                setError(err.message);
                toast({ variant: "destructive", title: "Error", description: err.message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchOnce();
        return; // Return early, do not set up subscription.
    }
    
    const unsubscribe = refetchSales();
    
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [realTime, refetchSales, toast]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    refetchSales,
  };
}
