"""Hero figure: one-dimensional, schematic, almost wordless.

Two response curves J(B): the LLM (gold) starts higher and flattens, the fixed strategy (blue) rises steeply
and overtakes it. Gold shading marks the LLM's lead, blue shading the strategy's lead; two tangent arrows
show the susceptibilities chi and chi'.

usage: python3 make_hero.py <out.svg>
"""
import math, sys

OUT = sys.argv[1]
f = lambda x: (1 - math.exp(-2.3 * x)) / (1 - math.exp(-2.3))
JS = lambda x: 0.06 + 0.88 * f(x)
JL = lambda x: 0.42 + 0.28 * f(x)
X0, X1, Y0, H = 60, 580, 360, 300
X = lambda x: X0 + (X1 - X0) * x
Y = lambda j: Y0 - H * j
N = 120
xs = [i / N for i in range(N + 1)]
lo, hi = 0.0, 1.0
for _ in range(60):
    m = (lo + hi) / 2
    lo, hi = (m, hi) if JS(m) < JL(m) else (lo, m)
xc = lo


def path(J, a=0.0, b=1.0):
    pts = [t for t in xs if a <= t <= b]
    pts = [a] + [t for t in pts if a < t < b] + [b]
    return ' L'.join('%.1f %.1f' % (X(t), Y(J(t))) for t in pts), pts


def band(top, bot, a, b):
    up, pts = path(top, a, b)
    down = ' L'.join('%.1f %.1f' % (X(t), Y(bot(t))) for t in reversed(pts))
    return f'M{up} L{down} Z'


def tangent(J, x0, length, col, mid):
    h = 1e-4; s = (J(x0 + h) - J(x0 - h)) / (2 * h)
    dx, dy = (X1 - X0), -H * s
    n = math.hypot(dx, dy); ux, uy = dx / n * length, dy / n * length
    x, y = X(x0), Y(J(x0))
    return (f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x + ux:.1f}" y2="{y + uy:.1f}" stroke="#fff" stroke-width="8" stroke-linecap="round"/>'
            f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x + ux:.1f}" y2="{y + uy:.1f}" stroke="{col}" stroke-width="3.6" stroke-linecap="round" marker-end="url(#{mid})"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="#fff" stroke="{col}" stroke-width="2.4"/>'), (x + ux, y + uy)


tS, eS = tangent(JS, 0.72, 96, '#1d5f9c', 'hS')
tL, eL = tangent(JL, 0.72, 96, '#a8730e', 'hL')
pS, _ = path(JS); pL, _ = path(JL)
xcp, ycp = X(xc), Y(JS(xc))
svg = f'''<svg class="hero-svg" viewBox="0 0 640 458" role="img" aria-labelledby="hTitle hDesc">
<title id="hTitle">响应率示意</title>
<desc id="hDesc">示意：LLM 曲线起点更高但逐渐走平，固定策略曲线更陡，在交叉点后领先。切线箭头表示两者的响应率 χ′ 与 χ。</desc>
<defs>
<linearGradient id="hGold" x1="0" x2="1"><stop offset="0" stop-color="#efb83e" stop-opacity=".42"/><stop offset="1" stop-color="#efb83e" stop-opacity=".10"/></linearGradient>
<linearGradient id="hBlue" x1="0" x2="1"><stop offset="0" stop-color="#5da8e8" stop-opacity=".08"/><stop offset="1" stop-color="#5da8e8" stop-opacity=".34"/></linearGradient>
<marker id="hS" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#1d5f9c"/></marker>
<marker id="hL" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#a8730e"/></marker>
<marker id="hA" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L11 6 L1 11 Z" fill="#68809a"/></marker>
<radialGradient id="hHalo"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<path d="M{X0} {Y0} H{X1 + 18}" stroke="#68809a" stroke-width="2.8" stroke-linecap="round" marker-end="url(#hA)"/>
<path d="M{X0} {Y0} V{Y0 - H - 24}" stroke="#68809a" stroke-width="2.8" stroke-linecap="round" marker-end="url(#hA)"/>
<path d="{band(JL, JS, 0, xc)}" fill="url(#hGold)"/>
<path d="{band(JS, JL, xc, 1)}" fill="url(#hBlue)"/>
<path d="M{pL}" fill="none" stroke="rgba(239,184,62,.28)" stroke-width="12" stroke-linecap="round"/>
<path d="M{pS}" fill="none" stroke="rgba(47,119,173,.22)" stroke-width="12" stroke-linecap="round"/>
<path d="M{pL}" fill="none" stroke="#e0a526" stroke-width="4.2" stroke-linecap="round"/>
<path d="M{pS}" fill="none" stroke="#2f77ad" stroke-width="4.2" stroke-linecap="round"/>
<circle cx="{xcp:.1f}" cy="{ycp:.1f}" r="26" fill="url(#hHalo)"/>
<circle cx="{xcp:.1f}" cy="{ycp:.1f}" r="7" fill="#fff" stroke="#173b62" stroke-width="2.8"/>
{tS}{tL}
<text x="{eS[0] + 10:.1f}" y="{eS[1] + 31:.1f}" class="h-chi h-blue">χ</text>
<text x="{eL[0] + 10:.1f}" y="{eL[1] + 34:.1f}" class="h-chi h-gold">χ′</text>
<text x="{X(0.02):.1f}" y="{Y(JL(0.02)) - 22:.1f}" class="h-name h-gold">LLM</text>
<text x="{X(1) + 4:.1f}" y="{Y(JS(1)) - 14:.1f}" class="h-name h-blue" text-anchor="end"><tspan class="zh">固定策略</tspan><tspan class="en">fixed strategy</tspan></text>
<text x="{X1 + 14:.1f}" y="{Y0 + 26}" class="h-axis" text-anchor="end">ℬ</text>
<text x="{X0 - 14}" y="{Y0 - H - 16}" class="h-axis" text-anchor="middle">J</text>
<text x="{(X0 + X1) / 2:.1f}" y="{Y0 + 72}" class="h-bound" text-anchor="middle">χ′ ≤ χ,  ℬ → 0</text>
</svg>'''
open(OUT, 'w').write(svg)
print('crossover at', round(xc, 3), 'bytes', len(svg))
