/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['@react-three/drei'],
  },
  async redirects() {
    // Starship Protocol is the public site. The legacy MetaMap surfaces
    // (terminal / map / moon / watchlist / narratives / token dashboards) and
    // the old landing prototypes (/siteNEW, /siteview, /design) are hidden:
    // every old URL bounces to the /siteMARS landing so nobody lands on the
    // MetaMap app. Temporary (307) so it stays fully reversible — the page code
    // is untouched, just unreachable from the public URLs.
    const hidden = [
      '/terminal',
      '/map',
      '/moon',
      '/watchlist',
      '/narratives',
      '/design',
      '/siteview',
      '/siteNEW',
    ];
    return [
      // Root → the Starship landing (emits a proper HTTP 307 with Location,
      // which a page-level redirect() does not for a hard request).
      { source: '/', destination: '/siteMARS', permanent: false },
      ...hidden.map((source) => ({
        source,
        destination: '/siteMARS',
        permanent: false,
      })),
      // Token dashboards (and any nested paths under them).
      { source: '/token/:path*', destination: '/siteMARS', permanent: false },
    ];
  },
};

export default nextConfig;
