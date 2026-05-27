/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu/**',
        'node_modules/@swc/core-linux-x64-musl/**',
        'node_modules/@esbuild/linux-x64/**',
        'node_modules/webpack/**',
        'node_modules/rollup/**',
        'node_modules/esbuild/**',
        'node_modules/typescript/**',
        'node_modules/framer-motion/**',
      ],
    },
  },
}

export default nextConfig
