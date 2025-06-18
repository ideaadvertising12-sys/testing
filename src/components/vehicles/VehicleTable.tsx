
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Truck, Edit, Trash2, MoreHorizontal } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEditVehicle: (vehicle: Vehicle) => void; // Placeholder for future edit
  onDeleteVehicle: (vehicleId: string) => void; // Placeholder for future delete
}

export function VehicleTable({ vehicles, onEditVehicle, onDeleteVehicle }: VehicleTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (vehicles.length === 0) {
    return (
      <Card className="shadow-md text-center">
        <CardHeader>
            <CardTitle className="font-headline">Registered Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No vehicles have been added yet.</p>
          <p className="text-sm text-muted-foreground">Use the form above to add your first vehicle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="font-headline">Registered Vehicles ({vehicles.length})</CardTitle>
        <CardDescription>List of all vehicles currently in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <ScrollArea className="h-[calc(100vh-25rem)]">
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary">{vehicle.vehicleNumber}</p>
                      <p className="text-sm text-muted-foreground">Driver: {vehicle.driverName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditVehicle(vehicle)} disabled>
                          <Edit className="mr-2 h-4 w-4" /> Edit (Soon)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteVehicle(vehicle.id)} className="text-destructive focus:text-destructive" disabled>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete (Soon)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {vehicle.notes && (
                    <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                      <strong>Notes:</strong> {vehicle.notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-28rem)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Badge variant="secondary">{vehicle.vehicleNumber}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{vehicle.driverName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {vehicle.notes || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEditVehicle(vehicle)} disabled>
                            <Edit className="mr-2 h-4 w-4" /> Edit (Coming Soon)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDeleteVehicle(vehicle.id)} className="text-destructive focus:text-destructive" disabled>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete (Coming Soon)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
