
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getReturns } from "@/lib/firestoreService";
import type { DateRange } from "react-day-picker";
import type { QueryDocumentSnapshot } from "firebase/firestore";

export function useReturns(fetchAll: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const refetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // For now, we fetch all. Pagination can be re-added if needed.
      const { returns: fetchedReturns } = await getReturns(undefined, dateRange, staffId);
      setReturns(fetchedReturns);
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
  

  // This single effect handles both initial fetching and refetching on dependency change.
  useEffect(() => {
    if (fetchAll || dateRange || staffId) {
      refetchReturns();
    }
  }, [fetchAll, dateRange, staffId, refetchReturns]);


  return {
    returns,
    isLoading,
    error,
    hasMore: false, // Temporarily disabled
    loadMoreReturns: () => {}, // No-op
    refetchReturns,
  };
}
