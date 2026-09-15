// @ts-ignore
import { httpServerHandler } from 'cloudflare:node';
import { onRequest } from 'firebase-functions/v2/https';
import app from './app';

// Export Cloud Function endpoint for Firebase Functions
export const api = onRequest({ cors: true, memory: '512MiB' }, app);

// Export Cloudflare Worker HTTP Server Handler for Cloudflare Workers
export default httpServerHandler({ port: 5000 });
