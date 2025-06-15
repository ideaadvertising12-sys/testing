
import { PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ManageStockForm } from "@/components/inventory/ManageStockForm";

export default function ManageStockPage() {
  return (
    <>
      <PageHeader 
        title="Manage Stock / Transactions" 
        description="Add, remove, or transfer product stock."
        icon={PlusSquare}
      />
      <ManageStockForm />
    </>
  );
}
