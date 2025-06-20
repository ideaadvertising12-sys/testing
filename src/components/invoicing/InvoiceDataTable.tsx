
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
import { CalendarIcon, FilterX, Search, ReceiptText, Printer, Eye, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react";
import { format, isValid, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { Sale } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BillDialog } from "@/components/sales/BillDialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface InvoiceDataTableProps {
  sales: Sale[];
  isLoading: boolean;
  error?: string | null;
}

export function InvoiceDataTable({ sales: initialSales, isLoading, error }: InvoiceDataTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [selectedInvoiceForReprint, setSelectedInvoiceForReprint] = useState<Sale | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [localSales, setLocalSales] = useState<Sale[]>(initialSales);

  // Update local sales when props change
  useEffect(() => {
    setLocalSales(initialSales);
  }, [initialSales]);

  // Sort sales by date (newest first)
  const sortedSales = useMemo(() => {
    return [...localSales].sort((a, b) => {
      const dateA = a.saleDate instanceof Date ? a.saleDate : new Date(a.saleDate || 0);
      const dateB = b.saleDate instanceof Date ? b.saleDate : new Date(b.saleDate || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [localSales]);

  const filteredSales = useMemo(() => {
    return sortedSales.filter(sale => {
      const saleDateObj = typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate;
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearchTerm = 
        (sale.id && sale.id.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.paymentMethod && sale.paymentMethod.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.chequeNumber && sale.chequeNumber.toLowerCase().includes(lowerSearchTerm));


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
        if (startDate || endDate) matchesDateRange = false;
      }
      
      return matchesSearchTerm && matchesDateRange;
    });
  }, [sortedSales, searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleReprintInvoice = (sale: Sale) => {
    setSelectedInvoiceForReprint(sale);
    setIsBillDialogOpen(true);
  };

  const toggleExpandInvoice = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs.');
  };

  // Auto-collapse expanded invoice when sales data changes
  useEffect(() => {
    setExpandedInvoice(null);
  }, [localSales]);

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Invoice History</CardTitle>
          <CardDescription>Browse through all recorded sales transactions</CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID, Customer, Payment, Cheque#..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            {!isMobile && (
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
                <Button variant="ghost" onClick={clearFilters} size="icon" className="h-10 w-10" title="Clear Filters">
                  <FilterX className="h-5 w-5"/>
                </Button>
              </div>
            )}
          </div>
          {isMobile && (
            <div className="mt-3 flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal flex-1", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal flex-1", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false}/>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" onClick={clearFilters} size="sm" className="h-9 px-3" title="Clear Filters">
                <FilterX className="h-4 w-4 mr-1"/>
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Error loading invoices</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : (
            <ScrollArea className={isMobile ? "h-[calc(100vh-24rem)]" : "h-[calc(100vh-24rem)]"}>
              {filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ReceiptText className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No invoices found</p>
                    {(searchTerm || startDate || endDate) && <p className="text-sm">Try adjusting your search or date filters</p>}
                </div>
              ) : isMobile ? (
                <div className="space-y-2">
                  {filteredSales.map((sale) => (
                    <Card key={sale.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{sale.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate, "PP")}
                          </p>
                          <p className="text-sm mt-1">{sale.customerName || "Walk-in"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(sale.totalAmount)}</p>
                          <Badge 
                            variant={
                                sale.paymentMethod === "Credit" ? "destructive" : 
                                sale.paymentMethod === "Cheque" ? "secondary" : "default"
                            }
                            className={cn(
                                "text-xs",
                                sale.paymentMethod === "Credit" && "bg-orange-500 text-white",
                                sale.paymentMethod === "Cheque" && "bg-blue-500 text-white"
                            )}
                          >
                            {sale.paymentMethod}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 justify-between text-primary hover:text-primary"
                        onClick={() => toggleExpandInvoice(sale.id)}
                      >
                        {expandedInvoice === sale.id ? "Hide details" : "Show details"}
                        {expandedInvoice === sale.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      
                      {expandedInvoice === sale.id && (
                        <div className="mt-3 space-y-1 text-xs border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid/Given:</span>
                            <span>
                              {sale.paymentMethod === "Cash" && sale.cashGiven !== undefined ? formatCurrency(sale.cashGiven) : ""}
                              {sale.paymentMethod === "Credit" && sale.amountPaidOnCredit !== undefined ? formatCurrency(sale.amountPaidOnCredit) : ""}
                              {sale.paymentMethod === "Cheque" ? `Cheque #: ${sale.chequeNumber || "N/A"}` : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Balance:</span>
                            <span>
                              {sale.paymentMethod === "Cash" && sale.balanceReturned !== undefined ? `${formatCurrency(sale.balanceReturned)} (Ret)` : ""}
                              {sale.paymentMethod === "Credit" && sale.remainingCreditBalance !== undefined ? `${formatCurrency(sale.remainingCreditBalance)} (Rem)` : ""}
                              {sale.paymentMethod === "Cheque" ? "N/A" : ""}
                            </span>
                          </div>
                           <p className="text-muted-foreground mt-1 pt-1 border-t">Items: {sale.items.length}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => handleReprintInvoice(sale)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Paid/Given/Cheque#</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-center w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                        <TableCell>{format(typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate, "PPp")}</TableCell>
                        <TableCell>{sale.customerName || "Walk-in"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge 
                              variant={
                                  sale.paymentMethod === "Credit" ? "destructive" : 
                                  sale.paymentMethod === "Cheque" ? "secondary" : "default"
                              }
                              className={cn(
                                  "text-xs",
                                  sale.paymentMethod === "Credit" && "bg-orange-500 text-white",
                                  sale.paymentMethod === "Cheque" && "bg-blue-500 text-white"
                              )}
                          >
                              {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.paymentMethod === "Cash" && sale.cashGiven !== undefined ? formatCurrency(sale.cashGiven) : ""}
                          {sale.paymentMethod === "Credit" && sale.amountPaidOnCredit !== undefined ? formatCurrency(sale.amountPaidOnCredit) : ""}
                          {sale.paymentMethod === "Cheque" ? `Chq: ${sale.chequeNumber || "N/A"}` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          {sale.paymentMethod === "Cash" && sale.balanceReturned !== undefined ? `${formatCurrency(sale.balanceReturned)} (Ret)` : ""}
                          {sale.paymentMethod === "Credit" && sale.remainingCreditBalance !== undefined ? `${formatCurrency(sale.remainingCreditBalance)} (Rem)` : ""}
                          {sale.paymentMethod === "Cheque" ? "N/A" : ""}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => handleReprintInvoice(sale)} title="View / Print Invoice">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          )}
          {filteredSales.length > 0 && !isLoading && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              Showing {filteredSales.length} invoice{filteredSales.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvoiceForReprint && isBillDialogOpen && (
        <BillDialog
          isOpen={isBillDialogOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoiceForReprint(null);
            setIsBillDialogOpen(open);
          }}
          existingSaleData={selectedInvoiceForReprint}
          onConfirmSale={() => { /* No confirm action needed for reprint */ }}
        />
      )}
    </>
  );
}
