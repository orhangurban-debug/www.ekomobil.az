import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { type CSSProperties, ReactNode } from "react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareProvider } from "@/components/compare/compare-context";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerSessionUser } from "@/lib/auth";
import { getBrandSettings } from "@/server/system-settings-store";
import { hasActiveBusinessSubscription } from "@/server/business-plan-store";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap"
});

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
    description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması.",
    images: [{ url: "/brand/ekomobil-og.png", width: 1200, height: 630, alt: "EkoMobil" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "EkoMobil — Etibarlı Avtomobil Bazarı",
    description: "Azərbaycanda VIN yoxlamalı, servis tarixçəli, şəffaf avtomobil alqı-satqı platforması.",
    images: ["/brand/ekomobil-og.png"]
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0057FF"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [user, brand] = await Promise.all([getServerSessionUser(), getBrandSettings()]);
  const hasStorePlan = user
    ? user.role === "admin" || (await hasActiveBusinessSubscription(user.id, "parts_store"))
    : false;
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
    /* Public shell always light/glass — DB canvasColor is for admin brand-kit preview only */
    "--color-page-canvas": "#EEF1F8",
    "--color-accent": "#0057FF",
    "--color-accent-hover": "#0046CC"
  } as CSSProperties;

  return (
    <html lang="az" className={plusJakarta.variable}>
      <head>
        {/* Admin-tərəfindən Brand Kit-də tənzimlənə bilən dinamik favicon (əsas mənbə). */}
        <link rel="icon" href={faviconPath} />
        {/* Statik ehtiyat: köhnə brauzerlər/OS-lər üçün çoxölçülü .ico və iOS home-screen ikonu. */}
        <link rel="shortcut icon" href="/brand/favicon.ico" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
      </head>
      <body
        className="min-h-screen flex flex-col text-slate-900"
        style={{
          ...dynamicThemeVars,
          backgroundColor: "var(--color-page-canvas)",
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 15% -10%, rgba(0,87,255,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(0,87,255,0.06), transparent 60%)",
          backgroundAttachment: "fixed"
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ToastProvider>
          <ConfirmDialogProvider>
            <CompareProvider>
              <Header userEmail={user?.email} userRole={user?.role} logoUrl={logoPath} hasStorePlan={hasStorePlan} />
              <main className="flex-1 pb-20">{children}</main>
              <Footer logoUrl={logoPath} />
              <CompareBar />
              <AiChatPanel />
            </CompareProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
