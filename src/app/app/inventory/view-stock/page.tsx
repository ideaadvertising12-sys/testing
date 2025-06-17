
import { View } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InventoryDataTable } from "@/components/inventory/InventoryDataTable";
import React from "react";

const InjectedHeadContent = () => (
  <>
    <title>NGroup Products</title>
    <meta name="description" content="Point of Sale system for milk products." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
  </>
);

export default function ViewStockPage() {
  return (
    <>
      <PageHeader 
        title="View Stock Levels" 
        description="Current stock levels for all products."
        icon={View}
      />
      <InventoryDataTable />
      <InjectedHeadContent />
    </>
  );
}
