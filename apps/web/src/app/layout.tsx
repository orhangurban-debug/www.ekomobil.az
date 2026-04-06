import "./globals.css";
import type { Metadata } from "next";
import { type CSSProperties, ReactNode } from "react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareProvider } from "@/components/compare/compare-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSessionUser } from "@/lib/auth";
import { getBrandSettings } from "@/server/system-settings-store";

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
  const [user, brand] = await Promise.all([getServerSessionUser(), getBrandSettings()]);
  const absoluteLogoUrl = brand.logoUrl.startsWith("http")
    ? brand.logoUrl
    : `${APP_URL}${brand.logoUrl.startsWith("/") ? "" : "/"}${brand.logoUrl}`;
  const absoluteFaviconUrl = brand.faviconUrl.startsWith("http")
    ? brand.faviconUrl
    : `${APP_URL}${brand.faviconUrl.startsWith("/") ? "" : "/"}${brand.faviconUrl}`;
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EkoMobil",
    url: APP_URL,
    logo: absoluteLogoUrl,
    sameAs: []
  };
  const dynamicThemeVars = {
    "--color-ocean-teal-500": brand.primaryColor,
    "--color-ocean-teal-600": brand.primaryHoverColor,
    "--color-brand-500": brand.primaryColor,
    "--color-brand-600": brand.primaryColor,
    "--color-brand-700": brand.primaryHoverColor,
    "--color-deep-base": brand.deepBaseColor,
    "--color-soft-brown": brand.softBrownColor,
    "--color-page-canvas": brand.canvasColor
  } as CSSProperties;

  return (
    <html lang="az">
      <head>
        <link rel="icon" href={absoluteFaviconUrl} />
      </head>
      <body className="min-h-screen flex flex-col" style={dynamicThemeVars}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <CompareProvider>
          <Header userEmail={user?.email} userRole={user?.role} logoUrl={brand.logoUrl} />
          <main className="flex-1">{children}</main>
          <Footer logoUrl={brand.logoUrl} />
          <CompareBar />
          <AiChatPanel />
        </CompareProvider>
      </body>
    </html>
  );
}
