import MillionLint from "@million/lint";
await import("./src/env.js");
const nextConfig = {};

export default MillionLint.next({
  enabled: true,
  rsc: true,
})(nextConfig);
