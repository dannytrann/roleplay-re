import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['kokoro-js', '@huggingface/transformers', 'onnxruntime-node'],
  outputFileTracingIncludes: {
    '/api/tts': [
      './node_modules/kokoro-js/voices/**',
      './node_modules/onnxruntime-node/bin/**',
    ],
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
