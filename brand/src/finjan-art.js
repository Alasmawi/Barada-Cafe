// Finjan art engine — gold-line "hologram" finjans, a dallah, and the cup stack.
//
// Pure functions that return SVG markup strings. No DOM, no dependencies, so the same
// code renders the static brand assets (Node) and the live per-collab art (browser).
//
//   import { stackSVG, cupSVG } from './finjan-art.js';
//   el.innerHTML = stackSVG({ spots: 5, taken: 2, seed: collab.id });
//
// Every collab gets its own foil pattern: the pattern is derived from `seed`
// (use the collab id), so the same collab always looks the same.

export const PALETTE = {
  ink: '#0E1322',        // night majlis background
  ink2: '#161D33',       // raised surfaces
  ink3: '#222B48',       // borders, sunken lines
  gold: '#E3B85A',       // primary line colour
  goldHi: '#FFE3A1',     // highlights, front rims
  goldDim: '#8C7442',    // back lines
  porcelain: '#F4F1EA',  // text on dark, porcelain hints
  cardamom: '#8FB573',   // success, "served"
  qahwa: '#C9892E',      // the coffee itself
  pomegranate: '#E8695A',// errors
  mist: '#9AA3B8',       // secondary text
};

// ---------- seeded randomness ----------
function hashSeed(str) {
  let h = 1779033703 ^ String(str).length;
  for (let i = 0; i < String(str).length; i++) {
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}
export function rng(seed) {
  let a = hashSeed(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 100) / 100;

// ---------- cup geometry (local coords: rim centre at 0,0; foot at y=50) ----------
const RIM_RX = 30;
const RIM_RY = 7;
const BODY = 'M-30 0 C-29.5 14 -27 29 -18.5 41 C-15 46 -11 49 -9 50 L9 50 C11 49 15 46 18.5 41 C27 29 29.5 14 30 0 Z';
const PROFILE = [[0, 30], [8, 29.7], [16, 28.8], [24, 27.4], [32, 24.4], [38, 20.6], [44, 14.6], [50, 9]];

/** Radius of the cup body at height y. */
export function cupRadius(y) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [y0, r0] = PROFILE[i];
    const [y1, r1] = PROFILE[i + 1];
    if (y >= y0 && y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return 9;
}
/** Front arc (the half facing the viewer) of the horizontal ring at height y. */
const frontArc = (y) => { const r = cupRadius(y); const ry = (r / RIM_RX) * RIM_RY; return `M${f(-r)} ${f(y)} A${f(r)} ${f(ry)} 0 0 0 ${f(r)} ${f(y)}`; };
const backArc = (y) => { const r = cupRadius(y); const ry = (r / RIM_RX) * RIM_RY; return `M${f(-r)} ${f(y)} A${f(r)} ${f(ry)} 0 0 1 ${f(r)} ${f(y)}`; };
/** Map a flat (u, y) point on the cup's front face to screen space, wrapping around the body. */
function wrap(u, y) {
  const r = cupRadius(y);
  const ry = (r / RIM_RX) * RIM_RY;
  const x = u * r;
  return [x, y + ry * Math.sqrt(Math.max(0, 1 - u * u))];
}

// ---------- foil patterns ----------
export const PATTERNS = ['fronds', 'dots', 'stripes', 'waves', 'stars', 'feathers'];

function patternPaths(kind, rand) {
  const out = [];
  const line = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  const coverTop = rand() > 0.5;
  const yA = coverTop ? 3 : 14 + rand() * 10;
  const yB = coverTop ? 26 + rand() * 12 : 47;
  if (kind === 'stripes') {
    const n = 10 + Math.floor(rand() * 6);
    for (let i = 0; i < n; i++) {
      const u = -0.95 + (1.9 * i) / (n - 1);
      if (rand() < 0.18) continue;
      const top = yA + rand() * 6;
      const bot = yB - rand() * 8;
      const pts = [];
      for (let y = top; y <= bot; y += 3) pts.push(wrap(u, y));
      out.push(`<path d="${line(pts)}"/>`);
    }
  } else if (kind === 'waves') {
    for (let y = yA + 2; y < yB; y += 4.5) {
      const pts = [];
      const ph = rand() * Math.PI * 2;
      for (let u = -0.98; u <= 0.98; u += 0.06) { const [x, yy] = wrap(u, y); pts.push([x, yy + Math.sin(u * 9 + ph) * 1.4]); }
      out.push(`<path d="${line(pts)}"/>`);
    }
  } else if (kind === 'dots') {
    const n = 46 + Math.floor(rand() * 26);
    for (let i = 0; i < n; i++) {
      const u = rand() * 1.9 - 0.95;
      const y = yA + rand() * (yB - yA);
      const [x, yy] = wrap(u * (1 - y / 120), y);
      const r = 0.5 + rand() * 1.3;
      out.push(rand() < 0.3 ? `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(r + 0.6)}" fill="none" stroke-width=".6"/>` : `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(r)}" stroke="none" fill="currentColor"/>`);
    }
  } else if (kind === 'fronds') {
    const n = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < n; k++) {
      const u0 = -0.7 + rand() * 1.4;
      const lean = (rand() - 0.5) * 0.9;
      const spine = [];
      for (let t = 0; t <= 1.0001; t += 0.1) spine.push(wrap(Math.max(-0.97, Math.min(0.97, u0 + lean * t)), 46 - t * 40));
      out.push(`<path d="${line(spine)}"/>`);
      for (let i = 2; i < spine.length; i++) {
        const [x, y] = spine[i];
        const len = 4 + (spine.length - i) * 0.8;
        out.push(`<path d="M${f(x)} ${f(y)} l${f(-len)} ${f(-len * 0.55)} M${f(x)} ${f(y)} l${f(len)} ${f(-len * 0.55)}"/>`);
      }
    }
  } else if (kind === 'stars') {
    const y = 10 + rand() * 18;
    const star = (cx, cy, s) => {
      const p = [];
      for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8; const r = i % 2 ? s * 0.45 : s; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8]); }
      return `<path d="${line(p)} Z"/>`;
    };
    for (let u = -0.8; u <= 0.81; u += 0.32) { const [x, yy] = wrap(u, y); out.push(star(x, yy, 3.6 * Math.sqrt(1 - u * u * 0.6))); }
    const [lx1, ly1] = wrap(-0.98, y - 6); const pts1 = []; const pts2 = [];
    for (let u = -0.98; u <= 0.98; u += 0.07) { pts1.push(wrap(u, y - 6)); pts2.push(wrap(u, y + 6)); }
    out.push(`<path d="${line(pts1)}"/>`, `<path d="${line(pts2)}"/>`);
    void lx1; void ly1;
  } else {
    // feathers
    const n = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < n; k++) {
      const u0 = -0.75 + rand() * 1.5;
      const tilt = (rand() - 0.5) * 0.5;
      const pts = [];
      for (let t = 0; t <= 1.0001; t += 0.08) pts.push(wrap(Math.max(-0.97, Math.min(0.97, u0 + tilt * t)), 8 + t * 34));
      out.push(`<path d="${line(pts)}"/>`);
      pts.forEach(([x, y], i) => {
        if (i === 0 || i === pts.length - 1) return;
        const l = 6 * Math.sin((i / pts.length) * Math.PI);
        out.push(`<path d="M${f(x)} ${f(y)} q${f(-l * 0.6)} ${f(-1)} ${f(-l)} ${f(-3)} M${f(x)} ${f(y)} q${f(l * 0.6)} ${f(-1)} ${f(l)} ${f(-3)}"/>`);
      });
    }
  }
  return out.join('');
}

