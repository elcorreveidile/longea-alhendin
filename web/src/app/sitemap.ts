import type { MetadataRoute } from "next";
import { SECTORES } from "@/data/sectores";
import { POSTS } from "@/data/blog";

// Dominio canónico público para SEO. Independiente de APP_URL (que en algunos
// entornos apunta al dominio de Vercel). Se puede forzar con SITE_URL.
const SITE_URL = process.env.SITE_URL || "https://planturnos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "",
    "/sectores",
    "/funcionalidades",
    "/como-funciona",
    "/demo",
    "/precios",
    "/preguntas-frecuentes",
    "/blog",
    "/casos-de-exito",
    "/sobre-nosotros",
    "/contacto",
    "/privacidad",
    "/cookies",
    "/aviso-legal",
  ];
  const pages = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const sectores = SECTORES.map((s) => ({
    url: `${SITE_URL}/sectores/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const posts = POSTS.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...pages, ...sectores, ...posts];
}
