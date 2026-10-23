/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for FFmpeg.wasm – SharedArrayBuffer needs these headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  // Required for @ffmpeg/ffmpeg – it spawns a Web Worker via import.meta.url
  // Turbopack can't resolve this; webpack handles it correctly with asset/resource.
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };

    // Treat .wasm files as asset resources so Next.js doesn't try to parse them
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;
