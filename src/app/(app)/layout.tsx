"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  ShoppingCart,
  ClipboardPlus,
  Box,
  Truck,
  Wrench,
  History,
  Users,
  User,
  Settings,
  SlidersHorizontal,
  Mountain,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insumos", label: "Insumos", icon: Package },
  { href: "/movimientos", label: "Movimientos", icon: ArrowRightLeft },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/registro-pedidos", label: "Registrar Pedido", icon: ClipboardPlus },
  { href: "/productos", label: "Productos", icon: Box },
  { href: "/envios", label: "Envíos", icon: Truck },
  { href: "/equipos", label: "Equipos", icon: Wrench },
  { href: "/historial-equipos", label: "Historial Equipos", icon: History },
  { href: "/usuarios", label: "Usuarios", icon: Users },
];

const settingsNavItems = [
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/ajustes", label: "Ajustes", icon: SlidersHorizontal },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const legalNavItems = [
  { href: "/terminos", label: "Términos de Servicio" },
  { href: "/privacidad", label: "Política de Privacidad" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const allItems = [...navItems, ...settingsNavItems, ...legalNavItems];
    const currentItem = allItems.find(item => item.href === pathname);
    return currentItem?.label || "Dashboard";
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
              <SidebarTrigger />
            </Button>
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-sidebar-foreground">
              <Mountain className="h-6 w-6 text-primary" />
              <span className="font-headline group-data-[collapsible=icon]:hidden">GestionPro</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            {settingsNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" />
                  <AvatarFallback>JP</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5 group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sidebar-foreground">
                    Juan Perez
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">
                    juan.perez@email.com
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-16 sm:px-6">
          <div className="block">
            <SidebarTrigger />
          </div>
          <h1 className="text-xl font-semibold tracking-tighter sm:text-2xl font-headline">
            {getPageTitle()}
          </h1>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
