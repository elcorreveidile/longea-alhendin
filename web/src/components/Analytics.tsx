"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// Google Tag Manager y Google Analytics 4: SOLO se cargan si el usuario ha
// dado su consentimiento (analítica). El consentimiento se guarda en
// localStorage y el banner de cookies dispara "pt-consent-granted" al aceptar.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PHR2QZBQ";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-GQXYK5J72P";

export default function Analytics() {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("pt_consent") === "granted") setGranted(true);
    } catch {
      /* localStorage no disponible */
    }
    const onGrant = () => setGranted(true);
    window.addEventListener("pt-consent-granted", onGrant);
    return () => window.removeEventListener("pt-consent-granted", onGrant);
  }, []);

  if (!granted) return null;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="gtm"
        />
      </noscript>

      {/* Google Analytics 4 (gtag.js) */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
