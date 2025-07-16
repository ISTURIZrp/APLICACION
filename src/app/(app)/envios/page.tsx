"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const envios = [
  { id: "ENV-001", cliente: "Cliente Final A", fecha: "2023-10-26", estado: "Entregado" },
  { id: "ENV-002", cliente: "Distribuidor B", fecha: "2023-10-27", estado: "En Tránsito" },
  { id: "ENV-003", cliente: "Cliente Final C", fecha: "2023-10-29", estado: "Preparando" },
  { id: "ENV-004", cliente: "Cliente Final D", fecha: "2023-11-02", estado: "Retrasado" },
  { id: "ENV-005", cliente: "Distribuidor E", fecha: "2023-11-06", estado: "Preparando" },
];

export default function EnviosPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Entregado":
        return <Badge variant="success">Entregado</Badge>;
      case "Preparando":
        return <Badge variant="accent">Preparando</Badge>;
      case "En Tránsito":
        return <Badge variant="secondary">En Tránsito</Badge>;
      case "Retrasado":
        return <Badge variant="destructive">Retrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Envíos de Productos</CardTitle>
            <CardDescription>Seguimiento de los envíos de productos a clientes.</CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Envío
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Envío</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha de Envío</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {envios.map((envio) => (
              <TableRow key={envio.id}>
                <TableCell className="font-medium">{envio.id}</TableCell>
                <TableCell>{envio.cliente}</TableCell>
                <TableCell>{new Date(envio.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(envio.estado)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Guía</DropdownMenuItem>
                      <DropdownMenuItem>Actualizar Estado</DropdownMenuItem>
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
