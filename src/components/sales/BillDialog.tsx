
"use client";

import type { CartItem, Customer, Sale } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/AppLogo";
import { CreditCard, Landmark, Printer, Wallet, AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { placeholderCustomers } from "@/lib/placeholder-data"; // For finding customer details in reprint
import { cn } from "@/lib/utils";

interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  
  // For new sales
  cartItems?: CartItem[];
  customer?: Customer | null;
  discountPercentage?: number;
  currentSubtotal?: number;
  currentDiscountAmount?: number;
  currentTotalAmount?: number;
  saleId?: string; 
  onConfirmSale?: (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'>) => void;

  // For reprinting existing sales
  existingSaleData?: Sale;
}

export function BillDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems: newCartItems,
  customer: newCustomer,
  discountPercentage: newDiscountPercentage,
  currentSubtotal: newSubtotal,
  currentDiscountAmount: newDiscountAmount,
  currentTotalAmount: newTotalAmount,
  saleId: newSaleId,
  onConfirmSale,
  existingSaleData
}: BillDialogProps) {
  
  const isReprintMode = !!existingSaleData;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Sale["paymentMethod"]>(
    isReprintMode && existingSaleData ? existingSaleData.paymentMethod : "Cash"
  );
  const [cashGiven, setCashGiven] = useState<string>(
    isReprintMode && existingSaleData?.paymentMethod === "Cash" ? (existingSaleData.cashGiven?.toString() || "") : ""
  );
  const [amountPaidOnCredit, setAmountPaidOnCredit] = useState<string>(
    isReprintMode && existingSaleData?.paymentMethod === "Credit" ? (existingSaleData.amountPaidOnCredit?.toString() || "") : ""
  );
  
  const transactionDate = isReprintMode && existingSaleData ? new Date(existingSaleData.saleDate) : new Date();
  const displaySaleId = isReprintMode && existingSaleData ? existingSaleData.id : (newSaleId || `SALE-${Date.now().toString().slice(-6)}`);
  
  const itemsToDisplay = (isReprintMode && existingSaleData ? existingSaleData.items : newCartItems) || [];
  
  const customerForDisplay = useMemo(() => {
    if (isReprintMode && existingSaleData) {
      if (existingSaleData.customerId) {
        return placeholderCustomers.find(c => c.id === existingSaleData.customerId) || null;
      }
      return existingSaleData.customerName ? { id: '', name: existingSaleData.customerName, phone: '', shopName: '' } as Customer : null;
    }
    return newCustomer;
  }, [isReprintMode, existingSaleData, newCustomer]);

  const subtotalToDisplay = (isReprintMode && existingSaleData ? existingSaleData.subTotal : newSubtotal) || 0;
  const discountPercentageToDisplay = (isReprintMode && existingSaleData ? existingSaleData.discountPercentage : newDiscountPercentage) || 0;
  const discountAmountToDisplay = (isReprintMode && existingSaleData ? existingSaleData.discountAmount : newDiscountAmount) || 0;
  const totalAmountToDisplay = (isReprintMode && existingSaleData ? existingSaleData.totalAmount : newTotalAmount) || 0;

  const balanceReturned = useMemo(() => {
    if (isReprintMode && existingSaleData?.paymentMethod === "Cash") return existingSaleData.balanceReturned || 0;
    if (selectedPaymentMethod === "Cash" && cashGiven) {
      const given = parseFloat(cashGiven);
      return given >= totalAmountToDisplay ? given - totalAmountToDisplay : null;
    }
    return null;
  }, [isReprintMode, existingSaleData, selectedPaymentMethod, cashGiven, totalAmountToDisplay]);

  const remainingCreditBalance = useMemo(() => {
    if (isReprintMode && existingSaleData?.paymentMethod === "Credit") return existingSaleData.remainingCreditBalance || 0;
    if (selectedPaymentMethod === "Credit" && amountPaidOnCredit) {
      const paid = parseFloat(amountPaidOnCredit);
      return paid <= totalAmountToDisplay ? totalAmountToDisplay - paid : null;
    }
    return null;
  }, [isReprintMode, existingSaleData, selectedPaymentMethod, amountPaidOnCredit, totalAmountToDisplay]);

  useEffect(() => {
    if (isOpen) {
      if (isReprintMode && existingSaleData) {
        setSelectedPaymentMethod(existingSaleData.paymentMethod);
        setCashGiven(existingSaleData.paymentMethod === "Cash" ? (existingSaleData.cashGiven?.toString() || "") : "");
        setAmountPaidOnCredit(existingSaleData.paymentMethod === "Credit" ? (existingSaleData.amountPaidOnCredit?.toString() || "") : "");
      } else {
        setSelectedPaymentMethod("Cash"); 
        setCashGiven("");
        setAmountPaidOnCredit("");
      }
    }
  }, [isOpen, isReprintMode, existingSaleData]);

  const handlePrimaryAction = () => {
    if (isReprintMode) {
      window.print();
      onOpenChange(false);
      return;
    }

    // Logic for new sale
    if (onConfirmSale) {
      const saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'> = {
        customerId: customerForDisplay?.id,
        customerName: customerForDisplay?.name,
        subTotal: subtotalToDisplay,
        discountPercentage: discountPercentageToDisplay,
        discountAmount: discountAmountToDisplay,
        totalAmount: totalAmountToDisplay,
        paymentMethod: selectedPaymentMethod,
      };

      if (selectedPaymentMethod === "Cash") {
        saleData.cashGiven = parseFloat(cashGiven || "0");
        saleData.balanceReturned = balanceReturned !== null ? balanceReturned : 0;
        if (saleData.cashGiven < totalAmountToDisplay) {
          alert("Cash given is less than total amount."); // Consider using toast
          return;
        }
      } else if (selectedPaymentMethod === "Credit") {
        if (!customerForDisplay) {
          alert("A customer must be selected for credit sales."); // Consider using toast
          return;
        }
        saleData.customerId = customerForDisplay.id; 
        saleData.customerName = customerForDisplay.name;
        saleData.amountPaidOnCredit = parseFloat(amountPaidOnCredit || "0");
        saleData.remainingCreditBalance = remainingCreditBalance !== null ? remainingCreditBalance : totalAmountToDisplay;
        if (saleData.amountPaidOnCredit > totalAmountToDisplay) {
          alert("Amount paid cannot exceed total amount for credit sales."); // Consider using toast
          return;
        }
      }
      onConfirmSale(saleData);
    }
    window.print();
    onOpenChange(false); 
  };

  const paymentMethods: { value: Sale["paymentMethod"]; label: string; icon: React.ElementType }[] = [
    { value: "Cash", label: "Cash", icon: Wallet },
    { value: "Card", label: "Card", icon: CreditCard },
    { value: "Credit", label: "Credit", icon: Landmark },
  ];
  
  const isPrimaryButtonDisabled = !isReprintMode && (
    itemsToDisplay.length === 0 ||
    (selectedPaymentMethod === "Cash" && (cashGiven === "" || parseFloat(cashGiven) < totalAmountToDisplay)) ||
    (selectedPaymentMethod === "Credit" && (!customerForDisplay || amountPaidOnCredit === "" || parseFloat(amountPaidOnCredit) > totalAmountToDisplay))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg flex flex-col",
          "print:shadow-none print:border-none print:max-w-full print:max-h-full print:m-0 print:p-0 print:h-auto print:overflow-visible",
          isOpen ? "max-h-[90vh]" : "" // Apply max-h only when dialog is open for screen view
        )}
      >
        <DialogHeader className="print:hidden px-6 pt-6">
          <DialogTitle className="font-headline text-xl">
            {isReprintMode ? "View Invoice" : "Transaction Receipt & Payment"}
          </DialogTitle>
          <DialogDescription>
            {isReprintMode ? `Details for invoice ${displaySaleId}.` : "Finalize payment method and print the receipt."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow print:overflow-visible print:flex-grow-0 print:h-auto">
          <div 
            id="bill-content" 
            className={cn(
                "p-6 bg-card text-card-foreground rounded-md",
                "print:p-0 print:bg-transparent print:text-black print:max-h-none print:overflow-visible"
            )}
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                 <AppLogo size="md"/>
              </div>
              <p className="text-sm">4/1 Bujjampala, Dankotuwa</p>
              <p className="text-sm">Hotline: 077-3383721, 077-1066595</p>
            </div>

            <Separator className="my-4"/>

            <div className="text-xs mb-4">
              <p>Date: {transactionDate.toLocaleDateString()} {transactionDate.toLocaleTimeString()}</p>
              {displaySaleId && <p>Transaction ID: {displaySaleId}</p>}
              {customerForDisplay && <p>Customer: {customerForDisplay.name} {customerForDisplay.shopName ? `(${customerForDisplay.shopName})` : ''}</p>}
              <p>Served by: Staff Member</p> 
            </div>

            <Separator className="my-4"/>
            
            <h3 className="font-semibold mb-2 text-sm">Order Summary:</h3>
            <div className="max-h-[150px] overflow-y-auto print:max-h-none print:overflow-visible mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-normal">Item</th>
                    <th className="text-center py-1 font-normal">Qty</th>
                    <th className="text-right py-1 font-normal">Price</th>
                    <th className="text-right py-1 font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToDisplay.map((item, index) => (
                    <tr key={`${item.id}-${item.saleType}-${index}`} className="border-b border-dashed">
                      <td className="py-1.5">{item.name}</td>
                      <td className="text-center py-1.5">{item.quantity}</td>
                      <td className="text-right py-1.5">Rs. {item.appliedPrice.toFixed(2)}</td>
                      <td className="text-right py-1.5">Rs. {(item.appliedPrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-xs mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {subtotalToDisplay.toFixed(2)}</span>
              </div>
              {discountPercentageToDisplay > 0 && (
                <div className="flex justify-between">
                  <span>Discount ({discountPercentageToDisplay.toFixed(2)}%):</span>
                  <span>- Rs. {discountAmountToDisplay.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-1"/>
              <div className="flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span>Rs. {totalAmountToDisplay.toFixed(2)}</span>
              </div>
            </div>
            
            <Separator className="my-4"/>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm">Payment Method:</h3>
              <RadioGroup 
                value={selectedPaymentMethod}
                onValueChange={(value: Sale["paymentMethod"]) => {
                  if (!isReprintMode) {
                    setSelectedPaymentMethod(value);
                    setCashGiven("");
                    setAmountPaidOnCredit("");
                  }
                }}
                className="grid grid-cols-3 gap-3 print:hidden"
                disabled={isReprintMode}
              >
                {paymentMethods.map((method) => (
                  <Label
                    key={method.value}
                    htmlFor={`payment-${method.value}`}
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground transition-all
                      ${selectedPaymentMethod === method.value ? "border-primary bg-primary/10 shadow-md" : "border-muted"}
                      ${isReprintMode ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                  >
                    <RadioGroupItem value={method.value} id={`payment-${method.value}`} className="sr-only" disabled={isReprintMode}/>
                    <method.icon className={`mb-1.5 h-5 w-5 ${selectedPaymentMethod === method.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${selectedPaymentMethod === method.value ? "text-primary" : ""}`}>{method.label}</span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="mt-2 text-xs print:block hidden"> 
                Selected: <span className="font-semibold">{selectedPaymentMethod}</span>
              </div>
            </div>

            {selectedPaymentMethod === "Cash" && (
              <div className="space-y-3 mt-4">
                <div className="print:hidden">
                  <Label htmlFor="cashGiven" className="text-xs">Cash Given (Rs.)</Label>
                  <Input 
                    id="cashGiven" 
                    type="number" 
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Amount received"
                    className="h-10"
                    min={!isReprintMode ? totalAmountToDisplay.toString() : undefined}
                    disabled={isReprintMode}
                  />
                </div>
                {balanceReturned !== null && (isReprintMode || parseFloat(cashGiven) >= totalAmountToDisplay) && (
                  <p className="text-sm font-medium">Balance to Return: <span className="text-green-600">Rs. {balanceReturned.toFixed(2)}</span></p>
                )}
                {!isReprintMode && cashGiven !== "" && parseFloat(cashGiven) < totalAmountToDisplay && (
                    <Alert variant="destructive" className="p-2 text-xs print:hidden">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        Cash given is less than total amount.
                        </AlertDescription>
                    </Alert>
                )}
                 {/* For print view of cash details */}
                <div className="mt-2 text-xs print:block hidden">
                  {isReprintMode && existingSaleData?.paymentMethod === "Cash" && (
                    <>
                      <p>Cash Given: Rs. {(existingSaleData.cashGiven || 0).toFixed(2)}</p>
                      <p>Balance Returned: Rs. {(existingSaleData.balanceReturned || 0).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedPaymentMethod === "Credit" && (
              <div className="space-y-3 mt-4">
                {!isReprintMode && !customerForDisplay && (
                   <Alert variant="destructive" className="p-3 text-sm print:hidden">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        A customer must be selected for credit sales.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="print:hidden">
                  <Label htmlFor="amountPaidOnCredit" className="text-xs">Amount Paid Now (Rs.)</Label>
                  <Input 
                    id="amountPaidOnCredit" 
                    type="number" 
                    value={amountPaidOnCredit}
                    onChange={(e) => setAmountPaidOnCredit(e.target.value)}
                    placeholder="Amount paid"
                    className="h-10"
                    max={!isReprintMode ? totalAmountToDisplay.toString() : undefined}
                    disabled={isReprintMode || (!isReprintMode && !customerForDisplay)}
                  />
                </div>
                {remainingCreditBalance !== null && (isReprintMode || (parseFloat(amountPaidOnCredit) <= totalAmountToDisplay && customerForDisplay)) && (
                  <p className="text-sm font-medium">Remaining Balance: <span className="text-orange-600">Rs. {remainingCreditBalance.toFixed(2)}</span></p>
                )}
                 {!isReprintMode && amountPaidOnCredit !== "" && parseFloat(amountPaidOnCredit) > totalAmountToDisplay && (
                    <Alert variant="destructive" className="p-2 text-xs print:hidden">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        Amount paid cannot exceed total.
                        </AlertDescription>
                    </Alert>
                )}
                {/* For print view of credit details */}
                <div className="mt-2 text-xs print:block hidden">
                  {isReprintMode && existingSaleData?.paymentMethod === "Credit" && (
                    <>
                      <p>Amount Paid: Rs. {(existingSaleData.amountPaidOnCredit || 0).toFixed(2)}</p>
                      <p>Remaining Credit: Rs. {(existingSaleData.remainingCreditBalance || 0).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <Separator className="my-4 print:hidden"/>

            <p className="text-center text-xs mt-6">Thank you for your purchase!</p>
            <p className="text-center text-xs">Please come again.</p>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handlePrimaryAction} disabled={isPrimaryButtonDisabled}>
             <Printer className="mr-2 h-4 w-4" /> 
             {isReprintMode ? "Print Receipt" : "Confirm & Print"}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
