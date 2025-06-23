
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Package, Hash, Loader2, Users, ChevronsUpDown, Check, ArrowRight, Undo2, XCircle, PlusCircle, MinusCircle, Trash2 } from "lucide-react";
import type { Customer, Sale, CartItem, Product } from "@/lib/types";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ReturnItem extends CartItem {
  returnQuantity: number;
  isResellable: boolean;
}

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export function ReturnManagement() {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { sales, isLoading: isLoadingSales } = useSalesData(true);
  const { products: allProducts, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts();
  const { toast } = useToast();

  // Search State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [isSearchingSale, setIsSearchingSale] = useState(false);

  // Return Processing State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [itemsToReturn, setItemsToReturn] = useState<ReturnItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Exchange State
  const [exchangeItems, setExchangeItems] = useState<CartItem[]>([]);
  const [openProductPopover, setOpenProductPopover] = useState(false);

  const customerOptions = useMemo(() => {
    if (!customers) return [];
    return customers.map(customer => ({
      value: customer.id,
      label: `${customer.name} (${customer.shopName || customer.phone})`,
      customerObject: customer
    }));
  }, [customers]);

  useEffect(() => {
    if (selectedCustomer && sales.length > 0) {
      const filteredSales = sales
        .filter(sale => sale.customerId === selectedCustomer.id)
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
      setCustomerSales(filteredSales);
    } else {
      setCustomerSales([]);
    }
    setSelectedSaleId("");
  }, [selectedCustomer, sales]);
  
  const handleSearchSale = () => {
    if (!selectedSaleId) return;
    setIsSearchingSale(true);
    const sale = customerSales.find(s => s.id === selectedSaleId);
    if (sale) {
        setSelectedSale(sale);
        const returnableItems = sale.items
            .filter(item => !item.isOfferItem)
            .map(item => ({...item, returnQuantity: 0, isResellable: true}));
        setItemsToReturn(returnableItems);
    } else {
        toast({ variant: "destructive", title: "Sale not found" });
        setSelectedSale(null);
        setItemsToReturn([]);
    }
    setTimeout(() => setIsSearchingSale(false), 500);
  };
  
  const handleReturnQuantityChange = (productId: string, saleType: 'retail' | 'wholesale', newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr) || 0;
    setItemsToReturn(prev => 
        prev.map(item => {
            if (item.id === productId && item.saleType === saleType) {
                const originalQuantity = selectedSale?.items.find(i => i.id === productId && i.saleType === item.saleType)?.quantity || 0;
                const validQuantity = Math.max(0, Math.min(newQuantity, originalQuantity));
                return {...item, returnQuantity: validQuantity};
            }
            return item;
        })
    );
  };
  
  const handleResellableChange = useCallback((productId: string, saleType: 'retail' | 'wholesale', isResellable: boolean) => {
    setItemsToReturn(prev => 
        prev.map(item =>
            (item.id === productId && item.saleType === saleType) ? { ...item, isResellable } : item
        )
    );
  }, []);

  const returnTotalValue = useMemo(() => {
    return itemsToReturn.reduce((total, item) => {
        return total + (item.appliedPrice * item.returnQuantity);
    }, 0);
  }, [itemsToReturn]);

  const resetSearch = () => {
    setSelectedCustomer(null);
    setCustomerSales([]);
    setSelectedSaleId("");
    setSelectedSale(null);
    setItemsToReturn([]);
    setExchangeItems([]);
  };

  // --- Exchange Logic ---
  const handleAddToExchange = (product: Product) => {
      setExchangeItems(prev => {
          const existingItem = prev.find(item => item.id === product.id);
          if (existingItem) {
              return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
          }
          return [...prev, {
              ...product,
              quantity: 1,
              appliedPrice: product.price, // Defaulting to retail for exchanges
              saleType: 'retail',
              isOfferItem: false,
          }];
      });
      setOpenProductPopover(false);
  }

  const handleUpdateExchangeQuantity = (productId: string, newQuantity: number) => {
      if (newQuantity < 1) {
          handleRemoveFromExchange(productId);
          return;
      }
      setExchangeItems(prev => prev.map(item => item.id === productId ? {...item, quantity: newQuantity} : item));
  }

  const handleRemoveFromExchange = (productId: string) => {
      setExchangeItems(prev => prev.filter(item => item.id !== productId));
  }

  const exchangeTotalValue = useMemo(() => {
      return exchangeItems.reduce((total, item) => total + item.appliedPrice * item.quantity, 0);
  }, [exchangeItems]);

  const difference = exchangeTotalValue - returnTotalValue;
  
  const handleProcessExchange = async () => {
    const activeReturnedItems = itemsToReturn.filter(item => item.returnQuantity > 0);
    if (activeReturnedItems.length === 0 && exchangeItems.length === 0) {
        toast({ variant: "destructive", title: "Nothing to Process", description: "Please specify items to return or exchange." });
        return;
    }

    setIsProcessing(true);
    try {
        const payload = {
            returnedItems: activeReturnedItems.map(item => ({ 
                id: item.id, 
                quantity: item.returnQuantity,
                isResellable: item.isResellable
            })),
            exchangedItems: exchangeItems.map(item => ({ id: item.id, quantity: item.quantity })),
        };

        const response = await fetch('/api/returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.details || result.error || 'Failed to process the exchange.');
        }

        toast({
            title: "Exchange Successful",
            description: "Stock levels have been updated accordingly.",
        });

        await refetchProducts(); // Refetch products to get updated stock
        resetSearch(); // Reset the form

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Exchange Failed",
            description: error.message,
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isLoadingCustomers || isLoadingSales || isLoadingProducts;
  const currentCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name} (${selectedCustomer.shopName || selectedCustomer.phone})`
    : "Select a customer...";

  const availableProductsForExchange = allProducts.filter(
    p => !exchangeItems.some(item => item.id === p.id)
  );

  const renderInitialSearchView = () => (
    <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Process a Return</CardTitle>
          <CardDescription>Start by finding the customer and original sale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer-search">Customer *</Label>
             <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openCustomerPopover} className="w-full justify-between" disabled={isLoading}>
                  <span className="truncate">{isLoading ? "Loading..." : currentCustomerLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command filter={(value, search) => customerOptions.find(opt => opt.value === value)?.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                  <CommandInput placeholder="Search by name, shop, or phone..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                       {customerOptions.map((option) => (
                        <CommandItem key={option.value} value={option.value} onSelect={() => { setSelectedCustomer(option.customerObject); setOpenCustomerPopover(false); }}>
                           <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === option.value ? "opacity-100" : "opacity-0")} />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleId">Original Sale ID *</Label>
            <div className="flex gap-2">
               <Select value={selectedSaleId} onValueChange={setSelectedSaleId} disabled={!selectedCustomer || customerSales.length === 0}>
                <SelectTrigger id="saleId"><SelectValue placeholder={!selectedCustomer ? "Select customer first" : "Select a sale..."} /></SelectTrigger>
                <SelectContent>
                  {customerSales.map(sale => (<SelectItem key={sale.id} value={sale.id}>{sale.id} ({format(new Date(sale.saleDate), "PP")})</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearchSale} disabled={!selectedSaleId || isSearchingSale}>
                {isSearchingSale ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {selectedCustomer && customerSales.length === 0 && !isLoadingSales && (
              <p className="text-xs text-muted-foreground mt-1">No recent sales found for this customer.</p>
            )}
          </div>
        </CardContent>
    </Card>
  );

  const renderReturnProcessingView = () => (
    <>
        <Card className="lg:col-span-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Return Details</CardTitle>
                        <CardDescription>Specify what is being returned.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetSearch}><XCircle className="h-4 w-4"/></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="text-sm space-y-1">
                    <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                    <p><strong>Original Sale ID:</strong> <span className="font-mono text-xs">{selectedSale?.id}</span></p>
                    <p><strong>Sale Date:</strong> {selectedSale ? format(new Date(selectedSale.saleDate), 'PPp') : ''}</p>
                 </div>
                 <Separator/>
                <div className="space-y-2">
                    <Label>Items to Return</Label>
                    <ScrollArea className="h-60 rounded-md border p-2">
                        {itemsToReturn.map(item => (
                            <div key={`${item.id}-${item.saleType}`} className="flex flex-col gap-2 text-sm p-2 bg-background rounded-md mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Purchased: {item.quantity} @ {formatCurrency(item.appliedPrice)}</p>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-20 h-8 text-center" 
                                        value={item.returnQuantity}
                                        onChange={e => handleReturnQuantityChange(item.id, item.saleType, e.target.value)}
                                        min={0}
                                        max={item.quantity}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pl-1">
                                    <Checkbox
                                        id={`resellable-${item.id}-${item.saleType}`}
                                        checked={item.isResellable}
                                        onCheckedChange={(checked) => handleResellableChange(item.id, item.saleType, !!checked)}
                                    />
                                    <Label htmlFor={`resellable-${item.id}-${item.saleType}`} className="text-xs font-normal">
                                        Return to stock (Resellable)
                                    </Label>
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                 <div className="pt-2 border-t text-right">
                    <p className="text-sm text-muted-foreground">Total Return Value</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(returnTotalValue)}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                 <CardTitle>Select Exchange Items</CardTitle>
                 <CardDescription>Choose the new products the customer will receive.</CardDescription>
            </CardHeader>
            <CardContent>
                <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start mb-4">
                           <PlusCircle className="mr-2 h-4 w-4" /> Add product to exchange...
                        </Button>
                    </PopoverTrigger>
                     <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                           <CommandInput placeholder="Search products..." />
                           <CommandList>
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                                {availableProductsForExchange.map(product => (
                                    <CommandItem key={product.id} onSelect={() => handleAddToExchange(product)}>
                                        {product.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                           </CommandList>
                        </Command>
                     </PopoverContent>
                </Popover>

                <ScrollArea className="h-[220px] rounded-md border">
                    {exchangeItems.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No exchange items added yet.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                           {exchangeItems.map(item => (
                                <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatCurrency(item.appliedPrice)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateExchangeQuantity(item.id, item.quantity - 1)}>
                                            <MinusCircle className="h-4 w-4"/>
                                        </Button>
                                        <span>{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateExchangeQuantity(item.id, item.quantity + 1)}>
                                            <PlusCircle className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveFromExchange(item.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <p className="w-20 text-right font-medium text-sm">{formatCurrency(item.quantity * item.appliedPrice)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                
                <Separator className="my-4"/>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Return Value:</span>
                        <span className="font-medium">{formatCurrency(returnTotalValue)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">New Items Total:</span>
                        <span className="font-medium">{formatCurrency(exchangeTotalValue)}</span>
                    </div>
                    <Separator/>
                    <div className={cn(
                        "flex justify-between items-center font-bold text-lg",
                        difference >= 0 ? "text-destructive" : "text-green-600"
                    )}>
                        <span>{difference >= 0 ? 'Amount to Pay:' : 'Credit Due:'}</span>
                        <span>{formatCurrency(Math.abs(difference))}</span>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                     <Button 
                        onClick={handleProcessExchange} 
                        disabled={isProcessing || (itemsToReturn.every(i => i.returnQuantity === 0) && exchangeItems.length === 0)}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Process Exchange'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </>
  );
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        { selectedSale ? renderReturnProcessingView() : renderInitialSearchView() }
    </div>
  );
}
