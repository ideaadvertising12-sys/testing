
"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Undo2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReturnInvoicesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading return invoices..." />;
  }

  return (
    <>
      <PageHeader
        title="Return Invoice History"
        description="View and manage all processed returns and exchanges."
        icon={Undo2}
      />
      <Card>
        <CardHeader>
          <CardTitle>All Returns</CardTitle>
          <CardDescription>
            A complete log of all return and exchange transactions. This feature is under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Return invoice data table will be displayed here.</p>
        </CardContent>
      </Card>
    </>
  );
}
