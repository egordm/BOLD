// @ts-ignore
export const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';

// @ts-ignore
export const API_ENDPOINT = `${window.location.protocol}//${window.location.hostname}:8000/api`;
// @ts-ignore
export const WS_ENDPOINT = `${WS_PROTOCOL}://${window.location.hostname}:8000`;

// // // @ts-ignore
// export const API_ENDPOINT= window.location.port
//   ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api`
//   : `${window.location.protocol}//${window.location.hostname}/api`;
// // @ts-ignore
// export const WS_ENDPOINT= window.location.port
//   ? `${WS_PROTOCOL}://${window.location.hostname}:${window.location.port}`
//   : `${WS_PROTOCOL}://${window.location.hostname}`;
