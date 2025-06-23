
"use client";

import type { FullReportEntry } from "@/lib/types";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Smartphone, Laptop, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import { format } from "date-fns";

interface FullReportTableProps {
  data: FullReportEntry[];
  isLoading?: boolean;
}

export function FullReportTable({ data, isLoading }: FullReportTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-4 max-w-md">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">No report data available</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or check back later
          </p>
          <Button variant="outline" className="mt-4">
            <Filter className="mr-2 h-4 w-4" />
            Adjust Filters
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2 p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Sales Report</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {data.map((entry, index) => {
          const rowKey = `${entry.saleId}-${entry.productName}-${index}`;
          const isExpanded = expandedRow === rowKey;
          
          return (
            <div 
              key={rowKey}
              className={`rounded-lg border p-3 transition-all ${isExpanded ? "bg-muted/50" : ""}`}
              onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{entry.productName}</p>
                  <p className="text-xs text-muted-foreground">{entry.saleDate}</p>
                </div>
                <Badge 
                  variant={entry.saleType === 'wholesale' ? 'default' : 'outline'} 
                  className={entry.saleType === 'wholesale' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                  {entry.saleType}
                </Badge>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Qty</p>
                  <p>{entry.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p>Rs. {entry.appliedPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium">Rs. {entry.lineTotal.toFixed(2)}</p>
                </div>
                 <div>
                  <p className="text-xs text-muted-foreground">Close Date</p>
                  <p>{entry.invoiceCloseDate || "N/A"}</p>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Sale ID</p>
                    <p className="font-mono">{entry.saleId}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Customer</p>
                    <p>{entry.customerName || "Walk-in"}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Category</p>
                    <Badge variant="secondary">{entry.productCategory}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Payment</p>
                    <p className="text-right">{entry.paymentMethod}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Staff</p>
                    <p className="font-mono">{entry.staffId}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[calc(100vh-25rem)] w-full overflow-auto rounded-lg border shadow-sm">
        <table className="w-full caption-bottom text-sm min-w-[1200px]">
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Sale ID</TableHead>
              <TableHead className="w-[90px]">Sale Date</TableHead>
              <TableHead className="w-[90px]">Close Date</TableHead>
              <TableHead className="w-[80px]">Time</TableHead>
              <TableHead className="min-w-[120px]">Customer</TableHead>
              <TableHead className="min-w-[150px]">Product</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead className="w-[60px] text-right">Qty</TableHead>
              <TableHead className="w-[90px] text-right">Unit Price</TableHead>
              <TableHead className="w-[100px] text-right">Total</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[150px]">Payment</TableHead>
              <TableHead className="w-[80px]">Staff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, index) => (
              <TableRow 
                key={`${entry.saleId}-${entry.productName}-${index}`} 
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-mono text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="block truncate max-w-[80px]">
                        {entry.saleId}
                      </TooltipTrigger>
                      <TooltipContent>{entry.saleId}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{entry.saleDate}</TableCell>
                <TableCell>{entry.invoiceCloseDate || 'N/A'}</TableCell>
                <TableCell>{entry.saleTime}</TableCell>
                <TableCell className="truncate max-w-[120px]">
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="truncate block">
                        {entry.customerName || "Walk-in"}
                      </TooltipTrigger>
                      <TooltipContent>{entry.customerName || "Walk-in"}</TooltipContent>
                    </Tooltip>
                   </TooltipProvider>
                </TableCell>
                <TableCell className="font-medium truncate max-w-[150px]">
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="truncate block">
                        {entry.productName}
                      </TooltipTrigger>
                      <TooltipContent>{entry.productName}</TooltipContent>
                    </Tooltip>
                   </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="max-w-[100px] truncate">
                    {entry.productCategory}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{entry.quantity}</TableCell>
                <TableCell className="text-right">Rs. {entry.appliedPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">
                  Rs. {entry.lineTotal.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={entry.saleType === 'wholesale' ? 'default' : 'outline'} 
                    className={
                      entry.saleType === 'wholesale' 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }
                  >
                    {entry.saleType}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="truncate block max-w-[140px] cursor-default text-left">
                        {entry.paymentMethod}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-card p-2 border shadow-lg rounded-md">
                        <div className="font-bold text-sm mb-1">Payment History</div>
                        <div className="space-y-1">
                          {entry.paymentDetails.map((detail, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-semibold">{format(detail.date, 'PP p')}: </span>
                              <span>{detail.summary}</span>
                            </div>
                          ))}
                          {entry.paymentDetails.length === 0 && <p className="text-xs">No payment details recorded.</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {entry.staffId}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
