import { redirect } from "next/navigation";

// El acceso es único por correo (magic link), que enruta a cada persona a su
// sitio. Mantenemos /entrar por si quedan enlaces antiguos: redirige al login.
export default function EntrarPage() {
  redirect("/login");
}
