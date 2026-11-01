import type { ReactNode } from 'react';
import emptyArt from '../../../brand/svg/state-empty.svg';
import errorArt from '../../../brand/svg/state-error.svg';

const ART = { empty: emptyArt, error: errorArt };

type Props = {
  art: keyof typeof ART;
  title: string;
  body?: string;
  action?: ReactNode;
};

/** The full-screen voice of an empty or failed screen: what happened, then what to do. */
export function MessageState({ art, title, body, action }: Props) {
  return (
    <div className="message-state" role={art === 'error' ? 'alert' : undefined}>
      <img className="message-state__art" src={ART[art]} alt="" />
      <h2 className="message-state__title">{title}</h2>
      {body && <p className="message-state__body">{body}</p>}
      {action}
    </div>
  );
}
