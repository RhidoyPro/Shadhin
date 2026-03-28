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
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=()",
  },
  // Force HTTPS for 1 year, including subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent DNS prefetching to third-party origins (privacy)
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  // Cross-Origin isolation headers — prevent data leaks via Spectre-class attacks
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  // Prevent browsers from caching sensitive pages
  {
    key: "Cache-Control",
    value: "no-store, no-cache, must-revalidate, proxy-revalidate",
  },
  {
    key: "Pragma",
    value: "no-cache",
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
      // unsafe-inline needed for Next.js inline scripts; unsafe-eval only for dev
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://connect.facebook.net`.trim(),
      // Images from R2, Google (user avatars), DiceBear, Meta Pixel, and data URIs
      "img-src 'self' data: blob: https://*.r2.dev https://api.dicebear.com https://lh3.googleusercontent.com https://www.facebook.com",
      // API calls, analytics endpoints, R2 uploads (both public + signed-URL endpoint), DiceBear avatars
      "connect-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com https://api.dicebear.com https://us.i.posthog.com https://www.google-analytics.com https://analytics.google.com https://www.clarity.ms https://www.facebook.com",
      // Font sources
      "font-src 'self' data:",
      // Media (video/audio) from R2
      "media-src 'self' https://*.r2.dev blob:",
      // Block all plugins (Flash, Java, etc.)
      "object-src 'none'",
      // Restrict base URI to prevent base-tag hijacking
      "base-uri 'self'",
      // Forms only submit to same origin
      "form-action 'self'",
      // Only same-origin pages can embed this site
      "frame-ancestors 'self'",
      // Block iframes from loading external content
      "frame-src 'self'",
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
      "web-push",
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev",
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
