
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { StockService } from "@/lib/stockService";
import type { DateRange } from "react-day-picker";
import { query, collection, orderBy, where, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { stockTransactionConverter } from "@/lib/types";

async function getStockTransactions(lastVisible?: QueryDocumentSnapshot<StockTransaction>, dateRange?: DateRange): Promise<{ transactions: StockTransaction[], lastVisible: QueryDocumentSnapshot<StockTransaction> | null }> {
  const transCol = collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any);
  
  const constraints = [orderBy("transactionDate", "desc")];
  if(dateRange?.from) constraints.push(where("transactionDate", ">=", dateRange.from));
  if(dateRange?.to) constraints.push(where("transactionDate", "<=", dateRange.to));

  const q = query(transCol, ...constraints);
  
  const snapshot = await getDocs(q);
  
  const transactions = snapshot.docs.map(doc => doc.data());
  const newLastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { transactions, lastVisible: newLastVisible };
}

export function useStockTransactions(fetchAll: boolean = false, dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { transactions: initial } = await getStockTransactions(undefined, dateRange);
      setTransactions(initial);
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
  }, [toast, dateRange]);

  useEffect(() => {
    if(fetchAll){
        refetchTransactions();
    }
  }, [fetchAll, refetchTransactions]);
  
  useEffect(() => {
    refetchTransactions();
  }, [dateRange, refetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore: false, // Temporarily disabled
    loadMoreTransactions: () => {}, // No-op
    refetchTransactions,
  };
}
