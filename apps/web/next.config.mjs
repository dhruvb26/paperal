await import("./src/env.js");

const nextConfig = {
  reactStrictMode: false,
  // ** For pdf-js and llamaindex
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    
    // Add ONNX handling for LlamaIndex
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });
    
    // Exclude ONNX from webpack bundling
    config.externals = [...(config.externals || []), { 'onnxruntime-node': 'onnxruntime-node' }];
    
    return config;
  },
};

export default nextConfig;
