"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "Active" | "Inactive";
}

const initialUsers: User[] = [
  { id: "USR-001", name: "Juan Perez", email: "juan.perez@email.com", role: "Admin", status: "Active" },
  { id: "USR-002", name: "Ana Torres", email: "ana.torres@email.com", role: "Editor", status: "Active" },
  { id: "USR-003", name: "Carlos Ruiz", email: "carlos.ruiz@email.com", role: "Viewer", status: "Inactive" },
  { id: "USR-004", name: "Maria Garcia", email: "maria.garcia@email.com", role: "Editor", status: "Active" },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.role) {
      setUsers([...users, {
        id: `USR-00${users.length + 1}`,
        ...newUser,
        status: "Active"
      } as User]);
      setIsModalOpen(false);
      setNewUser({ name: "", email: "", role: "" });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge variant="success">Activo</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Aquí podrás añadir, editar y eliminar usuarios del sistema.</CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
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
                        <DropdownMenuItem>Desactivar</DropdownMenuItem>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
            <DialogDescription>Completa la información para agregar un nuevo miembro al equipo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Rol</Label>
              <Select onValueChange={(value) => setNewUser({...newUser, role: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAddUser}>Guardar Usuario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
