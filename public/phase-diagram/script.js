/* Phase diagram of language models — language switch, navigation and all figures.
   Every data chart is drawn from window.PD (assets/data/data.js, built by tools/build_data.py from the paper's data). */
(function () {
  'use strict';
  const PD = window.PD, root = document.documentElement;
  const C = {
    ink: '#102944', deep: '#173b62', muted: '#68809a', faint: '#9fb6c9', grid: 'rgba(63,119,168,.10)', frame: '#9fb6c9',
    unt: '#245d96', untTint: '#e3eaf4', trn: '#d4552f', trnTint: '#f3d3ca', trnDeep: '#8a2f1d', gold: '#efb83e', band: '#dd9a8a', violet: '#7162c8'
  };
  const SANS = '"DM Sans","Noto Sans SC",system-ui,sans-serif', SERIF = 'KaTeX_Math,"Noto Serif SC",Georgia,serif', MONO = '"DM Mono","Noto Sans SC",ui-monospace,monospace';
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language ---------- */
  let lang = 'zh';
  const L = (zh, en) => (lang === 'en' ? en : zh);
  const langToggle = document.getElementById('languageToggle'), langMenu = document.getElementById('languageMenu');
  function setLang(next) {
    lang = next === 'en' ? 'en' : 'zh';
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
    langMenu.querySelectorAll('[data-locale]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.locale === lang)));
    try { localStorage.setItem('pd-lang', lang); } catch (e) { /* storage unavailable */ }
    drawAll();
  }
  langToggle.addEventListener('click', () => { const open = langMenu.hidden; langMenu.hidden = !open; langToggle.setAttribute('aria-expanded', String(open)); });
  langMenu.addEventListener('click', e => { const b = e.target.closest('[data-locale]'); if (!b) return; setLang(b.dataset.locale); langMenu.hidden = true; langToggle.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', e => { if (!e.target.closest('.language-select')) { langMenu.hidden = true; langToggle.setAttribute('aria-expanded', 'false'); } });

  /* ---------- nav ---------- */
  const nav = document.getElementById('site-nav'), menuBtn = document.getElementById('menuToggle'), links = document.getElementById('navLinks');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menuBtn.addEventListener('click', () => { const o = !links.classList.contains('is-open'); links.classList.toggle('is-open', o); menuBtn.setAttribute('aria-expanded', String(o)); });
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  /* ---------- helpers ---------- */
  const fillRange = el => { if (el) el.style.setProperty('--p', (100 * (el.value - el.min) / (el.max - el.min)).toFixed(1) + '%'); };
  const tex = el => { if (el && window.renderMathInElement) window.renderMathInElement(el, { delimiters: [{ left: '$', right: '$', display: false }], throwOnError: false }); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const ramp = (stops, t) => { t = Math.max(0, Math.min(1, t)); const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)); return mix(stops[i], stops[i + 1], t * n - i); };
  const UNT_RAMP = ['#c9d8ec', '#245d96', '#0b2a4f'], TRN_RAMP = ['#f2cfc6', '#d4552f', '#6e2416'];
  function fit(cv) {
    const w = cv.clientWidth, h = cv.clientHeight, r = Math.min(window.devicePixelRatio || 1, 2.5);
    if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); }
    const g = cv.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h); return { g, w, h };
  }
  function frame(w, h, pad, xr, yr) {
    const Lp = pad[3], R = w - pad[1], Tp = pad[0], B = h - pad[2];
    return { L: Lp, R, T: Tp, B, xr, yr,
      X: x => Lp + (x - xr[0]) / (xr[1] - xr[0]) * (R - Lp), Y: y => B - (y - yr[0]) / (yr[1] - yr[0]) * (B - Tp),
      ix: px => xr[0] + (px - Lp) / (R - Lp) * (xr[1] - xr[0]), iy: py => yr[0] + (B - py) / (B - Tp) * (yr[1] - yr[0]) };
  }
  const fmtLog = v => { const x = Math.pow(10, v); return x >= 1 ? String(+x.toPrecision(2)) : String(+x.toPrecision(1)); };
  function niceTicks(a, b, m) { const out = []; for (let e = Math.floor(a) - 1; e <= Math.ceil(b); e++) (m || [1, 3]).forEach(k => { const v = e + Math.log10(k); if (v >= a - 1e-9 && v <= b + 1e-9) out.push(v); }); return out; }
  // text with simple subscripts: "d_C" -> d with subscript C
  function subText(g, s, x, y, align) {
    const parts = []; let i = 0;
    while (i < s.length) { const k = s.indexOf('_', i); if (k < 0) { parts.push([s.slice(i), 0]); break; } parts.push([s.slice(i, k), 0]); parts.push([s[k + 1], 1]); i = k + 2; }
    const f0 = g.font, m = /(\d+(?:\.\d+)?)px/.exec(f0), px = m ? +m[1] : 12, fs = f0.replace(/\d+(?:\.\d+)?px/, Math.round(px * 0.72) + 'px');
    const wid = parts.reduce((a, [t, sb]) => { g.font = sb ? fs : f0; return a + g.measureText(t).width; }, 0);
    let cx = align === 'center' ? x - wid / 2 : align === 'right' ? x - wid : x; const ta = g.textAlign; g.textAlign = 'left';
    parts.forEach(([t, sb]) => { g.font = sb ? fs : f0; g.fillText(t, cx, sb ? y + px * 0.28 : y); cx += g.measureText(t).width; });
    g.font = f0; g.textAlign = ta;
  }
  function axes(g, f, o) {
    o = o || {};
    const inX = v => v >= f.xr[0] - 1e-9 && v <= f.xr[1] + 1e-9, inY = v => v >= f.yr[0] - 1e-9 && v <= f.yr[1] + 1e-9;
    g.save(); g.font = `11px ${MONO}`; g.fillStyle = C.muted; g.strokeStyle = C.grid; g.lineWidth = 1;
    (o.xt || []).filter(inX).forEach(v => { const x = f.X(v); if (o.grid) { g.beginPath(); g.moveTo(x, f.T); g.lineTo(x, f.B); g.stroke(); } g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(o.xf ? o.xf(v) : fmtLog(v), x, f.B + 6); });
    (o.yt || []).filter(inY).forEach(v => { const y = f.Y(v); if (o.grid) { g.beginPath(); g.moveTo(f.L, y); g.lineTo(f.R, y); g.stroke(); } g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(o.yf ? o.yf(v) : fmtLog(v), f.L - 7, y); });
    g.strokeStyle = C.frame; g.strokeRect(f.L + .5, f.T + .5, f.R - f.L - 1, f.B - f.T - 1);
    g.fillStyle = C.deep; g.font = `italic 14px ${SERIF}`;
    if (o.xl) { g.textBaseline = 'bottom'; subText(g, o.xl, (f.L + f.R) / 2, f.B + 38, 'center'); }
    if (o.yl) { g.save(); g.translate(f.L - (o.ylOff || 40), (f.T + f.B) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; subText(g, o.yl, 0, 0, 'center'); g.restore(); }
    g.restore();
  }
  function halo(g, t, x, y) { g.save(); g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,255,255,.9)'; g.strokeText(t, x, y); g.restore(); g.fillText(t, x, y); }
  function star(g, x, y, r) {
    g.save(); g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
    g.closePath(); g.fillStyle = C.gold; g.fill(); g.lineWidth = 1.1; g.strokeStyle = C.ink; g.stroke(); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, col, lw, head) {
    const a = Math.atan2(y1 - y0, x1 - x0), hl = head || 6;
    g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw || 1.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - Math.cos(a) * hl * 0.6, y1 - Math.sin(a) * hl * 0.6); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - hl * Math.cos(a - 0.42), y1 - hl * Math.sin(a - 0.42)); g.lineTo(x1 - hl * Math.cos(a + 0.42), y1 - hl * Math.sin(a + 0.42)); g.closePath(); g.fill(); g.restore();
  }
  const dot = (g, x, y, r, fill, stroke) => { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 1; g.strokeStyle = stroke; g.stroke(); } };
  function traj(g, f, r, stops, lw, alpha) {
    const n = r.x.length; g.save(); g.lineWidth = lw; g.lineCap = 'round'; g.globalAlpha = alpha == null ? 1 : alpha;
    for (let i = 1; i < n; i++) { g.strokeStyle = ramp(stops, (i - 0.5) / (n - 1)); g.beginPath(); g.moveTo(f.X(r.x[i - 1]), f.Y(r.y[i - 1])); g.lineTo(f.X(r.x[i]), f.Y(r.y[i])); g.stroke(); }
    g.restore();
  }
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(rnd) { const a = Math.max(1e-9, rnd()), b = rnd(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }

  // a compact in-canvas legend: items = [[kind, colour, label]], kind = 'line' | 'dot' | 'big'
  function keyBox(g, x, y, items) {
    g.save(); g.font = `11.5px ${SANS}`; const wds = items.map(it => g.measureText(it[2]).width + 30), W = wds.reduce((a, b) => a + b, 0) + 10;
    g.fillStyle = 'rgba(255,255,255,.88)'; g.fillRect(x, y, W, 22); let cx = x + 8; g.textBaseline = 'middle';
    items.forEach((it, i) => { const [k, col, lab] = it, cy = y + 11;
      if (k === 'line') { g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 16, cy); g.stroke(); }
      else dot(g, cx + 8, cy, k === 'big' ? 5 : 2.4, col, k === 'big' ? '#fff' : null);
      g.fillStyle = C.deep; g.textAlign = 'left'; g.fillText(lab, cx + 22, cy); cx += wds[i]; });
    g.restore();
  }

  /* ---------- measured phase map (shared background) ---------- */
  const PH = PD.phase;
  const pAt = (x, y) => { const i = Math.round((x - PH.x0) / (PH.x1 - PH.x0) * (PH.nx - 1)), j = Math.round((y - PH.y0) / (PH.y1 - PH.y0) * (PH.ny - 1)); if (i < 0 || j < 0 || i >= PH.nx || j >= PH.ny) return -1; return PH.P[j * PH.nx + i]; };
  const phaseImg = (() => {
    const c = document.createElement('canvas'); c.width = PH.nx; c.height = PH.ny; const g = c.getContext('2d'), im = g.createImageData(PH.nx, PH.ny);
    const A = hex('#dde9f6'), B = hex('#f4cfc4');
    for (let j = 0; j < PH.ny; j++) for (let i = 0; i < PH.nx; i++) {
      const p = PH.P[j * PH.nx + i], k = ((PH.ny - 1 - j) * PH.nx + i) * 4;
      if (p < 0) continue;
      const t = Math.max(0, Math.min(1, (p / 100 - 0.16) / 0.68)), s = t * t * (3 - 2 * t);
      for (let q = 0; q < 3; q++) im.data[k + q] = Math.round(A[q] + (B[q] - A[q]) * s); im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  })();
  function contours(g, f, lw) { g.strokeStyle = C.band; g.lineWidth = lw || 1.1; g.lineJoin = 'round'; PH.contours.forEach(c => { g.beginPath(); c.x.forEach((x, i) => (i ? g.lineTo(f.X(x), f.Y(c.y[i])) : g.moveTo(f.X(x), f.Y(c.y[i])))); g.stroke(); }); }
  function phaseBg(g, f) {
    g.save(); g.beginPath(); g.rect(f.L, f.T, f.R - f.L, f.B - f.T); g.clip();
    g.fillStyle = '#f1f4f8'; g.fillRect(f.L, f.T, f.R - f.L, f.B - f.T);
    const dx = (PH.x1 - PH.x0) / (PH.nx - 1), dy = (PH.y1 - PH.y0) / (PH.ny - 1);
    const x0 = f.X(PH.x0 - dx / 2), x1 = f.X(PH.x1 + dx / 2), y0 = f.Y(PH.y1 + dy / 2), y1 = f.Y(PH.y0 - dy / 2);
    g.imageSmoothingEnabled = true; g.drawImage(phaseImg, x0, y0, x1 - x0, y1 - y0);
    const yD0 = f.Y(Math.log10(PD.dmin)), yD1 = f.Y(Math.log10(PD.dmax));       // d_C above D (1536–5120 across models)
    g.fillStyle = 'rgba(200,212,224,.5)'; g.fillRect(f.L, yD1, f.R - f.L, yD0 - yD1);
    g.fillStyle = 'rgba(184,198,212,.85)'; g.fillRect(f.L, f.T, f.R - f.L, yD1 - f.T);
    contours(g, f); g.restore();
  }
  const UT = [-2, -1, 0, 1], DT = [0, 1, 2, 3];

  /* ---------- hero: dots along the schematic flows ---------- */
  (function heroDots() {
    const svg = document.getElementById('heroSvg'); if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg', grp = document.getElementById('heroFlows');
    grp.querySelectorAll('path').forEach(p => {
      const len = p.getTotalLength(), trn = p.classList.contains('h-trn'), n = trn ? 15 : 13, stops = trn ? TRN_RAMP : UNT_RAMP;
      for (let i = 0; i <= n; i++) {
        const t = trn ? 1 - Math.pow(1 - i / n, 1.6) : i / n, pt = p.getPointAtLength(len * t), c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); c.setAttribute('r', i === n ? 5 : 3.4);
        c.setAttribute('fill', ramp(stops, 0.15 + 0.85 * i / n)); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '1');
        grp.appendChild(c);
      }
    });
  })();

  /* ---------- 01: coordinate schematic (SVG) ---------- */
  (function coordSchematic() {
    const svg = document.getElementById('coordSvg'); if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg', rnd = seeded(7), el = (t, a) => { const e = document.createElementNS(NS, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); return e; };
    const others = [[110, 90], [120, 270], [250, 320], [400, 300], [90, 180]];
    others.forEach(([cx, cy]) => { for (let i = 0; i < 26; i++) el('circle', { cx: (cx + 15 * gauss(rnd)).toFixed(1), cy: (cy + 13 * gauss(rnd)).toFixed(1), r: 3.3, fill: '#b9cad9' }); });
    const ref = [186, 214], doc = [356, 112], ang = -0.62;
    el('ellipse', { cx: doc[0], cy: doc[1], rx: 86, ry: 30, transform: `rotate(${ang * 180 / Math.PI} ${doc[0]} ${doc[1]})`, fill: 'rgba(212,85,47,.06)', stroke: '#d4552f', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' });
    for (let i = 0; i < 60; i++) { const a = 34 * gauss(rnd), b = 11 * gauss(rnd); el('circle', { cx: (doc[0] + a * Math.cos(ang) - b * Math.sin(ang)).toFixed(1), cy: (doc[1] + a * Math.sin(ang) + b * Math.cos(ang)).toFixed(1), r: 3.6, fill: '#173b62' }); }
    el('path', { d: `M${ref[0] - 9} ${ref[1]} h18 M${ref[0]} ${ref[1] - 9} v18`, stroke: '#102944', 'stroke-width': 2.4 });
    const dx = doc[0] - ref[0], dy = doc[1] - ref[1], dl = Math.hypot(dx, dy), ex = doc[0] - dx / dl * 10, ey = doc[1] - dy / dl * 10;
    el('path', { d: `M${ref[0] + 8} ${ref[1] - 5} L${ex} ${ey}`, stroke: '#efb83e', 'stroke-width': 3.2, 'stroke-linecap': 'round' });
    el('path', { d: `M${ex} ${ey} l${(-dx / dl * 13 + dy / dl * 6).toFixed(1)} ${(-dy / dl * 13 - dx / dl * 6).toFixed(1)} M${ex} ${ey} l${(-dx / dl * 13 - dy / dl * 6).toFixed(1)} ${(-dy / dl * 13 + dx / dl * 6).toFixed(1)}`, stroke: '#b78018', 'stroke-width': 3, 'stroke-linecap': 'round' });
    const t = (x, y, s, cls, it) => { const e = el('text', { x, y, class: cls }); e.innerHTML = s; if (it) e.setAttribute('font-style', 'italic'); return e; };
    t(258, 178, 'δ', 'cs-big cs-gold', 1); t(452, 64, 'C', 'cs-big cs-red', 1);
  })();

  /* ---------- 01: u and d_C versus relative depth, and the same 8 trajectories on the plane ---------- */
  const DEP = PD.depth, NAMES = PD.trained.map(t => t.name); let depHi = -1; const dep = { s: 1 };
  function headAt(r, s) { const q = s * (r.x.length - 1), i = Math.min(r.x.length - 2, Math.floor(q)), u = q - i; return { i, q, x: r.x[i] + (r.x[i + 1] - r.x[i]) * u, y: r.y[i] + (r.y[i + 1] - r.y[i]) * u }; }
  const gridAt = (ys, s) => { const q = s * (ys.length - 1), i = Math.min(ys.length - 2, Math.floor(q)); return ys[i] + (ys[i + 1] - ys[i]) * (q - i); };
  const chips = document.getElementById('depthChips');
  if (chips) NAMES.forEach((nm, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = nm;
    const set = v => { depHi = v; [...chips.children].forEach((c, k) => c.classList.toggle('is-active', k === depHi)); drawDepth(); };
    b.addEventListener('mouseenter', () => set(i)); b.addEventListener('mouseleave', () => set(-1)); b.addEventListener('click', () => set(depHi === i ? -1 : i));
    chips.appendChild(b);
  });
  function depthOne(id, key, yr, yl, last) {
    const cv = document.getElementById(id); if (!cv) return; const { g, w, h } = fit(cv);
    const f = frame(w, h, [8, 10, last ? 44 : 14, 54], [0, 1], yr);
    axes(g, f, { xt: last ? [0, 0.25, 0.5, 0.75, 1] : [], xf: v => String(v), yt: niceTicks(yr[0], yr[1]), grid: true, xl: last ? L('相对深度', 'relative depth') : '', yl, ylOff: 42 });
    const line = (ys, col, lw, a) => { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.beginPath(); ys.forEach((y, i) => (i ? g.lineTo(f.X(DEP.grid[i]), f.Y(y)) : g.moveTo(f.X(DEP.grid[i]), f.Y(y)))); g.stroke(); g.restore(); };
    DEP[key].forEach((ys, i) => { if (i !== depHi) line(ys, '#a9bccd', 1.2, depHi < 0 ? 0.95 : 0.6); });
    line(DEP[key + '_med'], C.trn, 3, depHi < 0 ? 1 : 0.35);
    if (depHi >= 0) line(DEP[key][depHi], C.ink, 2.2, 1);
    const x = f.X(dep.s); g.save(); g.strokeStyle = C.gold; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, f.T); g.lineTo(x, f.B); g.stroke(); g.restore();
    DEP[key].forEach((ys, i) => dot(g, x, f.Y(gridAt(ys, dep.s)), i === depHi ? 4 : 2.6, i === depHi ? C.ink : '#7d93a8', '#fff'));
  }
  const PLX = [-1.4, 0.4], PLY = [0.85, 2.45];
  function drawPlane() {
    const cv = document.getElementById('depthPlane'); if (!cv) return; const { g, w, h } = fit(cv);
    const f = frame(w, h, [10, 12, 44, 56], PLX, PLY);
    axes(g, f, { xt: niceTicks(PLX[0], PLX[1]), yt: niceTicks(PLY[0], PLY[1]), grid: true, xl: L('文档可区分性 u', 'document distinguishability u'), yl: L('文档维度 d_C', 'document dimension d_C'), ylOff: 42 });
    const n = DEP.grid.length, k = dep.s * (n - 1), i0 = Math.min(n - 2, Math.floor(k));
    const path = (xs, ys, col, lw, a) => { g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= i0; i++) { const X = f.X(xs[i]), Y = f.Y(ys[i]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.lineTo(f.X(gridAt(xs, dep.s)), f.Y(gridAt(ys, dep.s))); g.stroke(); g.restore(); };
    g.save(); g.beginPath(); g.rect(f.L, f.T, f.R - f.L, f.B - f.T); g.clip();
    DEP.u.forEach((xs, i) => { if (i !== depHi) path(xs, DEP.dC[i], '#a9bccd', 1.2, depHi < 0 ? 0.95 : 0.6); });
    path(DEP.u_med, DEP.dC_med, C.trn, 3, depHi < 0 ? 1 : 0.35);
    if (depHi >= 0) path(DEP.u[depHi], DEP.dC[depHi], C.ink, 2.2, 1);
    DEP.u.forEach((xs, i) => dot(g, f.X(gridAt(xs, dep.s)), f.Y(gridAt(DEP.dC[i], dep.s)), i === depHi ? 4 : 2.6, i === depHi ? C.ink : '#7d93a8', '#fff'));
    dot(g, f.X(gridAt(DEP.u_med, dep.s)), f.Y(gridAt(DEP.dC_med, dep.s)), 5, C.trn, '#fff');
    g.restore();
  }
  function drawDepth() {
    depthOne('depthU', 'u', [-1.36, 0.32], 'u', false); depthOne('depthD', 'dC', [0.86, 2.42], 'd_C', true); drawPlane();
    document.getElementById('depthOut').textContent = L('相对深度 ', 'depth ') + dep.s.toFixed(2); const dr = document.getElementById('depthRange'); dr.value = Math.round(dep.s * 1000); fillRange(dr);
  }
  document.getElementById('depthRange').addEventListener('input', e => { depSet(false); dep.s = e.target.value / 1000; drawDepth(); });
  const depBtn = document.getElementById('depthPlay'); let depPlaying = false, depRaf = 0, depLast = 0;
  function depSet(on) { depPlaying = on; depBtn.textContent = on ? '❚❚' : '▶'; if (on) { if (dep.s >= 1) dep.s = 0; depLast = performance.now(); depRaf = requestAnimationFrame(depTick); } else cancelAnimationFrame(depRaf); }
  function depTick(now) { if (!depPlaying) return; const dt = (now - depLast) / 1000; depLast = now; dep.s = Math.min(1, dep.s + dt / (reduced ? 1.5 : 6)); drawDepth(); if (dep.s >= 1) { depSet(false); return; } depRaf = requestAnimationFrame(depTick); }
  depBtn.addEventListener('click', () => depSet(!depPlaying));

  /* ---------- 02: limit probe ---------- */
  const probe = { x: PD.pstar[0], y: PD.pstar[1], touched: false };
  const PRESET = { pstar: PD.pstar, noise: [-1.9, 3.0], collapse: [1.0, 0.3], u0: [-1.6, 2.4], uinf: [1.2, 1.8], d1: [0.6, 0.15], dD: [-0.2, 3.62] };
  const TOUR = ['pstar', 'u0', 'dD', 'uinf', 'd1', 'pstar'];
  const probeCv = document.getElementById('probeMap'), cloudCv = document.getElementById('cloudView');
  let probeF = null;
  const XR = [-2.6, 1.7], YR = [-0.1, 4.0];
  function drawProbe() {
    if (!probeCv) return; const { g, w, h } = fit(probeCv);
    const f = probeF = frame(w, h, [12, 14, 46, 56], XR, YR);
    phaseBg(g, f);
    g.save(); g.font = `600 12px ${MONO}`; g.fillStyle = C.deep;
    const yMid = f.Y(1.9), xMid = f.X(-0.45);
    arrow(g, f.L + 64, yMid, f.L + 14, yMid, C.deep, 1.4, 7); g.font = `italic 14px ${SERIF}`; g.textAlign = 'left'; g.textBaseline = 'bottom'; halo(g, 'u → 0', f.L + 14, yMid - 9);
    arrow(g, f.R - 64, yMid, f.R - 14, yMid, C.deep, 1.4, 7); g.textAlign = 'right'; halo(g, 'u → ∞', f.R - 14, yMid - 9);
    arrow(g, xMid, f.B - 54, xMid, f.B - 12, C.deep, 1.4, 7); g.textAlign = 'left'; g.textBaseline = 'middle'; subText(g, 'd_C → 1', xMid + 8, f.B - 22, 'left');
    g.textBaseline = 'top'; subText(g, L('d_C → D（不可达）', 'd_C → D (unreachable)'), f.R - 8, f.T + 6, 'right');
    g.font = `600 12px ${SANS}`; g.fillStyle = C.unt; g.textAlign = 'center'; g.fillText(L('噪声区', 'noise'), f.X(-1.95), f.Y(3.35));
    g.textBaseline = 'bottom'; g.fillText(L('坍缩区', 'collapse'), f.X(1.2), f.B - 6);
    g.restore();
    star(g, f.X(PD.pstar[0]), f.Y(PD.pstar[1]), 9);
    axes(g, f, { xt: UT, yt: DT, xl: L('文档可区分性 u', 'document distinguishability u'), yl: L('文档维度 d_C', 'document dimension d_C'), ylOff: 40 });
    const px = f.X(probe.x), py = f.Y(probe.y);
    g.save(); g.strokeStyle = 'rgba(16,41,68,.35)'; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(px, f.T); g.lineTo(px, f.B); g.moveTo(f.L, py); g.lineTo(f.R, py); g.stroke(); g.restore();
    dot(g, px, py, 13, 'rgba(239,184,62,.35)', '#b78018'); dot(g, px, py, 5, C.ink, '#fff');
    if (!probe.touched) {   // a visible handle hint until the reader first moves the probe
      const t = L('拖动我', 'drag me'); g.save(); g.font = `600 12px ${SANS}`; const tw = g.measureText(t).width, bx = px + 20, by = py - 34;
      g.fillStyle = C.ink; g.beginPath(); g.roundRect ? g.roundRect(bx, by, tw + 16, 24, 12) : g.rect(bx, by, tw + 16, 24); g.fill();
      g.beginPath(); g.moveTo(bx + 6, by + 22); g.lineTo(px + 10, py - 8); g.lineTo(bx + 16, by + 22); g.fill();
      g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(t, bx + 8, by + 12); g.restore();
    }
    drawCloud(); probeRead();
  }
  const DOC_COLS = ['#7162c8', '#3f9a6b', '#b78018', '#5da8e8'];   // house palette; the page's deep blue and red stay reserved for untrained / trained
  function drawCloud() {
    if (!cloudCv) return; const { g, w, h } = fit(cloudCv);
    const u = Math.pow(10, probe.x), dC = Math.pow(10, probe.y), D = 4096;
    const r = Math.max(0.035, Math.min(1, Math.log10(Math.max(1, dC)) / Math.log10(D)));   // minor/major axis ratio: a line at d_C = 1, a disc at d_C = D
    // in the plane of the mean offsets, the per-direction spread is √(tr C / d_C), so the separation is √u · d_C^¼ of that spread
    const off = Math.sqrt(u) * Math.pow(dC, 0.25);
    const ext = off + 2.6, sc = Math.min(w, h) / 2 / ext * 0.92, cx = w / 2, cy = h / 2;
    const rnd = seeded(11), mark = (g, k, x, y) => { g.beginPath(); if (k === 0) g.arc(x, y, 2.3, 0, 7); else if (k === 1) g.rect(x - 2, y - 2, 4, 4); else if (k === 2) { g.moveTo(x, y - 2.8); g.lineTo(x + 2.6, y + 2); g.lineTo(x - 2.6, y + 2); } else { g.moveTo(x, y - 2.8); g.lineTo(x + 2.8, y); g.lineTo(x, y + 2.8); g.lineTo(x - 2.8, y); } g.fill(); };
    for (let k = 0; k < 4; k++) {
      const a0 = Math.PI / 4 + k * Math.PI / 2, mx = off * Math.cos(a0), my = off * Math.sin(a0), th = 0.9 + k * 1.37;
      g.fillStyle = DOC_COLS[k]; g.globalAlpha = 0.8;
      for (let i = 0; i < 70; i++) { const a = gauss(rnd), b = gauss(rnd) * r; const x = mx + a * Math.cos(th) - b * Math.sin(th), y = my + a * Math.sin(th) + b * Math.cos(th); mark(g, k, cx + x * sc, cy - y * sc); }
    }
    g.globalAlpha = 1;
  }
  function probeRead() {
    const u = Math.pow(10, probe.x), dC = Math.pow(10, probe.y), p = pAt(probe.x, probe.y), aboveD = probe.y > Math.log10(PD.dmin);
    const ph = aboveD ? L('不可达（$d_C > D$）', 'Unreachable ($d_C > D$)') : p < 0 ? L('无数据', 'No data') : p >= 50 ? L('工作相', 'Working phase') : L('漂移相', 'Drifting phase');
    const fmt = v => (v >= 100 ? Math.round(v).toString() : v >= 1 ? v.toPrecision(3) : v.toPrecision(2));
    document.getElementById('probeRead').innerHTML = `$u = ${fmt(u)}$ · $d_C = ${fmt(dC)}$ · <b>${ph}</b>`;
    const su = u < 0.1 ? L('文档之间分不开', 'Documents cannot be told apart')
      : u > 10 ? L('文档各自缩成一团', 'Each document shrinks to a clump')
        : L('文档彼此可分', 'Documents are distinguishable');
    const sd = dC < 4 ? L('文档内只剩一两个方向', 'one or two directions left inside')
      : dC > 1000 ? L('文档内接近各向同性', 'nearly isotropic inside')
        : L('文档内铺在许多方向上', 'many directions inside');
    document.getElementById('probeText').innerHTML = su + L('；', '; ') + sd + L('。', '.'); tex(document.getElementById('probeRead'));
  }
  let tourRaf = 0;
  function stopTour() { cancelAnimationFrame(tourRaf); tourRaf = 0; }
  function goTo(key, chip) { const p = PRESET[key]; probe.x = p[0]; probe.y = p[1]; document.querySelectorAll('#limitChips .chip').forEach(c => c.classList.toggle('is-active', c.dataset.go === key)); drawProbe(); }
  if (probeCv) {
    let dragging = false;
    const setFrom = e => { const b = probeCv.getBoundingClientRect(); probe.touched = true; probe.x = Math.max(XR[0], Math.min(XR[1], probeF.ix(e.clientX - b.left))); probe.y = Math.max(YR[0], Math.min(YR[1], probeF.iy(e.clientY - b.top))); document.querySelectorAll('#limitChips .chip').forEach(c => c.classList.remove('is-active')); drawProbe(); };
    probeCv.addEventListener('pointerdown', e => { stopTour(); dragging = true; probeCv.setPointerCapture(e.pointerId); setFrom(e); });
    probeCv.addEventListener('pointermove', e => { if (dragging) setFrom(e); });
    probeCv.addEventListener('pointerup', () => { dragging = false; });
  }
  document.querySelectorAll('#limitChips .chip').forEach(b => b.addEventListener('click', () => { stopTour(); probe.touched = true; goTo(b.dataset.go); }));


  /* ---------- 02: measured flows, static and played layer by layer (kinematics) ---------- */
  const flowCv = document.getElementById('flowMap'), tip = document.getElementById('flowTip');
  const fs = { show: 'both', hover: null, s: 1 }; let flowF = null;
  const showU = r => fs.show === 'both' || (fs.show === 'small' && r.sigma < 0.02) || (fs.show === 'large' && r.sigma > 0.02);
  const showT = () => fs.show === 'both' || fs.show === 'trained';
  const upTo = (r, s) => { const hd = headAt(r, s); return { x: r.x.slice(0, hd.i + 1).concat([hd.x]), y: r.y.slice(0, hd.i + 1).concat([hd.y]), hd }; };
  function drawFlow() {
    if (!flowCv) return; const { g, w, h } = fit(flowCv);
    const f = flowF = frame(w, h, [12, 14, 46, 56], XR, YR);
    phaseBg(g, f);
    const inW = (x, y) => y < Math.log10(PD.dmin) && pAt(x, y) >= 84;
    const stat = { t: [0, 0], u: [0, 0], dt: [], du: [] }, heads = [];
    const one = (r, kind) => {
      const p = upTo(r, fs.s), dim = fs.hover && fs.hover.r !== r;
      traj(g, f, p, kind === 't' ? TRN_RAMP : UNT_RAMP, kind === 't' ? 2.2 : 1.15, dim ? (kind === 't' ? 0.35 : 0.3) : (kind === 't' ? 1 : 0.85));
      (kind === 't' ? stat.dt : stat.du).push(Math.hypot(p.hd.x - PD.pstar[0], p.hd.y - PD.pstar[1]));
      const c = kind === 't' ? stat.t : stat.u; c[1]++; if (inW(p.hd.x, p.hd.y)) c[0]++;
      if (fs.s < 1) heads.push(() => dot(g, f.X(p.hd.x), f.Y(p.hd.y), kind === 't' ? 4.6 : 3, kind === 't' ? C.trn : C.unt, '#fff'));
    };
    PD.untrained.forEach(r => { if (showU(r)) one(r, 'u'); });
    if (showT()) PD.trained.forEach(r => one(r, 't'));
    heads.forEach(fn => fn());
    if (fs.hover) { const r = fs.hover.r, p = upTo(r, fs.s); traj(g, f, p, fs.hover.kind === 'u' ? UNT_RAMP : TRN_RAMP, 3, 1); dot(g, f.X(r.x[0]), f.Y(r.y[0]), 3.5, '#fff', C.ink); dot(g, f.X(p.hd.x), f.Y(p.hd.y), 4, C.ink); }
    star(g, f.X(PD.pstar[0]), f.Y(PD.pstar[1]), 10);
    g.save(); g.font = `600 12px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = C.trnDeep; halo(g, L('工作相', 'working phase'), f.X(-0.35), f.Y(1.42));
    g.fillStyle = C.unt; halo(g, L('坍缩区', 'collapse'), f.X(1.55), f.Y(0.62)); halo(g, L('噪声区', 'noise'), f.X(-2.05), f.Y(3.62)); g.restore();
    axes(g, f, { xt: UT, yt: DT, xl: L('文档可区分性 u', 'document distinguishability u'), yl: L('文档维度 d_C', 'document dimension d_C'), ylOff: 40 });
    keyBox(g, f.L + 8, f.B - 30, [['line', C.trn, L('训练后', 'trained')], ['line', C.unt, L('未训练', 'untrained')]]);
    const med = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
    document.getElementById('kinT').textContent = stat.t[1] ? `${stat.t[0]} / ${stat.t[1]}` : '–';
    document.getElementById('kinU').textContent = stat.u[1] ? `${stat.u[0]} / ${stat.u[1]}` : '–';
    const mt = med(stat.dt), mu = med(stat.du);
    if (document.getElementById('kinV')) document.getElementById('kinV').innerHTML = [mu != null ? `<span style="color:${C.unt}">${mu.toFixed(2)}</span>` : '', mt != null ? `<span style="color:${C.trn}">${mt.toFixed(2)}</span>` : ''].filter(Boolean).join(' · ') || '–';
    document.getElementById('kinOut').textContent = L('相对深度 ', 'depth ') + fs.s.toFixed(2);
    document.getElementById('kinRange').value = Math.round(fs.s * 1000); fillRange(document.getElementById('kinRange'));
  }
  function nearest(px, py) {
    const f = flowF; let best = null, bd = 196;
    const scan = (r, kind) => { const n = headAt(r, fs.s).i + 1; for (let i = 0; i < n; i++) { const dx = f.X(r.x[i]) - px, dy = f.Y(r.y[i]) - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = { r, kind, i }; } } };
    if (showT()) PD.trained.forEach(r => scan(r, 't')); PD.untrained.forEach(r => { if (showU(r)) scan(r, 'u'); }); return best;
  }
  if (flowCv) {
    const move = e => {
      if (kinPlaying) return;
      const b = flowCv.getBoundingClientRect(), hit = nearest(e.clientX - b.left, e.clientY - b.top);
      if ((hit && hit.r) !== (fs.hover && fs.hover.r)) { fs.hover = hit; drawFlow(); }
      if (hit) {
        const r = hit.r, n = r.x.length, ui = Math.pow(10, r.x[hit.i]), di = Math.pow(10, r.y[hit.i]);
        const head = hit.kind === 't' ? `<b>${r.name}</b> · ${L('训练后', 'trained')}` : `<b>${r.arch}</b> · ${L('未训练', 'untrained')} · σ = ${r.sigma} · seed ${r.seed}`;
        tip.innerHTML = `${head}<br>${L('第 ', 'layer ')}${hit.i + 1}${L(' 层', '')} / ${n} · u = ${ui.toPrecision(2)}, d<sub>C</sub> = ${Math.round(di)}`;
        tip.style.left = flowF.X(r.x[hit.i]) + 'px'; tip.style.top = flowF.Y(r.y[hit.i]) + 'px'; tip.classList.add('on');
      } else tip.classList.remove('on');
    };
    flowCv.addEventListener('pointermove', move);
    flowCv.addEventListener('pointerleave', () => { fs.hover = null; tip.classList.remove('on'); drawFlow(); });
  }
  function tabs(id, attr, cb) { document.querySelectorAll(`#${id} .tab`).forEach(b => b.addEventListener('click', () => { document.querySelectorAll(`#${id} .tab`).forEach(x => x.classList.toggle('is-active', x === b)); cb(b.dataset[attr]); })); }
  tabs('flowTabs', 'show', v => { fs.show = v; fs.hover = null; tip.classList.remove('on'); drawFlow(); });
  const kinBtn = document.getElementById('kinPlay'), kinRange = document.getElementById('kinRange');
  let kinPlaying = false, kinRaf = 0, kinLast = 0;
  function kinSet(on) { kinPlaying = on; kinBtn.textContent = on ? '❚❚' : '▶'; kinBtn.setAttribute('aria-label', on ? 'Pause' : 'Play'); if (on) { fs.hover = null; tip.classList.remove('on'); if (fs.s >= 1) fs.s = 0; kinLast = performance.now(); kinRaf = requestAnimationFrame(kinTick); } else cancelAnimationFrame(kinRaf); }
  function kinTick(now) { if (!kinPlaying) return; const dt = (now - kinLast) / 1000; kinLast = now; fs.s = Math.min(1, fs.s + dt / (reduced ? 1.5 : 8)); drawFlow(); if (fs.s >= 1) { kinSet(false); return; } kinRaf = requestAnimationFrame(kinTick); }
  kinBtn.addEventListener('click', () => kinSet(!kinPlaying));
  kinRange.addEventListener('input', () => { kinSet(false); fs.s = kinRange.value / 1000; drawFlow(); });

  /* ---------- 02: schematic conversation in the three states ---------- */
  const CHAT = {
    q: [['法国的首都是哪里？', 'What is the capital of France?'], ['把 “bonjour” 翻译成中文。', 'Translate “bonjour” into English.'], ['2 + 3 等于几？', 'What is 2 + 3?']],
    cols: [
      { k: 'noise', h: ['噪声区', 'Noise region'], s: ['$u$ 小 · $d_C$ 大', 'small $u$ · large $d_C$'], a: [['42。', '42.'], ['42。', '42.'], ['42。', '42.']] },
      { k: 'work', h: ['工作相', 'Working phase'], s: ['$u$、$d_C$ 居中', '$u$, $d_C$ in between'], a: [['法国的首都是巴黎。', 'The capital of France is Paris.'], ['“bonjour” 的意思是“你好”。', '“Bonjour” means “hello”.'], ['2 + 3 = 5。', '2 + 3 = 5.']] },
      { k: 'collapse', h: ['坍缩区', 'Collapse region'], s: ['$u$ 大 · $d_C$ 小', 'large $u$ · small $d_C$'], a: [['法国的首都是巴黎巴黎巴黎巴黎巴黎……', 'The capital of France is Paris Paris Paris Paris…'], ['“bonjour” 的意思是你好你好你好你好……', '“Bonjour” means hello hello hello hello…'], ['2 + 3 = 5 5 5 5 5 5……', '2 + 3 = 5 5 5 5 5 5…']] }
    ]
  };
  function drawChat() {
    const el = document.getElementById('chatGrid'); if (!el) return;
    el.innerHTML = CHAT.cols.map(c => `<div class="chat chat-${c.k}"><div class="chat-head"><b>${L(...c.h)}</b><span>${L(...c.s)}</span></div>` +
      CHAT.q.map((q, i) => `<div class="msg user">${L(...q)}</div><div class="msg bot">${L(...c.a[i])}</div>`).join('') + '</div>').join('');
    tex(el);
  }

  /* ---------- 05: discussion table (paper Table I) ---------- */
  function drawTable() {
    const t = document.getElementById('dictTable'); if (!t || !window.PD_DICT) return;
    const esc = s0 => {   // plain table text -> HTML with KaTeX delimiters (composite formulas first, kept aside, then single symbols)
      const M = [], keep = t => { M.push(t); return '\u0000' + (M.length - 1) + '\u0000'; };
      let s = s0.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace('E = u/(√d_C + u)', () => keep('$E = u/(\\sqrt{d_C}+u)$')).replace('(u, d_C)', () => keep('$(u,\\ d_C)$')).replace('u → ∞', () => keep('$u \\to \\infty$')).replace(/P\*/g, () => keep('$P^*$'));
      s = s.replace(/d_C/g, () => keep('$d_C$')).replace(/δ/g, () => keep('$\\delta$')).replace(/(^|[\s（(，,：:；;])([uE])(?=[\s：:，,；;)）]|$)/g, (m, p, v) => p + keep('$' + v + '$'));
      return s.replace(/\u0000(\d+)\u0000/g, (m, i) => M[+i]);
    };
    let html = `<thead><tr><th>${L('相图上的量或现象', 'Quantity or phenomenon on the phase diagram')}</th><th>${L('文献中的描述', 'Description in the literature')}</th><th>${L('来源', 'Sources')}</th></tr></thead><tbody>`;
    let g0 = '';
    window.PD_DICT.forEach(r => {
      if (r.g !== g0) { g0 = r.g; html += `<tr class="grp"><td colspan="3">${r.g === 'F' ? L('基础：本文用到的量与视角', 'Foundations: quantities and perspectives used here') : L('现象：本文观察到的现象', 'Phenomena: what this paper observes')}</td></tr>`; }
      html += `<tr><td>${esc(L(r.iz, r.ie))}</td><td>${esc(L(r.lz, r.le))}</td><td class="src">${r.refs.map(x => x.k === 'song2026phasediagramtraininginference' ? '<span><a href="https://arxiv.org/abs/2611.19848" target="_blank" rel="noopener">' + x.s + ' ↗︎</a></span>' : '<span>' + x.s + '</span>').join('<br>')}</td></tr>`;
    });
    t.innerHTML = html + '</tbody>'; tex(t);
  }

  /* ---------- 03: dynamics — measured force field + ring iterated with the linearized difference equation ---------- */
  const forceCv = document.getElementById('forceMap');
  const BX = [-0.5, 0.5, 1.5, 2.6], SC = 0.27, PEC = ['#c3cfdb', '#dbe4ed', '#eef3f8', '#ffffff'], ALPHA = { untrained: PD.training.groups.untrained.alpha, trained: PD.training.groups.trained.alpha };
  const PE_MED = { untrained: '1.99', trained: '0.49' };
  const dyn = { group: 'untrained', t: 0, T: 48 };
  const NR = 16, R0 = 0.12;
  function ringPaths(group) {
    const J = PD.force[group].J, a = ALPHA[group], out = [];
    for (let k = 0; k < NR; k++) {
      const th = 2 * Math.PI * k / NR; let e = [R0 * Math.cos(th), R0 * Math.sin(th)], v = [0, 0]; const pts = [e.slice()];
      for (let t = 0; t < dyn.T; t++) { const F = [J[0][0] * e[0] + J[0][1] * e[1], J[1][0] * e[0] + J[1][1] * e[1]]; v = [a * v[0] + F[0], a * v[1] + F[1]]; e = [e[0] + v[0], e[1] + v[1]]; pts.push(e.slice()); }
      out.push(pts);
    }
    return out;
  }
  let RING = { untrained: ringPaths('untrained'), trained: ringPaths('trained') };
  function drawForce() {
    if (!forceCv) return; const { g, w, h } = fit(forceCv);
    const f = frame(w, h, [12, 14, 46, 56], [BX[0], BX[1]], [BX[2], BX[3]]);
    const F = PD.force[dyn.group], acc = dyn.group === 'untrained' ? C.unt : C.trn, P = PD.pstar;
    phaseBg(g, f);
    g.save(); g.beginPath(); g.rect(f.L, f.T, f.R - f.L, f.B - f.T); g.clip();
    const H = 0.1;
    F.cells.forEach(c => { const m = Math.hypot(c[2], c[3]); if (!m) return; const Lh = SC * Math.sqrt(m); arrow(g, f.X(c[0]), f.Y(c[1]), f.X(c[0] + c[2] / m * Lh), f.Y(c[1] + c[3] / m * Lh), '#7d8fa3', 1, 4.5); });
    // ring of starting points iterated layer by layer
    const ring = RING[dyn.group], t = Math.round(dyn.t);
    g.strokeStyle = 'rgba(16,41,68,.25)'; g.setLineDash([3, 3]); g.lineWidth = 1; g.beginPath(); g.arc(f.X(P[0]), f.Y(P[1]), Math.abs(f.X(P[0] + R0) - f.X(P[0])), 0, 7); g.stroke(); g.setLineDash([]);
    ring.forEach(pts => {
      g.strokeStyle = acc; g.globalAlpha = 0.55; g.lineWidth = 1.6; g.beginPath();
      for (let i = 0; i <= t; i++) { const X = f.X(P[0] + pts[i][0]), Y = f.Y(P[1] + pts[i][1]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); g.globalAlpha = 1;
    });
    g.beginPath(); ring.forEach((pts, k) => { const X = f.X(P[0] + pts[t][0]), Y = f.Y(P[1] + pts[t][1]); k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); g.strokeStyle = acc; g.lineWidth = 1.4; g.stroke();
    ring.forEach(pts => dot(g, f.X(P[0] + pts[t][0]), f.Y(P[1] + pts[t][1]), 3.2, acc, '#fff'));
    g.restore();
    // eigen-directions of the linearized force at P*: inward = restoring, outward = diverging
    for (let i = 0; i < 2; i++) {
      const v = F.vec[i], lam = F.eig[i], Lh = 0.84 * Math.sqrt(Math.abs(lam));
      [1, -1].forEach(sg => { const near = [P[0] + sg * 0.03 * v[0], P[1] + sg * 0.03 * v[1]], far = [P[0] + sg * Lh * v[0], P[1] + sg * Lh * v[1]]; const [a, b] = lam < 0 ? [far, near] : [near, far]; arrow(g, f.X(a[0]), f.Y(a[1]), f.X(b[0]), f.Y(b[1]), C.ink, 2, 8); });
    }
    star(g, f.X(P[0]), f.Y(P[1]), 10);
    axes(g, f, { xt: [Math.log10(0.5), 0, Math.log10(2)], yt: [Math.log10(50), 2, Math.log10(200)], xl: 'u', yl: 'd_C', ylOff: 40 });
    dynText();
  }
  function dynText() {
    const un = dyn.group === 'untrained', F = PD.force[dyn.group];
    document.getElementById('dynTitle').innerHTML = un ? L('鞍点：圆圈被拉成一条线', 'A saddle: the ring is drawn into a line') : L('稳定结点：圆圈收向 $P^*$', 'A stable node: the ring shrinks toward $P^*$'); tex(document.getElementById('dynTitle'));
    document.getElementById('dynText').innerHTML = un
      ? L('未训练组的有效力在 $P^*$ 处沿一个方向把状态推回来，沿另一个方向把它推开；惯性 $\\alpha \\approx 0.29$ 让每一步延续到下一层。逐层迭代后圆圈被拉成一条线，推理流因此分向噪声区和坍缩区，主要被有效力带着走。', 'For the untrained group the force at $P^*$ pushes states back along one direction and away along the other; inertia $\\alpha \\approx 0.29$ carries each step into the next. Iterated layer by layer, the ring is drawn into a line, so flows split toward the noise and collapse regions, carried mainly by the force.')
      : L('训练后组的有效力从两个方向都把状态推回 $P^*$；惯性 $\\alpha \\approx 0$，每一层只看当前位置。逐层迭代后圆圈收向 $P^*$：推理流留在工作相，以涨落为主，整体移动缓慢。', 'For the trained group the force pushes states back to $P^*$ from both directions; inertia $\\alpha \\approx 0$, so each layer responds only to where it is. Iterated layer by layer, the ring shrinks toward $P^*$: the flow stays in the working phase, dominated by fluctuation and moving slowly.');
    tex(document.getElementById('dynText'));
    document.getElementById('dynOut').textContent = (lang === 'en' ? 'layer ' : '第 ') + Math.round(dyn.t) + (lang === 'en' ? '' : ' 层');
    document.getElementById('dynRange').value = Math.round(dyn.t); fillRange(document.getElementById('dynRange'));
  }
  tabs('dynTabs', 'group', v => { dyn.group = v; drawForce(); });
  const dynBtn = document.getElementById('dynPlay'), dynRange = document.getElementById('dynRange');
  let dynPlaying = false, dynRaf = 0, dynLast = 0;
  function dynSet(on) { dynPlaying = on; dynBtn.textContent = on ? '❚❚' : '▶'; dynBtn.setAttribute('aria-label', on ? 'Pause' : 'Play'); if (on) { if (dyn.t >= dyn.T) dyn.t = 0; dynLast = performance.now(); dynRaf = requestAnimationFrame(dynTick); } else cancelAnimationFrame(dynRaf); }
  function dynTick(now) { if (!dynPlaying) return; const dt = (now - dynLast) / 1000; dynLast = now; dyn.t = Math.min(dyn.T, dyn.t + dt * (reduced ? 48 : 12)); drawForce(); if (dyn.t >= dyn.T) { dynSet(false); return; } dynRaf = requestAnimationFrame(dynTick); }
  dynBtn.addEventListener('click', () => dynSet(!dynPlaying));
  dynRange.addEventListener('input', () => { dynSet(false); dyn.t = +dynRange.value; drawForce(); });

  /* ---------- 04: Pythia training player ---------- */
  const PY = PD.pythia, TR = PD.training, NCK = PY.length, pos = { t: 0 };
  const trainCv = document.getElementById('trainMap'), range = document.getElementById('trainRange'), out = document.getElementById('trainOut'), badge = document.getElementById('trainBadge'), playBtn = document.getElementById('trainPlay');
  const XL = [Math.log10(40), Math.log10(2.2e5)];
  const pyB = (() => { let x0 = 9, x1 = -9, y0 = 9, y1 = -9; PY.forEach(p => { p.x.forEach(v => { x0 = Math.min(x0, v); x1 = Math.max(x1, v); }); p.y.forEach(v => { y0 = Math.min(y0, v); y1 = Math.max(y1, v); }); }); return [x0 - 0.15, x1 + 0.15, y0 - 0.15, y1 + 0.15]; })();
  const interp = t => { const i = Math.min(NCK - 2, Math.floor(t)), u = t - i, A = PY[i], B = PY[i + 1]; return { x: A.x.map((v, k) => v + (B.x[k] - v) * u), y: A.y.map((v, k) => v + (B.y[k] - v) * u) }; };
  const shareAt = s => TR.share.find(r => r.step === s);
  const working = t => { const s = PY[Math.round(t)].step; return s > 0 && shareAt(s).v > 0.5; };
  const fmtS = s => s.toLocaleString('en-US');
  const stepLabel = () => { const i = Math.floor(pos.t + 1e-9); return L('训练步 ', 'step ') + (Math.abs(pos.t - Math.round(pos.t)) < 1e-6 ? fmtS(PY[Math.round(pos.t)].step) : `${fmtS(PY[i].step)} → ${fmtS(PY[i + 1].step)}`); };
  // left: the late-half median point of each checkpoint (the paper's deep-layer summary) and its path over training;
  // context: the 96 per-document late-half points and the layer-wise median trajectory of the current checkpoint
  const TWX = [-1.2, 0.55], TWY = [0.72, 2.4];
  const lerp = (a, b, u) => a + (b - a) * u;
  function drawTrainMap() {
    if (!trainCv) return; const { g, w, h } = fit(trainCv);
    const f = frame(w, h, [12, 12, 46, 56], TWX, TWY);
    phaseBg(g, f);
    const i = Math.min(NCK - 2, Math.floor(pos.t)), u = pos.t - i, A = PY[i], B = PY[i + 1], wk = working(pos.t);
    g.save(); g.beginPath(); g.rect(f.L, f.T, f.R - f.L, f.B - f.T); g.clip();
    // 96 documents (late half)
    g.fillStyle = 'rgba(16,41,68,.28)'; A.lu.forEach((x, k) => { g.beginPath(); g.arc(f.X(lerp(x, B.lu[k], u)), f.Y(lerp(A.ld[k], B.ld[k], u)), 2, 0, 7); g.fill(); });
    // layer-wise median trajectory, thin
    const r = interp(pos.t); g.strokeStyle = 'rgba(16,41,68,.45)'; g.lineWidth = 1.2; g.lineJoin = 'round'; g.setLineDash([4, 3]); g.beginPath(); r.x.forEach((x, k) => (k ? g.lineTo(f.X(x), f.Y(r.y[k])) : g.moveTo(f.X(x), f.Y(r.y[k])))); g.stroke(); g.setLineDash([]);
    // path of the late-half median over the checkpoints passed so far
    g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); for (let k = 0; k <= i; k++) { const X = f.X(PY[k].mu), Y = f.Y(PY[k].md); k ? g.lineTo(X, Y) : g.moveTo(X, Y); }
    const mx = lerp(A.mu, B.mu, u), my = lerp(A.md, B.md, u); g.lineTo(f.X(mx), f.Y(my)); g.stroke();
    for (let k = 0; k <= i; k++) dot(g, f.X(PY[k].mu), f.Y(PY[k].md), 3, '#fff', C.ink);
    g.restore();
    star(g, f.X(PD.pstar[0]), f.Y(PD.pstar[1]), 10);
    dot(g, f.X(mx), f.Y(my), 8, wk ? C.trn : C.unt, '#fff');
    axes(g, f, { xt: niceTicks(TWX[0], TWX[1]), yt: niceTicks(TWY[0], TWY[1]), xl: 'u', yl: 'd_C', ylOff: 40 });
    keyBox(g, f.L + 8, f.B - 30, [['big', wk ? C.trn : C.unt, L('深层中位点', 'deep-layer median')], ['dot', 'rgba(16,41,68,.45)', L('各文档', 'documents')]]);
  }
  // three small charts sharing one log-step axis; step 0 sits in its own narrow box to the left
  const GAP = 14, BOX0 = 30;
  function stepX(f, s) { if (s === 0) return f.L + BOX0 / 2; const x0 = f.L + BOX0 + GAP; return x0 + (Math.log10(s) - XL[0]) / (XL[1] - XL[0]) * (f.R - x0); }
  function tX(f, t) { const i = Math.min(NCK - 2, Math.floor(t)), u = t - i; return stepX(f, PY[i].step) + (stepX(f, PY[i + 1].step) - stepX(f, PY[i].step)) * u; }
  const BOUND = Math.sqrt(256 * 512);   // the phase boundary between the two checkpoints
  function mini(id, o) {
    const cv = document.getElementById(id); if (!cv) return; const { g, w, h } = fit(cv);
    const f = frame(w, h, [24, 14, o.last ? 26 : 8, 44], [0, 1], o.yr);
    const x0 = f.L + BOX0 + GAP, xb = stepX(f, BOUND);
    g.fillStyle = '#ffffff'; g.fillRect(f.L, f.T, BOX0, f.B - f.T); g.fillRect(x0, f.T, f.R - x0, f.B - f.T);
    g.save(); g.strokeStyle = 'rgba(16,41,68,.35)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(xb, f.T); g.lineTo(xb, f.B); g.stroke(); g.restore();   // phase boundary between steps 256 and 512
    g.strokeStyle = 'rgba(16,41,68,.07)'; g.lineWidth = 1; o.yt.forEach(v => { g.beginPath(); g.moveTo(f.L, f.Y(v)); g.lineTo(f.L + BOX0, f.Y(v)); g.moveTo(x0, f.Y(v)); g.lineTo(f.R, f.Y(v)); g.stroke(); });
    g.strokeStyle = C.frame; g.strokeRect(f.L + .5, f.T + .5, BOX0 - 1, f.B - f.T - 1); g.strokeRect(x0 + .5, f.T + .5, f.R - x0 - 1, f.B - f.T - 1);
    // reference levels of the two groups: thin dashed lines, labelled at the right
    (o.refs || []).forEach(rf => { const y = f.Y(rf.v); g.save(); g.strokeStyle = rf.col; g.globalAlpha = 0.7; g.setLineDash([4, 4]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0, y); g.lineTo(f.R, y); g.stroke(); g.restore();
      g.save(); g.font = `10.5px ${SANS}`; g.fillStyle = rf.col; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(rf.lab, f.R + 6, y + (rf.dy || 0)); g.restore(); });
    o.draw(g, f, x0);
    const cx = tX(f, pos.t); g.save(); g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, f.T); g.lineTo(cx, f.B); g.stroke(); g.restore();
    g.save(); g.font = `10.5px ${MONO}`; g.fillStyle = C.muted; g.textAlign = 'right'; g.textBaseline = 'middle'; o.yt.forEach(v => g.fillText(String(v), f.L - 6, f.Y(v)));
    g.textAlign = 'left'; g.textBaseline = 'bottom'; g.font = `600 12px ${SANS}`; g.fillStyle = C.deep; g.fillText(o.title, f.L, f.T - 6);
    if (o.key) { const kx = f.L + g.measureText(o.title).width + 18, ky = f.T - 11; g.strokeStyle = C.ink; g.lineWidth = 1.8; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + 18, ky); g.stroke(); g.font = `11.5px ${SANS}`; g.fillStyle = C.muted; g.fillText(o.key, kx + 24, f.T - 6); }
    g.restore();
    if (o.last) { g.save(); g.font = `10.5px ${MONO}`; g.fillStyle = C.muted; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('0', stepX(f, 0), f.B + 5); [100, 1000, 10000, 100000].forEach(s => g.fillText(s >= 1000 ? (s / 1000) + 'k' : String(s), stepX(f, s), f.B + 5)); g.textAlign = 'center'; g.fillText(L('训练步数', 'training step'), (stepX(f, 100) + f.R) / 2, f.B + 18); g.restore(); }
  }
  const pt = (g, x, y, open) => dot(g, x, y, 3, open ? '#fff' : C.ink, C.ink);
  const vbar = (g, x, y0, y1) => { if (Math.abs(y1 - y0) < 7) return; g.strokeStyle = 'rgba(16,41,68,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); };
  function drawMinis() {
    const ck = TR.share.filter(r => r.step > 0);
    mini('miniShare', { title: L('工作相占比 φ', 'working fraction φ'), yr: [-0.05, 1.08], yt: [0, 0.5, 1], draw: (g, f, x0) => {
      g.strokeStyle = C.ink; g.lineWidth = 1.5; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x0, f.Y(ck[0].v)); ck.forEach(r => g.lineTo(stepX(f, r.step), f.Y(r.v))); g.stroke();
      TR.share.forEach(r => { const x = stepX(f, r.step); vbar(g, x, f.Y(r.lo), f.Y(r.hi)); pt(g, x, f.Y(r.v), r.step === 0); });
      const xb = stepX(f, BOUND); g.save(); g.font = `11px ${SANS}`; g.textBaseline = 'middle'; const ym = f.Y(0.5);
      g.fillStyle = C.unt; g.textAlign = 'right'; g.fillText(L('漂移相', 'drifting'), xb - 8, ym); g.fillStyle = C.trnDeep; g.textAlign = 'left'; g.fillText(L('工作相', 'working'), xb + 8, ym); g.restore();
    } });
    const LV = TR.lever, G = TR.groups;
    mini('miniAlpha', { title: L('惯性 α', 'inertia α'), key: L('杠杆定则', 'lever rule'), yr: [-0.12, 0.66], yt: [0, 0.3, 0.6], draw: (g, f, x0) => {
      g.fillStyle = 'rgba(16,41,68,.12)'; g.beginPath(); g.moveTo(x0, f.Y(LV.hi[0])); LV.steps.forEach((s, i) => g.lineTo(stepX(f, s), f.Y(LV.hi[i]))); for (let i = LV.steps.length - 1; i >= 0; i--) g.lineTo(stepX(f, LV.steps[i]), f.Y(LV.lo[i])); g.lineTo(x0, f.Y(LV.lo[0])); g.closePath(); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 1.8; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x0, f.Y(LV.fit[0])); LV.steps.forEach((s, i) => g.lineTo(stepX(f, s), f.Y(LV.fit[i]))); g.stroke();
      TR.alpha.forEach(r => { const x = stepX(f, r.step); vbar(g, x, f.Y(r.lo), f.Y(r.hi)); pt(g, x, f.Y(r.v), r.step === 0); });
    } });
    mini('miniRate', { last: true, title: L('收缩率 −ln ρ', 'contraction rate −ln ρ'), yr: [-0.03, 0.07], yt: [0, 0.05], draw: (g, f) => {
      TR.rate.forEach(r => { const s0 = r.steps[0], s1 = r.steps[r.steps.length - 1];
        const x = s0 === 0 ? stepX(f, 0) : stepX(f, Math.sqrt(s0 * s1)), xa = s0 === 0 ? x : stepX(f, s0), xb = s0 === 0 ? x : stepX(f, s1), y = f.Y(r.v);
        g.strokeStyle = 'rgba(16,41,68,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xa, y); g.lineTo(xb, y); g.stroke();
        vbar(g, x, f.Y(r.lo), f.Y(r.hi)); pt(g, x, y, s0 === 0); });
    } });
  }
  function drawTraining() {
    drawTrainMap(); drawMinis();
    const s = PY[Math.round(pos.t)].step, wk = working(pos.t);
    out.textContent = stepLabel(); range.value = Math.round(pos.t / (NCK - 1) * 1000); fillRange(range);
    badge.className = 'badge ' + (wk ? 'w' : 'd');
    badge.textContent = wk ? L('工作相', 'working phase') : s === 0 ? L('漂移相 · 路过工作相', 'drifting · passing through') : L('漂移相', 'drifting phase');
  }
  let playing = false, raf = 0, last = 0;
  function setPlay(on) { playing = on; playBtn.textContent = on ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play'); if (on) { if (pos.t >= NCK - 1) pos.t = 0; last = performance.now(); raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf); }
  function tick(now) {
    if (!playing) return; const dt = (now - last) / 1000; last = now;
    if (reduced) { if (dt < 0.7) { last = now - dt * 1000; raf = requestAnimationFrame(tick); return; } pos.t = Math.min(NCK - 1, Math.floor(pos.t) + 1); }
    else { const slow = pos.t > 2.6 && pos.t < 4.4 ? 0.35 : 1; pos.t = Math.min(NCK - 1, pos.t + dt * 1.6 * slow); }
    drawTraining(); if (pos.t >= NCK - 1) { setPlay(false); return; } raf = requestAnimationFrame(tick);
  }
  playBtn.addEventListener('click', () => setPlay(!playing));
  range.addEventListener('input', () => { setPlay(false); const t = range.value / 1000 * (NCK - 1), r = Math.round(t); pos.t = Math.abs(t - r) < 0.12 ? r : t; drawTraining(); });

  /* ---------- boot ---------- */
  function drawAll() { drawDepth(); drawChat(); drawProbe(); drawFlow(); drawForce(); drawTraining(); drawTable(); }
  let saved = null; try { saved = localStorage.getItem('pd-lang'); } catch (e) { /* storage unavailable */ }
  const qs = new URLSearchParams(location.search).get('lang'); if (qs === 'en' || qs === 'zh') saved = qs;
  tex(document.querySelector('main')); tex(document.querySelector('.hero'));
  setLang(saved || 'zh');
  let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawAll, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
