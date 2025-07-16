import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PrivacidadPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Política de Privacidad</CardTitle>
        <CardDescription>Tu privacidad es importante para nosotros.</CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        <h2>1. Información que recopilamos</h2>
        <p>Recopilamos información que nos proporcionas directamente, como cuando creas una cuenta...</p>
        <h2>2. Cómo usamos tu información</h2>
        <p>Usamos la información para operar, mantener y mejorar nuestros servicios...</p>
        <h2>3. Cómo compartimos tu información</h2>
        <p>No compartimos tu información personal con terceros, excepto en las circunstancias descritas en esta política...</p>
      </CardContent>
    </Card>
  )
}
