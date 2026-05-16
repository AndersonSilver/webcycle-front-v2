/**
 * URL base da API (sempre termina em /api).
 * Normaliza deploys em que VITE_API_URL foi definida sem o sufixo /api.
 */
function normalizeApiBaseUrl(raw: string | undefined): string {
  const value = (raw || 'http://localhost:3001/api').replace(/\/$/, '');
  return value.endsWith('/api') ? value : `${value}/api`;
}

// @ts-ignore - Vite environment variables
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

/** Origem do backend (sem /api) — health check, Socket.io, OAuth */
export const API_ORIGIN_URL = API_BASE_URL.replace(/\/api$/, '');
