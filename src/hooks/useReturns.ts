
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getReturns } from "@/lib/firestoreService";
import type { DateRange } from "react-day-picker";
import type { QueryDocumentSnapshot } from "firebase/firestore";

export function useReturns(fetchAll: boolean = false, dateRange?: DateRange) {
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
      const { returns: initialReturns, lastVisible: newLastVisible } = await getReturns(undefined, dateRange);
      setReturns(initialReturns);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
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
  }, [toast, dateRange]);
  
  const loadMoreReturns = useCallback(async () => {
    if (!lastVisible || !hasMore || isLoading) return;
    setIsLoading(true);
    try {
        const { returns: newReturns, lastVisible: newLastVisible } = await getReturns(lastVisible, dateRange);
        setReturns(prev => [...prev, ...newReturns]);
        setLastVisible(newLastVisible);
        if (!newLastVisible) {
            setHasMore(false);
        }
    } catch (err: any) {
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: "Could not load more returns." });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange]);


  useEffect(() => {
    // fetchAll is now just a trigger for the initial fetch on mount
    if (fetchAll) {
      fetchInitialReturns();
    }
  }, [fetchAll, fetchInitialReturns]);

  // Refetch when dateRange changes
  useEffect(() => {
    fetchInitialReturns();
  }, [dateRange, fetchInitialReturns]);


  return {
    returns,
    isLoading,
    error,
    hasMore,
    loadMoreReturns,
    refetchReturns: fetchInitialReturns,
  };
}
