
"use client";

import React, { useState, useEffect } from "react";
import { ListPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import type { Vehicle } from "@/lib/types";
import { placeholderVehicles } from "@/lib/placeholder-data";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useToast } from "@/hooks/use-toast";

export default function ManageVehiclesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>(placeholderVehicles);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const handleAddVehicle = (newVehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: `veh-${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setVehicles((prevVehicles) => [newVehicle, ...prevVehicles]);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    toast({
      title: "Feature Coming Soon",
      description: `Editing vehicle ${vehicle.vehicleNumber} is not yet implemented. Contact Limidora to enable this premium feature.`,
    });
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    toast({
      title: "Feature Coming Soon",
      description: `Deleting vehicle ${vehicle?.vehicleNumber || 'ID: '+vehicleId} is not yet implemented. Contact Limidora to enable this premium feature.`,
      variant: "default" 
    });
  };

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading vehicle management..." />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied message="Vehicle management is not available for your role. Redirecting..." />;
  }

  const existingVehicleNumbers = vehicles.map(v => v.vehicleNumber);

  return (
    <>
      <PageHeader 
        title="Manage Vehicles" 
        description="Add new vehicles and view existing ones."
        icon={ListPlus}
      />
      <div className="space-y-6">
        <VehicleForm onAddVehicle={handleAddVehicle} existingVehicleNumbers={existingVehicleNumbers} />
        <VehicleTable 
          vehicles={vehicles} 
          onEditVehicle={handleEditVehicle} 
          onDeleteVehicle={handleDeleteVehicle} 
        />
      </div>
    </>
  );
}
