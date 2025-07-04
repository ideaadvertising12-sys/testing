"use client";

import React from 'react';
import { AppLogo } from "@/components/AppLogo";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer } from "lucide-react";
import type { ReturnTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReturnInvoiceProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  returnTransaction: ReturnTransaction | null;
}

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export function ReturnInvoiceDialog({ isOpen, onOpenChange, returnTransaction }: ReturnInvoiceProps) {
  if (!returnTransaction) return null;

  const {
    id: returnId,
    originalSaleId,
    returnDate,
    customerName,
    staffId,
    returnedItems,
    exchangedItems,
    amountPaid,
    paymentSummary,
    changeGiven,
    settleOutstandingAmount,
    refundAmount,
    cashPaidOut,
  } = returnTransaction;

  const returnTotalValue = returnedItems.reduce((total, item) => {
      return total + (item.appliedPrice * item.quantity);
  }, 0);

  const exchangeTotalValue = exchangedItems.reduce((total, item) => {
      return total + (item.appliedPrice * item.quantity);
  }, 0);
  
  const netCreditAfterSettle = returnTotalValue - (settleOutstandingAmount || 0);
  const finalDifference = exchangeTotalValue - netCreditAfterSettle;
  const totalRefundValue = (refundAmount || 0) + (cashPaidOut || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-lg flex flex-col p-0 print:p-0",
        "print:shadow-none print:border-none print:max-w-none print:max-h-none print:m-0 print:h-auto print:overflow-visible",
        isOpen ? "max-h-[90vh]" : ""
      )}>
        <DialogHeader className="print:hidden px-6 pt-6">
          <DialogTitle className="font-headline text-xl">Return & Exchange Receipt</DialogTitle>
          <DialogDescription>
            A summary of the return transaction. Print this for the customer.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow print:overflow-visible print:max-h-none print:h-auto">
          <div 
            id="return-receipt-content" 
            className={cn(
              "p-4 bg-card text-card-foreground",
              "print:p-2 print:bg-transparent print:text-black print:max-h-none print:overflow-visible"
            )}
          >
            <div className="text-center mb-4 print:mb-2">
              <div className="flex justify-center mb-1 logo-container print:scale-75 print:mb-0">
                <AppLogo size="sm"/>
              </div>
              <p className="text-xs print:text-[9px]">4/1 Bujjampala, Dankotuwa</p>
              <p className="text-xs print:text-[9px]">Hotline: 077-3383721, 077-1066595</p>
            </div>

            <Separator className="my-3 print:my-2 summary-separator"/>
            
            <div className="text-xs print:text-[9px] mb-3 print:mb-2 space-y-1">
              <p><strong>Return ID:</strong> <span className="font-mono">{returnId || 'N/A'}</span></p>
              <p><strong>Return Date:</strong> {format(returnDate, "PP, p")}</p>
              <p><strong>Original Sale ID:</strong> {originalSaleId}</p>
              <p><strong>Customer:</strong> {customerName || "N/A"}</p>
              <p><strong>Served by:</strong> {staffId}</p>
            </div>
            <Separator className="my-3 print:my-2 summary-separator"/>

            {/* Returned Items */}
            {returnedItems.length > 0 && (
              <>
                <h3 className="font-semibold mb-2 text-sm print:text-[10px]">Returned Items:</h3>
                <table className="w-full text-xs print:text-[9px] print:w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 font-normal w-[40%]">Item</th>
                      <th className="text-center py-1 font-normal w-[15%]">Qty</th>
                      <th className="text-right py-1 font-normal w-[20%]">Credit Each</th>
                      <th className="text-right py-1 font-normal w-[25%]">Total Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedItems.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="border-b border-dashed">
                        <td className="py-1 break-words">{item.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{formatCurrency(item.appliedPrice)}</td>
                        <td className="text-right py-1 font-semibold">{formatCurrency(item.appliedPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-1 font-bold text-sm print:text-[10px]">
                  <span>Total Return Credit:</span>
                  <span className="ml-2 min-w-[60px] text-right">{formatCurrency(returnTotalValue)}</span>
                </div>
                <Separator className="my-3 print:my-2 summary-separator"/>
              </>
            )}
            
            {/* Exchanged Items */}
            {exchangedItems.length > 0 && (
              <>
                <h3 className="font-semibold mb-2 text-sm print:text-[10px]">New Items (Exchange):</h3>
                <table className="w-full text-xs print:text-[9px] print:w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 font-normal w-[40%]">Item</th>
                      <th className="text-center py-1 font-normal w-[15%]">Qty</th>
                      <th className="text-right py-1 font-normal w-[20%]">Price Each</th>
                      <th className="text-right py-1 font-normal w-[25%]">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangedItems.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="border-b border-dashed">
                        <td className="py-1 break-words">{item.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{formatCurrency(item.appliedPrice)}</td>
                        <td className="text-right py-1 font-semibold">{formatCurrency(item.appliedPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-1 font-bold text-sm print:text-[10px]">
                  <span>Total New Items Cost:</span>
                  <span className="ml-2 min-w-[60px] text-right">{formatCurrency(exchangeTotalValue)}</span>
                </div>
                <Separator className="my-3 print:my-2 summary-separator"/>
              </>
            )}
            
            {/* Summary */}
            <div className="space-y-1 text-sm print:text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return Credit:</span>
                <span>{formatCurrency(returnTotalValue)}</span>
              </div>
              {settleOutstandingAmount && settleOutstandingAmount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span className="text-muted-foreground pl-2">Applied to Outstanding Bill:</span>
                  <span>- {formatCurrency(settleOutstandingAmount)}</span>
                </div>
              )}
              <Separator className="my-1 summary-separator"/>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Credit:</span>
                <span>{formatCurrency(netCreditAfterSettle)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Items Cost:</span>
                <span>- {formatCurrency(exchangeTotalValue)}</span>
              </div>
              <Separator className="my-1 summary-separator"/>
              
              <div className={cn(
                "flex justify-between font-bold text-lg print:text-[14px]",
                finalDifference >= 0 ? "text-destructive" : "text-green-600"
              )}>
                <span>{finalDifference >= 0 ? 'FINAL BALANCE DUE:' : 'TOTAL REFUND DUE:'}</span>
                <span>{formatCurrency(Math.abs(finalDifference))}</span>
              </div>

              {/* Payment Details */}
              {(amountPaid && amountPaid > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid by Customer:</span>
                  <span>{formatCurrency(amountPaid)}</span>
                </div>
              )}
              {(changeGiven && changeGiven > 0) && (
                <div className="flex justify-between text-green-600">
                  <span className="text-muted-foreground">Change Given:</span>
                  <span>{formatCurrency(changeGiven)}</span>
                </div>
              )}
              {paymentSummary && <p className="text-xs print:text-[8px] text-muted-foreground text-right">{paymentSummary}</p>}
              
              {/* Refund Payout Details */}
              {(totalRefundValue > 0) && <Separator className="my-2 summary-separator"/>}
              {(cashPaidOut && cashPaidOut > 0) && (
                <div className="flex justify-between text-green-700">
                  <span className="text-muted-foreground">Cash Paid Out:</span>
                  <span>{formatCurrency(cashPaidOut)}</span>
                </div>
              )}
              {(refundAmount && refundAmount > 0) && (
                <div className="flex justify-between text-green-700">
                  <span className="text-muted-foreground">Credited to Account:</span>
                  <span>{formatCurrency(refundAmount)}</span>
                </div>
              )}
            </div>
            
            <p className="text-center text-xs print:text-[9px] mt-4 print:mt-2">Thank you!</p>
          </div>
        </ScrollArea>
        <div className="p-4 border-t print:hidden flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
