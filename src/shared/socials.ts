import { z } from 'zod';

/** Stores usernames, not links, so every link is built here and can only go to these sites. */
export const SOCIAL_PLATFORMS = {
  instagram: { label: 'Instagram', url: (name: string) => `https://www.instagram.com/${name}/` },
  tiktok: { label: 'TikTok', url: (name: string) => `https://www.tiktok.com/@${name}` },
  youtube: { label: 'YouTube', url: (name: string) => `https://www.youtube.com/@${name}` },
  snapchat: { label: 'Snapchat', url: (name: string) => `https://www.snapchat.com/add/${name}` },
  x: { label: 'X', url: (name: string) => `https://x.com/${name}` },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;
export const SOCIAL_NAMES = Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[];
export type Socials = Partial<Record<SocialPlatform, string>>;

const SocialName = z
  .string()
  .trim()
  .transform((name) => name.replace(/^@/, ''))
  .refine((name) => name === '' || /^[A-Za-z0-9._-]{1,40}$/.test(name), 'Enter just the username');

/** Blank fields are dropped, so `{ instagram: '' }` means no Instagram. */
export const SocialsInput = z
  .object(Object.fromEntries(SOCIAL_NAMES.map((name) => [name, SocialName.optional()])))
  .transform((socials) =>
    Object.fromEntries(Object.entries(socials).filter(([, name]) => name)) as Socials,
  );

export function parseSocials(stored: string): Socials {
  try {
    return SocialsInput.parse(JSON.parse(stored));
  } catch {
    return {};
  }
}
