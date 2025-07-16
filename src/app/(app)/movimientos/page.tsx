"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const movimientos = [
  { insumo: "Planchas de Melamina", tipo: "Entrada", cantidad: 100, fecha: "2023-10-25", responsable: "Juan Perez" },
  { insumo: "Tornillos de Acero", tipo: "Salida", cantidad: 500, fecha: "2023-10-24", responsable: "Ana Torres" },
  { insumo: "Pintura Blanca", tipo: "Salida", cantidad: 10, fecha: "2023-10-24", responsable: "Ana Torres" },
  { insumo: "Pegamento de Contacto", tipo: "Entrada", cantidad: 20, fecha: "2023-10-22", responsable: "Juan Perez" },
  { insumo: "Tornillos de Acero", tipo: "Entrada", cantidad: 2000, fecha: "2023-10-20", responsable: "Juan Perez" },
  { insumo: "Rieles para Cajón", tipo: "Salida", cantidad: 50, fecha: "2023-10-19", responsable: "Carlos Ruiz" },
];

export default function MovimientosPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos de Insumos</CardTitle>
        <CardDescription>Historial de entradas y salidas de todos los insumos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Insumo</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead className="hidden md:table-cell">Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((mov, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{mov.insumo}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={mov.tipo === 'Entrada' ? 'success' : 'destructive'}>
                    {mov.tipo === 'Entrada' ? 
                      <ArrowDownCircle className="mr-2 h-4 w-4" /> : 
                      <ArrowUpCircle className="mr-2 h-4 w-4" />}
                    {mov.tipo}
                  </Badge>
                </TableCell>
                <TableCell>{mov.cantidad}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(mov.fecha).toLocaleDateString()}</TableCell>
                <TableCell className="hidden md:table-cell">{mov.responsable}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
