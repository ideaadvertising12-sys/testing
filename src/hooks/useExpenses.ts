
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/expenses";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      const processedData = data.map((e: any) => ({
        ...e,
        expenseDate: new Date(e.expenseDate),
      }));
      setExpenses(processedData);
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: "Could not load expenses." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

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
      await fetchExpenses(); // Refetch to update the list
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
        await fetchExpenses();
        toast({ title: "Success", description: "Expense deleted." });
        return true;
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
        return false;
    }
  };

  return { expenses, isLoading, error, addExpense, deleteExpense, refetchExpenses: fetchExpenses };
}
