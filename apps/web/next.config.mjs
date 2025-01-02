import MillionLint from "@million/lint";
await import("./src/env.js");
const nextConfig = {
  reactStrictMode: false,
};

export default MillionLint.next({
  enabled: true,
  rsc: true,
})(nextConfig);
