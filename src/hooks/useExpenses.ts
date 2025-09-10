
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToExpenses } from "@/lib/firestoreService"; // Updated import

const API_BASE_URL = "/api/expenses";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchExpenses = useCallback(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToExpenses(
      (newExpenses) => {
        setExpenses(newExpenses);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: "Could not load expenses." });
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = refetchExpenses();
    return () => unsubscribe();
  }, [refetchExpenses]);

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
      // Listener will handle UI update
      const newExpense = await response.json();
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
        // Listener will handle UI update
        toast({ title: "Success", description: "Expense deleted." });
        return true;
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
        return false;
    }
  };

  return { expenses, isLoading, error, addExpense, deleteExpense, refetchExpenses };
}
