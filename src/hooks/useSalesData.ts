
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
      // Ensure numerical values are correctly parsed, defaulting to 0 if invalid
      const processedSales = data.map((sale: any) => ({
        ...sale,
        saleDate: new Date(sale.saleDate), // Ensure saleDate is a Date object
        totalAmount: Number(sale.totalAmount) || 0,
        subTotal: Number(sale.subTotal) || 0,
        discountAmount: Number(sale.discountAmount) || 0,
        cashGiven: sale.cashGiven !== undefined ? Number(sale.cashGiven) || 0 : undefined,
        balanceReturned: sale.balanceReturned !== undefined ? Number(sale.balanceReturned) || 0 : undefined,
        amountPaidOnCredit: sale.amountPaidOnCredit !== undefined ? Number(sale.amountPaidOnCredit) || 0 : undefined,
        remainingCreditBalance: sale.remainingCreditBalance !== undefined ? Number(sale.remainingCreditBalance) || 0 : undefined,
      }));
      setSales(processedSales);
    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      const errorMessage = err.message || "An unknown error occurred while fetching sales data.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Sales Data",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSales();

    // Optional: Refetch on window focus for pseudo-real-time update
    const handleFocus = () => fetchSales();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchSales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  return {
    sales,
    isLoading,
    error,
    totalRevenue, // Export the calculated totalRevenue
    refetchSales: fetchSales,
  };
}
