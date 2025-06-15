import { Package, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductDataTable } from "@/components/products/ProductDataTable";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  return (
    <>
      <PageHeader 
        title="Product Management" 
        description="Add, view, and manage your products."
        icon={Package}
        // Action button is now part of ProductDataTable's header
      />
      <ProductDataTable />
    </>
  );
}
