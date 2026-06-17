// Clean up empty environment variables to prevent next-auth build crashes
if (process.env.NEXTAUTH_URL === '') {
  delete process.env.NEXTAUTH_URL;
}
if (process.env.NEXTAUTH_SECRET === '') {
  delete process.env.NEXTAUTH_SECRET;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
}

module.exports = nextConfig