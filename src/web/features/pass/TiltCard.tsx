import { useRef, type PointerEvent, type ReactNode } from 'react';
import { prefersReducedMotion } from '../moments/motion';

const MAX_TILT_DEG = 14;

/** Drag to tilt. Vertical swipes still scroll the page, because `touch-action` leaves them alone. */
export function TiltCard({ children }: { children: ReactNode }) {
  const card = useRef<HTMLElement>(null);

  const tiltTo = (event: PointerEvent) => {
    const element = card.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    element.style.setProperty('--tilt-y', `${x * MAX_TILT_DEG}deg`);
    element.style.setProperty('--tilt-x', `${-y * MAX_TILT_DEG}deg`);
    element.style.setProperty('--sheen', `${(x + 0.5) * 100}%`);
  };

  const start = (event: PointerEvent) => {
    if (prefersReducedMotion()) return;
    card.current?.classList.add('pass--tilting');
    card.current?.setPointerCapture(event.pointerId);
    tiltTo(event);
  };

  const move = (event: PointerEvent) => {
    if (card.current?.classList.contains('pass--tilting')) tiltTo(event);
  };

  const settle = () => {
    const element = card.current;
    if (!element) return;
    element.classList.remove('pass--tilting');
    element.style.removeProperty('--tilt-x');
    element.style.removeProperty('--tilt-y');
  };

  return (
    <article
      ref={card}
      className="pass"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={settle}
      onPointerCancel={settle}
    >
      {children}
    </article>
  );
}
