
"use client";

import { MoreHorizontal, Edit, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Customer } from "@/lib/types";
import { CustomerDialog } from "./CustomerDialog";
import { useState } from "react";
import { placeholderCustomers } from "@/lib/placeholder-data";
import { useAuth } from "@/contexts/AuthContext";

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

export function CustomerDataTable() {
  const [customers, setCustomers] = useState<Customer[]>(placeholderCustomers);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { userRole } = useAuth();
  const canManageCustomers = userRole === 'admin'; // Full manage for admin
  const canAddCustomers = userRole === 'admin' || userRole === 'cashier';

  const handleSaveCustomer = (customerToSave: Customer) => {
    if (editingCustomer) { // This implies editing, only for admin
      if (!canManageCustomers) return;
      setCustomers(customers.map(c => c.id === customerToSave.id ? customerToSave : c));
    } else { // Adding new customer
      if (!canAddCustomers) return;
      setCustomers([...customers, { ...customerToSave, id: Date.now().toString() }]);
    }
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (!canManageCustomers) return;
    setCustomers(customers.filter(c => c.id !== customerId));
  };
  
  const handleEditCustomer = (customer: Customer) => {
    if (!canManageCustomers) return;
    setEditingCustomer(customer);
  }


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">Customer List</CardTitle>
        {canAddCustomers && (
          <CustomerDialog
            customer={null} // For adding new
            onSave={handleSaveCustomer}
            isEditMode={false} // Explicitly false for add dialog
            trigger={
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell text-right">Loyalty Points</TableHead>
              {canManageCustomers && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 hidden sm:flex">
                      {/* <AvatarImage src={`https://i.pravatar.cc/40?u=${customer.email || customer.id}`} alt={customer.name} data-ai-hint="customer avatar" /> */}
                      <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.email || "N/A"}</TableCell>
                <TableCell className="hidden md:table-cell">{customer.phone || "N/A"}</TableCell>
                <TableCell className="hidden md:table-cell text-right">{customer.loyaltyPoints || 0}</TableCell>
                {canManageCustomers && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                           <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteCustomer(customer.id)}>
                           <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* This dialog is now only for editing by admin */}
        {canManageCustomers && editingCustomer && (
          <CustomerDialog
            customer={editingCustomer}
            onSave={handleSaveCustomer}
            isEditMode={true} // Explicitly true for edit dialog
            onOpenChange={(isOpen) => { if (!isOpen) setEditingCustomer(null); }} // Reset editingCustomer when dialog closes
            open={!!editingCustomer} // Control dialog visibility
            trigger={<></>} // Trigger is handled by edit button
          />
        )}
      </CardContent>
    </Card>
  );
}
