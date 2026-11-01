import { SOCIAL_NAMES, SOCIAL_PLATFORMS, type Socials } from '../../../shared/socials';

export function SocialLinks({ socials }: { socials: Socials }) {
  const listed = SOCIAL_NAMES.flatMap((platform) => {
    const name = socials[platform];
    return name ? [{ platform, name }] : [];
  });
  if (listed.length === 0) return null;

  return (
    <ul className="social-links">
      {listed.map(({ platform, name }) => (
        <li key={platform}>
          <a
            className="social-link"
            href={SOCIAL_PLATFORMS[platform].url(name)}
            target="_blank"
            rel="noreferrer"
          >
            {SOCIAL_PLATFORMS[platform].label}
          </a>
        </li>
      ))}
    </ul>
  );
}
