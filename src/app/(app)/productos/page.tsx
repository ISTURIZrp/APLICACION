import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Image from "next/image";

const products = [
  { id: 1, name: "Escritorio Moderno", price: "2,500.00", image: "https://placehold.co/600x400.png", hint: "desk office" },
  { id: 2, name: "Silla de Oficina Ergonómica", price: "1,800.00", image: "https://placehold.co/600x400.png", hint: "office chair" },
  { id: 3, name: "Librero de Pared", price: "1,200.00", image: "https://placehold.co/600x400.png", hint: "bookshelf wall" },
  { id: 4, name: "Mesa de Centro", price: "950.00", image: "https://placehold.co/600x400.png", hint: "coffee table" },
  { id: 5, name: "Gabinete de Cocina", price: "3,200.00", image: "https://placehold.co/600x400.png", hint: "kitchen cabinet" },
  { id: 6, name: "Cama Queen Size", price: "4,500.00", image: "https://placehold.co/600x400.png", hint: "queen bed" },
];

export default function ProductosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Productos</h2>
          <p className="text-muted-foreground">Catálogo de productos terminados.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-0">
              <Image
                src={product.image}
                alt={product.name}
                width={600}
                height={400}
                className="object-cover aspect-[4/3] w-full h-auto transition-transform hover:scale-105"
                data-ai-hint={product.hint}
              />
            </CardContent>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">${product.price} MXN</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline">Detalles</Button>
              <Button>Añadir al Envío</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
