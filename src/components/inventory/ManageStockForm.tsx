
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { placeholderProducts as initialProducts } from "@/lib/placeholder-data";
import type { Product, StockTransactionType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function ManageStockForm() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [skuInput, setSkuInput] = useState<string>("");
  const [transactionType, setTransactionType] = useState<StockTransactionType>("ADD_STOCK_INVENTORY");
  const [quantity, setQuantity] = useState<number | string>("");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");

  const { toast } = useToast();

  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60000));
    setTransactionDate(localDate.toISOString().slice(0, 16));
  }, []);

  const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

  const handleSkuInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSku = e.target.value;
    setSkuInput(newSku);
    const productBySku = products.find(p => p.sku?.toLowerCase() === newSku.toLowerCase());
    if (productBySku) {
      setSelectedProductId(productBySku.id);
    } else {
      setSelectedProductId("");
    }
  };

  const handleProductSelectChange = (productId: string) => {
    setSelectedProductId(productId);
    const productById = products.find(p => p.id === productId);
    if (productById) {
      setSkuInput(productById.sku || "");
    } else {
      setSkuInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId || !transactionType || quantity === "" || Number(quantity) <= 0 || !transactionDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields, ensure quantity is positive, and a product is selected.",
      });
      return;
    }
    if ((transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && !vehicleId.trim()) {
       toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Vehicle ID is required for vehicle load/unload transactions.",
      });
      return;
    }


    const currentProduct = products.find(p => p.id === selectedProductId);
    if (!currentProduct) {
       toast({ variant: "destructive", title: "Error", description: "Selected product not found." });
       return;
    }
    
    let newStock = currentProduct.stock;
    const numQuantity = Number(quantity);

    if (transactionType === "ADD_STOCK_INVENTORY" || transactionType === "UNLOAD_FROM_VEHICLE") {
      newStock += numQuantity;
    } else if (transactionType === "LOAD_TO_VEHICLE" || transactionType === "REMOVE_STOCK_WASTAGE" || transactionType === "STOCK_ADJUSTMENT_MANUAL") {
      if (newStock < numQuantity && transactionType !== "STOCK_ADJUSTMENT_MANUAL" /*Allow adjustment to go negative conceptually if needed, but usually not*/) {
         toast({ variant: "destructive", title: "Stock Error", description: `Not enough stock for ${currentProduct.name} to perform ${transactionType}. Available: ${currentProduct.stock}` });
         return;
      }
      newStock -= numQuantity;
    }
    newStock = Math.max(0, newStock); // Ensure stock doesn't go negative unless it's a manual adjustment that explicitly allows it.

    const transactionData = {
      productId: selectedProductId,
      productName: currentProduct?.name,
      sku: currentProduct?.sku,
      type: transactionType,
      quantity: numQuantity,
      transactionDate: new Date(transactionDate),
      notes,
      vehicleId: (transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") ? vehicleId : undefined,
      previousStock: currentProduct.stock,
      newStock: newStock,
    };

    console.log("Stock Transaction Submitted:", transactionData);

    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === selectedProductId ? { ...p, stock: newStock } : p
      )
    );

    toast({
      title: "Transaction Logged",
      description: `${transactionType} of ${quantity} ${currentProduct?.name || 'product'} recorded. New stock: ${newStock}.`,
    });

    // Reset form
    setSelectedProductId("");
    setSkuInput("");
    // setTransactionType("ADD_STOCK_INVENTORY"); // Keep type or reset based on preference
    setQuantity("");
    setNotes("");
    setVehicleId("");
    // transactionDate can be left as is or reset to current time
  };
  
  const transactionTypes: { value: StockTransactionType; label: string }[] = [
    { value: "ADD_STOCK_INVENTORY", label: "Add Stock to Inventory" },
    { value: "LOAD_TO_VEHICLE", label: "Load to Vehicle" },
    { value: "UNLOAD_FROM_VEHICLE", label: "Unload from Vehicle (Return)" },
    { value: "REMOVE_STOCK_WASTAGE", label: "Remove Stock (Wastage/Spoilage)" },
    { value: "STOCK_ADJUSTMENT_MANUAL", label: "Manual Stock Adjustment" },
  ];


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">New Stock Transaction</CardTitle>
        <CardDescription>Record movements or adjustments to product inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select value={transactionType} onValueChange={(value) => setTransactionType(value as StockTransactionType)}>
                <SelectTrigger id="transactionType" className="mt-1">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionDate">Date and Time</Label>
              <Input 
                id="transactionDate" 
                type="datetime-local" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="mt-1" 
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="skuInput">SKU</Label>
              <Input 
                id="skuInput" 
                value={skuInput} 
                onChange={handleSkuInputChange} 
                className="mt-1"
                placeholder="Enter SKU to find product"
              />
            </div>
            <div>
              <Label htmlFor="productId">Product</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelectChange}>
                <SelectTrigger id="productId" className="mt-1">
                  <SelectValue placeholder="Select a product or enter SKU" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Stock: {product.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedProduct && (
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              <p>Selected: <span className="font-semibold">{selectedProduct.name}</span></p>
              <p>Current Stock: <span className="font-semibold">{selectedProduct.stock}</span></p>
              <p>SKU: <span className="font-semibold">{selectedProduct.sku || 'N/A'}</span></p>
            </div>
          )}

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input 
              id="quantity" 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
              className="mt-1" 
              min="1" // Or 0 for adjustments
              placeholder="Enter quantity"
              required
            />
          </div>

          {(transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && (
            <div>
              <Label htmlFor="vehicleId">Vehicle ID/Number</Label>
              <Input 
                id="vehicleId" 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                className="mt-1"
                placeholder="e.g., Lorry A, Van 123" 
                required={transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE"}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="mt-1" 
              rows={3}
              placeholder="e.g., Reason for adjustment, destination vehicle, etc."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedProductId || quantity === "" || Number(quantity) <= 0}>
              Record Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

