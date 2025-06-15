
"use client";

import Image from "next/image";
import { MoreHorizontal, Edit, Trash2, PlusCircle, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { Product } from "@/lib/types";
import { ProductDialog } from "./ProductDialog";
import { useState } from "react";
import { placeholderProducts } from "@/lib/placeholder-data";
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProductDataTable() {
  const [products, setProducts] = useState<Product[]>(placeholderProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const handleSaveProduct = (productToSave: Product) => {
    if (!isAdmin) return; 
    if (editingProduct) {
      setProducts(products.map(p => p.id === productToSave.id ? productToSave : p));
    } else {
      // For new products, assign a unique ID if not already present (e.g. from dialog)
      const newProduct = { ...productToSave, id: productToSave.id || Date.now().toString() };
      setProducts([...products, newProduct]); 
    }
    setEditingProduct(null);
  };

  const openDeleteConfirmation = (productId: string) => {
    if (!isAdmin) return;
    setProductToDeleteId(productId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteProduct = () => {
    if (!isAdmin || !productToDeleteId) return; 
    setProducts(products.filter(p => p.id !== productToDeleteId));
    setIsDeleteAlertOpen(false);
    setProductToDeleteId(null);
  };

  const filteredDisplayProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="font-headline shrink-0">Product List</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <ProductDialog
                product={null}
                onSave={handleSaveProduct}
                trigger={
                  <Button size="sm" className="w-full sm:w-auto shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredDisplayProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <PackageSearch className="w-16 h-16 mb-4" />
                <p className="text-xl">No products found matching your search.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Wholesale Price</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                {isAdmin && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisplayProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.imageUrl || "https://placehold.co/64x64.png"}
                      width="64"
                      data-ai-hint={`${product.category.toLowerCase()} product`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    {product.wholesalePrice !== undefined ? `Rs. ${product.wholesalePrice.toFixed(2)}` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">Rs. {product.price.toFixed(2)}</TableCell>
                  {isAdmin && (
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
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteConfirmation(product.id)}>
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
          )}
          {isAdmin && editingProduct && (
            <ProductDialog
              product={editingProduct}
              onSave={handleSaveProduct}
              trigger={<></>} 
              open={!!editingProduct}
              onOpenChange={(isOpen) => { if (!isOpen) setEditingProduct(null); }}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              Yes, delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
