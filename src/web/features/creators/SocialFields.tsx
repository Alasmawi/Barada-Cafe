import { SOCIAL_NAMES, SOCIAL_PLATFORMS, type Socials } from '../../../shared/socials';

type Props = {
  socials: Socials;
  onChange: (socials: Socials) => void;
};

/** One username per platform. Links are built from these, so nobody has to paste a URL. */
export function SocialFields({ socials, onChange }: Props) {
  return (
    <div className="social-fields">
      {SOCIAL_NAMES.map((platform) => (
        <label key={platform} className="social-field">
          <span className="social-field__label">{SOCIAL_PLATFORMS[platform].label}</span>
          <input
            className="social-field__input"
            value={socials[platform] ?? ''}
            onChange={(event) => onChange({ ...socials, [platform]: event.target.value })}
            placeholder="username"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
          />
        </label>
      ))}
    </div>
  );
}
