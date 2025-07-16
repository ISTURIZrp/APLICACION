"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const equipos = [
  { id: "EQ-01", nombre: "Sierra de Banco", modelo: "SB-2000", estado: "Operativo", ubicacion: "Taller Principal" },
  { id: "EQ-02", nombre: "Taladro de Columna", modelo: "TC-500", estado: "En Mantenimiento", ubicacion: "Área de Montaje" },
  { id: "EQ-03", nombre: "Compresor de Aire", modelo: "CA-150", estado: "Operativo", ubicacion: "Área de Pintura" },
  { id: "EQ-04", nombre: "Ruteadora CNC", modelo: "CNC-X1", estado: "Fuera de Servicio", ubicacion: "Almacén" },
  { id: "EQ-05", nombre: "Lijadora de Banda", modelo: "LB-300", estado: "Operativo", ubicacion: "Área de Acabados" },
];

export default function EquiposPage() {
    const getStatusBadge = (status: string) => {
    switch (status) {
      case "Operativo":
        return <Badge variant="success">Operativo</Badge>;
      case "En Mantenimiento":
        return <Badge variant="accent">En Mantenimiento</Badge>;
      case "Fuera de Servicio":
        return <Badge variant="destructive">Fuera de Servicio</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Equipos</CardTitle>
            <CardDescription>Gestiona el inventario y estado de los equipos.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Equipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Equipo</TableHead>
              <TableHead className="hidden md:table-cell">Modelo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Ubicación</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipos.map((equipo) => (
              <TableRow key={equipo.id}>
                <TableCell className="font-medium">{equipo.nombre}</TableCell>
                <TableCell className="hidden md:table-cell">{equipo.modelo}</TableCell>
                <TableCell>{getStatusBadge(equipo.estado)}</TableCell>
                <TableCell className="hidden md:table-cell">{equipo.ubicacion}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Historial</DropdownMenuItem>
                      <DropdownMenuItem>Registrar Mantenimiento</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive hover:!text-destructive-foreground hover:!bg-destructive">Dar de Baja</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
