import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ignora los errores de tipos durante la compilación.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ignora ESLint durante el build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