/** Pick the pattern kind for a seed (stable per collab). */
export function patternFor(seed) {
  const r = rng(seed + ':kind');
  return PATTERNS[Math.floor(r() * PATTERNS.length)];
}

// ---------- shared defs ----------
/** Glow filter + nothing else. Include once per <svg>. */
export function defsMarkup(id = 'fj') {
  return `<filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b1"/>
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2"/>
    <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
}

// ---------- the cup ----------
/**
 * One hologram finjan.
 * @param {object} o
 * @param {string} o.id       unique id within the svg (used for the clip path)
 * @param {string} [o.seed]   pattern seed; omit for a plain cup
 * @param {number} [o.fill]   coffee level 0..1 (0 = empty)
 * @param {'night'|'light'} [o.theme]
 * @param {boolean} [o.ghost] dashed outline for an open/unavailable spot
 * @param {string} [o.liquidClass] class put on the coffee group (for CSS animation)
 */
export function cupMarkup({ id, seed, fill = 0, theme = 'night', ghost = false, liquidClass = '' }) {
  const P = PALETTE;
  const line = theme === 'night' ? P.gold : '#9A6E1C';
  const hi = theme === 'night' ? P.goldHi : '#7A5410';
  const dim = theme === 'night' ? P.goldDim : '#C9A866';
  const body = theme === 'night' ? P.ink : '#FFFDF7';
  if (ghost) {
    return `<g fill="none" stroke="${dim}" stroke-width="1.3" stroke-dasharray="3 4" stroke-linecap="round">
      <path d="${BODY}"/><ellipse rx="${RIM_RX}" ry="${RIM_RY}"/><ellipse cy="50" rx="9" ry="2.4"/></g>`;
  }
  const pattern = seed ? patternPaths(patternFor(seed), rng(seed)) : '';
  let liquid = '';
  if (fill > 0) {
    const y = 34 - 30 * Math.min(1, fill);
    const r = cupRadius(y) - 2.5;
    const ry = (r / RIM_RX) * RIM_RY;
    liquid = `<g class="${liquidClass}"><ellipse cy="${f(y)}" rx="${f(r)}" ry="${f(ry)}" fill="${P.qahwa}" fill-opacity=".55" stroke="${hi}" stroke-width=".8"/>
      <ellipse cx="${f(-r * 0.35)}" cy="${f(y - ry * 0.25)}" rx="${f(r * 0.25)}" ry="${f(ry * 0.22)}" fill="${hi}" opacity=".5"/></g>`;
  }
  return `<g>
    <clipPath id="${id}-clip"><path d="${BODY}"/><ellipse rx="${RIM_RX}" ry="${RIM_RY}"/></clipPath>
    <path d="${BODY}" fill="${body}" fill-opacity="${theme === 'night' ? 0.92 : 1}"/>
    <ellipse rx="${RIM_RX}" ry="${RIM_RY}" fill="${body}"/>
    <g fill="none" stroke="${dim}" stroke-width=".7" stroke-dasharray="1.5 3" opacity=".7">
      <path d="${backArc(13)}"/><path d="${backArc(26)}"/><path d="${backArc(38)}"/>
    </g>
    <g clip-path="url(#${id}-clip)" fill="none" stroke="${line}" color="${line}" stroke-width=".75" stroke-linecap="round" opacity=".85">${pattern}</g>
    <g fill="none" stroke="${line}" stroke-width=".7" opacity=".5"><path d="${frontArc(13)}"/><path d="${frontArc(26)}"/><path d="${frontArc(38)}"/></g>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${BODY}" stroke="${line}" stroke-width="1.6"/>
      <ellipse rx="${RIM_RX}" ry="${RIM_RY}" stroke="${line}" stroke-width="1.4"/>
      <ellipse cy=".8" rx="${RIM_RX - 3}" ry="${RIM_RY - 1.6}" stroke="${dim}" stroke-width=".8"/>
      ${liquid}
      <path d="M-30 0 A30 7 0 0 0 30 0" stroke="${hi}" stroke-width="1.9"/>
      <ellipse cy="50" rx="9" ry="2.4" stroke="${line}" stroke-width="1.2"/>
      <path d="M-22 6 C-21 18 -18 28 -13 36" stroke="${hi}" stroke-width="1.6" opacity=".55"/>
    </g>
  </g>`;
}

// ---------- the dallah ----------
/** Dallah, local coords: base centre at (0,100), spout tip at (68,14). */
export const DALLAH_SPOUT_TIP = [68, 14];
export function dallahMarkup({ theme = 'night' } = {}) {
  const P = PALETTE;
  const line = theme === 'night' ? P.gold : '#9A6E1C';
  const hi = theme === 'night' ? P.goldHi : '#7A5410';
  const dim = theme === 'night' ? P.goldDim : '#C9A866';
  const body = theme === 'night' ? P.ink : '#FFFDF7';
  const outline = 'M-26 100 C-31 92 -31 76 -22 66 C-15 59 -10 56 -10 52 C-10 47 -16 42 -20 36 L20 36 C16 42 10 47 10 52 C10 56 15 59 22 66 C31 76 31 92 26 100 Z';
  const ring = (y, r) => `M${-r} ${y} A${r} ${f(r * 0.22)} 0 0 0 ${r} ${y}`;
  const ringB = (y, r) => `M${-r} ${y} A${r} ${f(r * 0.22)} 0 0 1 ${r} ${y}`;
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 84 C40 78 47 54 50 34 C52 24 59 17 68 14 C60 21 56 29 55 40 C53 60 45 82 27 92" fill="${body}" stroke="${line}" stroke-width="1.5"/>
    <path d="M50 34 C52 24 59 17 68 14" stroke="${hi}" stroke-width="1.6"/>
    <path d="M-20 40 C-46 40 -48 84 -26 90" stroke="${line}" stroke-width="2.4"/>
    <path d="M-20 40 C-46 40 -48 84 -26 90" stroke="${hi}" stroke-width=".8" opacity=".6"/>
    <path d="${outline}" fill="${body}" stroke="${line}" stroke-width="1.6"/>
    <g stroke="${dim}" stroke-width=".7" stroke-dasharray="1.5 3" opacity=".7"><path d="${ringB(90, 29)}"/><path d="${ringB(76, 27)}"/></g>
    <g stroke="${line}" stroke-width=".7" opacity=".6"><path d="${ring(90, 29)}"/><path d="${ring(76, 27)}"/><path d="${ring(44, 15)}"/></g>
    <g stroke="${line}" stroke-width=".7" opacity=".7">
      <path d="M-12 70 L0 62 L12 70 L0 78 Z"/><path d="M-6 70 L0 66 L6 70 L0 74 Z"/>
      <path d="M-28 84 C-14 88 14 88 28 84" stroke-dasharray="1 2.5"/>
    </g>
    <ellipse cx="0" cy="52" rx="10" ry="2.4" stroke="${hi}" stroke-width="1.2"/>
    <ellipse cx="0" cy="36" rx="20" ry="4.4" stroke="${hi}" stroke-width="1.5"/>
    <path d="M-18 35 C-15 22 15 22 18 35" fill="${body}" stroke="${line}" stroke-width="1.5"/>
    <path d="M-8 26 C-4 23 4 23 8 26" stroke="${dim}" stroke-width=".8"/>
    <path d="M0 24 L0 14" stroke="${line}" stroke-width="1.4"/>
    <circle cx="0" cy="12" r="3" fill="${body}" stroke="${hi}" stroke-width="1.3"/>
    <path d="M0 9 L0 3" stroke="${hi}" stroke-width="1.2"/>
    <ellipse cx="0" cy="100" rx="26" ry="5" stroke="${hi}" stroke-width="1.6"/>
  </g>`;
}

