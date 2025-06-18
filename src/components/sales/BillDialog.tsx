
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

interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  discountPercentage: number;
  currentSubtotal: number;
  currentDiscountAmount: number;
  currentTotalAmount: number;
  saleId?: string;
  onConfirmSale: (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'>) => void;
}

export function BillDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems, 
  customer, 
  discountPercentage,
  currentSubtotal,
  currentDiscountAmount,
  currentTotalAmount,
  saleId,
  onConfirmSale
}: BillDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Sale["paymentMethod"]>("Cash");
  const [cashGiven, setCashGiven] = useState<string>("");
  const [amountPaidOnCredit, setAmountPaidOnCredit] = useState<string>("");
  
  const transactionDate = new Date();

  const balanceReturned = useMemo(() => {
    if (selectedPaymentMethod === "Cash" && cashGiven) {
      const given = parseFloat(cashGiven);
      return given >= currentTotalAmount ? given - currentTotalAmount : null;
    }
    return null;
  }, [selectedPaymentMethod, cashGiven, currentTotalAmount]);

  const remainingCreditBalance = useMemo(() => {
    if (selectedPaymentMethod === "Credit" && amountPaidOnCredit) {
      const paid = parseFloat(amountPaidOnCredit);
      return paid <= currentTotalAmount ? currentTotalAmount - paid : null;
    }
    return null;
  }, [selectedPaymentMethod, amountPaidOnCredit, currentTotalAmount]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod("Cash"); 
      setCashGiven("");
      setAmountPaidOnCredit("");
    }
  }, [isOpen]);

  const handleConfirmAndPrint = () => {
    const saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'> = {
      customerId: customer?.id,
      customerName: customer?.name,
      subTotal: currentSubtotal,
      discountPercentage: discountPercentage,
      discountAmount: currentDiscountAmount,
      totalAmount: currentTotalAmount,
      paymentMethod: selectedPaymentMethod,
    };

    if (selectedPaymentMethod === "Cash") {
      saleData.cashGiven = parseFloat(cashGiven || "0");
      saleData.balanceReturned = balanceReturned !== null ? balanceReturned : 0;
      if (saleData.cashGiven < currentTotalAmount) {
        alert("Cash given is less than total amount.");
        return;
      }
    } else if (selectedPaymentMethod === "Credit") {
      if (!customer) {
        alert("A customer must be selected for credit sales.");
        return;
      }
      saleData.customerId = customer.id; // Ensure customerId is set
      saleData.customerName = customer.name; // Ensure customerName is set
      saleData.amountPaidOnCredit = parseFloat(amountPaidOnCredit || "0");
      saleData.remainingCreditBalance = remainingCreditBalance !== null ? remainingCreditBalance : currentTotalAmount;
       if (saleData.amountPaidOnCredit > currentTotalAmount) {
        alert("Amount paid cannot exceed total amount for credit sales.");
        return;
      }
    }

    onConfirmSale(saleData);
    window.print();
    onOpenChange(false); 
  };

  const paymentMethods: { value: Sale["paymentMethod"]; label: string; icon: React.ElementType }[] = [
    { value: "Cash", label: "Cash", icon: Wallet },
    { value: "Card", label: "Card", icon: CreditCard },
    { value: "Credit", label: "Credit", icon: Landmark },
  ];
  
  const isConfirmDisabled = cartItems.length === 0 ||
    (selectedPaymentMethod === "Cash" && (cashGiven === "" || parseFloat(cashGiven) < currentTotalAmount)) ||
    (selectedPaymentMethod === "Credit" && (!customer || amountPaidOnCredit === "" || parseFloat(amountPaidOnCredit) > currentTotalAmount));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-w-full print:max-h-full print:m-0 print:p-0">
        <DialogHeader className="print:hidden px-6 pt-6">
          <DialogTitle className="font-headline text-xl">Transaction Receipt & Payment</DialogTitle>
          <DialogDescription>
            Finalize payment method and print the receipt.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow">
          <div id="bill-content" className="p-6 bg-card text-card-foreground rounded-md print:p-0 print:bg-transparent print:text-black">
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
              {saleId && <p>Transaction ID: {saleId}</p>}
              {customer && <p>Customer: {customer.name} {customer.shopName ? `(${customer.shopName})` : ''}</p>}
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
                  {cartItems.map(item => (
                    <tr key={`${item.id}-${item.saleType}`} className="border-b border-dashed">
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
                <span>Rs. {currentSubtotal.toFixed(2)}</span>
              </div>
              {discountPercentage > 0 && (
                <div className="flex justify-between">
                  <span>Discount ({discountPercentage.toFixed(2)}%):</span>
                  <span>- Rs. {currentDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-1"/>
              <div className="flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span>Rs. {currentTotalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <Separator className="my-4"/>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm">Payment Method:</h3>
              <RadioGroup 
                value={selectedPaymentMethod}
                onValueChange={(value: Sale["paymentMethod"]) => {
                  setSelectedPaymentMethod(value);
                  setCashGiven("");
                  setAmountPaidOnCredit("");
                }}
                className="grid grid-cols-3 gap-3 print:hidden"
              >
                {paymentMethods.map((method) => (
                  <Label
                    key={method.value}
                    htmlFor={`payment-${method.value}`}
                    className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all
                      ${selectedPaymentMethod === method.value ? "border-primary bg-primary/10 shadow-md" : "border-muted"}`}
                  >
                    <RadioGroupItem value={method.value} id={`payment-${method.value}`} className="sr-only" />
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
              <div className="space-y-3 mt-4 print:hidden">
                <div>
                  <Label htmlFor="cashGiven" className="text-xs">Cash Given (Rs.)</Label>
                  <Input 
                    id="cashGiven" 
                    type="number" 
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Amount received"
                    className="h-10"
                    min={currentTotalAmount.toString()}
                  />
                </div>
                {balanceReturned !== null && parseFloat(cashGiven) >= currentTotalAmount && (
                  <p className="text-sm font-medium">Balance to Return: <span className="text-green-600">Rs. {balanceReturned.toFixed(2)}</span></p>
                )}
                {cashGiven !== "" && parseFloat(cashGiven) < currentTotalAmount && (
                    <Alert variant="destructive" className="p-2 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        Cash given is less than total amount.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            )}

            {selectedPaymentMethod === "Credit" && (
              <div className="space-y-3 mt-4 print:hidden">
                {!customer && (
                   <Alert variant="destructive" className="p-3 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        A customer must be selected for credit sales.
                        </AlertDescription>
                    </Alert>
                )}
                <div>
                  <Label htmlFor="amountPaidOnCredit" className="text-xs">Amount Paid Now (Rs.)</Label>
                  <Input 
                    id="amountPaidOnCredit" 
                    type="number" 
                    value={amountPaidOnCredit}
                    onChange={(e) => setAmountPaidOnCredit(e.target.value)}
                    placeholder="Amount paid"
                    className="h-10"
                    max={currentTotalAmount.toString()}
                    disabled={!customer}
                  />
                </div>
                {remainingCreditBalance !== null && parseFloat(amountPaidOnCredit) <= currentTotalAmount && customer && (
                  <p className="text-sm font-medium">Remaining Balance: <span className="text-orange-600">Rs. {remainingCreditBalance.toFixed(2)}</span></p>
                )}
                 {amountPaidOnCredit !== "" && parseFloat(amountPaidOnCredit) > currentTotalAmount && (
                    <Alert variant="destructive" className="p-2 text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                        Amount paid cannot exceed total.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
            )}
            
            <Separator className="my-4 print:hidden"/>
            <div className="mt-2 text-xs print:block hidden">
              {selectedPaymentMethod === "Cash" && cashGiven && parseFloat(cashGiven) >= currentTotalAmount && (
                <>
                  <p>Cash Given: Rs. {parseFloat(cashGiven).toFixed(2)}</p>
                  <p>Balance Returned: Rs. {(balanceReturned ?? 0).toFixed(2)}</p>
                </>
              )}
              {selectedPaymentMethod === "Credit" && amountPaidOnCredit && parseFloat(amountPaidOnCredit) <= currentTotalAmount && customer && (
                 <>
                  <p>Amount Paid: Rs. {parseFloat(amountPaidOnCredit).toFixed(2)}</p>
                  <p>Remaining Balance: Rs. {(remainingCreditBalance ?? 0).toFixed(2)}</p>
                </>
              )}
            </div>


            <p className="text-center text-xs mt-6">Thank you for your purchase!</p>
            <p className="text-center text-xs">Please come again.</p>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleConfirmAndPrint} disabled={isConfirmDisabled}>
             <Printer className="mr-2 h-4 w-4" /> Confirm & Print
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
