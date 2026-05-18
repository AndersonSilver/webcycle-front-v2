import { normalizeLandingBannerLink } from "./landingBannerLink";

export type LandingBannerSnapshotItem = {
  id?: string;
  imageUrl: string;
  alt: string;
  link: string;
  order: number;
};

/** Mesma normalização usada ao salvar — para comparar rascunho vs publicado. */
export function serializeLandingBanners(banners: LandingBannerSnapshotItem[]): string {
  return JSON.stringify(
    [...banners]
      .sort((a, b) => a.order - b.order)
      .map((b, index) => ({
        id: b.id || "",
        imageUrl: (b.imageUrl || "").trim(),
        alt: (b.alt || `Banner ${index + 1}`).trim(),
        link: normalizeLandingBannerLink((b.link || "").trim()) || "#",
        order: b.order ?? index,
      }))
  );
}
