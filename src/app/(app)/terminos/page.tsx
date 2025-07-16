import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TerminosPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Términos y Condiciones de Servicio</CardTitle>
        <CardDescription>Por favor, lee nuestros términos y condiciones cuidadosamente.</CardDescription>
      </CardHeader>
      <CardContent className="prose dark:prose-invert max-w-none">
        <h2>1. Aceptación de los términos</h2>
        <p>Al acceder y utilizar GestionPro, aceptas estar sujeto a estos términos y condiciones...</p>
        <h2>2. Uso del servicio</h2>
        <p>El servicio se proporciona "tal cual". Nos reservamos el derecho de modificar o descontinuar el servicio en cualquier momento...</p>
        <h2>3. Cuentas de usuario</h2>
        <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña...</p>
      </CardContent>
    </Card>
  )
}
