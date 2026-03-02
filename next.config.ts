import type { NextConfig } from "next";
import pk from "./package.json";
const nextConfig: NextConfig = {
  /* config options here */
  env: {
    PROJECT_VERSION: pk.version
  }
};

export default nextConfig;
