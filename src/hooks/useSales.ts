"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Sale } from '@/lib/types';

export interface UseSalesReturn {
  sales: Sale[] | null;
  isLoading: boolean;
  error: Error | null;
  addSale: (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'createdAt' | 'items'> & { items: Omit<import('@/lib/types').CartItem, 'createdAt' | 'updatedAt'>[], saleDate: string | Date }) => Promise<Sale | null>;
  refetchSales: () => void;
}

export function useSales(): UseSalesReturn {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Ensure /api/sales endpoint exists and is functional
      const response = await fetch('/api/sales'); 
      if (!response.ok) {
        let errorMsg = `Failed to fetch sales: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
        } catch (e) { /* Ignore if response is not JSON */ }
        throw new Error(errorMsg);
      }
      const data: Sale[] = await response.json();
      setSales(data.map(sale => ({...sale, saleDate: new Date(sale.saleDate)}))); // Ensure saleDate is Date object
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching sales'));
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales, refreshKey]);

  const refetchSales = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const addSale = async (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'createdAt' | 'items'> & { items: Omit<import('@/lib/types').CartItem, 'createdAt' | 'updatedAt'>[], saleDate: string | Date }): Promise<Sale | null> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...saleData,
            saleDate: saleData.saleDate instanceof Date ? saleData.saleDate.toISOString() : saleData.saleDate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add sale: ${response.statusText}`);
      }
      const newSale: Sale = await response.json();
      refetchSales();
      return {...newSale, saleDate: new Date(newSale.saleDate)}; // Ensure saleDate is Date object
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while adding sale'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sales, isLoading, error, addSale, refetchSales };
}
