const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Standalone output for optimized Vercel deployment
  output: 'standalone',

  serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
