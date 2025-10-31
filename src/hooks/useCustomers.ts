
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getCustomers } from "@/lib/firestoreService";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const API_BASE_URL = "/api/customers";

export function useCustomers(fetchAll: boolean = true) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Customer> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchInitialCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const { customers: initialCustomers, lastVisible: newLastVisible } = await getCustomers();
      setCustomers(initialCustomers);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching customers.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Customers",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const loadMoreCustomers = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { customers: newCustomers, lastVisible: newLastVisible } = await getCustomers(lastVisible);
      setCustomers(prev => [...prev, ...newCustomers]);
      setLastVisible(newLastVisible);
      if (!newLastVisible) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching more customers.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast]);


  useEffect(() => {
    if (fetchAll) {
      fetchInitialCustomers();
    }
  }, [fetchAll, fetchInitialCustomers]);

  const addCustomer = async (customerData: Omit<Customer, "id" | "avatar">): Promise<Customer | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add customer" }));
        throw new Error(errorData.details || errorData.error || "Failed to add customer. Server responded with an error.");
      }
      const newCustomer = await response.json();
      await fetchInitialCustomers(); // Refetch after adding
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

  const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, "id">>): Promise<Customer | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: "Failed to update customer" }));
        throw new Error(errorData.details || errorData.error || `Failed to update customer. Server responded with status ${response.status}.`);
      }
      await fetchInitialCustomers(); // Refetch after updating
      const updatedCustomerState = customers.find(c => c.id === id);
      return updatedCustomerState ? { ...updatedCustomerState, ...customerData } as Customer : null;

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
        throw new Error(errorData.details || errorData.error || `Failed to delete customer. Server responded with status ${response.status}.`);
      }
      await fetchInitialCustomers(); // Refetch after deleting
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
    hasMore,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetchCustomers: fetchInitialCustomers,
    loadMoreCustomers,
  };
}
