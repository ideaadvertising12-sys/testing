
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { placeholderProducts } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PackageSearch } from "lucide-react";

export function InventoryDataTable() {
  const [products] = useState<Product[]>(placeholderProducts); // Use placeholder data
  const [searchTerm, setSearchTerm] = useState("");

  const getStockStatus = (stock: number, reorderLevel?: number) => {
    if (reorderLevel === undefined) reorderLevel = 10; // Default reorder level
    if (stock <= 0) return { text: "Out of Stock", color: "bg-red-500 text-destructive-foreground", variant: "destructive" as const };
    if (stock <= reorderLevel) return { text: "Low Stock", color: "bg-orange-500 text-destructive-foreground", variant: "default" as const }; 
    return { text: "In Stock", color: "bg-green-500 text-primary-foreground", variant: "default" as const }; 
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Inventory Status</CardTitle>
        <CardDescription>Current stock levels for all products.</CardDescription>
        <div className="relative mt-4">
          <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by product name or SKU..."
            className="pl-10 w-full sm:w-1/2 lg:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <PackageSearch className="w-16 h-16 mb-4" />
              <p className="text-xl">No products found matching your search.</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[80px] sm:table-cell">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="hidden md:table-cell text-center">Reorder Level</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.stock, product.reorderLevel);
              
              return (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="48"
                      src={product.imageUrl || "https://placehold.co/48x48.png"}
                      width="48"
                      data-ai-hint={`${product.category.toLowerCase()} inventory`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{product.stock}</TableCell>
                  <TableCell className="hidden md:table-cell text-center">{product.reorderLevel || 10}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(status.color, "text-xs")}>{status.text}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}

