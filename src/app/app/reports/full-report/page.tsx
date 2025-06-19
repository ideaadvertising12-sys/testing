
"use client";

import { ClipboardList, FileText, Printer, DownloadCloud, Filter, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullReportTable } from "@/components/reports/FullReportTable";
import { placeholderFullReportData } from "@/lib/placeholder-data";
import type { FullReportEntry } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker"; // Corrected import path if needed, but component will exist now
import type { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function FullReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<FullReportEntry[]>([]);
  const [filteredData, setFilteredData] = useState<FullReportEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setReportData(placeholderFullReportData);
      setFilteredData(placeholderFullReportData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...reportData];
    
    // Date filter
    if (dateRange?.from && dateRange.to) {
      result = result.filter(entry => {
        const entryDate = new Date(entry.saleDate);
        return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
      });
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => 
        entry.saleId.toLowerCase().includes(term) ||
        (entry.customerName && entry.customerName.toLowerCase().includes(term)) ||
        entry.productName.toLowerCase().includes(term) ||
        entry.productSku.toLowerCase().includes(term) ||
        entry.staffId.toLowerCase().includes(term)
      );
    }
    
    // Sale type filter
    if (saleTypeFilter !== "all") {
      result = result.filter(entry => entry.saleType === saleTypeFilter);
    }
    
    // Payment filter
    if (paymentFilter !== "all") {
      result = result.filter(entry => entry.paymentMethod === paymentFilter);
    }
    
    setFilteredData(result);
  }, [reportData, searchTerm, dateRange, saleTypeFilter, paymentFilter]);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
       router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  if (!currentUser) {
     return <GlobalPreloaderScreen message="Loading report..." />;
  }

  if (currentUser.role !== "admin") {
    return (
      <AccessDenied message="Full reports are not available for your role. Redirecting..." />
    );
  }

  const handleExportExcel = () => {
    setIsLoading(true);
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Full Report");
      XLSX.writeFile(workbook, `Full_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF('landscape') as jsPDFWithAutoTable; 
      doc.text(`Full Sales Report - ${format(new Date(), 'PP')}`, 14, 16);
      
      doc.autoTable({
        startY: 20,
        head: [['ID', 'Date', 'Time', 'Customer', 'SKU', 'Product', 'Category', 'Qty', 'Unit Price', 'Total', 'Type', 'Payment', 'Staff']],
        body: filteredData.map(entry => [
          entry.saleId,
          entry.saleDate,
          entry.saleTime,
          entry.customerName || "Walk-in",
          entry.productSku,
          entry.productName,
          entry.productCategory,
          entry.quantity,
          entry.appliedPrice.toFixed(2),
          entry.lineTotal.toFixed(2),
          entry.saleType,
          entry.paymentMethod,
          entry.staffId,
        ]),
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [30, 18, 57], // Corresponds to primary color, adjust if theme changes
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 20 },
        pageBreak: 'auto',
        tableWidth: 'wrap'
      });
      
      doc.save(`Full_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportActions = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        onClick={handleExportExcel} 
        variant="outline" 
        size="sm"
        disabled={isLoading || filteredData.length === 0}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <DownloadCloud className="mr-2 h-4 w-4" />
        )}
        Export Excel
      </Button>
      <Button 
        onClick={handleExportPDF} 
        variant="outline" 
        size="sm"
        disabled={isLoading || filteredData.length === 0}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      <Button 
        onClick={handlePrint} 
        variant="outline" 
        size="sm"
        disabled={filteredData.length === 0}
      >
        <Printer className="mr-2 h-4 w-4" /> 
        Print
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 print:space-y-0">
      <PageHeader 
        title="Full Sales Report" 
        description="Comprehensive overview of all sales transactions and item details."
        icon={ClipboardList}
        action={reportActions}
      />
      
      <Card className="shadow-lg printable-report-container">
        <CardHeader className="print:hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Detailed Transaction Log</CardTitle>
              <CardDescription>
                {filteredData.length} transactions found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full"
            />
            
            <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sale Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sale Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem> {/* Assuming UPI might be a payment method */}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="print:p-0">
          <FullReportTable data={filteredData} isLoading={isLoading} />
        </CardContent>
      </Card>
      
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .printable-report-container {
            box-shadow: none;
            border: none;
          }
          .table th, .table td {
            padding: 4px 8px;
            font-size: 10px;
          }
          .badge {
            padding: 2px 6px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
