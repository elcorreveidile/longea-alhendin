// Detección heurística de spam de formularios (agencias de "marketing/web/apps").
// No usa servicios externos: puntúa por señales típicas de estos mensajes.

/** Frases/términos habituales del spam de agencia (ES + EN), en minúsculas. */
const SPAM_TERMS: string[] = [
  "app a medida", "aplicación a medida", "desarrollar una app", "desarrollo de app",
  "app móvil", "aplicación móvil", "mobile app", "develop an app", "custom app",
  "mejorar su sitio web", "mejorar tu sitio web", "mejorar su web", "rediseño web",
  "diseño web", "página web profesional", "desarrollo web", "web development",
  "posicionamiento", "posicionar su web", "seo", "sem", "google ads", "adwords",
  "primera página de google", "primera posición", "ranking", "tráfico web",
  "marketing digital", "estrategia digital", "redes sociales", "social media",
  "generar leads", "más clientes", "más ventas", "aumentar sus ventas",
  "presupuesto sin compromiso", "sin compromiso", "oferta especial", "promoción",
  "backlinks", "link building", "guest post", "outreach", "cold email",
  "podemos ayudarle", "podemos ayudarte", "nos gustaría ofrecerle", "le ofrecemos",
  "trabajo remoto", "equipo de desarrollo", "tarifas competitivas", "bajo coste",
  "crypto", "bitcoin", "inversión", "préstamo", "loan", "viagra", "casino",
];

/** Resultado del análisis: si es spam y por qué (para registro/depuración). */
export interface SpamVerdict {
  spam: boolean;
  score: number;
  reasons: string[];
}

export function scoreLeadSpam(data: {
  name?: string;
  email?: string;
  org?: string;
  message?: string;
}): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;
  const text = `${data.name ?? ""} ${data.org ?? ""} ${data.message ?? ""}`.toLowerCase();
  const msg = (data.message ?? "").trim();

  // 1) Términos típicos de agencia/publicidad.
  const hits = SPAM_TERMS.filter((t) => text.includes(t));
  if (hits.length) {
    score += hits.length >= 2 ? 3 : 2;
    reasons.push(`términos publicitarios: ${hits.slice(0, 4).join(", ")}`);
  }

  // 2) Enlaces en el mensaje (los formularios de contacto legítimos rara vez los traen).
  const urls = (msg.match(/\bhttps?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|io|biz|info|xyz|online|site)\b/gi) || []).length;
  if (urls > 0) {
    score += urls >= 2 ? 3 : 1;
    reasons.push(`${urls} enlace(s) en el mensaje`);
  }

  // 3) Nombre = empresa (copia/pega de bots) o mensaje en inglés a una web en español.
  if (data.name && data.org && data.name.trim().toLowerCase() === data.org.trim().toLowerCase()) {
    score += 1;
    reasons.push("nombre idéntico a la empresa");
  }

  // 4) Correos desechables o con muchos puntos/sufijos sospechosos.
  const email = (data.email ?? "").toLowerCase();
  if (/(\.[a-z0-9]+){3,}@|@.*\.(top|xyz|click|live|buzz)$/.test(email)) {
    score += 1;
    reasons.push("dirección de correo sospechosa");
  }

  return { spam: score >= 3, score, reasons };
}
