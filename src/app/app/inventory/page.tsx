import { Archive } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InventoryDataTable } from "@/components/inventory/InventoryDataTable";

export default function InventoryPage() {
  return (
    <>
      <PageHeader 
        title="Inventory Management" 
        description="View current stock levels for all products."
        icon={Archive}
      />
      <InventoryDataTable />
    </>
  );
}
