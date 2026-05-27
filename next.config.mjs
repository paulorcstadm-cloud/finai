/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core*/**',
        'node_modules/@esbuild/**',
        'node_modules/esbuild/**',
        'node_modules/webpack/**',
        'node_modules/webpack-sources/**',
        'node_modules/rollup/**',
        'node_modules/terser/**',
        'node_modules/typescript/**',
        'node_modules/ts-node/**',
        'node_modules/framer-motion/**',
        'node_modules/sharp/**',
        'node_modules/lightningcss/**',
        'node_modules/@next/swc-*/**',
        'node_modules/next/dist/compiled/webpack/**',
        'node_modules/next/dist/compiled/@ampproject/**',
      ],
    },
  },
}

export default nextConfig
