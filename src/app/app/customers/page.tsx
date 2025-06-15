import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomerDataTable } from "@/components/customers/CustomerDataTable";

export default function CustomersPage() {
  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="Add, view, and manage your customers."
        icon={Users}
      />
      <CustomerDataTable />
    </>
  );
}
