
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getReturns } from "@/lib/firestoreService";
import type { DateRange } from "react-day-picker";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const PAGE_SIZE = 50;

export function useReturns(fetchAll: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<ReturnTransaction> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  const fetchInitialReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const { returns: initialReturns, lastVisible: newLastVisible } = await getReturns(undefined, dateRange, staffId);
      setReturns(initialReturns);
      setLastVisible(newLastVisible);
      if (!newLastVisible || initialReturns.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching returns.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Returns",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast, dateRange, staffId]);
  
  const loadMoreReturns = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { returns: newReturns, lastVisible: newLastVisible } = await getReturns(lastVisible, dateRange, staffId);
      setReturns(prev => [...prev, ...newReturns]);
      setLastVisible(newLastVisible);
      if (!newLastVisible || newReturns.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching more returns.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More Returns",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange, staffId]);

  useEffect(() => {
    if (fetchAll || dateRange || staffId) {
      fetchInitialReturns();
    }
  }, [fetchAll, dateRange, staffId, fetchInitialReturns]);


  return {
    returns,
    isLoading,
    error,
    hasMore,
    loadMoreReturns,
    refetchReturns: fetchInitialReturns,
  };
}
