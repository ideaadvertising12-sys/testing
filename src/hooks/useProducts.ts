

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { subscribeToProducts } from "@/lib/firestoreService";

const API_BASE_URL = "/api/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetch = useCallback(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToProducts(
      (newProducts) => {
        setProducts(newProducts);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err.message || "An unknown error occurred while fetching products.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Fetching Products",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = refetch();
    return () => unsubscribe();
  }, [refetch]);

  const addProduct = async (productData: Omit<Product, "id">): Promise<Product | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add product"}));
        throw new Error(errorData.message || "Failed to add product. Server responded with an error.");
      }
      const newProduct = await response.json();
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been successfully added.`,
      });
      // The listener will handle the state update.
      return newProduct;
    } catch (err: any) {
      console.error("Error adding product:", err);
      const errorMessage = err.message || "An unknown error occurred while adding the product.";
      toast({
        variant: "destructive",
        title: "Failed to Add Product",
        description: errorMessage,
      });
      return null;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Omit<Product, "id">>): Promise<Product | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update product"}));
        throw new Error(errorData.message || `Failed to update product. Server responded with status ${response.status}.`);
      }
      toast({
        title: "Product Updated",
        description: `${productData.name || 'Product'} has been successfully updated.`,
      });
      // The listener will handle the state update.
      const updatedProduct = products.find(p => p.id === id); // optimistic find
      return updatedProduct ? { ...updatedProduct, ...productData } : null;
    } catch (err: any) {
      console.error("Error updating product:", err);
      const errorMessage = err.message || "An unknown error occurred while updating the product.";
      toast({
        variant: "destructive",
        title: "Failed to Update Product",
        description: errorMessage,
      });
      return null;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete product"}));
        throw new Error(errorData.message || `Failed to delete product. Server responded with status ${response.status}.`);
      }
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
      // The listener will handle the state update.
      return true;
    } catch (err: any) {
      console.error("Error deleting product:", err);
      const errorMessage = err.message || "An unknown error occurred while deleting the product.";
      toast({
        variant: "destructive",
        title: "Failed to Delete Product",
        description: errorMessage,
      });
      return false;
    }
  };


  return {
    products,
    isLoading,
    error,
    refetch,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
