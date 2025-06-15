
"use client";

import type { CartItem, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle, Trash2, Users, XCircle } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { placeholderCustomers } from "@/lib/placeholder-data";

interface CartViewProps {
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  discountAmount: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onSelectCustomer: (customerId: string | null) => void;
  onUpdateDiscountAmount: (amount: number) => void;
  onCheckout: () => void;
  onCancelOrder: () => void; 
}

export function CartView({ 
  cartItems, 
  selectedCustomer,
  discountAmount,
  onUpdateQuantity, 
  onRemoveItem,
  onSelectCustomer,
  onUpdateDiscountAmount,
  onCheckout,
  onCancelOrder
}: CartViewProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newDiscount = parseFloat(e.target.value) || 0;
    newDiscount = Math.max(0, Math.min(newDiscount, subtotal)); // Prevent negative discount or discount > subtotal
    onUpdateDiscountAmount(newDiscount);
  };
  
  const totalAmount = Math.max(0, subtotal - discountAmount); // Ensure total is not negative

  return (
    <Card className="shadow-xl flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Current Order</CardTitle>
        <div className="flex items-center gap-2 pt-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <Select 
              value={selectedCustomer?.id || ""} 
              onValueChange={(value) => onSelectCustomer(value === "guest" ? null : value)}
            >
            <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select Customer (Optional)" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="guest">Walk-in / Guest</SelectItem>
                {placeholderCustomers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone || customer.email})
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="flex-grow min-h-[150px]">
          {cartItems.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center p-4 space-x-3">
                  <Image
                    src={item.imageUrl || "https://placehold.co/64x64.png"}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md aspect-square object-cover"
                    data-ai-hint={`${item.category.toLowerCase()} product`}
                  />
                  <div className="flex-grow">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Rs. {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <MinusCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="h-7 w-12 text-center px-1"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                       disabled={item.quantity >= item.stock}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-right">
                    Rs. {(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {cartItems.length > 0 && (
        <CardFooter className="flex flex-col space-y-3 p-4 border-t">
          <div className="w-full flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex items-center justify-between text-sm">
            <Label htmlFor="discountAmount" className="shrink-0">Discount (Rs.):</Label>
            <Input 
              id="discountAmount"
              type="number"
              value={discountAmount.toString()} // Control the input value
              onChange={handleDiscountChange}
              className="h-8 w-24 text-right ml-2"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <Separator />
          <div className="w-full flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="w-full grid grid-cols-2 gap-2 mt-2">
            <Button 
              variant="outline" 
              className="text-base py-3 h-auto" 
              onClick={onCancelOrder}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
            <Button 
              className="text-base py-3 h-auto" 
              onClick={onCheckout} 
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
