"use client";

import { CircleUserRound, LogOut } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";

type AppHeaderProps = {
  // null pendant le chargement : le menu utilisateur n'est pas encore affiché.
  user: User | null;
  onLogout: () => void;
};

export function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <AppLogo />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" aria-label={`Menu de ${user.username}`}>
                <CircleUserRound aria-hidden="true" />
                <span className="hidden max-w-40 truncate sm:inline">{user.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate font-medium text-foreground">{user.username}</span>
                <span className="truncate font-normal">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLogout}>
                <LogOut aria-hidden="true" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
