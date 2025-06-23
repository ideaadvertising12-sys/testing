
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, Hash, Loader2 } from "lucide-react";

type ReturnType = "exchange" | "refund" | "damaged" | "resellable" | "credit_note";

export function ReturnManagement() {
  const [returnType, setReturnType] = useState<ReturnType>("refund");
  const [saleId, setSaleId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const returnTypeOptions = [
    { value: "exchange", label: "Exchange Return", description: "Return a product and receive a different product of equal or similar value." },
    { value: "refund", label: "Refund Return (Full or Partial)", description: "Return a product and receive full or part of the purchase amount back." },
    { value: "damaged", label: "Damaged Return", description: "Products returned because they’re damaged or expired, not restocked." },
    { value: "resellable", label: "Resellable Return", description: "Returned item is still in good condition and can be sold again." },
    { value: "credit_note", label: "Credit Note Return", description: "Return processed by issuing store credit instead of cash." },
  ];

  const handleSearchSale = () => {
    if (!saleId) return;
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
        setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Process a Return</CardTitle>
          <CardDescription>Start by finding the original sale invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="saleId">Original Sale ID *</Label>
            <div className="flex gap-2">
              <Input
                id="saleId"
                placeholder="e.g., sale-0623-1"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
              />
              <Button onClick={handleSearchSale} disabled={!saleId || isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
              </Button>
            </div>
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
                <p className="text-sm">Enter a Sale ID and click Search.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
