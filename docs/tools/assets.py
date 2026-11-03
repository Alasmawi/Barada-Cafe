"""Draw the banner, the status and spot-race animations, the awning divider and the doc icons.

    python3 docs/tools/assets.py
"""
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
CREAM, SURFACE, LINE, INK, SOFT, RED = '#faf5ea', '#fffdf8', '#e6dccb', '#241a16', '#66594f', '#c8102e'
GREEN, BLUE = '#2f6b3f', '#2f5f8a'
HOUSES = {'saffron': ('#f2b632', '#fbe9bf'), 'gulf': ('#0f4c5c', '#c9dade'), 'sage': ('#c9ddaa', '#eef4e4'),
          'oud': ('#4b2145', '#ddcdd9'), 'coral': ('#ff7a59', '#ffe0d6')}
TITLE = "Ultra, 'Rockwell Extra Bold', Rockwell, Georgia, serif"
SANS = "Archivo, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace"


def awning(x, y, width, height, house, step=16, clip=None):
    """Stripes of one house colour and its pale tint, ending in one scallop per stripe."""
    bg, pale = HOUSES[house]
    body = height - step / 2
    parts = []
    count = int(width // step) + 1
    for i in range(count):
        sx = x + i * step
        w = min(step, x + width - sx)
        if w <= 0:
            break
        colour = bg if i % 2 == 0 else pale
        r = w / 2
        parts.append(f'<path d="M{sx} {y} h{w} v{body} a{r} {r} 0 0 1 {-w} 0 Z" fill="{colour}"/>')
    g = ''.join(parts)
    return f'<g clip-path="url(#{clip})">{g}</g>' if clip else f'<g>{g}</g>'


def write(name, svg):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf8').write(svg)
    print('wrote', name)


MOTION_GUARD = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }'


# ---------- banner ----------
def card(x, y, angle, house, title, sub, meta, stamp=None, delay=0.0):
    bg, _ = HOUSES[house]
    w, h = 236, 124
    cid = f'c{house}'
    stamp_svg = ''
    if stamp:
        label, colour = stamp
        sw = 12 + len(label) * 8.6
        stamp_svg = (f'<g transform="translate({w - sw / 2 - 12} {h - 20}) rotate(-8)">'
                     f'<g class="stamp" style="animation-delay:{delay + 0.9:.2f}s">'
                     f'<rect x="{-sw / 2}" y="-11" width="{sw}" height="22" rx="4" fill="{SURFACE}" stroke="{colour}" stroke-width="2"/>'
                     f'<text x="0" y="5" text-anchor="middle" font-family="{SANS}" font-size="12" font-weight="800" letter-spacing="1.4" fill="{colour}">{label}</text>'
                     f'</g></g>')
    return (f'<g transform="translate({x} {y}) rotate({angle} {w / 2} {h / 2})">'
            f'<g class="rise" style="animation-delay:{delay:.2f}s">'
            f'<clipPath id="{cid}"><rect width="{w}" height="{h}" rx="14"/></clipPath>'
            f'<rect width="{w}" height="{h}" rx="14" fill="{SURFACE}" stroke="{LINE}"/>'
            f'{awning(0, 0, w, 22, house, clip=cid)}'
            f'<rect x="16" y="36" width="26" height="26" rx="6" fill="{bg}"/>'
            f'<text x="52" y="54" font-family="{SANS}" font-size="13" font-weight="600" fill="{INK}">{sub}</text>'
            f'<text x="16" y="84" font-family="{TITLE}" font-size="16" font-weight="900" fill="{INK}">{title}</text>'
            f'<text x="16" y="108" font-family="{SANS}" font-size="12" fill="{SOFT}">{meta}</text>'
            f'{stamp_svg}</g></g>')


banner = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="340" viewBox="0 0 1200 340" role="img" aria-labelledby="t d">
<title id="t">Collab Board</title>
<desc id="d">Collab Board banner: collab cards under business awnings, one stamped Accepted.</desc>
<style>
.rise {{ animation: rise .8s cubic-bezier(.2,.7,.1,1) both; }}
.stamp {{ transform-box: fill-box; transform-origin: center; animation: thump .45s cubic-bezier(.3,1.6,.6,1) both; }}
.ring {{ transform-box: fill-box; transform-origin: center; animation: spin 18s linear infinite; }}
@keyframes rise {{ from {{ opacity: 0; transform: translateY(26px); }} }}
@keyframes thump {{ from {{ opacity: 0; transform: scale(1.8); }} }}
@keyframes spin {{ to {{ transform: rotate(360deg); }} }}
{MOTION_GUARD}
</style>
<clipPath id="frame"><rect width="1200" height="340" rx="20"/></clipPath>
<rect width="1200" height="340" rx="20" fill="{CREAM}"/>
{awning(0, 0, 1200, 34, 'saffron', step=24, clip='frame')}
<text x="56" y="160" font-family="{TITLE}" font-size="64" font-weight="900" fill="{INK}">Collab Board</text>
<text x="58" y="204" font-family="{SANS}" font-size="22" fill="{SOFT}">Businesses post collabs. Creators apply.</text>
<g transform="translate(58 234)">
  <rect width="30" height="30" rx="7" fill="{HOUSES['saffron'][0]}"/>
  <text x="42" y="21" font-family="{SANS}" font-size="15" font-weight="600" fill="{INK}">Businesses are squares</text>
  <g transform="translate(244 15)"><g class="ring">
    <circle r="15" fill="none" stroke="{RED}" stroke-width="2.5"/>
    <circle r="10" fill="none" stroke="{GREEN}" stroke-width="2.5"/>
    <circle r="5" fill="none" stroke="{HOUSES['saffron'][0]}" stroke-width="2.5"/>
    <circle cx="0" cy="-15" r="3" fill="{INK}"/><circle cx="0" cy="15" r="3" fill="{INK}"/>
  </g></g>
  <text x="268" y="21" font-family="{SANS}" font-size="15" font-weight="600" fill="{INK}">creators are rings</text>
