"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Rastrea los clics en cualquier enlace a /demo ("Probar demo") y envía un
 * evento de GA4. Solo mide si hay analítica cargada (consentimiento aceptado).
 * Usa un listener delegado para cubrir todos los botones, actuales y futuros.
 */
export default function DemoClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;
      let path = "";
      try {
        path = new URL((a as HTMLAnchorElement).href, location.origin).pathname;
      } catch {
        return;
      }
      if (path !== "/demo") return;
      if (typeof window.gtag === "function") {
        window.gtag("event", "probar_demo", {
          link_text: (a.textContent || "").trim().slice(0, 100),
          link_location: location.pathname,
        });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
