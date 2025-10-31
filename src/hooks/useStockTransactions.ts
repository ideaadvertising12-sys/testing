
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { StockService } from "@/lib/stockService";
import type { DateRange } from "react-day-picker";
import { query, collection, orderBy, where, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { stockTransactionConverter } from "@/lib/types";


const PAGE_SIZE = 50;

async function getStockTransactions(lastVisible?: QueryDocumentSnapshot<StockTransaction>, dateRange?: DateRange): Promise<{ transactions: StockTransaction[], lastVisible: QueryDocumentSnapshot<StockTransaction> | null }> {
  const transCol = collection(db, 'stockTransactions').withConverter(stockTransactionConverter as any);
  
  const constraints = [orderBy("transactionDate", "desc")];
  if(dateRange?.from) constraints.push(where("transactionDate", ">=", dateRange.from));
  if(dateRange?.to) constraints.push(where("transactionDate", "<=", dateRange.to));
  if (lastVisible) constraints.push(startAfter(lastVisible));
  constraints.push(limit(PAGE_SIZE));

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
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<StockTransaction> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchInitialTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const { transactions: initial, lastVisible: newLastVisible } = await getStockTransactions(undefined, dateRange);
      setTransactions(initial);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
        setHasMore(false);
      }
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

  const loadMoreTransactions = useCallback(async () => {
    if (!lastVisible || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
        const { transactions: newTransactions, lastVisible: newLastVisible } = await getStockTransactions(lastVisible, dateRange);
        setTransactions(prev => [...prev, ...newTransactions]);
        setLastVisible(newLastVisible);
        if (!newLastVisible) {
            setHasMore(false);
        }
    } catch (err: any) {
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: "Could not load more stock transactions." });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange]);


  useEffect(() => {
    if(fetchAll){
        fetchInitialTransactions();
    }
  }, [fetchAll, fetchInitialTransactions]);
  
  useEffect(() => {
    fetchInitialTransactions();
  }, [dateRange, fetchInitialTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMoreTransactions,
    refetchTransactions: fetchInitialTransactions
  };
}
