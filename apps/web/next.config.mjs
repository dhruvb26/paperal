import MillionLint from "@million/lint";
await import("./src/env.js");
const nextConfig = {
  reactStrictMode: false,
  // ** For pdf-js
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default MillionLint.next({
  enabled: true,
  rsc: true,
})(nextConfig);
