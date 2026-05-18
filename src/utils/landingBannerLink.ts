/** Domínio ou URL externa sem protocolo (ex.: wa.me/…, www.site.com). */
const EXTERNAL_WITHOUT_PROTOCOL =
  /^(www\.|[a-z0-9][a-z0-9-]*\.[a-z]{2,}(\/|$))/i;

/**
 * Normaliza o link configurado no banner da landing.
 * - https://… → externo
 * - /rota → interno (React Router)
 * - wa.me/…, site.com/… → externo com https://
 */
export function normalizeLandingBannerLink(link: string): string {
  const trimmed = link.trim();
  if (!trimmed || trimmed === "#") return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (EXTERNAL_WITHOUT_PROTOCOL.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isExternalLandingBannerLink(normalized: string): boolean {
  return /^https?:\/\//i.test(normalized);
}

export function openLandingBannerLink(
  link: string,
  navigate: (path: string) => void
): void {
  const normalized = normalizeLandingBannerLink(link);
  if (!normalized) return;

  if (isExternalLandingBannerLink(normalized)) {
    window.open(normalized, "_blank", "noopener,noreferrer");
    return;
  }

  navigate(normalized);
}
