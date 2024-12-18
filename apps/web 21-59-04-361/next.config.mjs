import MillionLint from "@million/lint";
/** @type {import('next').NextConfig} */
// some changes to next.config.mjs
const nextConfig = {};

export default MillionLint.next({
  enabled: true,
  rsc: true,
})(nextConfig);
