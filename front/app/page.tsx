import { redirect } from "next/navigation";

// La page d'accueil renvoie vers le tableau de bord. Si l'utilisateur n'est pas
// connecté, le tableau de bord le redirigera lui-même vers /login.
export default function Home() {
  redirect("/dashboard");
}
