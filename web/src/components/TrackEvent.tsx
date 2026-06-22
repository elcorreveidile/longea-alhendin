"use client";

import { useEffect } from "react";

/**
 * Dispara una vez un evento de GA4 al montarse (p. ej. en una página de
 * "éxito" tras enviar un formulario). Solo mide si hay analítica cargada.
 */
export default function TrackEvent({ name, params }: { name: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params ?? {});
    }
    // Solo al montar: una página de éxito se monta una vez por envío.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
