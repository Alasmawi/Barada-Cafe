const TAPPABLE = '.button, .list-row, .post-card, .choice-card, .pill, .tab-bar__link, .icon-button';
const SCROLLED_AT = 4;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ripple(event: PointerEvent): void {
  if (reducedMotion()) return;
  const target = (event.target as Element).closest<HTMLElement>(TAPPABLE);
  if (!target || target.matches(':disabled')) return;

  const box = target.getBoundingClientRect();
  const size = Math.max(box.width, box.height) * 2;
  const wave = document.createElement('span');
  wave.className = 'ripple';
  wave.style.width = wave.style.height = `${size}px`;
  wave.style.left = `${event.clientX - box.left - size / 2}px`;
  wave.style.top = `${event.clientY - box.top - size / 2}px`;
  wave.addEventListener('animationend', () => wave.remove());
  target.append(wave);

  // Android only: iOS Safari doesn't offer haptics to web pages.
  if (target.matches('.button--primary')) navigator.vibrate?.(8);
}

/** Shadows lift the bars once content moves under them, as native apps do. */
function trackScroll(): void {
  document.documentElement.toggleAttribute('data-scrolled', window.scrollY > SCROLLED_AT);
}

/** Touch response in one place, so no screen can forget it. */
export function installTouchFeedback(): void {
  document.addEventListener('pointerdown', ripple, { passive: true });
  window.addEventListener('scroll', trackScroll, { passive: true });
}
