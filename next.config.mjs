/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  images: {
    unoptimized: true
  },
  eslint: {
    // Warning: This allows production builds to successfully complete
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true
  },

  reactStrictMode: false,

  productionBrowserSourceMaps: false,

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
        source: '/:path((?!(?:en|fr|ar|front-pages|favicon\\.ico)(?:/|$)).*)',
        destination: '/en/:path',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
