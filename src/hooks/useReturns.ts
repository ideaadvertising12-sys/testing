
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToReturns } from "@/lib/firestoreService";

export function useReturns() {
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchReturns = useCallback(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToReturns(
      (newReturns) => {
        setReturns(newReturns); // The query in firestoreService already sorts by date
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err.message || "An unknown error occurred while fetching returns.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Fetching Returns",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = refetchReturns();
    return () => unsubscribe();
  }, [refetchReturns]);

  return {
    returns,
    isLoading,
    error,
    refetchReturns,
  };
}
