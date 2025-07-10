
"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { AccessDenied } from "@/components/AccessDenied";
import { PlusCircle, Wallet, Loader2, Trash2 } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace("LKR", "Rs.");

export default function ExpensesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [category, setCategory] = useState("Fuel");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace("/app/dashboard");
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? customCategory.trim() : category;
    const numericAmount = parseFloat(amount);

    if (!finalCategory) {
      toast({ variant: "destructive", title: "Error", description: "Category is required." });
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid positive amount." });
      return;
    }

    setIsSubmitting(true);
    const newExpense: Omit<Expense, 'id'> = {
      category: finalCategory,
      amount: numericAmount,
      expenseDate: new Date(),
      description: finalCategory,
      staffId: currentUser?.username,
    };

    const result = await addExpense(newExpense);
    if (result) {
      toast({ title: "Success", description: "Expense added successfully." });
      setCategory("Fuel");
      setCustomCategory("");
      setAmount("");
    }
    setIsSubmitting(false);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);


  if (!currentUser) return <GlobalPreloaderScreen message="Loading expenses page..." />;
  if (currentUser.role !== "admin") return <AccessDenied message="You do not have permission to access this page." />;

  return (
    <>
      <PageHeader
        title="Manage Expenses"
        description="Log business expenses to accurately track net revenue."
        icon={Wallet}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fuel">Fuel</SelectItem>
                    <SelectItem value="Foods">Foods</SelectItem>
                    <SelectItem value="Other">Other (Specify)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === "Other" && (
                <div>
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g., Vehicle Repair"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="amount">Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Expense History</CardTitle>
            <CardDescription>
              Total Expenses:{" "}
              <span className="font-bold text-primary">{formatCurrency(totalExpenses)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-25rem)]">
              {isLoading && expenses.length === 0 ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : expenses.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground">
                    <p>No expenses recorded yet.</p>
                </div>
              ) : isMobile ? (
                  <div className="space-y-2">
                    {expenses.map(expense => (
                      <Card key={expense.id} className="p-3">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium capitalize">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">{format(expense.expenseDate, "PP")}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(expense)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                         </div>
                      </Card>
                    ))}
                  </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(expense.expenseDate, "yyyy-MM-dd")}</TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(expense)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the expense of {expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''} for "{expenseToDelete?.category}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
