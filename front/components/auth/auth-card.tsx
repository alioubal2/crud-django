import Link from "next/link";

import { AppLogo } from "@/components/app-logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: React.ReactNode;
};

// Cadre commun aux pages de connexion et d'inscription.
export function AuthCard({ title, description, footerText, footerLinkLabel, footerHref, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <AppLogo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {footerText}&nbsp;
          <Link href={footerHref} className="font-medium text-primary underline-offset-4 hover:underline">
            {footerLinkLabel}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
