import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite subir fotografías de la ficha (server actions) hasta 8 MB.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
