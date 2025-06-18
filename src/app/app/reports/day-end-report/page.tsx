
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarClock, FileText, DownloadCloud, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { placeholderSales } from "@/lib/placeholder-data";
import type { Sale, DayEndReportSummary } from "@/lib/types";
import { format, startOfDay, endOfDay, isSameDay, parseISO } from "date-fns";
import jsPDF from 'jspdf';
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return "Rs. 0.00";
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace("LKR", "Rs.");
};

export default function DayEndReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportSummary, setReportSummary] = useState<DayEndReportSummary | null>(null);

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
    if (selectedDate) {
      const dateStart = startOfDay(selectedDate);
      const dateEnd = endOfDay(selectedDate);

      const salesForDay = placeholderSales.filter(sale => {
        const saleDateObj = typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate;
        return saleDateObj >= dateStart && saleDateObj <= dateEnd;
      });

      const cashSalesList = salesForDay.filter(s => s.paymentMethod === "Cash");
      const cardSalesList = salesForDay.filter(s => s.paymentMethod === "Card");
      const creditSalesList = salesForDay.filter(s => s.paymentMethod === "Credit");

      const cashAmount = cashSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
      const cashReceived = cashSalesList.reduce((sum, s) => sum + (s.cashGiven || s.totalAmount), 0); // If cashGiven not present, assume exact
      const balanceReturned = cashSalesList.reduce((sum, s) => sum + (s.balanceReturned || 0), 0);

      const cardAmount = cardSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
      
      const creditAmount = creditSalesList.reduce((sum, s) => sum + s.totalAmount, 0);
      const amountPaidOnCredit = creditSalesList.reduce((sum, s) => sum + (s.amountPaidOnCredit || 0), 0);
      const remainingCreditBalance = creditSalesList.reduce((sum, s) => sum + (s.remainingCreditBalance || s.totalAmount), 0);


      setReportSummary({
        reportDate: selectedDate,
        cashSales: { count: cashSalesList.length, amount: cashAmount, cashReceived: cashReceived, balanceReturned: balanceReturned },
        cardSales: { count: cardSalesList.length, amount: cardAmount },
        creditSales: { count: creditSalesList.length, amount: creditAmount, amountPaidOnCredit: amountPaidOnCredit, remainingCreditBalance: remainingCreditBalance },
        overallTotalSales: salesForDay.reduce((sum, s) => sum + s.totalAmount, 0),
        overallTotalCashReceived: cashReceived + amountPaidOnCredit, // Cash from cash sales + amount paid on credit sales
        overallTotalBalanceReturned: balanceReturned,
        overallTotalCreditOutstanding: remainingCreditBalance,
        totalTransactions: salesForDay.length,
      });
    } else {
      setReportSummary(null);
    }
  }, [selectedDate]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading report..." />;
  }
  if (currentUser.role !== "admin") {
    return <AccessDenied message="Day End reports are not available for your role. Redirecting..." />;
  }

  const handleExportPDF = () => {
    if (!reportSummary || !selectedDate) return;
    const doc = new jsPDF();
    const reportDateFormatted = format(selectedDate, "PPP");

    doc.setFontSize(18);
    doc.text("Day End Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Date: ${reportDateFormatted}`, 105, 30, { align: "center" });

    let yPos = 45;
    const lineSpacing = 7;
    const sectionSpacing = 10;

    doc.setFontSize(14);
    doc.text("Sales Summary by Payment Method", 14, yPos);
    yPos += lineSpacing;
    doc.setFontSize(10);

    doc.text(`Cash Sales: ${reportSummary.cashSales.count} invoices, Amount: ${formatCurrency(reportSummary.cashSales.amount)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Card Sales: ${reportSummary.cardSales.count} invoices, Amount: ${formatCurrency(reportSummary.cardSales.amount)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Credit Sales: ${reportSummary.creditSales.count} invoices, Amount: ${formatCurrency(reportSummary.creditSales.amount)}`, 18, yPos);
    yPos += sectionSpacing;

    doc.setFontSize(14);
    doc.text("Financial Overview", 14, yPos);
    yPos += lineSpacing;
    doc.setFontSize(10);
    doc.text(`Total Transactions: ${reportSummary.totalTransactions}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Sales Amount: ${formatCurrency(reportSummary.overallTotalSales)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Cash Received (Cash + Credit Payments): ${formatCurrency(reportSummary.overallTotalCashReceived)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Balance Returned (from Cash Sales): ${formatCurrency(reportSummary.overallTotalBalanceReturned)}`, 18, yPos);
    yPos += lineSpacing;
    doc.text(`Total Outstanding Credit: ${formatCurrency(reportSummary.overallTotalCreditOutstanding)}`, 18, yPos);
    
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
      <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={!reportSummary}>
        <DownloadCloud className="mr-2 h-4 w-4" /> Export PDF
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Day End Report" 
        description="Summary of daily sales transactions and financial totals."
        icon={FileText}
        action={reportActions}
      />

      {reportSummary ? (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Report for: {selectedDate ? format(selectedDate, "PPP") : "N/A"}</CardTitle>
              <CardDescription>Total Transactions: {reportSummary.totalTransactions}</CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cash Sales</CardTitle>
                <CardDescription>{reportSummary.cashSales.count} invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Amount: <span className="font-semibold">{formatCurrency(reportSummary.cashSales.amount)}</span></p>
                <p>Cash Received: <span className="font-semibold">{formatCurrency(reportSummary.cashSales.cashReceived)}</span></p>
                <p>Balance Returned: <span className="font-semibold">{formatCurrency(reportSummary.cashSales.balanceReturned)}</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Card Sales</CardTitle>
                <CardDescription>{reportSummary.cardSales.count} invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Amount: <span className="font-semibold">{formatCurrency(reportSummary.cardSales.amount)}</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credit Sales</CardTitle>
                <CardDescription>{reportSummary.creditSales.count} invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total Amount: <span className="font-semibold">{formatCurrency(reportSummary.creditSales.amount)}</span></p>
                <p>Amount Paid: <span className="font-semibold">{formatCurrency(reportSummary.creditSales.amountPaidOnCredit)}</span></p>
                <p>Outstanding: <span className="font-semibold">{formatCurrency(reportSummary.creditSales.remainingCreditBalance)}</span></p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Overall Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-md">
              <p>Total Sales Value (All Methods): <strong className="text-primary">{formatCurrency(reportSummary.overallTotalSales)}</strong></p>
              <hr className="my-2"/>
              <p>Total Cash Collected Today: <strong className="text-green-600">{formatCurrency(reportSummary.overallTotalCashReceived)}</strong></p>
              <p className="text-sm text-muted-foreground ml-4">(Includes cash from 'Cash' sales and payments made on 'Credit' sales today)</p>
              
              <p>Total Balance Returned to Customers: <strong>{formatCurrency(reportSummary.overallTotalBalanceReturned)}</strong></p>
              <p>Total Outstanding Credit (New & Existing): <strong className="text-orange-600">{formatCurrency(reportSummary.overallTotalCreditOutstanding)}</strong></p>
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
