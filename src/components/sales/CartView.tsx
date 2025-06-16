
"use client";

import * as React from "react";
import type { CartItem, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle, Trash2, Users, XCircle, Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { placeholderCustomers } from "@/lib/placeholder-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


interface CartViewProps {
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  discountPercentage: number;
  onUpdateQuantity: (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => void;
  onRemoveItem: (productId: string, saleType: 'retail' | 'wholesale') => void;
  onSelectCustomer: (customerId: string | null) => void;
  onUpdateDiscountPercentage: (percentage: number) => void;
  onCheckout: () => void;
  onCancelOrder: () => void;
}

export function CartView({
  cartItems,
  selectedCustomer,
  discountPercentage,
  onUpdateQuantity,
  onRemoveItem,
  onSelectCustomer,
  onUpdateDiscountPercentage,
  onCheckout,
  onCancelOrder
}: CartViewProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const [openCustomerPopover, setOpenCustomerPopover] = React.useState(false);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newPercentage = parseFloat(e.target.value) || 0;
    newPercentage = Math.max(0, Math.min(newPercentage, 100)); // Discount percentage between 0 and 100
    onUpdateDiscountPercentage(newPercentage);
  };

  const calculatedDiscountAmount = subtotal * (discountPercentage / 100);
  const totalAmount = Math.max(0, subtotal - calculatedDiscountAmount);

  const customerOptions = [
    { value: "guest", label: "Walk-in / Guest" },
    ...placeholderCustomers.map(customer => ({
      value: customer.id,
      label: `${customer.name} (${customer.phone || 'N/A'})${customer.shopName ? ` - ${customer.shopName}` : ''}`,
      name: customer.name,
      shopName: customer.shopName
    }))
  ];

  const currentCustomerLabel = selectedCustomer
    ? customerOptions.find(opt => opt.value === selectedCustomer.id)?.label
    : "Walk-in / Guest";

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-xl flex flex-col h-full">
      <CardHeader className="flex flex-col space-y-1.5 p-4"> {/* Reduced padding */}
        <CardTitle className="font-semibold tracking-tight font-headline text-xl">Current Order</CardTitle>
        <div className="flex items-center gap-2 pt-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCustomerPopover}
                className="w-full justify-between flex-1"
              >
                <span className="truncate">
                  {currentCustomerLabel || "Select Customer..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command
                filter={(value, search) => {
                  const option = customerOptions.find(opt => opt.value === value);
                  if (!option) return 0;
                  let searchableString = option.label.toLowerCase();
                  if ('name' in option && option.name) {
                    searchableString += ` ${option.name.toLowerCase()}`;
                  }
                  if ('shopName' in option && option.shopName) {
                    searchableString += ` ${option.shopName.toLowerCase()}`;
                  }
                  return searchableString.includes(search.toLowerCase()) ? 1 : 0;
                }}
              >
                <CommandInput placeholder="Search customer..." />
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {customerOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          onSelectCustomer(currentValue === "guest" ? null : currentValue);
                          setOpenCustomerPopover(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (selectedCustomer?.id === option.value || (!selectedCustomer && option.value === "guest"))
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0"> {/* flex-1 and min-h-0 */}
        <ScrollArea className="h-full"> {/* Ensure ScrollArea takes full height of CardContent */}
          {cartItems.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="divide-y divide-border">
              {cartItems.map((item, index) => ( 
                <div key={`${item.id}-${item.saleType}-${index}`} className="flex items-center p-4 space-x-3">
                  <Image
                    src={item.imageUrl || "https://placehold.co/48x48.png"}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md aspect-square object-cover"
                    data-ai-hint={`${item.category.toLowerCase()} product`}
                  />
                  <div className="flex-grow min-w-0"> {/* Added min-w-0 for truncation */}
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rs. {item.appliedPrice.toFixed(2)}
                      {item.saleType === 'wholesale' && <span className="text-blue-500 ml-1">(W)</span>}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.saleType)}
                      disabled={item.quantity <= 1}
                    >
                      <MinusCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1, item.saleType)}
                      className="h-7 w-12 text-center px-1"
                      min="1"
                      max={item.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.saleType)}
                      disabled={item.quantity >= item.stock}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold w-16 text-right shrink-0"> {/* Added shrink-0 */}
                    Rs. {(item.appliedPrice * item.quantity).toFixed(2)}
                  </p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => onRemoveItem(item.id, item.saleType)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {cartItems.length > 0 && (
        <CardFooter className="items-center flex flex-col space-y-3 p-4 border-t"> {/* Reduced padding */}
          <div className="w-full flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="w-full flex items-center justify-between text-sm">
            <Label htmlFor="discountPercentage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 shrink-0">Discount (%):</Label>
            <Input
              id="discountPercentage"
              type="number"
              value={discountPercentage.toString()}
              onChange={handleDiscountChange}
              className="flex h-8 w-24 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-right ml-2"
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          {discountPercentage > 0 && (
            <div className="w-full flex justify-between text-sm text-muted-foreground">
                <span>Discount Amount:</span>
                <span>- Rs. {calculatedDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-1" />
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
