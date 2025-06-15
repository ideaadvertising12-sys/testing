
"use client";

import type { FullReportEntry } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface FullReportTableProps {
  data: FullReportEntry[];
}

export function FullReportTable({ data }: FullReportTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground">No report data available.</p>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Line Total</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Staff ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={`${entry.saleId}-${entry.productSku}-${index}`}>
              <TableCell className="font-mono text-xs">{entry.saleId}</TableCell>
              <TableCell>{entry.saleDate}</TableCell>
              <TableCell>{entry.saleTime}</TableCell>
              <TableCell>{entry.customerName}</TableCell>
              <TableCell className="font-mono text-xs">{entry.productSku}</TableCell>
              <TableCell className="font-medium">{entry.productName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.productCategory}</Badge>
              </TableCell>
              <TableCell className="text-right">{entry.quantity}</TableCell>
              <TableCell className="text-right">Rs. {entry.appliedPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">Rs. {entry.lineTotal.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={entry.saleType === 'wholesale' ? 'default' : 'outline'} 
                       className={entry.saleType === 'wholesale' ? 'bg-blue-500 text-white' : ''}>
                  {entry.saleType}
                </Badge>
              </TableCell>
              <TableCell>{entry.paymentMethod}</TableCell>
              <TableCell>{entry.staffId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
