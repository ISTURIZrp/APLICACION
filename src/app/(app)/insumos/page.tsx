"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const insumos = [
  { name: "Tornillos de Acero", sku: "TRN-001", stock: 1500, unit: "unidades", status: "En Stock" },
  { name: "Planchas de Melamina", sku: "PLM-002", stock: 250, unit: "planchas", status: "En Stock" },
  { name: "Pintura Blanca", sku: "PNT-003", stock: 45, unit: "litros", status: "Bajo Stock" },
  { name: "Pegamento de Contacto", sku: "PEG-004", stock: 80, unit: "litros", status: "En Stock" },
  { name: "Rieles para Cajón", sku: "RIL-005", stock: 300, unit: "pares", status: "En Stock" },
  { name: "Bisagras", sku: "BSG-006", stock: 0, unit: "unidades", status: "Agotado" },
];

export default function InsumosPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Insumos</CardTitle>
            <CardDescription>Gestiona tus insumos y niveles de stock.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Insumo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insumos.map((insumo) => (
              <TableRow key={insumo.sku}>
                <TableCell className="font-medium">{insumo.name}</TableCell>
                <TableCell className="hidden md:table-cell">{insumo.sku}</TableCell>
                <TableCell>{insumo.stock} {insumo.unit}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge 
                    variant={
                      insumo.status === 'En Stock' ? 'secondary' 
                      : insumo.status === 'Bajo Stock' ? 'accent' 
                      : insumo.status === 'Agotado' ? 'destructive' 
                      : 'outline'
                    }
                  >
                    {insumo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ver Movimientos</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive hover:!text-destructive-foreground hover:!bg-destructive">Eliminar</DropdownMenuItem>
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
