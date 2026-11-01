import { useState } from 'react';
import type { CreatorCard } from '../../../shared/api';
import { useSummarize } from '../../api/queries';
import { Icon } from '../../components/Icon';
import { Ring } from '../rings/Ring';
import { InviteSheet } from './InviteSheet';
import { SocialLinks } from './SocialLinks';

export function CreatorResult({ creator }: { creator: CreatorCard }) {
  const summarize = useSummarize(creator.id);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  /** The model gave nothing usable, so the plain facts stay and the button goes away. */
  const noBetter = summarize.isSuccess && !summarize.data.creator.isAiSummary;

  return (
    <li className="creator-card">
      <div className="creator-card__who">
        <Ring tags={creator.tags} size={56} name={creator.name} />
        <div className="creator-card__text">
          <h2 className="creator-card__name">{creator.name}</h2>
          <p className="creator-card__handle">{creator.handle}</p>
          {creator.signature && <p className="creator-line">{creator.signature}</p>}
        </div>
      </div>
      <SocialLinks socials={creator.socials} />
      <ul className="tag-list">
        {creator.tags.map((tag) => (
          <li key={tag} className="tag tag--quiet">
            {tag}
          </li>
        ))}
      </ul>
      <p className="creator-card__summary">
        <span className="creator-card__summary-label">
          {creator.isAiSummary ? 'AI summary' : 'At a glance'}
        </span>{' '}
        {creator.summary}
      </p>
      {noBetter && <p className="note">The AI couldn't add more this time.</p>}
      <div className="button-row">
        {!creator.isAiSummary && !noBetter && (
          <button
            className="icon-button icon-button--soft"
            type="button"
            aria-label={summarize.isPending ? 'Writing AI summary' : 'Write an AI summary'}
            onClick={() => summarize.mutate()}
            disabled={summarize.isPending}
          >
            <Icon name="sparkle" />
          </button>
        )}
        <button
          className="button button--primary button--grow"
          type="button"
          onClick={() => setInviting(true)}
          disabled={invited}
        >
          {invited ? 'Invited' : 'Invite'}
        </button>
      </div>
      <InviteSheet
        creator={creator}
        open={inviting}
        onClose={() => setInviting(false)}
        onSent={() => {
          setInvited(true);
          setInviting(false);
        }}
      />
    </li>
  );
}
