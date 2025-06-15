
import { View } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InventoryDataTable } from "@/components/inventory/InventoryDataTable";

export default function ViewStockPage() {
  return (
    <>
      <PageHeader 
        title="View Stock Levels" 
        description="Current stock levels for all products."
        icon={View}
      />
      <InventoryDataTable />
    </>
  );
}
