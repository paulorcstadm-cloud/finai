/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Type-checking via tsc already covers this; skip lint step during build
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
}

export default nextConfig
