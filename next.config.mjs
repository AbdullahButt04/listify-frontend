/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  // ✅ Disable all heavy optimizations
  images: {
    unoptimized: true // already present
  },

  optimizeFonts: false, // disable Google Font optimization (saves memory)
  swcMinify: false, // use default Terser minifier, lower memory usage
  reactStrictMode: false, // optional, reduces overhead in dev + build

  productionBrowserSourceMaps: false, // disable source maps to reduce memory + disk

  experimental: {
    turboMode: false, // already present
    images: {
      allowFutureImage: false // optional: disables newer image component memory usage
    }
  },

  // Optional: prevents static page build timeouts from crashing build
  staticPageGenerationTimeout: 300, // seconds (increase if you have large pages)
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/((?!(?:en|fr|ar|front-pages|favicon.ico)\\b)):path',
        destination: '/en/:path',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
