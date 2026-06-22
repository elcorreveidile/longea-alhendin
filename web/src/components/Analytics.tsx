"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// Google Tag Manager: SOLO se carga si el usuario ha dado su consentimiento
// (analítica/marketing). El consentimiento se guarda en localStorage y el
// banner de cookies dispara el evento "pt-consent-granted" al aceptar.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-PHR2QZBQ";

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
    </>
  );
}
