"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/lib/types';

export interface UseCustomersReturn {
  customers: Customer[] | null;
  isLoading: boolean;
  error: Error | null;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer | null>;
  updateCustomer: (customerId: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt'>>) => Promise<Customer | null>;
  deleteCustomer: (customerId: string) => Promise<boolean>;
  refetchCustomers: () => void;
}

export function useCustomers(): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Ensure /api/customers endpoint exists and is functional
      const response = await fetch('/api/customers');
      if (!response.ok) {
        let errorMsg = `Failed to fetch customers: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if response is not JSON */ }
        throw new Error(errorMsg);
      }
      const data: Customer[] = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching customers'));
      setCustomers([]); // Default to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, refreshKey]);

  const refetchCustomers = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add customer: ${response.statusText}`);
      }
      const newCustomer: Customer = await response.json();
      refetchCustomers();
      return newCustomer;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while adding customer'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update customer: ${response.statusText}`);
      }
      refetchCustomers();
      const updatedCustomerResponse = await fetch(`/api/customers?id=${customerId}`);
      if (!updatedCustomerResponse.ok) throw new Error('Failed to fetch updated customer details after update.');
      return await updatedCustomerResponse.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while updating customer'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomer = async (customerId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete customer: ${response.statusText}`);
      }
      refetchCustomers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while deleting customer'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { customers, isLoading, error, addCustomer, updateCustomer, deleteCustomer, refetchCustomers };
}
