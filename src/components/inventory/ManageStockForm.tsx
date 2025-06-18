
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { placeholderProducts as initialProducts, placeholderVehicles } from "@/lib/placeholder-data";
import type { Product, StockTransactionType, Vehicle } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function ManageStockForm() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [vehicles, setVehicles] = useState<Vehicle[]>(placeholderVehicles);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [skuInput, setSkuInput] = useState<string>("");
  const [transactionType, setTransactionType] = useState<StockTransactionType>("ADD_STOCK_INVENTORY");
  const [quantity, setQuantity] = useState<number | string>("");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(""); // Changed from vehicleId to selectedVehicleId for clarity
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedProductId || !transactionType || quantity === "" || Number(quantity) <= 0 || !transactionDate) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields, ensure quantity is positive, and a product is selected.",
        });
        return;
      }
      
      if ((transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && !selectedVehicleId.trim()) {
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
        if (newStock < numQuantity && transactionType !== "STOCK_ADJUSTMENT_MANUAL") {
          toast({ 
            variant: "destructive", 
            title: "Stock Error", 
            description: `Not enough stock for ${currentProduct.name} to perform ${transactionType}. Available: ${currentProduct.stock}` 
          });
          return;
        }
        newStock -= numQuantity;
      }
      newStock = Math.max(0, newStock);

      const transactionData = {
        productId: selectedProductId,
        productName: currentProduct?.name,
        sku: currentProduct?.sku,
        type: transactionType,
        quantity: numQuantity,
        transactionDate: new Date(transactionDate),
        notes,
        vehicleId: (transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") ? selectedVehicleId : undefined,
        previousStock: currentProduct.stock,
        newStock: newStock,
      };

      console.log("Stock Transaction Submitted:", transactionData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

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
      setQuantity("");
      setNotes("");
      setSelectedVehicleId(""); // Reset selected vehicle ID
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const transactionTypes: { value: StockTransactionType; label: string }[] = [
    { value: "ADD_STOCK_INVENTORY", label: "Add Stock" },
    { value: "LOAD_TO_VEHICLE", label: "Load to Vehicle" },
    { value: "UNLOAD_FROM_VEHICLE", label: "Unload from Vehicle" },
    { value: "REMOVE_STOCK_WASTAGE", label: "Remove (Wastage)" },
    { value: "STOCK_ADJUSTMENT_MANUAL", label: "Manual Adjustment" },
  ];

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Inventory Management</CardTitle>
            <CardDescription className="mt-1">Record stock movements and adjustments</CardDescription>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select value={transactionType} onValueChange={(value) => setTransactionType(value as StockTransactionType)}>
                <SelectTrigger id="transactionType" className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Date & Time</Label>
              <Input 
                id="transactionDate" 
                type="datetime-local" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="h-11" 
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="skuInput">Quick SKU Search</Label>
                <span className="text-xs text-muted-foreground">Scan or type</span>
              </div>
              <Input 
                id="skuInput" 
                value={skuInput} 
                onChange={handleSkuInputChange} 
                className="h-11"
                placeholder="Enter SKU"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productId">Select Product</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelectChange}>
                <SelectTrigger id="productId" className="h-11">
                  <SelectValue placeholder="Choose product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id} className="text-sm">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{product.name}</span>
                        <span className="ml-2 text-muted-foreground">{product.stock} in stock</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedProduct && (
            <Alert className="bg-muted/50 border-l-4 border-primary">
              <Info className="h-4 w-4" />
              <AlertTitle className="font-medium">{selectedProduct.name}</AlertTitle>
              <AlertDescription className="mt-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Current Stock</span>
                    <p className="font-semibold">{selectedProduct.stock}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">SKU</span>
                    <p className="font-semibold">{selectedProduct.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Category</span>
                    <p className="font-semibold">{selectedProduct.category || 'N/A'}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                className="h-11" 
                min="1"
                placeholder="Enter amount"
                required
              />
            </div>

            {(transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && (
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Select Vehicle</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger id="vehicleId" className="h-11">
                    <SelectValue placeholder="Choose vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length > 0 ? (
                      vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id} className="text-sm">
                          {vehicle.vehicleNumber} {vehicle.driverName ? `(${vehicle.driverName})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No vehicles available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="min-h-[100px]" 
              placeholder="Additional information..."
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => {
                setSelectedProductId("");
                setSkuInput("");
                setQuantity("");
                setNotes("");
                setSelectedVehicleId("");
              }}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedProductId || quantity === "" || Number(quantity) <= 0 || isSubmitting || ((transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && !selectedVehicleId)}
              className="min-w-[180px]"
            >
              {isSubmitting ? "Processing..." : "Record Transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
