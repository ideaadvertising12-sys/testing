"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/types';

export interface UseProductsReturn {
  products: Product[] | null;
  isLoading: boolean;
  error: Error | null;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  refetchProducts: () => void;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching products'));
      setProducts([]); // Default to empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshKey]);

  const refetchProducts = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    setIsLoading(true); // Consider a more granular loading state for mutations
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add product: ${response.statusText}`);
      }
      const newProduct: Product = await response.json();
      refetchProducts();
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while adding product'));
      return null;
    } finally {
      setIsLoading(false); // Reset main loading state, or use granular
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update product: ${response.statusText}`);
      }
      // const updatedProduct: Product = await response.json(); // If API returns updated product
      refetchProducts();
      // To return the full updated product, you might need to fetch it again if API doesn't return it
      // For simplicity, returning null or a success indicator might be okay, relying on the refetch
      const updatedProductResponse = await fetch(`/api/products?id=${productId}`);
      if (!updatedProductResponse.ok) throw new Error('Failed to fetch updated product details after update.');
      return await updatedProductResponse.json();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while updating product'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete product: ${response.statusText}`);
      }
      refetchProducts();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred while deleting product'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { products, isLoading, error, addProduct, updateProduct, deleteProduct, refetchProducts };
}
