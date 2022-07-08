/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    env: {
        API_ENDPOINT: 'http://localhost:8000/api',
        WS_ENDPOINT: 'ws://localhost:8000',
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
