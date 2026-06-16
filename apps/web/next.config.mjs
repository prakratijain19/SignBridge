/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared-types is a workspace TS package; let Next transpile it directly.
  transpilePackages: ['@signbridge/shared-types'],
};

export default nextConfig;
