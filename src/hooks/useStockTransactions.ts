
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/stock-transactions";

export function useStockTransactions() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch stock transactions" }));
        throw new Error(errorData.message || "Failed to fetch stock transactions");
      }
      let data = await response.json();
      // Ensure transactionDate is a Date object
      data = data.map((tx: any) => ({...tx, transactionDate: new Date(tx.transactionDate)}));
      setTransactions(data);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Stock Report",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
