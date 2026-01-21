const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'firebasestorage.googleapis.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Force firebase/auth to use the browser ESM build (no undici dependency)
    const firebaseAuthPath = path.resolve(
      __dirname,
      'node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index.js'
    );
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/auth': firebaseAuthPath,
      '@firebase/auth': firebaseAuthPath,
    };

    if (!isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }
    return config;
  },
};

module.exports = nextConfig;
