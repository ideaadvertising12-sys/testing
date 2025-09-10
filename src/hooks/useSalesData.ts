
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToSales } from "@/lib/firestoreService";

export function useSalesData() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchSales = useCallback(() => {
    setIsLoading(true);
    
    // The listener handles real-time updates.
    const unsubscribe = subscribeToSales(
      (newSales) => {
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
    const unsubscribe = refetchSales();
    
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [refetchSales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue,
    refetchSales,
  };
}
