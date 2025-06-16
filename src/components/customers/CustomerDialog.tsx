
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
import { useAuth } from "@/contexts/AuthContext";

interface CustomerDialogProps {
  customer?: Customer | null;
  trigger?: React.ReactNode; 
  onSave: (customer: Customer) => void;
  isEditMode: boolean; 
  open?: boolean; 
  onOpenChange?: (isOpen: boolean) => void; 
}

const defaultCustomer: Omit<Customer, 'id'> = {
  name: "",
  phone: "",
  address: "",
  shopName: "",
};

export function CustomerDialog({ 
  customer, 
  trigger, 
  onSave, 
  isEditMode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: CustomerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(
    customer && isEditMode ? { name: customer.name, phone: customer.phone, address: customer.address, shopName: customer.shopName } : defaultCustomer
  );
  const { currentUser } = useAuth(); // Use currentUser
  const userRole = currentUser?.role;
  const canEditDetails = userRole === 'admin';

  useEffect(() => {
    if (isOpen) {
      setFormData(customer && isEditMode ? { name: customer.name, phone: customer.phone, address: customer.address, shopName: customer.shopName } : defaultCustomer);
    }
  }, [isOpen, customer, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) {
      alert("Customer name and phone number are required."); // Replace with toast
      return;
    }
    onSave({ ...formData, id: (customer && isEditMode) ? customer.id : Date.now().toString() });
    setIsOpen(false);
  };

  const dialogTitle = isEditMode ? "Edit Customer" : "Add New Customer";
  const dialogDescription = isEditMode ? "Update customer details." : "Fill in the new customer's information.";

  const readOnlyForCashier = isEditMode && !canEditDetails;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" readOnly={readOnlyForCashier} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="mt-1" readOnly={readOnlyForCashier} />
            </div>
            <div>
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea id="address" name="address" value={formData.address || ""} onChange={handleChange} className="mt-1" rows={3} readOnly={readOnlyForCashier}/>
            </div>
            <div>
              <Label htmlFor="shopName">Shop Name (Optional)</Label>
              <Input id="shopName" name="shopName" value={formData.shopName || ""} onChange={handleChange} className="mt-1" readOnly={readOnlyForCashier} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          { (isEditMode && canEditDetails) || (!isEditMode && (userRole === 'admin' || userRole === 'cashier')) ? (
            <Button onClick={handleSubmit}>Save Customer</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

