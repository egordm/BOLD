const BACKEND_PORT = 8000
// @ts-ignore
export const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';

// @ts-ignore
export const API_ENDPOINT = `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/api`;
// @ts-ignore
export const WS_ENDPOINT = `${WS_PROTOCOL}://${window.location.hostname}:${BACKEND_PORT}`;
