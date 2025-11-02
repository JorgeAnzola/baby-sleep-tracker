import type { NextConfig } from "next";
// TODO: Uncomment when next-intl is installed for night waking feature
// import createNextIntlPlugin from 'next-intl/plugin';
// const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', // Required for Docker
};

// TODO: Change to withNextIntl(nextConfig) when next-intl is installed
export default nextConfig;
