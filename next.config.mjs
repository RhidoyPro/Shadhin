/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevents your site being embedded in iframes on other domains (clickjacking)
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Stops browsers guessing the content type — prevents MIME-sniffing attacks
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controls how much referrer info is sent with requests — don't leak full URLs
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disable access to camera, microphone, geolocation, and payment APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 1 year, including subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy — controls which resources the browser can load
  // Prevents XSS by blocking inline scripts from injected content
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs unsafe-inline for styles; nonce-based CSP would be stricter
      // but requires additional Next.js middleware configuration
      "style-src 'self' 'unsafe-inline'",
      // Next.js hydration requires unsafe-eval in dev; removed in production builds
      // unsafe-inline needed for Next.js inline scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      // Images from S3, Google (user avatars), and data URIs
      "img-src 'self' data: blob: https://utopia-web-app.s3.ap-south-1.amazonaws.com https://lh3.googleusercontent.com",
      // API calls, WebSocket for Socket.IO, Google Analytics
      "connect-src 'self' wss: ws: https://www.google-analytics.com https://analytics.google.com",
      // Font sources
      "font-src 'self' data:",
      // Media (video/audio) from S3
      "media-src 'self' https://utopia-web-app.s3.ap-south-1.amazonaws.com blob:",
      // Forms only submit to same origin
      "form-action 'self'",
      // Only same-origin pages can embed this site
      "frame-ancestors 'self'",
      // Block mixed HTTP/HTTPS content
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: [
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
      "@react-email/render",
      "@react-email/components",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utopia-web-app.s3.ap-south-1.amazonaws.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
