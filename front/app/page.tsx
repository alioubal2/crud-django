import { redirect } from "next/navigation";

// La page d'accueil renvoie vers les tâches. Si l'utilisateur n'est pas
// connecté, la page /todos le redirigera elle-même vers /login.
export default function Home() {
  redirect("/todos");
}
