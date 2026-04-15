import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['kokoro-js', '@huggingface/transformers', 'onnxruntime-node'],
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
