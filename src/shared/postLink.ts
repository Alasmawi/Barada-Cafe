export type PostPlatform = 'instagram' | 'tiktok' | 'other';

const PLATFORM_HOSTS: Record<Exclude<PostPlatform, 'other'>, readonly string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
};

export const PLATFORM_LABELS: Record<PostPlatform, string> = {
  instagram: 'Instagram post',
  tiktok: 'TikTok post',
  other: 'Your post',
};

function parseUrl(value: string): URL | null {
  return URL.canParse(value) ? new URL(value) : null;
}

export function isHttpsUrl(value: string): boolean {
  const url = parseUrl(value);
  return url?.protocol === 'https:' && url.hostname.includes('.');
}

/** Compares whole hostnames, so instagram.com.example.net is not Instagram. */
export function detectPlatform(value: string): PostPlatform {
  const host = parseUrl(value)?.hostname.toLowerCase();
  if (!host) return 'other';
  if (PLATFORM_HOSTS.instagram.includes(host)) return 'instagram';
  if (PLATFORM_HOSTS.tiktok.includes(host)) return 'tiktok';
  return 'other';
}
