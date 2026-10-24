import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Todo List",
    template: "%s · Todo List",
  },
  description: "Gérez vos tâches simplement.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* TooltipProvider : requis par les Tooltip de shadcn/ui. */}
        <TooltipProvider>{children}</TooltipProvider>
        {/* Toaster : affiche les notifications déclenchées avec toast(). */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
