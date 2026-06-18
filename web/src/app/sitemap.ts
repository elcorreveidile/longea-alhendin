import type { MetadataRoute } from "next";
import { SECTORES } from "@/data/sectores";

const SITE_URL = process.env.APP_URL || "https://planturnos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "",
    "/sectores",
    "/funcionalidades",
    "/como-funciona",
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
  return [...pages, ...sectores];
}
