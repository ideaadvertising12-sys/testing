"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/lib/types";
import { useEffect, useState } from "react";

interface CustomerDialogProps {
  customer?: Customer | null;
  trigger: React.ReactNode;
  onSave: (customer: Customer) => void;
}

const defaultCustomer: Customer = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  loyaltyPoints: 0,
};

export function CustomerDialog({ customer, trigger, onSave }: CustomerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Customer>(customer || defaultCustomer);

  useEffect(() => {
    if (isOpen) {
      setFormData(customer || defaultCustomer);
    }
  }, [isOpen, customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'loyaltyPoints' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert("Customer name is required."); // Replace with toast
      return;
    }
    onSave({ ...formData, id: customer?.id || Date.now().toString() });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Update customer details." : "Fill in the new customer's information."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} className="mt-1" rows={3}/>
            </div>
             <div>
              <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
              <Input id="loyaltyPoints" name="loyaltyPoints" type="number" value={formData.loyaltyPoints} onChange={handleChange} className="mt-1" min="0"/>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
