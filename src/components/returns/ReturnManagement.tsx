
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Package, Hash, Loader2, Users, ChevronsUpDown, Check } from "lucide-react";
import type { Customer, Sale } from "@/lib/types";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type ReturnType = "exchange" | "refund" | "damaged" | "resellable" | "credit_note";

export function ReturnManagement() {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { sales, isLoading: isLoadingSales } = useSalesData(true);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [returnType, setReturnType] = useState<ReturnType>("refund");
  const [isSearching, setIsSearching] = useState(false);
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);

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

  const returnTypeOptions = [
    { value: "exchange", label: "Exchange Return", description: "Return a product and receive a different product of equal or similar value." },
    { value: "refund", label: "Refund Return (Full or Partial)", description: "Return a product and receive full or part of the purchase amount back." },
    { value: "damaged", label: "Damaged Return", description: "Products returned because they’re damaged or expired, not restocked." },
    { value: "resellable", label: "Resellable Return", description: "Returned item is still in good condition and can be sold again." },
    { value: "credit_note", label: "Credit Note Return", description: "Return processed by issuing store credit instead of cash." },
  ];

  const handleSearchSale = () => {
    if (!selectedSaleId) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };
  
  const currentCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name} (${selectedCustomer.shopName || selectedCustomer.phone})`
    : "Select a customer...";

  const isLoading = isLoadingCustomers || isLoadingSales;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Process a Return</CardTitle>
          <CardDescription>Start by finding the customer and original sale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="customer-search">Customer *</Label>
             <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomerPopover}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  <span className="truncate">
                    {isLoading ? "Loading..." : currentCustomerLabel}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command
                   filter={(value, search) => {
                      const option = customerOptions.find(opt => opt.value === value);
                      if (!option?.label) return 0;
                      return option.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                   }}
                >
                  <CommandInput placeholder="Search by name, shop, or phone..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                       {customerOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label} // Use label for filtering
                          onSelect={() => {
                            setSelectedCustomer(option.customerObject);
                            setOpenCustomerPopover(false);
                          }}
                        >
                           <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomer?.id === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
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
               <Select 
                value={selectedSaleId} 
                onValueChange={setSelectedSaleId}
                disabled={!selectedCustomer || customerSales.length === 0}
               >
                <SelectTrigger id="saleId">
                  <SelectValue placeholder={!selectedCustomer ? "Select customer first" : "Select a sale..."} />
                </SelectTrigger>
                <SelectContent>
                  {customerSales.map(sale => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.id} ({format(new Date(sale.saleDate), "PP")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearchSale} disabled={!selectedSaleId || isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
              </Button>
            </div>
             {selectedCustomer && customerSales.length === 0 && !isLoadingSales && (
              <p className="text-xs text-muted-foreground mt-1">No recent sales found for this customer.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="returnType">Return Method *</Label>
            <Select value={returnType} onValueChange={(value) => setReturnType(value as ReturnType)}>
              <SelectTrigger id="returnType">
                <SelectValue placeholder="Select a return method" />
              </SelectTrigger>
              <SelectContent>
                {returnTypeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
                {returnTypeOptions.find(opt => opt.value === returnType)?.description}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle>Return Details</CardTitle>
            <CardDescription>Items from the selected invoice will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <Hash className="h-10 w-10 mb-4" />
                <p className="font-medium">Find an invoice to begin</p>
                <p className="text-sm">Select a customer and sale, then click Search.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
