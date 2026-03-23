import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareProvider } from "@/components/compare/compare-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "EkoMobil — Etibarlı Avtomobil Bazarı", template: "%s | EkoMobil" },
  description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması.",
  metadataBase: new URL("https://ekomobil.az")
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getServerSessionUser();

  return (
    <html lang="az">
      <body className="min-h-screen flex flex-col">
        <CompareProvider>
          <Header userEmail={user?.email} userRole={user?.role} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareBar />
          <AiChatPanel />
        </CompareProvider>
      </body>
    </html>
  );
}