</g>
{card(612, 58, -2.0, 'sage', 'Sunset majlis dinner', 'Sidra Garden', '1 spot left', ('LAST SPOT', RED), 0.0)}
{card(880, 52, 1.5, 'oud', 'An evening of oud', 'Layali Perfumes', '2 spots left', None, 0.15)}
{card(652, 198, 1.2, 'saffron', 'Karak tasting flight', 'Barada Café', 'Ends in 3 days', ('ACCEPTED', RED), 0.3)}
{card(918, 194, -1.4, 'coral', 'Mat classes', 'Move Studio', '2 spots left', ('APPLIED', GREEN), 0.45)}
</svg>
'''
write('banner.svg', banner)


# ---------- status journey ----------
STEPS = [('APPLIED', GREEN), ('ACCEPTED', RED), ('POSTED', BLUE), ('COMPLETED', INK)]
gap = 210
x0 = 120
stamps = []
for i, (label, colour) in enumerate(STEPS):
    cx = x0 + i * gap
    sw = 20 + len(label) * 10
    stamps.append(
        f'<g transform="translate({cx} 78) rotate(-7)"><g class="s" style="animation-delay:{i * 1.6:.1f}s">'
        f'<rect x="{-sw / 2}" y="-16" width="{sw}" height="32" rx="5" fill="{SURFACE}" stroke="{colour}" stroke-width="2.5"/>'
        f'<text x="0" y="6" text-anchor="middle" font-family="{SANS}" font-size="15" font-weight="800" letter-spacing="1.6" fill="{colour}">{label}</text>'
        f'</g></g>'
        f'<text x="{cx}" y="138" text-anchor="middle" font-family="{SANS}" font-size="14" fill="{SOFT}">'
        + ['Creator applies', 'Business accepts, code issued', 'Creator adds post link', 'Business marks complete'][i]
        + '</text>')
journey = f'''<svg xmlns="http://www.w3.org/2000/svg" width="880" height="170" viewBox="0 0 880 170" role="img" aria-labelledby="t d">
<title id="t">Application journey</title>
<desc id="d">An application moves from Applied to Accepted to Posted to Completed.</desc>
<style>
.s {{ transform-box: fill-box; transform-origin: center; animation: hit 6.4s ease-out infinite both; }}
@keyframes hit {{ 0% {{ transform: scale(1); }} 4% {{ transform: scale(1.22); }} 9% {{ transform: scale(1); }} 100% {{ transform: scale(1); }} }}
.dot {{ animation: travel 6.4s cubic-bezier(.45,0,.55,1) infinite; }}
@keyframes travel {{ 0% {{ transform: translateX(0); }} 75% {{ transform: translateX({gap * 3}px); }} 100% {{ transform: translateX({gap * 3}px); opacity: 0; }} }}
{MOTION_GUARD}
</style>
<rect width="880" height="170" rx="18" fill="{CREAM}"/>
<line x1="{x0}" y1="78" x2="{x0 + gap * 3}" y2="78" stroke="{LINE}" stroke-width="4" stroke-linecap="round"/>
<circle class="dot" cx="{x0}" cy="78" r="8" fill="{RED}"/>
{''.join(stamps)}
</svg>
'''
write('status-journey.svg', journey)


# ---------- spot race ----------
race = f'''<svg xmlns="http://www.w3.org/2000/svg" width="880" height="220" viewBox="0 0 880 220" role="img" aria-labelledby="t d">
<title id="t">Two phones, one last spot</title>
<desc id="d">Two phones accept at the same moment. One gets the last spot, the other is told it was just taken.</desc>
<style>
.a {{ animation: go 5s cubic-bezier(.45,0,.55,1) infinite both; }}
.b {{ animation: go 5s cubic-bezier(.45,0,.55,1) infinite both; animation-delay: .12s; }}
@keyframes go {{ 0% {{ transform: translateX(0); opacity: 1; }} 35% {{ transform: translateX(290px); opacity: 1; }} 40%, 100% {{ transform: translateX(290px); opacity: 0; }} }}
.win {{ transform-box: fill-box; transform-origin: center; animation: win 5s ease-out infinite both; }}
.lose {{ animation: lose 5s ease-out infinite both; }}
@keyframes win {{ 0%, 38% {{ opacity: 0; transform: scale(1.6); }} 46%, 100% {{ opacity: 1; transform: scale(1); }} }}
@keyframes lose {{ 0%, 44% {{ opacity: 0; }} 52%, 100% {{ opacity: 1; }} }}
{MOTION_GUARD}
</style>
<rect width="880" height="220" rx="18" fill="{CREAM}"/>
<g font-family="{SANS}">
  <rect x="40" y="40" width="120" height="56" rx="12" fill="{SURFACE}" stroke="{LINE}"/><text x="100" y="74" text-anchor="middle" font-size="15" font-weight="600" fill="{INK}">Phone A</text>
  <rect x="40" y="124" width="120" height="56" rx="12" fill="{SURFACE}" stroke="{LINE}"/><text x="100" y="158" text-anchor="middle" font-size="15" font-weight="600" fill="{INK}">Phone B</text>
  <circle class="a" cx="176" cy="68" r="7" fill="{RED}"/>
  <circle class="b" cx="176" cy="152" r="7" fill="{RED}"/>
  <rect x="470" y="60" width="150" height="100" rx="14" fill="{INK}"/>
  <text x="545" y="102" text-anchor="middle" font-size="15" font-weight="700" fill="{CREAM}">One SQL</text>
  <text x="545" y="124" text-anchor="middle" font-size="15" font-weight="700" fill="{CREAM}">statement</text>
  <g transform="translate(745 70) rotate(-7)"><g class="win">
    <rect x="-62" y="-16" width="124" height="32" rx="5" fill="{SURFACE}" stroke="{RED}" stroke-width="2.5"/>
    <text x="0" y="6" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="1.6" fill="{RED}">ACCEPTED</text>
  </g></g>
  <g class="lose"><text x="745" y="158" text-anchor="middle" font-size="14" fill="{SOFT}">That last spot</text>
  <text x="745" y="176" text-anchor="middle" font-size="14" fill="{SOFT}">was just taken</text></g>
  <text x="440" y="206" text-anchor="middle" font-size="13" fill="{SOFT}">The count and the update happen in one step, so the second request finds no spot left.</text>
