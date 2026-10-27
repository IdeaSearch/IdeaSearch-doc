"""Generate the hero SVG: two response curves that cross, seed ghosts, black-box strip."""
import math, random
random.seed(7)
X0, X1, Y0, YH = 56, 520, 300, 236          # plot box: x range, baseline y, height
f = lambda t: (1 - math.exp(-2.2 * t)) / (1 - math.exp(-2.2))
J1 = lambda t: 0.10 + 0.86 * f(t)            # fixed strategy
J2 = lambda t: 0.40 + 0.30 * f(t)            # LLM: higher start, flatter
X = lambda t: X0 + (X1 - X0) * t
Y = lambda j: Y0 - YH * j
N = 60
ts = [i / N for i in range(N + 1)]
pth = lambda J, dj=lambda t: 0: 'M' + ' L'.join(f'{X(t):.1f} {Y(J(t) + dj(t)):.1f}' for t in ts)
# crossing
lo, hi = 0.0, 1.0
for _ in range(60):
    m = (lo + hi) / 2
    (lo, hi) = (m, hi) if J1(m) < J2(m) else (lo, m)
tc = (lo + hi) / 2; xc, yc = X(tc), Y(J1(tc))
def area(a, b, t0, t1):
    seg = [t for t in ts if t0 <= t <= t1] or [t0, t1]
    seg = [t0] + [t for t in seg if t0 < t < t1] + [t1]
    up = ' L'.join(f'{X(t):.1f} {Y(a(t)):.1f}' for t in seg)
    dn = ' L'.join(f'{X(t):.1f} {Y(b(t)):.1f}' for t in reversed(seg))
    return f'M{up} L{dn} Z'
def ghost(J, amp):
    ph = [random.uniform(0, 6.3) for _ in range(3)]; k = [random.uniform(5, 13) for _ in range(3)]; s = random.uniform(-1, 1) * amp
    return pth(J, lambda t: s * f(t) + amp * 0.5 * sum(math.sin(k[i] * t + ph[i]) for i in range(3)) / 3)
