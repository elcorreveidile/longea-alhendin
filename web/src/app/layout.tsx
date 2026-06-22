import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

// Google Tag Manager (se puede sobreescribir con NEXT_PUBLIC_GTM_ID).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PHR2QZBQ";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.APP_URL || "https://planturnos.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PlanTurnos · Cuadrantes de turnos para tu equipo",
  description:
    "Genera los cuadrantes de tu equipo en segundos cumpliendo el convenio de tu sector. Especialistas en digitalización del sector productivo.",
  keywords: [
    "cuadrantes", "gestor de turnos", "software de turnos", "planificación de turnos",
    "cuadrante de trabajo", "turnos residencias", "digitalización sector productivo",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "PlanTurnos",
    url: SITE_URL,
    title: "PlanTurnos · Cuadrantes de turnos, listos en segundos",
    description: "Genera los cuadrantes de tu equipo cumpliendo el convenio de tu sector. Cada trabajador ve su turno en el móvil.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PlanTurnos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlanTurnos · Cuadrantes de turnos, listos en segundos",
    description: "Genera los cuadrantes de tu equipo cumpliendo el convenio de tu sector.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) — debe ir justo al abrir <body>. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "PlanTurnos",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Software de cuadrantes y turnos que genera la planificación cumpliendo el convenio de tu sector.",
              url: SITE_URL,
              offers: { "@type": "Offer", price: "49", priceCurrency: "EUR" },
            }),
          }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
