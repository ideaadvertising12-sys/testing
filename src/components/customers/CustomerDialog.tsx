
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
import { Loader2 } from "lucide-react";

const defaultCustomer: Omit<Customer, 'id'> = {
  name: "",
  phone: "",
  address: "",
  shopName: "",
  avatar: "",
};

interface CustomerDialogProps {
  customer?: Customer | null;
  trigger?: React.ReactNode;
  onSave: (customer: Customer) => Promise<void> | void;
  isEditMode?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function CustomerDialog({
  customer,
  trigger,
  onSave,
  isEditMode = false, // Default to false if not provided
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CustomerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const [formData, setFormData] = useState<Omit<Customer, 'id'>>(defaultCustomer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;

  const actualIsEditMode = !!customer; // Determine if it's an edit based on customer prop

  const canEditFields = !actualIsEditMode || userRole === 'admin'; // Fields editable if new OR admin is editing
  const canSubmitForm = actualIsEditMode ? userRole === 'admin' : (userRole === 'admin' || userRole === 'cashier'); // Submit if admin (edit) OR admin/cashier (new)


  useEffect(() => {
    if (isOpen) {
      setFormData(customer ? { // If customer exists, it's an edit, populate with its data
        name: customer.name,
        phone: customer.phone,
        address: customer.address || "",
        shopName: customer.shopName || "",
        avatar: customer.avatar || ""
      } : defaultCustomer); // Otherwise, it's a new customer, use defaults
    }
  }, [isOpen, customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        id: customer?.id || Date.now().toString(), // Use existing ID if editing, else generate
        avatar: formData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`
      });
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {actualIsEditMode ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
            <DialogDescription>
              {actualIsEditMode ? "Update customer details below." : "Fill in the customer information."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block mb-2 font-medium">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  disabled={!canEditFields}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block mb-2 font-medium">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  required
                  disabled={!canEditFields}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="shopName" className="block mb-2 font-medium">
                  Shop Name
                </Label>
                <Input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Doe's Shop"
                  disabled={!canEditFields}
                  className="h-11"
                />
              </div>

              <div>
                <Label htmlFor="address" className="block mb-2 font-medium">
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City"
                  disabled={!canEditFields}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {canSubmitForm && (
              <Button type="submit" disabled={isSubmitting || !formData.name || !formData.phone}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  actualIsEditMode ? "Update Customer" : "Add Customer"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
