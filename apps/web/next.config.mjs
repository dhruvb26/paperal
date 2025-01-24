await import("./src/env.js");

const nextConfig = {
  reactStrictMode: false,
  // ** For pdf-js and llamaindex
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    // Add ONNX handling for LlamaIndex
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
      type: "javascript/auto",
    });

    config.externals = [
      ...(config.externals || []),
      { "onnxruntime-node": "onnxruntime-node" },
      // "@opentelemetry/api",
      "@opentelemetry/core",
      "@opentelemetry/semantic-conventions",
      "@opentelemetry/resources",
      "sharp",
    ];

    return config;
  },
};

export default nextConfig;
