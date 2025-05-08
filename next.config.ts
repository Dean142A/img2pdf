import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Add other domains if your data-ai-hint images come from a specific source
      // For example, if they were to come from unsplash:
      // {
      //   protocol: 'https',
      //   hostname: 'images.unsplash.com',
      // },
    ],
    // Allow data URIs for image previews
    dangerouslyAllowSVG: true, 
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false, // Set to true if you primarily use data URIs and external SVGs without optimization needs.
                         // Or keep false and ensure proper loaders for different image types.
                         // For this app, local data URIs are primary, so optimization is less critical for them.
  },
};

export default nextConfig;
