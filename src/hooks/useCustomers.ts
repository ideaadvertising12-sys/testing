

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToCustomers } from "@/lib/firestoreService";

const API_BASE_URL = "/api/customers";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToCustomers(
      (newCustomers) => {
        setCustomers(newCustomers.sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err.message || "An unknown error occurred while fetching customers.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Fetching Customers",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const addCustomer = async (customerData: Omit<Customer, "id" | "avatar">): Promise<Customer | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add customer" }));
        throw new Error(errorData.message || "Failed to add customer. Server responded with an error.");
      }
      const newCustomer = await response.json();
      // State will be updated by the real-time listener
      return newCustomer;
    } catch (err: any) {
      console.error("Error adding customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Add Customer",
        description: err.message,
      });
      return null;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, "id" | "avatar">>): Promise<Customer | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: "Failed to update customer" }));
        throw new Error(errorData.message || `Failed to update customer. Server responded with status ${response.status}.`);
      }
      // Optimistic update for UI responsiveness before listener catches up
      let updatedCustomerState: Customer | null = null;
      setCustomers((prev) => prev.map((c) => {
        if (c.id === id) {
          updatedCustomerState = { ...c, ...customerData };
          return updatedCustomerState;
        }
        return c;
      }));
      return updatedCustomerState;
    } catch (err: any) {
      console.error("Error updating customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Update Customer",
        description: err.message,
      });
      return null;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete customer" }));
        throw new Error(errorData.message || `Failed to delete customer. Server responded with status ${response.status}.`);
      }
      // State will be updated by the real-time listener
      return true;
    } catch (err: any) {
      console.error("Error deleting customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Delete Customer",
        description: err.message,
      });
      return false;
    }
  };

  return {
    customers,
    isLoading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
