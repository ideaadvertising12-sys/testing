
"use client";

import Image from "next/image";
import { MoreHorizontal, Edit, Trash2, PlusCircle } from "lucide-react";
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

export function ProductDataTable() {
  const [products, setProducts] = useState<Product[]>(placeholderProducts);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  const handleSaveProduct = (productToSave: Product) => {
    if (!isAdmin) return; // Should not be callable by cashier
    if (editingProduct) {
      setProducts(products.map(p => p.id === productToSave.id ? productToSave : p));
    } else {
      setProducts([...products, { ...productToSave, id: Date.now().toString() }]); // Mock ID
    }
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!isAdmin) return; // Should not be callable by cashier
    setProducts(products.filter(p => p.id !== productId));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline">Product List</CardTitle>
        {isAdmin && (
          <ProductDialog
            product={null}
            onSave={handleSaveProduct}
            trigger={
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            }
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              {isAdmin && (
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
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
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
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
        {isAdmin && editingProduct && (
          <ProductDialog
            product={editingProduct}
            onSave={handleSaveProduct}
            trigger={<></>} 
          />
        )}
      </CardContent>
    </Card>
  );
}
