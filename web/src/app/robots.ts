import type { MetadataRoute } from "next";

const SITE_URL = process.env.APP_URL || "https://planturnos.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zonas privadas / de aplicación: no se indexan.
      disallow: ["/panel", "/mi-turno", "/mi-ficha", "/api", "/login", "/acceso", "/logout"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
