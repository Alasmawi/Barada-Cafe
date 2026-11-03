#!/usr/bin/env python3
"""Draw the documentation diagrams as self-contained SVGs.

    python3 docs/tools/diagrams.py

Writes docs/assets/diagrams/*.svg. Logos come from docs/assets/brands (Simple Icons, CC0) and are
inlined, so nothing is fetched when a diagram is viewed. Everything drawn here mirrors the code:
change the code, then change this.

Animation: dashed flows and packets move along the request wires. Packets are invisible at rest, so
a still render or prefers-reduced-motion shows the finished diagram.
"""
import html
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
BRANDS = os.path.join(HERE, '..', 'assets', 'brands')
OUT = os.path.join(HERE, '..', 'assets', 'diagrams')

# Collab Board's own palette.
CREAM, SURFACE, LINE, INK, SOFT = '#faf5ea', '#fffdf8', '#e6dccb', '#241a16', '#66594f'
RED, RED_SOFT = '#c8102e', '#fbe3e4'
SAFFRON, SAFFRON_SOFT = '#f2b632', '#fbe9bf'
GREEN, GREEN_SOFT = '#2f6b3f', '#e2efe2'
BLUE, BLUE_SOFT = '#2f5f8a', '#e3ecf4'
ORANGE, ORANGE_SOFT = '#f38020', '#fdebd9'
PLUM, PLUM_SOFT = '#4b2145', '#efe3ec'

TITLE = "Ultra, 'Rockwell Extra Bold', Rockwell, Georgia, serif"
SANS = "Archivo, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"

BRAND = {
    'cloudflare': 'F38020', 'cloudflareworkers': 'F38020', 'react': '61DAFB', 'reactrouter': 'CA4245',
    'reactquery': 'FF4154', 'hono': 'E36002', 'zod': '3E67B1', 'typescript': '3178C6', 'vite': '646CFF',
    'vitest': '6E9F18', 'sqlite': '003B57', 'githubactions': '2088FF', 'github': '181717', 'meta': '0467DF',
    'eslint': '4B32C3', 'nodedotjs': '5FA04E',
}
e = html.escape


# ------------------------------------------------------------------ pieces
def logo(name, x, y, size):
    src = open(os.path.join(BRANDS, f'{name}.svg'), encoding='utf8').read()
    d = re.search(r'<path d="([^"]+)"', src).group(1)
    return (f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="0 0 24 24">'
            f'<path d="{d}" fill="#{BRAND[name]}"/></svg>')


GLYPHS = {
    'phone': '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    'laptop': '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    'business': '<rect x="4" y="4" width="16" height="16" rx="4" fill="#f2b632" stroke="#241a16"/>',
    'creator': '<circle cx="12" cy="12" r="8.5" stroke="#c8102e"/><circle cx="12" cy="12" r="5" stroke="#2f6b3f"/>'
               '<circle cx="12" cy="3.5" r="1.6" fill="#241a16" stroke="none"/>',
    'key': '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    'logs': '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 15.5h7M9 19h4"/>',
    'shield': '<path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    'lock': '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    'cookie': '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r="1.2" fill="C" stroke="none"/>'
              '<circle cx="14.5" cy="14" r="1.2" fill="C" stroke="none"/><circle cx="14" cy="8.5" r="1" fill="C" stroke="none"/>',
    'check': '<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
    'users': '<rect x="3" y="8" width="7" height="7" rx="2" fill="#f2b632" stroke="#241a16"/>'
             '<circle cx="16.5" cy="11.5" r="4" stroke="#2f6b3f"/><path d="M3 20h18"/>',
    'db': '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/>'
          '<path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    'sparkle': '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    'stamp': '<rect x="3" y="7" width="18" height="10" rx="2" transform="rotate(-8 12 12)"/><path d="M7.5 12.5h9" transform="rotate(-8 12 12)"/>',
    'search': '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    'send': '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    'code': '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 10l-2 2 2 2M16 10l2 2-2 2M13 9l-2 6"/>',
    'link': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    'flag': '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    'wall': '<rect x="3" y="4" width="8" height="7" rx="1.5" transform="rotate(-4 7 7.5)"/><rect x="13" y="4" width="8" height="7" rx="1.5" transform="rotate(3 17 7.5)"/>'
            '<rect x="3" y="13" width="8" height="7" rx="1.5" transform="rotate(2 7 16.5)"/><rect x="13" y="13" width="8" height="7" rx="1.5" stroke-dasharray="2 2"/>',
    'awning': '<path d="M3 5h18v5a2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0A2.25 2.25 0 0 1 3 10z"/><path d="M5 13v7h14v-7"/>',
    'inbox': '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    'chart': '<path d="M4 20h16"/><path d="M7 20v-6M12 20V8M17 20v-9"/>',
    'race': '<path d="M3 8h9M3 16h9"/><path d="M12 8l5 4-5 4"/><circle cx="19.5" cy="12" r="1.8" fill="C" stroke="none"/>',
    'heart': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    'playwright': '<path d="M4 15c2-6 6-9 12-9 2 0 3.5.5 4 1-1 5-5 10-11 10-2 0-4-.6-5-2z"/><circle cx="14" cy="10" r="1.3" fill="C" stroke="none"/>',
    'git': '<circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="12" r="2.3"/><path d="M6 8.3v7.4M8 7l8 4"/>',
    'rocket': '<path d="M12 3c3 2 5 6 4 11l-4 3-4-3c-1-5 1-9 4-11z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M8 14l-3 3 4 1M16 14l3 3-4 1"/>',
    'heartbeat': '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    'globe': '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17"/>',
    'scale': '<path d="M12 4v16M5 20h14"/><path d="M5 8h14"/><path d="M5 8l-2.5 6h5zM19 8l-2.5 6h5z"/>',
}