</g>
</svg>
'''
write('spot-race.svg', race)


# ---------- divider ----------
div = f'''<svg xmlns="http://www.w3.org/2000/svg" width="880" height="18" viewBox="0 0 880 18" role="presentation">
<clipPath id="r"><rect width="880" height="18" rx="4"/></clipPath>
{awning(0, 0, 880, 18, 'saffron', step=16, clip='r')}
</svg>
'''
write('divider.svg', div)


# ---------- icons ----------
def icon(name, inner, tile=CREAM):
    write(f'icons/{name}.svg', f'''<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" role="img" aria-label="{name}">
<rect width="48" height="48" rx="12" fill="{tile}" stroke="{LINE}"/>
<g fill="none" stroke="{RED}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">{inner}</g>
</svg>
''')


icon('executive', f'<path d="M13 35V25"/><path d="M21 35V17"/><path d="M29 35V21"/><path d="M37 35V12"/><path d="M11 35h28" stroke="{INK}"/>')
icon('product', f'<rect x="10" y="15" width="14" height="14" rx="3" fill="{HOUSES["saffron"][0]}" stroke="{INK}"/><circle cx="32" cy="24" r="7"/><circle cx="32" cy="24" r="3" stroke="{GREEN}"/>')
icon('architecture', f'<path d="M24 11l13 6-13 6-13-6z"/><path d="M11 24l13 6 13-6" stroke="{INK}"/><path d="M11 31l13 6 13-6" stroke="{INK}"/>')
icon('api', f'<path d="M19 13c-4 0-4 3-4 6s-1 5-4 5c3 0 4 2 4 5s0 6 4 6"/><path d="M29 13c4 0 4 3 4 6s1 5 4 5c-3 0-4 2-4 5s0 6-4 6"/><circle cx="24" cy="24" r="1.6" fill="{INK}" stroke="{INK}"/>')
icon('design', f'<path d="M11 14h26v8a3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0 3.25 3.25 0 0 1-6.5 0z" fill="{HOUSES["saffron"][1]}"/><path d="M14 27v8M34 27v8" stroke="{INK}"/><path d="M14 35h20" stroke="{INK}"/>')
icon('operations', f'<rect x="10" y="12" width="28" height="24" rx="4" stroke="{INK}"/><path d="M15 21l4 3-4 3"/><path d="M22 28h8"/>')
icon('index', f'<path d="M14 12h14l6 6v18H14z" stroke="{INK}"/><path d="M28 12v6h6" stroke="{INK}"/><path d="M18 24h12M18 29h8"/>')
