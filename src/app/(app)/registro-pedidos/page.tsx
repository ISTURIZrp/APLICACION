"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

export default function RegistroPedidosPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Nuevo Pedido</CardTitle>
        <CardDescription>Completa el formulario para registrar un nuevo pedido de insumos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Select>
                <SelectTrigger id="supplier" aria-label="Proveedor">
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prov1">Proveedor A</SelectItem>
                  <SelectItem value="prov2">Proveedor B</SelectItem>
                  <SelectItem value="prov3">Proveedor C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-date">Fecha del Pedido</Label>
              <Input id="order-date" type="date" defaultValue={new Date().toISOString().substring(0, 10)} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Insumos del Pedido</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-[1fr_120px_120px_auto] items-end gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-1">Insumo</Label>
                   <Select>
                    <SelectTrigger id="item-1" aria-label="Insumo">
                      <SelectValue placeholder="Selecciona un insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insumo1">Tornillos de Acero</SelectItem>
                      <SelectItem value="insumo2">Planchas de Melamina</SelectItem>
                      <SelectItem value="insumo3">Pintura Blanca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity-1">Cantidad</Label>
                  <Input id="quantity-1" type="number" placeholder="0" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="price-1">Precio Unit.</Label>
                  <Input id="price-1" type="number" placeholder="0.00" />
                </div>
                <Button variant="ghost" size="icon" className="mb-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Insumo
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea id="notes" placeholder="Cualquier observación sobre el pedido..." />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Guardar Pedido</Button>
      </CardFooter>
    </Card>
  )
}
