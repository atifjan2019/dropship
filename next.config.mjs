/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            // CJ Dropshipping CDN
            { protocol: 'https', hostname: 'img.cjdropshipping.com' },
            { protocol: 'https', hostname: '*.cjdropshipping.com' },
            // Common product image hosts
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'ae01.alicdn.com' },
            { protocol: 'https', hostname: '*.alicdn.com' },
            { protocol: 'https', hostname: 'cdn.shopify.com' },
        ],
    },
};

export default nextConfig;

