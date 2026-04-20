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

/** Force brand assets onto a same-origin path so COOP/CORP + www/apex mismatches cannot break images. */
function toSameOriginBrandAssetPath(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "ekomobil.az" || parsed.hostname === "www.ekomobil.az" || parsed.hostname.endsWith(".ekomobil.az")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // ignore
  }
  return url;
}

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
  const logoPath = toSameOriginBrandAssetPath(brand.logoUrl);
  const faviconPath = toSameOriginBrandAssetPath(brand.faviconUrl);
  const absoluteLogoUrl = logoPath.startsWith("http")
    ? logoPath
    : `${APP_URL}${logoPath.startsWith("/") ? "" : "/"}${logoPath}`;
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
        <link rel="icon" href={faviconPath} />
      </head>
      <body className="min-h-screen flex flex-col" style={dynamicThemeVars}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <CompareProvider>
          <Header userEmail={user?.email} userRole={user?.role} logoUrl={logoPath} />
          <main className="flex-1">{children}</main>
          <Footer logoUrl={logoPath} />
          <CompareBar />
          <AiChatPanel />
        </CompareProvider>
      </body>
    </html>
  );
}
