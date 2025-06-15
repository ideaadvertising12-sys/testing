
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { placeholderProducts } from "@/lib/placeholder-data";
import type { Product, StockTransactionType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function ManageStockForm() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [transactionType, setTransactionType] = useState<StockTransactionType>("ADD_STOCK_INVENTORY");
  const [quantity, setQuantity] = useState<number | string>("");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  // const [vehicleId, setVehicleId] = useState<string>(""); // For future use

  const { toast } = useToast();

  useEffect(() => {
    // Set default transaction date to current date and time
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    setTransactionDate(localDate.toISOString().slice(0, 16));
  }, []);

  const selectedProduct = placeholderProducts.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId || !transactionType || quantity === "" || Number(quantity) <= 0 || !transactionDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields and ensure quantity is positive.",
      });
      return;
    }

    const transactionData = {
      productId: selectedProductId,
      productName: selectedProduct?.name,
      type: transactionType,
      quantity: Number(quantity),
      transactionDate: new Date(transactionDate),
      notes,
      // vehicleId: transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE" ? vehicleId : undefined,
    };

    console.log("Stock Transaction Submitted:", transactionData);
    // In a real app, you would send this data to a backend and update stock levels.
    // For now, we just log it and show a success toast.

    // Example: Update placeholderProducts (this is client-side only and won't persist)
    // const productIndex = placeholderProducts.findIndex(p => p.id === selectedProductId);
    // if (productIndex !== -1) {
    //   let newStock = placeholderProducts[productIndex].stock;
    //   if (transactionType === "ADD_STOCK_INVENTORY" || transactionType === "UNLOAD_FROM_VEHICLE") {
    //     newStock += Number(quantity);
    //   } else if (transactionType === "LOAD_TO_VEHICLE" || transactionType === "REMOVE_STOCK_WASTAGE" || transactionType === "STOCK_ADJUSTMENT_MANUAL") {
    //     newStock -= Number(quantity);
    //   }
    //   placeholderProducts[productIndex].stock = Math.max(0, newStock); // Ensure stock doesn't go negative
    // }


    toast({
      title: "Transaction Logged",
      description: `${transactionType} of ${quantity} ${selectedProduct?.name || 'product'} recorded.`,
    });

    // Reset form (optional)
    // setSelectedProductId("");
    // setTransactionType("ADD_STOCK_INVENTORY");
    // setQuantity("");
    // setNotes("");
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
              <Label htmlFor="productId">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="productId" className="mt-1">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {placeholderProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Current Stock: {product.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedProduct.name}, SKU: {selectedProduct.sku || 'N/A'}, Current Stock: {selectedProduct.stock}
                </p>
              )}
            </div>

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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                className="mt-1" 
                min="1"
                placeholder="Enter quantity"
                required
              />
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

          {/* 
          {(transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && (
            <div>
              <Label htmlFor="vehicleId">Vehicle ID/Number (Optional)</Label>
              <Input 
                id="vehicleId" 
                value={vehicleId} 
                onChange={(e) => setVehicleId(e.target.value)} 
                className="mt-1"
                placeholder="e.g., Lorry A, Van 123" 
              />
            </div>
          )}
          */}

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
