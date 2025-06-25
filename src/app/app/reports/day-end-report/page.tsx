
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarClock, FileText, DownloadCloud, ReceiptText, Banknote, Building, Newspaper, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import type { Sale, DayEndReportSummary, ReturnTransaction } from "@/lib/types";
import { format, startOfDay, endOfDay } from "date-fns";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from "@/lib/utils";
import { useSalesData } from "@/hooks/useSalesData"; 
import { useReturns } from "@/hooks/useReturns";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || isNaN(amount)) return "Rs. 0.00";
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace("LKR", "Rs.");
};

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export default function DayEndReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportSummary, setReportSummary] = useState<DayEndReportSummary | null>(null);

  const { sales: allSales, isLoading: isLoadingSales, error: salesError } = useSalesData(true); 
  const { returns, isLoading: isLoadingReturns, error: returnsError } = useReturns();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (selectedDate && !isLoadingSales && allSales && !isLoadingReturns && returns) {
      const dateStart = startOfDay(selectedDate);
      const dateEnd = endOfDay(selectedDate);

      // --- Collections on the selected day ---
      let totalCollectedByCash = 0;
      let totalCollectedByCheque = 0;
      let totalCollectedByBankTransfer = 0;
      let totalChangeGiven = 0;
      const chequeNumbersList: string[] = [];
      const bankTransferRefs: string[] = [];

      allSales.forEach(sale => {
        // 1. Check initial payments for sales created on this day
        const saleDateObj = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
        if (saleDateObj >= dateStart && saleDateObj <= dateEnd) {
          if (sale.paidAmountCash) totalCollectedByCash += sale.paidAmountCash;
          if (sale.paidAmountCheque) {
            totalCollectedByCheque += sale.paidAmountCheque;
            if (sale.chequeDetails?.number) chequeNumbersList.push(sale.chequeDetails.number);
          }
          if (sale.paidAmountBankTransfer) {
            totalCollectedByBankTransfer += sale.paidAmountBankTransfer;
            if(sale.bankTransferDetails?.referenceNumber) bankTransferRefs.push(sale.bankTransferDetails.referenceNumber);
          }
          if (sale.changeGiven) totalChangeGiven += sale.changeGiven;
        }

        // 2. Check for additional payments made on this day for *any* sale
        if (sale.additionalPayments) {
          sale.additionalPayments.forEach(payment => {
            const paymentDateObj = payment.date instanceof Date ? payment.date : new Date(payment.date);
            if (paymentDateObj >= dateStart && paymentDateObj <= dateEnd) {
              switch (payment.method) {
                case 'Cash':
                  totalCollectedByCash += payment.amount;
                  break;
                case 'Cheque':
                  totalCollectedByCheque += payment.amount;
                  if (payment.details && 'number' in payment.details && payment.details.number) {
                    chequeNumbersList.push(payment.details.number);
                  }
                  break;
                case 'BankTransfer':
                   totalCollectedByBankTransfer += payment.amount;
                  break;
              }
            }
          });
        }
      });
      
      const totalCollectedOverall = totalCollectedByCash + totalCollectedByCheque + totalCollectedByBankTransfer;
      
      // --- Sales and outstanding created on the selected day ---
      const salesForDay = allSales.filter(sale => {
        const saleDateObj = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
        return saleDateObj >= dateStart && saleDateObj <= dateEnd;
      });

      const grossSalesValue = salesForDay.reduce((sum, s) => sum + s.totalAmount, 0);
      
      // --- Calculate Refunds for Sales made on the same day ---
      const sameDayRefundsValue = returns.filter(ret => {
          if (!ret.refundAmount || ret.refundAmount <= 0) return false;
          
          const returnDateObj = ret.returnDate instanceof Date ? ret.returnDate : new Date(ret.returnDate);
          if (returnDateObj < dateStart || returnDateObj > dateEnd) return false;
          
          const originalSale = allSales.find(s => s.id === ret.originalSaleId);
          if (!originalSale) return false;
          
          const originalSaleDateObj = originalSale.saleDate instanceof Date ? originalSale.saleDate : new Date(originalSale.saleDate);
          
          return originalSaleDateObj >= dateStart && originalSaleDateObj <= dateEnd;
      }).reduce((sum, ret) => sum + (ret.refundAmount || 0), 0);

      const netSalesValue = grossSalesValue - sameDayRefundsValue;

      const totalOutstandingAmount = salesForDay.reduce((sum, s) => {
        const initialOutstanding = typeof s.initialOutstandingBalance === 'number'
          ? s.initialOutstandingBalance
          : s.totalAmount - ((s.paidAmountCash || 0) + (s.paidAmountCheque || 0) + (s.paidAmountBankTransfer || 0));
        return sum + initialOutstanding;
      }, 0);


      setReportSummary({
        reportDate: selectedDate,
        totalTransactions: salesForDay.length,
        totalSalesAmount: netSalesValue,
        
        totalAmountCollectedByCash: totalCollectedByCash,
        totalAmountCollectedByCheque: totalCollectedByCheque,
        totalAmountCollectedByBankTransfer: totalCollectedByBankTransfer,
        totalChangeGiven: totalChangeGiven, 
        totalOutstandingAmount: totalOutstandingAmount,
        
        cashSales: { count: 0, amount: 0, cashReceived: totalCollectedByCash, balanceReturned: totalChangeGiven }, 
        chequeSales: { count: salesForDay.filter(s => s.paidAmountCheque && s.paidAmountCheque > 0).length, amount: totalCollectedByCheque, chequeNumbers: chequeNumbersList },
        creditSales: { count: salesForDay.filter(s => (s.initialOutstandingBalance ?? 0) > 0).length, amount: totalOutstandingAmount, amountPaidOnCredit: 0, remainingCreditBalance: totalOutstandingAmount },
        
        overallTotalSales: netSalesValue,
        overallTotalCashReceived: totalCollectedOverall,
        overallTotalBalanceReturned: totalChangeGiven,
        overallTotalCreditOutstanding: totalOutstandingAmount,
      });
    } else {
      setReportSummary(null);
    }
  }, [selectedDate, allSales, isLoadingSales, returns, isLoadingReturns]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading report..." />;
  }
  if (currentUser.role !== "admin") {
    return <AccessDenied message="Day End reports are not available for your role. Redirecting..." />;
  }

  const handleExportPDF = () => {
    if (!reportSummary || !selectedDate) return;
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const reportDateFormatted = format(selectedDate, "PPP");

    doc.setFontSize(18);
    doc.text("Day End Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Date: ${reportDateFormatted}`, 105, 30, { align: "center" });

    let yPos = 45;
    const lineSpacing = 7;
    const sectionSpacing = 10;

    doc.setFontSize(14);
    doc.text("Payment Summary", 14, yPos);
    yPos += lineSpacing * 1.5;
    doc.setFontSize(10);

    doc.text(`Total Amount Collected by Cash: ${formatCurrency(reportSummary.totalAmountCollectedByCash)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Amount Collected by Cheque: ${formatCurrency(reportSummary.totalAmountCollectedByCheque)}`, 18, yPos);
    if(reportSummary.chequeSales.chequeNumbers.length > 0) {
        yPos += lineSpacing;
        doc.text(` (Cheque Nos: ${reportSummary.chequeSales.chequeNumbers.join(', ')})`, 22, yPos);
    }
    yPos += lineSpacing;
    doc.text(`Total Amount Collected by Bank Transfer: ${formatCurrency(reportSummary.totalAmountCollectedByBankTransfer)}`, 18, yPos);
    yPos += sectionSpacing;


    doc.setFontSize(14);
    doc.text("Financial Overview", 14, yPos);
    yPos += lineSpacing * 1.5;
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${reportSummary.totalTransactions}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Net Sales Value (Amount Due): ${formatCurrency(reportSummary.totalSalesAmount)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Amount Collected (All Methods): ${formatCurrency(reportSummary.overallTotalCashReceived)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Change Given (from Cash): ${formatCurrency(reportSummary.totalChangeGiven)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Outstanding Credit: ${formatCurrency(reportSummary.totalOutstandingAmount)}`, 18, yPos);
    
    doc.save(`Day_End_Report_${format(selectedDate, "yyyy-MM-dd")}.pdf`);
  };

  const reportActions = (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
        <Popover>
            <PopoverTrigger asChild>
            <Button
                variant={"outline"}
                className={cn(
                "w-[220px] justify-start text-left font-normal h-10",
                !selectedDate && "text-muted-foreground"
                )}
            >
                <CalendarClock className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
            />
            </PopoverContent>
        </Popover>
      <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={!reportSummary || isLoadingSales || isLoadingReturns}>
        <DownloadCloud className="mr-2 h-4 w-4" /> Export PDF
      </Button>
    </div>
  );

  if ((isLoadingSales || isLoadingReturns) && !reportSummary) {
    return <GlobalPreloaderScreen message="Fetching report data..." />
  }

  return (
    <>
      <PageHeader 
        title="Day End Report" 
        description="Summary of daily sales transactions and financial totals."
        icon={FileText}
        action={reportActions}
      />

      {(salesError || returnsError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{salesError || returnsError}</AlertDescription>
        </Alert>
      )}

      {reportSummary ? (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Report for: {selectedDate ? format(selectedDate, "PPP") : "N/A"}</CardTitle>
              <CardDescription>Total Transactions: {reportSummary.totalTransactions}</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Banknote className="h-5 w-5"/>Cash Payments</CardTitle>
                <CardDescription>Total collected via cash</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Cash In: <span className="font-semibold">{formatCurrency(reportSummary.totalAmountCollectedByCash)}</span></p>
                <p>Change Given: <span className="font-semibold">{formatCurrency(reportSummary.totalChangeGiven)}</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Newspaper className="h-5 w-5"/>Cheque Payments</CardTitle>
                 <CardDescription>Total collected via cheques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Cheque Amount: <span className="font-semibold">{formatCurrency(reportSummary.totalAmountCollectedByCheque)}</span></p>
                {reportSummary.chequeSales.chequeNumbers.length > 0 && (
                  <p className="text-xs text-muted-foreground">Cheque Nos: {reportSummary.chequeSales.chequeNumbers.join(', ')}</p>
                )}
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Building className="h-5 w-5"/>Bank Transfers</CardTitle>
                 <CardDescription>Total collected via bank transfers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Transfer Amount: <span className="font-semibold">{formatCurrency(reportSummary.totalAmountCollectedByBankTransfer)}</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5"/>Credit / Outstanding</CardTitle>
                <CardDescription>Total new credit issued today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Outstanding: <span className="font-semibold">{formatCurrency(reportSummary.totalOutstandingAmount)}</span></p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Overall Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-md">
              <p>Net Sales Value (Amount Due): <strong className="text-primary">{formatCurrency(reportSummary.totalSalesAmount)}</strong></p>
              <hr className="my-2"/>
              <p>Total Amount Collected (All Methods): <strong className="text-green-600">{formatCurrency(reportSummary.overallTotalCashReceived)}</strong></p>
              <p>Total Change Given (from Cash): <strong>{formatCurrency(reportSummary.totalChangeGiven)}</strong></p>
              <p>Total Outstanding Credit: <strong className="text-orange-600">{formatCurrency(reportSummary.totalOutstandingAmount)}</strong></p>
            </CardContent>
          </Card>

        </div>
      ) : (
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">No Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground flex items-center">
                <ReceiptText className="mr-2 h-5 w-5" />
                {selectedDate ? `No sales transactions found for ${format(selectedDate, "PPP")}.` : "Please select a date to view the report."}
              </p>
            </CardContent>
          </Card>
      )}
    </>
  );
}
