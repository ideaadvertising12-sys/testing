
"use client";

import { MoreHorizontal, Edit, Trash2, PlusCircle, Users2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Customer } from "@/lib/types";
import { CustomerDialog } from "./CustomerDialog";
import { useState } from "react";
import { placeholderCustomers } from "@/lib/placeholder-data";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent, // Renamed to avoid conflict
} from "@/components/ui/alert-dialog";

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

export function CustomerDataTable() {
  const [customers, setCustomers] = useState<Customer[]>(placeholderCustomers);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;
  
  const canManageCustomers = userRole === 'admin'; 
  const canAddCustomers = userRole === 'admin' || userRole === 'cashier';

  const handleSaveCustomer = (customerToSave: Customer) => {
    if (editingCustomer) { 
      if (!canManageCustomers) return;
      setCustomers(customers.map(c => c.id === customerToSave.id ? customerToSave : c));
    } else { 
      if (!canAddCustomers) return;
      setCustomers([...customers, { ...customerToSave, id: Date.now().toString() }]);
    }
    setEditingCustomer(null);
  };

  const openDeleteConfirmation = (customerId: string) => {
    if (!canManageCustomers) return;
    setCustomerToDeleteId(customerId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteCustomer = () => {
    if (!canManageCustomers || !customerToDeleteId) return;
    setCustomers(customers.filter(c => c.id !== customerToDeleteId));
    setIsDeleteAlertOpen(false);
    setCustomerToDeleteId(null);
  };
  
  const handleEditCustomer = (customer: Customer) => {
    if (!canManageCustomers) return;
    setEditingCustomer(customer);
  }

  const filteredCustomers = customers.filter(customer => {
    const term = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.shopName && customer.shopName.toLowerCase().includes(term)) ||
      customer.phone.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="font-headline shrink-0">Customer List</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {canAddCustomers && (
              <CustomerDialog
                customer={null} 
                onSave={handleSaveCustomer}
                isEditMode={false} 
                trigger={
                  <Button size="sm" className="w-full sm:w-auto shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Users2 className="w-16 h-16 mb-4" />
              <p className="text-xl">No customers found.</p>
              {searchTerm && <p>Try adjusting your search term.</p>}
            </div>
          ) : (
            <>
              {/* Mobile Card View - hidden on md and larger screens */}
              <div className="md:hidden space-y-4">
                {filteredCustomers.map((customer) => (
                  <Card key={customer.id} className="w-full">
                    <CardHeader className="p-4 flex flex-row justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-lg font-semibold">{customer.name}</CardTitle>
                        </div>
                        {customer.shopName && <p className="text-sm text-muted-foreground mt-1 ml-12">{customer.shopName}</p>}
                      </div>
                      {canManageCustomers && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8 -mt-1 -mr-1">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteConfirmation(customer.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="font-medium w-20 shrink-0">Phone:</span>
                          <span className="text-muted-foreground truncate">{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex">
                            <span className="font-medium w-20 shrink-0">Address:</span>
                            <span className="text-muted-foreground">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View - hidden on screens smaller than md */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Shop Name</TableHead>
                      {canManageCustomers && (
                        <TableHead className="text-right">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 hidden sm:flex">
                              <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.address || "N/A"}</TableCell>
                        <TableCell>{customer.shopName || "N/A"}</TableCell>
                        {canManageCustomers && (
                          <TableCell className="text-right">
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
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteConfirmation(customer.id)}>
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
              </div>
            </>
          )}
          {canManageCustomers && editingCustomer && (
            <CustomerDialog
              customer={editingCustomer}
              onSave={handleSaveCustomer}
              isEditMode={true} 
              onOpenChange={(isOpen) => { if (!isOpen) setEditingCustomer(null); }}
              open={!!editingCustomer} 
              trigger={<></>} 
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleComponent>Are you absolutely sure?</AlertDialogTitleComponent>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">
              Yes, delete customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

