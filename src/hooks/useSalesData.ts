
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
      // Ensure saleDate is a Date object and totalAmount is a number
      const formattedData = data.map((sale: any) => ({
        ...sale,
        saleDate: new Date(sale.saleDate),
        totalAmount: Number(sale.totalAmount) || 0,
        subTotal: Number(sale.subTotal) || 0,
        discountPercentage: Number(sale.discountPercentage) || 0,
        discountAmount: Number(sale.discountAmount) || 0,
        cashGiven: sale.cashGiven !== undefined ? Number(sale.cashGiven) : undefined,
        balanceReturned: sale.balanceReturned !== undefined ? Number(sale.balanceReturned) : undefined,
        amountPaidOnCredit: sale.amountPaidOnCredit !== undefined ? Number(sale.amountPaidOnCredit) : undefined,
        remainingCreditBalance: sale.remainingCreditBalance !== undefined ? Number(sale.remainingCreditBalance) : undefined,
      }));
      setSales(formattedData);
    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      const errorMessage = err.message || "An unknown error occurred while fetching sales data.";
      setError(errorMessage);
      // Only show toast if it's a new error or loading state changes, to avoid spamming
      // For simplicity, we'll keep the toast here, but a more advanced setup might gate it.
      toast({
        variant: "destructive",
        title: "Error Fetching Sales",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed setIsLoading, setError, setSales from deps as they are stable state setters

  useEffect(() => {
    fetchSales(); // Initial fetch

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSales();
      }
    };

    // Refetch when the tab/window gains focus or becomes visible
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchSales);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchSales);
    };
  }, [fetchSales]);

  return {
    sales,
    isLoading,
    error,
    refetchSales: fetchSales,
  };
}