def glyph(kind, x, y, size, colour=INK, width=1.7):
    body = GLYPHS[kind].replace('"C"', f'"{colour}"')
    s = size / 24
    return (f'<g transform="translate({x} {y}) scale({s:.4f})" fill="none" stroke="{colour}" '
            f'stroke-width="{width / s * s:.2f}" stroke-linecap="round" stroke-linejoin="round">{body}</g>')


def text(x, y, s, size=13, fill=INK, weight=400, anchor='start', family=SANS, spacing=0):
    ls = f' letter-spacing="{spacing}"' if spacing else ''
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}"{ls}>{e(s)}</text>')


def heading(w, title, subtitle):
    return (text(40, 62, title, 34, INK, 900, family=TITLE)
            + text(42, 92, subtitle, 15, SOFT)
            + f'<rect x="40" y="108" width="{w - 80}" height="1.5" fill="{LINE}"/>')


def panel(x, y, w, h, label, colour, soft, icon=None):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{soft}" stroke="{colour}" stroke-width="1.6"/>']
    lw = len(label) * 9.3 + (48 if icon else 26)
    out.append(f'<rect x="{x + 14}" y="{y - 13}" width="{lw}" height="26" rx="13" fill="{colour}"/>')
    tx = x + 26
    if icon:
        out.append(icon(x + 22, y - 9))
        tx = x + 46
    out.append(text(tx, y + 5, label.upper(), 11.5, SURFACE, 800, spacing=1.2))
    return ''.join(out)


def chip(x, y, w, icon, name, sub=None, h=52, accent=None):
    """A white card: icon on the left, name and detail on the right."""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="11" fill="{SURFACE}" stroke="{LINE}"/>']
    if accent:
        out.append(f'<rect x="{x}" y="{y + 10}" width="3.5" height="{h - 20}" rx="1.75" fill="{accent}"/>')
    out.append(icon(x + 12, y + (h - 28) / 2))
    out.append(text(x + 50, y + (h / 2 - 3 if sub else h / 2 + 5), name, 13.5, INK, 700))
    if sub:
        out.append(text(x + 50, y + h / 2 + 14, sub, 11.5, SOFT))
    return ''.join(out)


def tile(x, y, icon, name, sub=None, w=92):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{86 if sub else 74}" rx="12" fill="{SURFACE}" stroke="{LINE}"/>',
           icon(x + w / 2 - 15, y + 10),
           text(x + w / 2, y + 58, name, 12, INK, 700, 'middle')]
    if sub:
        out.append(text(x + w / 2, y + 74, sub, 10.5, SOFT, 400, 'middle'))
    return ''.join(out)


def L(name, size=28):
    return lambda x, y: logo(name, x, y, size)


def G(kind, colour=INK, size=28):
    return lambda x, y: glyph(kind, x, y, size, colour)


PACKETS = []


