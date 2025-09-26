
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { StockService } from "@/lib/stockService";

export function useStockTransactions() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newTransactions = await StockService.getAllTransactions();
      setTransactions(newTransactions);
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
    refetchTransactions();
  }, [refetchTransactions]);


  return {
    transactions,
    isLoading,
    error,
  };
}
