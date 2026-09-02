import type { NextConfig } from "next";

// Web běží pod cestou /coachville-momenty na doméně poznej.coachville.eu.
// Hlavní projekt na této doméně přesměrovává (rewrite) /coachville-momenty/* sem.
const nextConfig: NextConfig = {
  basePath: "/coachville-momenty",
  images: { unoptimized: true },
};

export default nextConfig;
