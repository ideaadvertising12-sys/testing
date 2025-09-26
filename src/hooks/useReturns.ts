
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getReturns } from "@/lib/firestoreService";

export function useReturns() {
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedReturns = await getReturns();
      setReturns(fetchedReturns); // The query in firestoreService already sorts by date
      setError(null);
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
  }, [toast]);

  useEffect(() => {
    refetchReturns();
  }, [refetchReturns]);

  return {
    returns,
    isLoading,
    error,
    refetchReturns,
  };
}
