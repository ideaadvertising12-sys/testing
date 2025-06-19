
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/sales";

export function useSalesData() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch sales data" }));
        throw new Error(errorData.message || "Failed to fetch sales data");
      }
      const data = await response.json();
      // Ensure saleDate is a Date object
      const formattedData = data.map((sale: any) => ({
        ...sale,
        saleDate: new Date(sale.saleDate),
      }));
      setSales(formattedData);
    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      const errorMessage = err.message || "An unknown error occurred while fetching sales data.";
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
    fetchSales();
  }, [fetchSales]);

  return {
    sales,
    isLoading,
    error,
    refetchSales: fetchSales,
  };
}
