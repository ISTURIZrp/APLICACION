"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const pedidos = [
  { id: "PED-001", fecha: "2023-10-22", proveedor: "Proveedor B", estado: "Entregado" },
  { id: "PED-002", fecha: "2023-10-25", proveedor: "Proveedor A", estado: "Pendiente" },
  { id: "PED-003", fecha: "2023-10-28", proveedor: "Proveedor C", estado: "En Camino" },
  { id: "PED-004", fecha: "2023-11-01", proveedor: "Proveedor B", estado: "Cancelado" },
  { id: "PED-005", fecha: "2023-11-05", proveedor: "Proveedor A", estado: "Pendiente" },
];

export default function PedidosPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Entregado":
        return <Badge variant="success">Entregado</Badge>;
      case "Pendiente":
        return <Badge variant="accent">Pendiente</Badge>;
      case "En Camino":
        return <Badge variant="secondary">En Camino</Badge>;
      case "Cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pedidos de Insumos</CardTitle>
            <CardDescription>Consulta y gestiona los pedidos realizados a proveedores.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/registro-pedidos">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-medium">{pedido.id}</TableCell>
                <TableCell>{new Date(pedido.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{pedido.proveedor}</TableCell>
                <TableCell>{getStatusBadge(pedido.estado)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Marcar como Recibido</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive hover:!text-destructive-foreground hover:!bg-destructive">Cancelar Pedido</DropdownMenuItem>
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
