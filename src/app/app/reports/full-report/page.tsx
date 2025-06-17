
"use client";

import { ClipboardList, FileText, Printer, DownloadCloud } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullReportTable } from "@/components/reports/FullReportTable";
import { placeholderFullReportData } from "@/lib/placeholder-data";
import type { FullReportEntry } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export default function FullReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const reportData: FullReportEntry[] = placeholderFullReportData;

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
     return (
      <>
        <GlobalPreloaderScreen message="Loading report..." />
      </>
     );
  }

  if (currentUser.role !== "admin") {
    return (
      <>
        <AccessDenied message="Full reports are not available for your role. Redirecting..." />
      </>
    );
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Full Report");
    XLSX.writeFile(workbook, "Full_Report.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable; 
    doc.text("Full Sales Report", 14, 16);
    doc.autoTable({
      startY: 20,
      head: [['ID', 'Date', 'Time', 'Customer', 'SKU', 'Product', 'Category', 'Qty', 'Unit Price', 'Total', 'Type', 'Payment', 'Staff']],
      body: reportData.map(entry => [
        entry.saleId,
        entry.saleDate,
        entry.saleTime,
        entry.customerName,
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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 18, 57] }, 
      columnStyles: {
        0: {cellWidth: 15}, 
        1: {cellWidth: 18}, 
        2: {cellWidth: 15}, 
        3: {cellWidth: 'auto'}, 
        4: {cellWidth: 15}, 
      }
    });
    doc.save("Full_Report.pdf");
  };

  const handlePrint = () => {
    window.print();
  };

  const reportActions = (
    <div className="report-action-buttons flex flex-col sm:flex-row gap-2">
      <Button onClick={handleExportExcel} variant="outline" size="sm">
        <DownloadCloud className="mr-2 h-4 w-4" /> Export Excel
      </Button>
      <Button onClick={handleExportPDF} variant="outline" size="sm">
        <FileText className="mr-2 h-4 w-4" /> Export PDF
      </Button>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="mr-2 h-4 w-4" /> Print Report
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Full Sales Report" 
        description="Comprehensive overview of all sales transactions and item details."
        icon={ClipboardList}
        action={reportActions}
      />
      <Card className="shadow-lg printable-report-container">
        <CardHeader className="print:hidden">
          <CardTitle className="font-headline">Detailed Transaction Log</CardTitle>
          <CardDescription>
            This report contains a detailed breakdown of all sales transactions, including individual items sold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FullReportTable data={reportData} />
        </CardContent>
      </Card>
    </>
  );
}