// ---------- the stack ----------
/**
 * Positions for a leaning stack of n cups (bottom first), like a real finjan tower.
 * Each cup nests into the one below; alternate tilt gives the playful lean.
 */
export function stackLayout(n, seed = 'stack') {
  const r = rng(seed + ':lean');
  const out = [];
  let x = 0; let y = 0; let rot = 0;
  for (let i = 0; i < n; i++) {
    out.push({ x: f(x), y: f(y), rot: f(rot) });
    rot = (i % 2 ? -1 : 1) * (3 + r() * 6);
    x += (r() - 0.5) * 8;
    y -= 35 + r() * 4;
  }
  return out;
}

/**
 * Full spots-meter SVG for a collab: open spots stand as a stack of patterned cups,
 * taken spots sit filled on the tray. Full collab → empty ghost cup + full tray.
 */
export function stackSVG({ spots, taken, seed = 'finjan', theme = 'night', width = 220, animateLast = false }) {
  const P = PALETTE;
  const open = Math.max(0, spots - taken);
  const layout = stackLayout(Math.max(open, 1), seed);
  const stackH = 70 + 39 * Math.max(open - 1, 0);
  const trayW = Math.max(1, taken) * 34;
  const W = 90 + trayW + 20;
  const H = Math.max(stackH, 70) + 14;
  const baseY = H - 6;
  const id = 'fs' + hashSeed(seed + spots + taken).toString(36);
  const place = (p) => `translate(${f(44 + p.x)} ${f(baseY - 52 + p.y)}) rotate(${p.rot} 0 25)`;
  // Each cup sits inside the one below, so the lower cup's front rim is redrawn on top to read as nesting.
  const rimColor = theme === 'night' ? P.goldHi : '#7A5410';
  const cups = open
    ? layout.map((p, i) => `<g transform="${place(p)}">${cupMarkup({ id: `${id}-o${i}`, seed, theme })}</g>`
        + (i > 0 ? `<g transform="${place(layout[i - 1])}"><path d="M-30 0 A30 7 0 0 0 30 0" fill="none" stroke="${rimColor}" stroke-width="1.9"/></g>` : '')).join('')
    : `<g transform="translate(44 ${baseY - 52})">${cupMarkup({ id: `${id}-g`, ghost: true, theme })}</g>`;
  const tray = Array.from({ length: taken }, (_, i) => {
    const anim = animateLast && i === taken - 1 ? ' class="fj-served"' : '';
    return `<g transform="translate(${f(104 + i * 34)} ${baseY - 30}) scale(.55)"><g${anim}>${cupMarkup({ id: `${id}-t${i}`, seed, theme, fill: 0.85 })}</g></g>`;
  }).join('');
  const trayLine = taken ? `<path d="M90 ${baseY + 1} H${W - 8}" stroke="${theme === 'night' ? P.goldDim : '#C9A866'}" stroke-width="1" stroke-linecap="round"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${width}" role="img" aria-label="${taken} of ${spots} spots taken">
  <style>.fj-served{transform-box:fill-box;transform-origin:50% 100%;animation:fj-serve .7s cubic-bezier(.34,1.56,.64,1) both}
  @keyframes fj-serve{0%{transform:translate(-40px,-60px) rotate(-14deg);opacity:0}100%{transform:none;opacity:1}}
  @media (prefers-reduced-motion:reduce){.fj-served{animation:none}}</style>
  <defs>${defsMarkup(id)}</defs>
  <g filter="url(#${id}-glow)">${cups}${trayLine}${tray}</g>
</svg>`;
}

/** A single cup as a complete SVG (e.g. collab thumbnail, visit pass). */
export function cupSVG({ seed, fill = 0, theme = 'night', size = 120 }) {
  const id = 'fc' + hashSeed(String(seed) + fill).toString(36);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -14 80 74" width="${size}" role="img" aria-label="Finjan">
  <defs>${defsMarkup(id)}</defs><g filter="url(#${id}-glow)">${cupMarkup({ id, seed, fill, theme })}</g></svg>`;
}