ghosts_b = ''.join(f'<path d="{ghost(J1, 0.05)}" stroke="rgba(47,119,173,.16)"/>' for _ in range(14))
ghosts_g = ''.join(f'<path d="{ghost(J2, 0.05)}" stroke="rgba(224,165,38,.20)"/>' for _ in range(14))
grid = ''.join(f'<path d="M{X0} {Y0 - YH * v:.1f} H{X1}"/>' for v in (0.25, 0.5, 0.75, 1.0)) + ''.join(f'<path d="M{X(t):.1f} {Y0 - YH} V{Y0}"/>' for t in (0.25, 0.5, 0.75, 1.0))
def wave(x0, x1, yc, amp, cycles):
    pts = [(x0 + (x1 - x0) * i / 120, yc - amp * math.sin(2 * math.pi * cycles * i / 120)) for i in range(121)]
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
svg = f'''<svg class="hero-svg" viewBox="0 0 560 340" role="img" aria-labelledby="heroSvgTitle heroSvgDesc">
<title id="heroSvgTitle">响应率示意</title>
<desc id="heroSvgDesc">两条效用曲线随预算上升：LLM 起点更高但斜率更小，固定策略在交叉点后领先。</desc>
<defs>
<linearGradient id="hgGold" x1="0" x2="1"><stop offset="0" stop-color="#efb83e" stop-opacity=".45"/><stop offset="1" stop-color="#efb83e" stop-opacity=".12"/></linearGradient>
<linearGradient id="hgBlue" x1="0" x2="1"><stop offset="0" stop-color="#5da8e8" stop-opacity=".06"/><stop offset="1" stop-color="#5da8e8" stop-opacity=".28"/></linearGradient>
<radialGradient id="hgHalo"><stop offset="0" stop-color="#efb83e" stop-opacity=".35"/><stop offset="1" stop-color="#efb83e" stop-opacity="0"/></radialGradient>
</defs>
<g stroke="rgba(63,119,168,.12)" stroke-width="1">{grid}</g>
<path d="M{X0} {Y0} H{X1} M{X0} {Y0} V{Y0 - YH - 8}" stroke="#9fb6c9" stroke-width="1.4" fill="none"/>
<path d="{area(J2, J1, 0, tc)}" fill="url(#hgGold)"/>
<path d="{area(J1, J2, tc, 1)}" fill="url(#hgBlue)"/>
<g fill="none" stroke-width="1">{ghosts_b}{ghosts_g}</g>
<path d="{pth(J1)}" fill="none" stroke="rgba(47,119,173,.18)" stroke-width="9" stroke-linecap="round"/>
<path d="{pth(J2)}" fill="none" stroke="rgba(239,184,62,.22)" stroke-width="9" stroke-linecap="round"/>
<path d="{pth(J1)}" fill="none" stroke="#2f77ad" stroke-width="3.4" stroke-linecap="round"/>
<path d="{pth(J2)}" fill="none" stroke="#e0a526" stroke-width="3.4" stroke-linecap="round"/>
<circle cx="{xc:.1f}" cy="{yc:.1f}" r="34" fill="url(#hgHalo)"/>
<circle cx="{xc:.1f}" cy="{yc:.1f}" r="12" fill="none" stroke="#173b62" stroke-width="1" stroke-dasharray="2 3"/>
<circle cx="{xc:.1f}" cy="{yc:.1f}" r="5.5" fill="#fff" stroke="#173b62" stroke-width="2.4"/>
<text x="{X0 + 12}" y="{Y(J2(0)) - 46:.0f}" class="hg-t hg-tg"><tspan class="zh">世界知识</tspan><tspan class="en">knowledge</tspan></text>
<text x="{X0 + 12}" y="{Y(J2(0)) - 29:.0f}" class="hg-a hg-ag"><tspan class="zh">LLM 领先</tspan><tspan class="en">LLM ahead</tspan></text>
<text x="{X1 - 8}" y="{Y(J2(1)) + 34:.0f}" class="hg-t hg-tb" text-anchor="end"><tspan class="zh">幻觉代价</tspan><tspan class="en">hallucination</tspan></text>
<text x="{X1 - 8}" y="{Y(J2(1)) + 51:.0f}" class="hg-a hg-ab" text-anchor="end"><tspan class="zh">固定策略领先</tspan><tspan class="en">fixed strategy ahead</tspan></text>
<text x="{X1 - 4}" y="{Y(J1(1)) - 12:.0f}" class="hg-s hg-sb" text-anchor="end"><tspan class="zh">固定策略</tspan><tspan class="en">fixed strategy</tspan></text>
<text x="{X1 - 4}" y="{Y(J2(1)) - 12:.0f}" class="hg-s hg-sg" text-anchor="end">LLM</text>
<text x="{xc:.0f}" y="{yc - 20:.0f}" class="hg-k" text-anchor="middle"><tspan class="zh">反超</tspan><tspan class="en">crossover</tspan></text>
<text x="{(X0 + X1) / 2:.0f}" y="{Y0 + 22}" class="hg-a" text-anchor="middle"><tspan class="zh">预算 ℬ · 问题复杂度 →</tspan><tspan class="en">budget ℬ · problem complexity →</tspan></text>
<text x="{X0 - 16}" y="{Y0 - YH / 2:.0f}" class="hg-a" text-anchor="middle">J</text>
</svg>'''
wave_svg = f'''<svg class="wave-svg" viewBox="0 0 640 150" role="img" aria-labelledby="waveSvgTitle">
<title id="waveSvgTitle">边际信号 δℬ 穿过固定 LLM 黑箱，输出 δJ′ 被衰减</title>
<defs><linearGradient id="wvBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e4670"/><stop offset="1" stop-color="#0f2742"/></linearGradient>
<clipPath id="wvL"><rect x="10" y="20" width="200" height="110"/></clipPath><clipPath id="wvR"><rect x="430" y="20" width="200" height="110"/></clipPath></defs>
<g clip-path="url(#wvL)"><path d="{wave(-60, 260, 70, 30, 320 / 65)}" fill="none" stroke="#2f77ad" stroke-width="3" stroke-linecap="round"/></g>
<g clip-path="url(#wvR)"><path d="{wave(380, 700, 70, 11, 320 / 65)}" fill="none" stroke="#e0a526" stroke-width="3" stroke-linecap="round"/></g>
<path d="M212 70 H230 M410 70 H428" stroke="#9fb6c9" stroke-width="1.8"/>
<rect x="230" y="28" width="180" height="84" rx="16" fill="url(#wvBox)" stroke="#e0a526" stroke-width="1.8"/>
<text x="320" y="62" class="wv-box" text-anchor="middle"><tspan class="zh">固定 LLM · 黑箱</tspan><tspan class="en">fixed LLM · black box</tspan></text>
<text x="320" y="90" class="wv-eq" text-anchor="middle">χ′ = α·χ</text>
<text x="110" y="140" class="wv-a" text-anchor="middle">δℬ</text>
<text x="530" y="140" class="wv-a" text-anchor="middle">δJ′</text>
</svg>'''
sys_argv = __import__('sys').argv
open(sys_argv[1], 'w').write(svg)
open(sys_argv[2], 'w').write(wave_svg)
print('crossing at t=%.3f x=%.1f y=%.1f' % (tc, xc, yc), len(svg))
