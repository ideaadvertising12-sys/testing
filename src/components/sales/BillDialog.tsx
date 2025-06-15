
"use client";

import type { CartItem, Customer } from "@/lib/types";
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
import { Printer } from "lucide-react";

interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  customer: Customer | null;
  discountAmount: number;
  saleId?: string; 
}

export function BillDialog({ isOpen, onOpenChange, cartItems, customer, discountAmount, saleId }: BillDialogProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const transactionDate = new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-w-full print:max-h-full print:m-0 print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="font-headline">Transaction Receipt</DialogTitle>
          <DialogDescription>
            Details of the completed sale. You can print this receipt.
          </DialogDescription>
        </DialogHeader>
        
        <div id="bill-content" className="flex-grow overflow-y-auto p-6 bg-card text-card-foreground rounded-md print:p-0 print:bg-transparent print:text-black">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
               <AppLogo size="md"/>
            </div>
            <p className="text-sm">123 Milk Lane, Dairyville, CA 98765</p>
            <p className="text-sm">Phone: (555) 123-MILK</p>
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
          <ScrollArea className="max-h-[200px] print:max-h-none print:overflow-visible">
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

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>- Rs. {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-1"/>
            <div className="flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Separator className="my-4"/>

          <p className="text-center text-xs mt-6">Thank you for your purchase!</p>
          <p className="text-center text-xs">Please come again.</p>
        </div>

        <div className="mt-auto p-6 border-t print:hidden flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
           <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
