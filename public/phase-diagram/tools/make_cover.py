"""Render the square cover card (assets/hero-square.png, 1800x1800) for the physics.ideasearch.cn project list.
It is the page's hero SVG (English labels) plus the difference equation in a box, on white — the same layout as the
Susceptibility cover. Usage, from the site root, with a local server on :8766 serving this folder:
    python3 tools/make_cover.py            # writes cover_render.html
    (screenshot #card of http://localhost:8766/cover_render.html at 900x900, device scale 2, to assets/hero-square.png)
"""
import re
s = open('index.html').read()
i = s.index('<svg class="hero-svg"'); svg = s[i:s.index('</svg>', i) + 6]
svg = re.sub(r'<tspan class="zh">[^<]*</tspan>', '', svg).replace('<tspan class="en">', '<tspan>')
page = '''<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="assets/katex/katex.min.css"><link rel="stylesheet" href="styles.css">
<style>html,body{margin:0;background:#fff} body::before{display:none}
#card{width:900px;height:900px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}
#card .hero-svg{width:800px;height:auto}
.box{padding:14px 34px;border:2px solid #d6e2ee;border-radius:16px;color:#173b62;font-size:34px}
.hero-svg .h-lbl{font-size:19px} .hero-svg .hg-ax{font-size:24px}</style></head>
<body><div id="card">SVG<div class="box">$v_{t+1} = \\alpha\\, v_t + F(x_t) + \\eta_t$</div></div>
<script src="assets/katex/katex.min.js"></script><script src="assets/katex/auto-render.min.js"></script>
<script>renderMathInElement(document.body,{delimiters:[{left:'$',right:'$',display:false}]});
const NS='http://www.w3.org/2000/svg',U=['#c9d8ec','#245d96','#0b2a4f'],T=['#f2cfc6','#d4552f','#6e2416'];
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,t)=>{const A=hex(a),B=hex(b);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'};
const ramp=(s,t)=>{t=Math.max(0,Math.min(1,t));const n=s.length-1,i=Math.min(n-1,Math.floor(t*n));return mix(s[i],s[i+1],t*n-i)};
document.getElementById('heroFlows').querySelectorAll('path').forEach(p=>{const L=p.getTotalLength(),tr=p.classList.contains('h-trn'),n=tr?15:13,st=tr?T:U;
for(let i=0;i<=n;i++){const t=tr?1-Math.pow(1-i/n,1.6):i/n,pt=p.getPointAtLength(L*t),c=document.createElementNS(NS,'circle');
c.setAttribute('cx',pt.x);c.setAttribute('cy',pt.y);c.setAttribute('r',i===n?5:3.4);c.setAttribute('fill',ramp(st,.15+.85*i/n));c.setAttribute('stroke','#fff');c.setAttribute('stroke-width','1');document.getElementById('heroFlows').appendChild(c)}});
</script></body></html>'''.replace('SVG', svg, 1)
open('cover_render.html', 'w').write(page)
