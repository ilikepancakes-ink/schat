/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  

  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Content Security Policy
  async rewrites() {
    return [];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Server external packages (moved from experimental)
  serverExternalPackages: ['crypto-js', 'jsonwebtoken'],

  // Make sure Edge runtime never bundles jsonwebtoken by restricting it to Node runtimes only
  experimental: {
    serverMinify: true,
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add path alias resolution for @/* imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  
  // Output configuration for Render deployment
  output: 'standalone',
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate build ID
  generateBuildId: async () => {
    // You can return any string here
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
