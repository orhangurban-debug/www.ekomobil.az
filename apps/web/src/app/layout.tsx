import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareProvider } from "@/components/compare/compare-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSessionUser } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekomobil.az";
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "EkoMobil — Etibarlı Avtomobil Bazarı", template: "%s | EkoMobil" },
  description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması.",
  applicationName: "EkoMobil",
  keywords: [
    "avtomobil elanları",
    "maşın satışı",
    "ikinci əl maşın",
    "vin yoxlama",
    "auksion",
    "ekomobil"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "az_AZ",
    url: APP_URL,
    siteName: "EkoMobil",
    title: "EkoMobil — Etibarlı Avtomobil Bazarı",
    description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması."
  },
  twitter: {
    card: "summary_large_image",
    title: "EkoMobil — Etibarlı Avtomobil Bazarı",
    description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getServerSessionUser();
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EkoMobil",
    url: APP_URL,
    logo: `${APP_URL}/icon`,
    sameAs: []
  };

  return (
    <html lang="az">
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
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