def wire(points, colour=SOFT, label=None, at=None, dash=False, flow=None, packet=None, label_colour=None):
    d = ' '.join(f"{'M' if i == 0 else 'L'}{px},{py}" for i, (px, py) in enumerate(points))
    dd = ' stroke-dasharray="6 5"' if dash else ''
    out = [f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="2"{dd} marker-end="url(#arrow)"/>']
    if flow:
        out.append(f'<path class="flow" d="{d}" stroke="{flow}"/>')
    if packet is not None:
        delay, pcolour = packet
        PACKETS.append(f'<circle class="pkt" r="6" fill="{pcolour}" stroke="{SURFACE}" stroke-width="2" '
                       f'style="offset-path: path(\'{d}\'); animation-delay: {delay:.2f}s"/>')
    if label:
        lx, ly = at
        w = len(label) * 6.7 + 16
        out.append(f'<rect x="{lx - w / 2}" y="{ly - 12}" width="{w}" height="20" rx="10" fill="{SURFACE}" stroke="{label_colour or LINE}"/>')
        out.append(text(lx, ly + 2, label, 10.5, label_colour or SOFT, 600, 'middle', MONO))
    return ''.join(out)


def document(name, w, h, title, desc, body, cycle=6.0):
    packets = ''.join(PACKETS)
    PACKETS.clear()
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="t d">
<title id="t">{e(title)}</title>
<desc id="d">{e(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{SOFT}"/></marker></defs>
<style>
.flow {{ fill: none; stroke-width: 2.4; stroke-dasharray: 4 10; stroke-opacity: 0; animation: flow 1.2s linear infinite; }}
@keyframes flow {{ from {{ stroke-dashoffset: 14; stroke-opacity: .8; }} to {{ stroke-dashoffset: 0; stroke-opacity: .8; }} }}
.pkt {{ opacity: 0; offset-rotate: 0deg; animation: pkt {cycle}s linear infinite; }}
@keyframes pkt {{ 0% {{ offset-distance: 0%; opacity: 1; }} {0.9 / cycle * 100:.2f}% {{ offset-distance: 100%; opacity: 1; }} {0.9 / cycle * 100 + 0.6:.2f}%, 100% {{ offset-distance: 100%; opacity: 0; }} }}
.rise {{ animation: rise .7s cubic-bezier(.2,.7,.1,1) both; }}
@keyframes rise {{ from {{ opacity: 0; transform: translateY(14px); }} }}
@media (prefers-reduced-motion: reduce) {{ .flow, .pkt, .rise {{ animation: none; }} .pkt {{ opacity: 0; }} }}
</style>
<rect width="{w}" height="{h}" rx="22" fill="{CREAM}"/>
{body}{packets}
</svg>
'''
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, f'{name}.svg'), 'w', encoding='utf8').write(svg)
    print('wrote', name)


def rise(content, delay):
    return f'<g class="rise" style="animation-delay:{delay:.2f}s">{content}</g>'


# ------------------------------------------------------------ 1. overview
def overview():
    W, H = 1400, 640
    b = [heading(W, 'How Collab Board works', 'Two sides, one board. Every arrow is something a person does in the app.')]
    # Businesses
    b.append(rise(panel(40, 160, 360, 430, 'Businesses', '#8a5a00', SAFFRON_SOFT, G('business', SURFACE, 16)), 0))
    biz = [('awning', 'Post a collab', 'offer, what to post, spots, end date'), ('sparkle', 'Fill it with AI', 'one sentence becomes a draft'),
           ('search', 'Find creators', 'search, AI summary, invite'), ('inbox', 'Review applicants', 'accept or decline'),
           ('check', 'Mark complete', 'after the post is live')]
    for i, (g, n, s) in enumerate(biz):
        b.append(rise(chip(60, 190 + i * 76, 320, G(g, '#8a5a00'), n, s, h=62, accent=SAFFRON), 0.1 + i * 0.06))
    # Creators
    b.append(rise(panel(1000, 160, 360, 430, 'Creators', GREEN, GREEN_SOFT, G('creator', SURFACE, 16)), 0))
    cre = [('globe', 'Browse the board', 'every live collab'), ('send', 'Apply in one line', '140 characters'),
           ('mail', 'Answer invites', 'accept or decline'), ('stamp', 'Visit with a code', 'shown at the counter'),
           ('link', 'Add the post link', 'https only')]
    for i, (g, n, s) in enumerate(cre):
        b.append(rise(chip(1020, 190 + i * 76, 320, G(g, GREEN), n, s, h=62, accent=GREEN), 0.1 + i * 0.06))
    # Board in the middle
    b.append(rise(panel(470, 200, 460, 350, 'Collab Board', RED, RED_SOFT, G('stamp', SURFACE, 16)), 0.2))
    core = [('race', 'Never overbooked', 'one SQL statement guards every spot'), ('users', 'One account per business', 'enforced by a unique index'),
            ('stamp', 'Clear statuses', 'Applied, Accepted, Posted, Completed'), ('wall', 'Profile wall', 'completed collabs pinned up')]
    for i, (g, n, s) in enumerate(core):
        b.append(rise(chip(492, 232 + i * 76, 416, G(g, RED), n, s, h=62, accent=RED), 0.3 + i * 0.06))
    # Flows
    b.append(wire([(400, 260), (470, 260)], '#8a5a00', 'posts', (435, 244), flow=SAFFRON, packet=(0, SAFFRON)))
    b.append(wire([(1000, 300), (930, 300)], GREEN, 'applies', (965, 284), flow=GREEN, packet=(0.9, GREEN)))
    b.append(wire([(470, 420), (400, 420)], '#8a5a00', 'applicants', (435, 404), flow=SAFFRON, packet=(1.8, SAFFRON)))
    b.append(wire([(930, 460), (1000, 460)], GREEN, 'accepted', (965, 444), flow=GREEN, packet=(2.7, GREEN)))
    # Outcomes
    b.append(rise(f'<rect x="400" y="574" width="600" height="40" rx="20" fill="{INK}"/>'
                  + text(700, 599, 'Outcome: businesses gain content and reach; creators build a track record', 12.5, CREAM, 600, 'middle'), 0.6))
    document('overview', W, H, 'How Collab Board works',
             'Businesses post collabs and review applicants; creators browse, apply, visit and post; the board guarantees no collab is overbooked.',
             ''.join(b), cycle=4.5)


# --------------------------------------------------------- 2. architecture
def architecture():
    W, H = 1400, 900
    b = [heading(W, 'Architecture', 'One Cloudflare Worker serves the app and the API. Logos mark the technology in each part.')]
    # Client
    b.append(panel(40, 150, 270, 480, 'Browser', BLUE, BLUE_SOFT, G('globe', SURFACE, 16)))
    b.append(chip(56, 176, 238, G('creator', INK), 'Creator', 'phone browser', accent=GREEN))
    b.append(chip(56, 238, 238, G('business', INK), 'Business', 'phone or laptop', accent=SAFFRON))
    b.append(text(175, 322, 'React single-page app', 12, SOFT, 700, 'middle'))
    b.append(tile(56, 334, L('react', 30), 'React 19', 'screens', w=114))
    b.append(tile(180, 334, L('reactrouter', 30), 'Router 7', 'navigation', w=114))
    b.append(tile(56, 430, L('reactquery', 30), 'TanStack', 'Query 5 cache', w=114))
    b.append(tile(180, 430, L('vite', 30), 'Vite 8', 'build', w=114))
    b.append(chip(56, 530, 238, L('typescript', 26), 'TypeScript', 'types shared with the API', h=50))
    b.append(text(175, 610, 'Fonts bundled: no third-party calls', 11, SOFT, 400, 'middle'))
    # Edge
    b.append(panel(350, 150, 220, 480, 'Cloudflare edge', ORANGE, ORANGE_SOFT, L('cloudflare', 18)))
    b.append(f'<rect x="366" y="180" width="188" height="80" rx="12" fill="{SURFACE}" stroke="{LINE}"/>')
    b.append(logo('cloudflare', 436, 186, 48))
    b.append(text(460, 250, 'HTTPS · workers.dev', 11, SOFT, 600, 'middle', MONO))
    b.append(f'<path d="M460 300 l36 30 -36 30 -36 -30 z" fill="{SURFACE}" stroke="{ORANGE}" stroke-width="1.8"/>')
    b.append(text(460, 334, '/api/* ?', 12, INK, 700, 'middle', MONO))
    b.append(chip(366, 390, 188, G('code', ORANGE), 'Static app', 'SPA fallback', h=52))
    b.append(chip(366, 454, 188, G('shield', ORANGE), '_headers', 'CSP · X-Frame DENY', h=52))
    b.append(text(460, 540, 'API paths reach the Worker;', 11, SOFT, 400, 'middle'))
    b.append(text(460, 556, 'all others get the app.', 11, SOFT, 400, 'middle'))
    # Worker
    b.append(panel(610, 150, 430, 480, 'Worker  /api/v1', RED, RED_SOFT, L('cloudflareworkers', 18)))
    for i, n in enumerate(['cloudflareworkers', 'hono', 'zod', 'typescript']):
        b.append(f'<rect x="{628 + i * 100}" y="174" width="92" height="44" rx="10" fill="{SURFACE}" stroke="{LINE}"/>' + logo(n, 640 + i * 100, 183, 26)
                 + text(684 + i * 100 - 10, 201, ['Workers', 'Hono 4', 'Zod 4', 'TS 5.9'][i], 11, INK, 700))
    layers = [('Hono app', 'security headers · one error shape', 'shield'),
              ('actingUser', 'session cookie to user', 'cookie'),
              ('routes/*', 'Zod validation · HTTP only', 'check'),
              ('services/*', 'role, ownership, status machine', 'scale'),
              ('repositories/*', 'parameterised SQL · guarded writes', 'db')]
    for i, (n, s, g) in enumerate(layers):
        y = 238 + i * 66
        b.append(chip(628, y, 270, G(g, RED, 26), n, s, h=54, accent=RED))
        if i < 4:
            b.append(f'<path d="M763 {y + 54} v12" stroke="{RED}" stroke-width="2" marker-end="url(#arrow)"/>')
    b.append(chip(910, 436, 116, G('sparkle', PLUM, 24), 'ai/*', '8 s timeout', h=54))
    b.append(chip(910, 502, 116, G('flag', SOFT, 24), 'seed', 'demo reset', h=54))
    b.append(wire([(898, 463), (910, 463)], RED))
    # Data
    b.append(panel(1080, 150, 280, 480, 'Data and services', INK, '#efe8dc', G('db', SURFACE, 16)))
    b.append(chip(1096, 180, 248, L('sqlite', 28), 'Cloudflare D1', 'SQLite · 7 tables · 5 migrations', h=62, accent=INK))
    b.append(chip(1096, 262, 248, L('meta', 28), 'Workers AI', 'Llama 3.3 70B · JSON mode', h=62, accent=PLUM))
    b.append(chip(1096, 344, 248, G('key', INK), 'Secret', 'DEMO_RESET_TOKEN', h=62, accent=INK))
    b.append(chip(1096, 426, 248, G('logs', INK), 'Observability', 'Worker logs', h=62, accent=INK))
    b.append(text(1220, 530, 'Free plan: 100k requests,', 11, SOFT, 400, 'middle'))
    b.append(text(1220, 546, '5M rows read, 10k AI neurons a day', 11, SOFT, 400, 'middle'))
    # Request wires
    b.append(wire([(310, 300), (424, 330)], BLUE, 'HTTPS', (360, 300), flow=BLUE, packet=(0, BLUE)))
    b.append(wire([(496, 330), (628, 265)], ORANGE, '/api/*', (562, 282), flow=ORANGE, packet=(0.9, ORANGE)))
    b.append(wire([(460, 360), (460, 390)], ORANGE))
    b.append(wire([(763, 556), (763, 600), (1060, 600), (1060, 211), (1096, 211)], INK, 'SQL', (900, 600), flow=INK, packet=(1.8, INK)))
    b.append(wire([(1026, 463), (1070, 463), (1070, 293), (1096, 293)], PLUM, None, None, flow=PLUM, packet=(2.7, PLUM)))
    b.append(wire([(1026, 529), (1080, 529), (1080, 375), (1096, 375)], SOFT, dash=True))
    # Delivery
    b.append(panel(40, 690, 1320, 170, 'Build, test and deliver', SOFT, '#f1ebe0', L('githubactions', 18)))
    steps = [(L('github', 28), 'GitHub', 'push to main'), (L('githubactions', 28), 'Actions', 'CI pipeline'),
             (L('nodedotjs', 28), 'Node 24', 'npm ci'), (L('typescript', 28), 'Typecheck', 'web and worker'),
             (L('eslint', 28), 'ESLint', 'lint'), (L('vitest', 28), 'Vitest 5', '265 tests'),
             (L('vite', 28), 'Vite', 'build'), (L('cloudflare', 28), 'wrangler', 'migrate · deploy')]
    for i, (ic, n, s) in enumerate(steps):
        x = 64 + i * 160
        b.append(tile(x, 722, ic, n, s, w=128))
        if i < len(steps) - 1:
            b.append(f'<path d="M{x + 128} 765 h28" stroke="{SOFT}" stroke-width="2" marker-end="url(#arrow)"/>')
    b.append(text(700, 838, 'Run by hand: playwright-core visits every screen at five widths in every state (300 checks).', 11.5, SOFT, 400, 'middle'))
    b.append(wire([(1268, 722), (1268, 660), (900, 660), (900, 630)], SOFT, 'new version', (1090, 660), dash=True))
    b.append(wire([(1300, 722), (1300, 630)], SOFT, 'migrations', (1300, 676), dash=True))
    document('architecture', W, H, 'Collab Board architecture',
             'Browsers reach Cloudflare\'s edge; API paths go to a Worker built on Hono and Zod with routes, services and repositories; '
             'data lives in D1 and AI runs on Workers AI; GitHub Actions checks and deploys with wrangler.', ''.join(b), cycle=4.5)


# ------------------------------------------------------------ 3. features
def features():
    W, H = 1400, 700
    b = [heading(W, 'Features', 'Everything a business and a creator can do today, and what the platform guarantees for both.')]
    cols = [
        ('For businesses', '#8a5a00', SAFFRON_SOFT, SAFFRON, 'business', [
            ('users', 'Business account', 'one per business, name and colour'),
            ('awning', 'Post and edit collabs', 'offer, deliverable, spots, end date, details'),
            ('sparkle', 'AI post draft', 'one sentence fills the form'),
            ('search', 'Creator search', 'by name, handle or tag; 30 results'),
            ('sparkle', 'AI creator summary', 'saved; plain facts by default'),
            ('mail', 'Invites', 'to any post, under the spot rule'),
            ('inbox', 'Applicants', 'accept, decline, mark complete'),
            ('chart', 'Overview', 'stats, decisions due, ending soon')]),
        ('Platform', RED, RED_SOFT, RED, 'stamp', [
            ('race', 'Spot guarantee', 'never more creators than spots'),
            ('lock', 'Accounts and sessions', 'hashed passwords, HttpOnly cookie'),
            ('scale', 'Server-side checks', 'role and ownership on every action'),
            ('stamp', 'Statuses as stamps', 'Applied to Completed'),
            ('code', 'Visit codes', 'CB-XXXX, issued on accept'),
            ('globe', 'Phone to desktop', '320 to 1280px, Reduce Motion'),
            ('heartbeat', 'Graceful AI failure', 'timeouts and plain fallbacks'),
            ('flag', 'Demo tools', 'accounts, preview states, locked reset')]),
        ('For creators', GREEN, GREEN_SOFT, GREEN, 'creator', [
            ('creator', 'Creator profile', 'ring from tags, one line, socials'),
            ('globe', 'The board', 'awnings, tilt, stamps'),
            ('send', 'Apply', 'one line, 140 characters'),
            ('mail', 'Answer invites', 'accept or decline'),
            ('code', 'Code card', 'shown at the business'),
            ('link', 'Post link', 'https, fixable until complete'),
            ('sparkle', 'Picked for you', 'AI reasons, once a day'),
            ('wall', 'Profile wall', 'completed collabs pinned up')]),
    ]
    for c, (label, colour, soft, accent, ic, items) in enumerate(cols):
        x = 40 + c * 450
        b.append(rise(panel(x, 150, 420, 510, label, colour, soft, G(ic, SURFACE, 16)), c * 0.1))
        for i, (g, n, s) in enumerate(items):
            b.append(rise(chip(x + 16, 176 + i * 59, 388, G(g, colour, 24), n, s, h=50, accent=accent), c * 0.1 + i * 0.04))
    document('features', W, H, 'Collab Board features', 'Business features, platform guarantees and creator features, eight each.', ''.join(b))


# ------------------------------------------------------------ 4. security
def security():
    W, H = 1400, 560
    b = [heading(W, 'How a request is protected', 'Each step a request passes through, and what it stops. Every check runs on the server.')]
    steps = [
        (ORANGE, ORANGE_SOFT, L('cloudflare', 30), 'Edge', 'HTTPS only', 'eavesdropping'),
        (ORANGE, ORANGE_SOFT, G('shield', ORANGE, 30), 'Headers', 'CSP, frame DENY, nosniff', 'clickjacking, injected scripts'),
        (RED, RED_SOFT, G('cookie', RED, 30), 'Session', 'HttpOnly, SameSite=Lax', 'script access, cross-site posts'),
        (RED, RED_SOFT, L('zod', 30), 'Validation', 'Zod schema per route', 'malformed input'),
        (RED, RED_SOFT, G('scale', RED, 30), 'Permission', 'role and ownership', 'acting on others\' data'),
        (INK, '#efe8dc', L('sqlite', 30), 'Data', 'bound parameters, guarded writes', 'SQL injection, overbooking'),
    ]
    for i, (colour, soft, ic, n, how, stops) in enumerate(steps):
        x = 40 + i * 222
        b.append(rise(f'<rect x="{x}" y="160" width="200" height="250" rx="16" fill="{soft}" stroke="{colour}" stroke-width="1.6"/>'
                      + f'<circle cx="{x + 30}" cy="160" r="15" fill="{colour}"/>' + text(x + 30, 165, str(i + 1), 13, SURFACE, 800, 'middle')
                      + f'<rect x="{x + 70}" y="184" width="60" height="60" rx="14" fill="{SURFACE}" stroke="{LINE}"/>' + ic(x + 85, 199)
                      + text(x + 100, 276, n, 16, INK, 800, 'middle')
                      + text(x + 100, 300, how.split(', ')[0] if len(how) > 24 else how, 11.5, SOFT, 400, 'middle')
                      + (text(x + 100, 316, ', '.join(how.split(', ')[1:]), 11.5, SOFT, 400, 'middle') if len(how) > 24 else '')
                      + f'<rect x="{x + 14}" y="338" width="172" height="56" rx="10" fill="{SURFACE}" stroke="{LINE}"/>'
                      + text(x + 100, 358, 'STOPS', 9.5, colour, 800, 'middle', spacing=1.4)
                      + text(x + 100, 378, stops, 11, INK, 600, 'middle'), i * 0.08))
        if i < len(steps) - 1:
            b.append(wire([(x + 200, 285), (x + 222, 285)], SOFT, flow=RED, packet=(i * 0.9, RED)))
    b.append(f'<rect x="40" y="440" width="1320" height="84" rx="14" fill="{SURFACE}" stroke="{LINE}"/>')
    b.append(glyph('lock', 62, 466, 30, RED))
    b.append(text(108, 474, 'Passwords: PBKDF2-SHA256 with a random salt. Sessions: random tokens, stored only as SHA-256 hashes.', 13, INK, 600))
    b.append(text(108, 498, 'Demo-strength by design: 10,000 rounds, sessions expire only with the 30-day cookie, and no login rate limit.', 12.5, RED, 600))
    document('security', W, H, 'How a request is protected',
             'Six server-side steps: HTTPS at the edge, security headers, session cookie, Zod validation, role and ownership checks, and parameterised guarded SQL.',
             ''.join(b), cycle=6)


# ----------------------------------------------------------- 5. data flow
def data_flow():
    W, H = 1400, 620
    b = [heading(W, 'What data goes where', 'What the app stores, and the only data that ever leaves it: three AI features, all checked by code.')]
    b.append(panel(40, 150, 300, 420, 'People enter', BLUE, BLUE_SOFT, G('users', SURFACE, 16)))
    ins = [('business', 'Business', 'name, colour, username'), ('creator', 'Creator', 'name, handle, tags, line, socials'),
           ('awning', 'Collabs', 'offer, deliverable, details'), ('send', 'Applications', 'one line, post link'),
           ('lock', 'Passwords', 'hashed before storing')]
    for i, (g, n, s) in enumerate(ins):
        b.append(chip(56, 178 + i * 76, 268, G(g, BLUE if g not in ('business', 'creator') else INK, 26), n, s, h=62, accent=BLUE))
    b.append(panel(420, 150, 520, 420, 'Stored in Cloudflare D1', INK, '#efe8dc', L('sqlite', 18)))
    tables = [('businesses', 'name, colour'), ('users', 'accounts, hashes, tags, socials'),
              ('sessions', 'SHA-256 hashes of tokens only'), ('collabs', 'posts'),
              ('requests', 'applications, codes, links'), ('pick_reasons', 'saved AI reasons, one a day'),
              ('demo_meta', 'last reset time')]
    for i, (n, s) in enumerate(tables):
        x = 440 + (i % 2) * 246
        y = 178 + (i // 2) * 72
        b.append(chip(x, y, 232, G('db', INK, 24), n, s, h=60, accent=INK))
    b.append(text(680, 508, 'Kept until the demo is reset. There is no', 12, SOFT, 400, 'middle'))
    b.append(text(680, 526, 'account deletion yet.', 12, SOFT, 400, 'middle'))
    b.append(panel(1020, 150, 340, 420, 'Sent to Workers AI', PLUM, PLUM_SOFT, L('meta', 18)))
    b.append(chip(1036, 180, 308, G('sparkle', PLUM, 26), 'Creator summary', 'name, tags, one line, completed count', h=60, accent=PLUM))
    b.append(chip(1036, 248, 308, G('sparkle', PLUM, 26), 'Post draft', 'the sentence the business typed', h=60, accent=PLUM))
    b.append(chip(1036, 316, 308, G('sparkle', PLUM, 26), 'Picked for you', "creator's tags and line, open collabs", h=60, accent=PLUM))
    b.append(f'<rect x="1036" y="388" width="308" height="122" rx="12" fill="{SURFACE}" stroke="{RED}" stroke-dasharray="5 4"/>')
    b.append(text(1056, 412, 'NEVER SENT', 10, RED, 800, spacing=1.4))
    for i, s in enumerate(['passwords or session tokens', 'socials or post links', 'applications or codes', 'other users\' data']):
        b.append(text(1056, 434 + i * 19, '·  ' + s, 12, INK, 500))
    b.append(text(1190, 532, 'Business taps for drafts and summaries;', 11, SOFT, 400, 'middle'))
    b.append(text(1190, 548, 'pick reasons once a day per creator.', 11, SOFT, 400, 'middle'))
    b.append(wire([(340, 360), (420, 360)], BLUE, 'stored', (380, 344), flow=BLUE, packet=(0, BLUE)))
    b.append(wire([(940, 215), (1036, 215)], PLUM, 'on demand', (988, 198), flow=PLUM, packet=(0.9, PLUM)))
    document('data-flow', W, H, 'What data goes where',
             'People enter account, collab and application data, stored in D1; only two on-demand AI calls send data out, never passwords, sessions, socials or other users\' data.',
             ''.join(b), cycle=3.6)


# ------------------------------------------------------------ 6. delivery
def delivery():
    W, H = 1400, 470
    b = [heading(W, 'From commit to live', 'Every push is checked. Only main deploys, and migrations always run before the new code.')]
    stages = [
        (BLUE, BLUE_SOFT, [(L('github', 26), 'Push', 'any branch or PR')]),
        (GREEN, GREEN_SOFT, [(L('typescript', 26), 'Typecheck', 'web and worker'), (L('eslint', 26), 'Lint', 'ESLint 10'),
                             (L('vitest', 26), 'Test', '265 tests, real D1')]),
        (PLUM, PLUM_SOFT, [(L('vite', 26), 'Build', 'Vite 8')]),
        (ORANGE, ORANGE_SOFT, [(L('cloudflare', 26), 'Migrate', 'D1, before code'), (L('cloudflareworkers', 26), 'Deploy', 'new Worker version')]),
        (RED, RED_SOFT, [(G('heartbeat', RED, 26), 'Health', 'GET /api/v1/health')]),
    ]
    labels = ['Source', 'Check', 'Build', 'Release', 'Verify']
    x = 53
    widths = [190, 318, 190, 318, 190]
    for i, ((colour, soft, items), w) in enumerate(zip(stages, widths)):
        b.append(rise(panel(x, 160, w, 230, labels[i], colour, soft), i * 0.08))
        for j, (ic, n, s) in enumerate(items):
            b.append(rise(chip(x + 14, 186 + j * 66, w - 28, ic, n, s, h=56, accent=colour), i * 0.08 + j * 0.05))
        if i < 4:
            b.append(wire([(x + w, 275), (x + w + 22, 275)], SOFT, flow=colour, packet=(i * 0.9, colour)))
        x += w + 22
    b.append(text(700, 428, 'Deploys run only for pushes to main once CLOUDFLARE_ACCOUNT_ID is set. Rollback: wrangler rollback restores the previous code; migrations only move forward.', 12, SOFT, 400, 'middle'))
    document('delivery', W, H, 'From commit to live',
             'Push, then typecheck, lint and 265 tests, then a Vite build, then D1 migrations before the new Worker version, then a health check.',
             ''.join(b), cycle=5)


def coloured_logos():
    """Each logo in its brand colour on a light tile, for tables in the Markdown docs."""
    out = os.path.join(HERE, '..', 'assets', 'logos')
    os.makedirs(out, exist_ok=True)
    for name in BRAND:
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'
               f'<rect width="32" height="32" rx="8" fill="{SURFACE}" stroke="{LINE}"/>{logo(name, 6, 6, 20)}</svg>\n')
        open(os.path.join(out, f'{name}.svg'), 'w', encoding='utf8').write(svg)
    print('wrote logos')


if __name__ == '__main__':
    coloured_logos()
    overview()
    architecture()
    features()
    security()
    data_flow()
    delivery()
