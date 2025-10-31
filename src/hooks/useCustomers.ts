
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getCustomers } from "@/lib/firestoreService";

const API_BASE_URL = "/api/customers";
const CACHE_KEY = "customersCache";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCustomers = await getCustomers();
      const sortedCustomers = fetchedCustomers.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(sortedCustomers);
      setError(null);
      // Cache the fresh data
      localStorage.setItem(CACHE_KEY, JSON.stringify(sortedCustomers));
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

  useEffect(() => {
    const loadData = async () => {
      // 1. Try to load from cache first
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setCustomers(JSON.parse(cachedData));
          setIsLoading(false); // We have data to show, so we are not "loading"
        }
      } catch (e) {
        console.warn("Could not read customers from cache", e);
      }
      
      // 2. Fetch fresh data from Firestore
      await refetchCustomers();
    };

    loadData();
  }, [refetchCustomers]);

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
      await refetchCustomers(); // Refetch after adding
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
      await refetchCustomers(); // Refetch after updating
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
        throw new Error(errorData.message || `Failed to delete customer. Server responded with status ${response.status}.`);
      }
      await refetchCustomers(); // Refetch after deleting
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
    refetchCustomers,
  };
}
