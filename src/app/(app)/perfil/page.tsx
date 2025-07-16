import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PerfilPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
        <CardDescription>Aquí podrás ver y editar la información de tu perfil.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>El contenido para el perfil de usuario estará disponible aquí.</p>
      </CardContent>
    </Card>
  )
}
