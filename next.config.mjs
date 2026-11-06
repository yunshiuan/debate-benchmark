/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/**': ['./data/explorers/**/*'],
  },
};

export default nextConfig;
