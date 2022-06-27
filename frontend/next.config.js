/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    env: {
        API_ENDPOINT: 'http://localhost:8000',
        WS_ENDPOINT: 'ws://localhost:8000',
    },
    output: 'standalone',
}

module.exports = nextConfig
