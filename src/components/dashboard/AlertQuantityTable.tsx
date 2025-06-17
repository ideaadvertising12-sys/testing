
"use client";

import { placeholderProducts } from "@/lib/placeholder-data";
import type { Product } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Package } from "lucide-react"; // Combined Package import

export function AlertQuantityTable() {
  const productsToReorder = placeholderProducts.filter(
    product => product.stock <= (product.reorderLevel || 10) // Default reorder level to 10 if not specified
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle className="font-headline text-xl">Low Stock Alerts</CardTitle>
        </div>
        <CardDescription>Products that have reached or fallen below their reorder quantity.</CardDescription>
      </CardHeader>
      <CardContent>
        {productsToReorder.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
            <Package className="w-16 h-16 mb-4 text-green-500" />
            <p className="text-xl">All Products Well Stocked!</p>
            <p>No products currently need reordering.</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] hidden sm:table-cell">SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Alert Qty</TableHead>
                  <TableHead className="text-right">Current Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsToReorder.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs hidden sm:table-cell">{product.sku || "N/A"}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.reorderLevel || 10}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
