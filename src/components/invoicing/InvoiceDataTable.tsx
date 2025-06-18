
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterX, Search, ReceiptText } from "lucide-react";
import { format, isValid, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InvoiceDataTableProps {
  initialSales: Sale[];
}

export function InvoiceDataTable({ initialSales }: InvoiceDataTableProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    setSales(initialSales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime()));
  }, [initialSales]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDateObj = typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate;
      
      const matchesSearchTerm = 
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (isValid(saleDateObj)) {
          if (startDate && endDate) {
            matchesDateRange = isWithinInterval(saleDateObj, { start: startOfDay(startDate), end: endOfDay(endDate) });
          } else if (startDate) {
            matchesDateRange = saleDateObj >= startOfDay(startDate);
          } else if (endDate) {
            matchesDateRange = saleDateObj <= endOfDay(endDate);
          }
      } else {
        // If saleDateObj is not valid, don't filter out unless other criteria fail
      }
      
      return matchesSearchTerm && matchesDateRange;
    });
  }, [sales, searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Invoice History</CardTitle>
        <CardDescription>Browse through all recorded sales transactions.</CardDescription>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ID, Customer, Payment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-left font-normal w-full sm:w-[180px]", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Start Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 justify-start text-left font-normal w-full sm:w-[180px]", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>End Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false}/>
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="ghost" onClick={clearFilters} size="icon" className="h-10 w-10" title="Clear Filters">
            <FilterX className="h-5 w-5"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-24rem)]"> {/* Adjust height as needed */}
          {filteredSales.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <ReceiptText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No invoices found</p>
                {(searchTerm || startDate || endDate) && <p className="text-sm">Try adjusting your search or date filters</p>}
            </div>
          ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Paid/Given</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                  <TableCell>{format(typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate, "PPp")}</TableCell>
                  <TableCell>{sale.customerName || "Walk-in"}</TableCell>
                  <TableCell className="text-right font-medium">Rs. {sale.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                        variant={
                            sale.paymentMethod === "Credit" ? "destructive" : 
                            sale.paymentMethod === "Card" ? "secondary" : "default"
                        }
                        className={
                            sale.paymentMethod === "Credit" ? "bg-orange-500 text-white" :
                            sale.paymentMethod === "Card" ? "bg-blue-500 text-white" : ""
                        }
                    >
                        {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.paymentMethod === "Cash" && sale.cashGiven !== undefined ? `Rs. ${sale.cashGiven.toFixed(2)}` : ""}
                    {sale.paymentMethod === "Credit" && sale.amountPaidOnCredit !== undefined ? `Rs. ${sale.amountPaidOnCredit.toFixed(2)}` : ""}
                    {sale.paymentMethod === "Card" ? "N/A" : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.paymentMethod === "Cash" && sale.balanceReturned !== undefined ? `Rs. ${sale.balanceReturned.toFixed(2)} (Ret)` : ""}
                    {sale.paymentMethod === "Credit" && sale.remainingCreditBalance !== undefined ? `Rs. ${sale.remainingCreditBalance.toFixed(2)} (Rem)` : ""}
                     {sale.paymentMethod === "Card" ? "N/A" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
