
import { View } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InventoryDataTable } from "@/components/inventory/InventoryDataTable";
import React from "react";

// InjectedHeadContent component removed

export default function ViewStockPage() {
  return (
    <>
      <PageHeader 
        title="View Stock Levels" 
        description="Current stock levels for all products."
        icon={View}
      />
      <InventoryDataTable />
      {/* InjectedHeadContent usage removed */}
      <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
    </>
  );
}
