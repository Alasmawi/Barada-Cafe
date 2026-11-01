import { useEffect } from 'react';
import { Icon } from './Icon';

const VISIBLE_MS = 2400;

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="toast" role="status">
      <Icon name="check" size={20} />
      {message}
    </div>
  );
}
