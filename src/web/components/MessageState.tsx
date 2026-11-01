import type { ReactNode } from 'react';
import { Icon } from './Icon';

type Props = {
  art: 'empty' | 'error';
  title: string;
  body?: string;
  action?: ReactNode;
};

/** An empty or failed screen: what happened, then what to do. */
export function MessageState({ art, title, body, action }: Props) {
  return (
    <div className="message-state" role={art === 'error' ? 'alert' : undefined}>
      <span className="message-state__icon">
        <Icon name={art === 'error' ? 'alert' : 'empty'} size={32} />
      </span>
      <h2 className="message-state__title">{title}</h2>
      {body && <p className="message-state__body">{body}</p>}
      {action}
    </div>
  );
}
