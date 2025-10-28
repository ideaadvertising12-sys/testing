
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getExpenses } from "@/lib/firestoreService";
import type { DateRange } from "react-day-picker";

const API_BASE_URL = "/api/expenses";

export function useExpenses(fetchAll: boolean = true, dateRange?: DateRange, staffId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the service directly for consistency with other hooks
      const fetchedExpenses = await getExpenses(dateRange, staffId);
      setExpenses(fetchedExpenses);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: "Could not load expenses." });
    } finally {
      setIsLoading(false);
    }
  }, [toast, dateRange, staffId]);

  useEffect(() => {
    if(fetchAll) {
        refetchExpenses();
    }
  }, [fetchAll, refetchExpenses]);

  // Refetch when dependencies change
  useEffect(() => {
    refetchExpenses();
  }, [dateRange, staffId, refetchExpenses]);


  const addExpense = async (expenseData: Omit<Expense, "id">): Promise<Expense | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }
      const newExpense = await response.json();
      await refetchExpenses(); // Refetch after adding
      toast({ title: "Success", description: "Expense added successfully." });
      return newExpense;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      return null;
    }
  };
  
  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete expense");
        }
        await refetchExpenses(); // Refetch after deleting
        toast({ title: "Success", description: "Expense deleted." });
        return true;
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
        return false;
    }
  };

  return { expenses, isLoading, error, addExpense, deleteExpense, refetchExpenses };
}
