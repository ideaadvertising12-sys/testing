
"use client";

import type { CartItem, Customer, Sale } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/AppLogo";
import { CreditCard, Landmark, Printer, Wallet } from "lucide-react"; // Added Landmark for Credit
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";

interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  discountPercentage: number;
  saleId?: string;
  onConfirmSale: (paymentMethod: Sale["paymentMethod"]) => void;
}

export function BillDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems, 
  customer, 
  discountPercentage, 
  saleId,
  onConfirmSale
}: BillDialogProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<Sale["paymentMethod"]>("Cash");
  const subtotal = cartItems.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const calculatedDiscountAmount = subtotal * (discountPercentage / 100);
  const totalAmount = Math.max(0, subtotal - calculatedDiscountAmount);
  const transactionDate = new Date();

  useEffect(() => {
    if (isOpen) {
      // Reset to cash when dialog opens, or maintain last selection if preferred
      setSelectedPaymentMethod("Cash"); 
    }
  }, [isOpen]);

  const handlePrintAndConfirm = () => {
    onConfirmSale(selectedPaymentMethod);
    window.print();
    onOpenChange(false); // Close dialog after printing and confirming
  };

  const paymentMethods: { value: Sale["paymentMethod"]; label: string; icon: React.ElementType }[] = [
    { value: "Cash", label: "Cash", icon: Wallet },
    { value: "Card", label: "Card", icon: CreditCard },
    { value: "Credit", label: "Credit", icon: Landmark },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-w-full print:max-h-full print:m-0 print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="font-headline">Transaction Receipt</DialogTitle>
          <DialogDescription>
            Confirm payment method and print the receipt.
          </DialogDescription>
        </DialogHeader>
        
        <div id="bill-content" className="flex-grow overflow-y-auto p-6 bg-card text-card-foreground rounded-md print:p-0 print:bg-transparent print:text-black">
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
            {customer && <p>Customer: {customer.name}</p>}
            <p>Served by: Staff Member</p> 
          </div>

          <Separator className="my-4"/>
          
          <h3 className="font-semibold mb-2 text-sm">Order Summary:</h3>
          <ScrollArea className="max-h-[150px] print:max-h-none print:overflow-visible"> {/* Adjusted max-h */}
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
          </ScrollArea>

          <Separator className="my-4"/>

          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm">Payment Method:</h3>
            <RadioGroup 
              defaultValue="Cash" 
              value={selectedPaymentMethod}
              onValueChange={(value: Sale["paymentMethod"]) => setSelectedPaymentMethod(value)}
              className="grid grid-cols-3 gap-3 print:hidden"
            >
              {paymentMethods.map((method) => (
                <Label
                  key={method.value}
                  htmlFor={`payment-${method.value}`}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer
                    ${selectedPaymentMethod === method.value ? "border-primary bg-primary/10" : "border-muted"}`}
                >
                  <RadioGroupItem value={method.value} id={`payment-${method.value}`} className="sr-only" />
                  <method.icon className={`mb-1.5 h-5 w-5 ${selectedPaymentMethod === method.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${selectedPaymentMethod === method.value ? "text-primary" : ""}`}>{method.label}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="mt-2 text-xs print:block hidden"> {/* Visible only on print */}
              Selected: <span className="font-semibold">{selectedPaymentMethod}</span>
            </div>
          </div>
          
          <Separator className="my-4"/>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between">
                <span>Discount ({discountPercentage.toFixed(2)}%):</span>
                <span>- Rs. {calculatedDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-1"/>
            <div className="flex justify-between font-bold text-sm">
              <span>Total Amount:</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Separator className="my-4"/>

          <p className="text-center text-xs mt-6">Thank you for your purchase!</p>
          <p className="text-center text-xs">Please come again.</p>
        </div>

        <div className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handlePrintAndConfirm} disabled={cartItems.length === 0}><Printer className="mr-2 h-4 w-4" /> Confirm & Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
