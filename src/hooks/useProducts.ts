

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { getProducts } from "@/lib/firestoreService";

const API_BASE_URL = "/api/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching products.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Products",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refetch();
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
      await refetch();
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been successfully added.`,
      });
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
      await refetch();
      toast({
        title: "Product Updated",
        description: `${productData.name || 'Product'} has been successfully updated.`,
      });
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
      await refetch();
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
      return true;
    } catch (err: any