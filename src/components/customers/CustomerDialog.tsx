
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
  trigger?: React.ReactNode; // Made optional for controlled dialog
  onSave: (customer: Customer) => void;
  isEditMode: boolean; // To differentiate between add and edit
  open?: boolean; // For controlled dialog
  onOpenChange?: (isOpen: boolean) => void; // For controlled dialog
}

const defaultCustomer: Customer = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  loyaltyPoints: 0,
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

  const [formData, setFormData] = useState<Customer>(customer && isEditMode ? customer : defaultCustomer);
  const { userRole } = useAuth();
  const canEditDetails = userRole === 'admin';

  useEffect(() => {
    if (isOpen) {
      setFormData(customer && isEditMode ? customer : defaultCustomer);
    }
  }, [isOpen, customer, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'loyaltyPoints' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert("Customer name is required."); // Replace with toast
      return;
    }
    onSave({ ...formData, id: (customer && isEditMode) ? customer.id : Date.now().toString() });
    setIsOpen(false);
  };

  const dialogTitle = isEditMode ? "Edit Customer" : "Add New Customer";
  const dialogDescription = isEditMode ? "Update customer details." : "Fill in the new customer's information.";

  // For cashier, some fields might be read-only if they are editing (though current logic prevents cashier from editing)
  // This is more for if we allow cashiers to edit *some* fields in the future.
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
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} className="mt-1" readOnly={readOnlyForCashier} />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone || ""} onChange={handleChange} className="mt-1" readOnly={readOnlyForCashier} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address || ""} onChange={handleChange} className="mt-1" rows={3} readOnly={readOnlyForCashier}/>
            </div>
             <div>
              <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
              <Input id="loyaltyPoints" name="loyaltyPoints" type="number" value={formData.loyaltyPoints} onChange={handleChange} className="mt-1" min="0" readOnly={!canEditDetails}/>
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
