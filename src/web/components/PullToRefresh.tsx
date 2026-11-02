import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

const TRIGGER_PX = 70;
const MAX_PX = 96;
const RESISTANCE = 0.5;

/** Drag down at the top of a tab to refresh, as in any native list. */
export function PullToRefresh() {
  const queryClient = useQueryClient();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  const distance = useRef(0);

  useEffect(() => {
    const down = (event: TouchEvent) => {
      const inSheet = (event.target as Element).closest('dialog');
      start.current = window.scrollY === 0 && !inSheet ? (event.touches[0]?.clientY ?? null) : null;
    };
    const move = (event: TouchEvent) => {
      if (start.current === null) return;
      const moved = (event.touches[0]?.clientY ?? 0) - start.current;
      distance.current = Math.min(Math.max(moved * RESISTANCE, 0), MAX_PX);
      setPull(distance.current);
    };
    const up = () => {
      const triggered = distance.current >= TRIGGER_PX;
      start.current = null;
      distance.current = 0;
      setPull(0);
      if (!triggered) return;
      setRefreshing(true);
      void queryClient.invalidateQueries().finally(() => setRefreshing(false));
    };

    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [queryClient]);

  if (pull === 0 && !refreshing) return null;

  return (
    <div className="pull-indicator" style={{ height: refreshing ? 44 : pull }} aria-hidden>
      <span
        className={`spinner ${refreshing ? 'spinner--on' : ''}`}
        style={refreshing ? undefined : { transform: `rotate(${pull * 4}deg)`, opacity: pull / TRIGGER_PX }}
      />
    </div>
  );
}
