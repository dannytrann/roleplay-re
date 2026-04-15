import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['kokoro-js', '@huggingface/transformers', 'onnxruntime-node'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // credentialless allows cross-origin fetches (HuggingFace CDN)
          // while still enabling SharedArrayBuffer for WASM
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ]
  },
  turbopack: {},
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    return config
  },
};

export default nextConfig;
