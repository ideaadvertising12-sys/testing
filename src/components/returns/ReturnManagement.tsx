
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Package, Hash, Loader2, Users, ChevronsUpDown, Check, ArrowRight, Undo2, XCircle } from "lucide-react";
import type { Customer, Sale, CartItem } from "@/lib/types";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type ReturnType = "exchange" | "refund" | "damaged" | "resellable" | "credit_note";

const returnTypeOptions = [
    { value: "exchange" as ReturnType, label: "Exchange Return", description: "Return a product and receive a different product of equal or similar value." },
    { value: "refund" as ReturnType, label: "Refund Return (Full or Partial)", description: "Return a product and receive full or part of the purchase amount back." },
    { value: "damaged" as ReturnType, label: "Damaged Return", description: "Products returned because they’re damaged or expired, not restocked." },
    { value: "resellable" as ReturnType, label: "Resellable Return", description: "Returned item is still in good condition and can be sold again." },
    { value: "credit_note" as ReturnType, label: "Credit Note Return", description: "Return processed by issuing store credit instead of cash." },
];

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

interface ReturnItem extends CartItem {
  returnQuantity: number;
}

export function ReturnManagement() {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { sales, isLoading: isLoadingSales } = useSalesData(true);
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
  const [returnType, setReturnType] = useState<ReturnType>("exchange");

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
            .map(item => ({...item, returnQuantity: 0}));
        setItemsToReturn(returnableItems);
    } else {
        toast({ variant: "destructive", title: "Sale not found" });
        setSelectedSale(null);
        setItemsToReturn([]);
    }
    setTimeout(() => setIsSearchingSale(false), 500);
  };
  
  const handleReturnQuantityChange = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr) || 0;
    setItemsToReturn(prev => 
        prev.map(item => {
            if (item.id === productId) {
                const originalQuantity = selectedSale?.items.find(i => i.id === productId && i.saleType === item.saleType)?.quantity || 0;
                const validQuantity = Math.max(0, Math.min(newQuantity, originalQuantity));
                return {...item, returnQuantity: validQuantity};
            }
            return item;
        })
    );
  };

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
  };

  const isLoading = isLoadingCustomers || isLoadingSales;
  const currentCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name} (${selectedCustomer.shopName || selectedCustomer.phone})`
    : "Select a customer...";

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
                    <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-2">
                        {itemsToReturn.map(item => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                                <div className="flex-1">
                                    <p className="font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">Purchased: {item.quantity} @ {formatCurrency(item.appliedPrice)}</p>
                                </div>
                                <Input 
                                    type="number" 
                                    className="w-20 h-8 text-center" 
                                    value={item.returnQuantity}
                                    onChange={e => handleReturnQuantityChange(item.id, e.target.value)}
                                    min={0}
                                    max={item.quantity}
                                />
                            </div>
                        ))}
                    </div>
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
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                    <Package className="h-10 w-10 mb-4" />
                    <p className="font-medium">Product Selection Area</p>
                    <p className="text-sm">This is where you'll choose the new items for the exchange.</p>
                </div>
                <div className="mt-4 flex justify-between items-center font-bold text-lg">
                    <span>New Items Total:</span>
                    <span>{formatCurrency(0)}</span>
                </div>
                 <div className="mt-2 flex justify-between items-center font-bold text-lg text-destructive">
                    <span>Difference to Pay:</span>
                    <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-end mt-4">
                    <Button disabled>
                        <ArrowRight className="mr-2 h-4 w-4"/>
                        Process Exchange
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
