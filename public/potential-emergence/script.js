/* Potential emergence in LLM agents — language switch, navigation and all figures.
   Every data chart is drawn from window.PT (assets/data/data.js, built by tools/build_data.py from the paper's data). */
(function () {
  'use strict';
  const PT = window.PT, root = document.documentElement;
  const C = {
    ink: '#102944', deep: '#173b62', muted: '#68809a', faint: '#9fb6c9', grid: 'rgba(63,119,168,.10)', frame: '#9fb6c9',
    t1: '#245d96', t2: '#d55e00', gold: '#efb83e', goldDeep: '#b78018', green: '#3f9a6b', sky: '#5da8e8', violet: '#7162c8', up: '#c9d3dd'
  };
  const TC = { T1: C.t1, T2: C.t2 };
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
    try { localStorage.setItem('pt-lang', lang); } catch (e) { /* storage unavailable */ }
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
  const btnState = (btn, playing, done) => { btn.textContent = playing ? '❚❚' : done ? '↺' : '▶'; btn.setAttribute('aria-label', playing ? 'Pause' : done ? 'Replay' : 'Play'); };
  const tex = el => {
    if (!el || !window.renderMathInElement) return;
    window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false });
    el.querySelectorAll('.katex').forEach(k => { let h = k; while (!h.nextSibling && h.parentNode && h.parentNode.childNodes.length === 1 && h.parentNode !== el) h = h.parentNode; const n = h.nextSibling; if (n && n.nodeType === 3 && /^[，。；：、）]/.test(n.data) && !h.parentNode.classList.contains('nb')) { const w = document.createElement('span'); w.className = 'nb'; h.parentNode.insertBefore(w, h); w.appendChild(h); w.appendChild(document.createTextNode(n.data[0])); n.data = n.data.slice(1); } });
  };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  function fit(cv) {
    const w = cv.clientWidth, h = cv.clientHeight, r = Math.min(window.devicePixelRatio || 1, 2.5);
    if (cv.width !== Math.round(w * r) || cv.height !== Math.round(h * r)) { cv.width = Math.round(w * r); cv.height = Math.round(h * r); }
    const g = cv.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h); return { g, w, h };
  }
  function frame(w, h, pad, xr, yr) {
    const Lp = pad[3], R = w - pad[1], Tp = pad[0], B = h - pad[2];
    return { L: Lp, R, T: Tp, B, xr, yr,
      X: x => Lp + (x - xr[0]) / (xr[1] - xr[0]) * (R - Lp), Y: y => B - (y - yr[0]) / (yr[1] - yr[0]) * (B - Tp) };
  }
  const ticks = (a, b, step) => { const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(6)); return out; };
  // axis text: multi-letter words (log, eff, nominal) upright, single symbols italic, CJK in sans; "_x" or "_{xy}" subscripts
  function subText(g, s, x, y, align, size) {
    const px = size || 14, parts = []; let i = 0;
    while (i < s.length) {
      const k = s.indexOf('_', i); if (k < 0) { parts.push([s.slice(i), 0]); break; }
      parts.push([s.slice(i, k), 0]);
      if (s[k + 1] === '{') { const e = s.indexOf('}', k); parts.push([s.slice(k + 2, e), 1]); i = e + 1; } else { parts.push([s[k + 1], 1]); i = k + 2; }
    }
    const runs = [];
    parts.forEach(([t, sb]) => (t.match(/[A-Za-z]{2,}|[一-鿿（-？]+|./g) || []).forEach(tok => {
      const z = sb ? Math.round(px * 0.72) : px;
      const font = /^[一-鿿（-？]/.test(tok) ? `${z}px ${SANS}` : /^[A-Za-zα-ωΑ-ΩφΦθβ]$/.test(tok) && !sb ? `italic ${z}px KaTeX_Math,${SERIF}` : `${z}px KaTeX_Main,Georgia,serif`;
      runs.push([tok, sb, font]);
    }));
    const wid = runs.reduce((a, [t, , fnt]) => { g.font = fnt; return a + g.measureText(t).width; }, 0);
    let cx = align === 'center' ? x - wid / 2 : align === 'right' ? x - wid : x; const ta = g.textAlign; g.textAlign = 'left';
    runs.forEach(([t, sb, fnt]) => { g.font = fnt; g.fillText(t, cx, sb ? y + px * 0.28 : y); cx += g.measureText(t).width; });
    g.textAlign = ta;
  }
  function axes(g, f, o) {
    o = o || {};
    g.save(); g.font = `11px ${MONO}`; g.fillStyle = C.muted; g.strokeStyle = C.grid; g.lineWidth = 1;
    (o.xt || []).forEach(v => { const x = f.X(v); g.beginPath(); g.moveTo(x, f.T); g.lineTo(x, f.B); g.stroke(); g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(o.xf ? o.xf(v) : String(v), x, f.B + 6); });
    (o.yt || []).forEach(v => { const y = f.Y(v); g.beginPath(); g.moveTo(f.L, y); g.lineTo(f.R, y); g.stroke(); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(o.yf ? o.yf(v) : String(v), f.L - 6, y); });
    g.strokeStyle = C.frame; g.strokeRect(f.L + .5, f.T + .5, f.R - f.L - 1, f.B - f.T - 1);
    g.fillStyle = C.deep; g.font = `italic 14px ${SERIF}`;
    if (o.xl) { g.textBaseline = 'bottom'; subText(g, o.xl, (f.L + f.R) / 2, f.B + 40, 'center'); }
    if (o.yl && o.yl.length <= 2) { g.textBaseline = 'bottom'; subText(g, o.yl, f.L - 8, f.T - 4, 'right', 15); }
    else if (o.yl) { g.save(); g.translate(f.L - (o.ylOff || 42), (f.T + f.B) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; subText(g, o.yl, 0, 0, 'center'); g.restore(); }
    g.restore();
  }
  const dot = (g, x, y, r, fill, stroke, lw) => { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw || 1.4; g.strokeStyle = stroke; g.stroke(); } };
  function line(g, xs, ys, f, col, lw, dash) { g.save(); g.strokeStyle = col; g.lineWidth = lw || 2; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(f.X(x), f.Y(ys[i])) : g.moveTo(f.X(x), f.Y(ys[i])))); g.stroke(); g.restore(); }
  function band(g, xs, lo, hi, f, col) { g.save(); g.fillStyle = col; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(f.X(x), f.Y(hi[i])) : g.moveTo(f.X(x), f.Y(hi[i])))); for (let i = xs.length - 1; i >= 0; i--) g.lineTo(f.X(xs[i]), f.Y(lo[i])); g.closePath(); g.fill(); g.restore(); }
  function points(g, xs, ys, f, col, o) {
    o = o || {};
    if (o.lo) { g.save(); g.strokeStyle = rgba(col, .55); g.lineWidth = 1.2; xs.forEach((x, i) => { g.beginPath(); g.moveTo(f.X(x), f.Y(o.lo[i])); g.lineTo(f.X(x), f.Y(o.hi[i])); g.stroke(); }); g.restore(); }
    xs.forEach((x, i) => dot(g, f.X(x), f.Y(ys[i]), o.r || 3.6, '#fff', col, 1.6));
  }
  function keyBox(g, x, y, items, align) {
    g.save(); g.font = `11.5px ${SANS}`; const wds = items.map(it => g.measureText(it[2]).width + 30), W = wds.reduce((a, b) => a + b, 0) + 10;
    if (align === 'right') x -= W;
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x, y, W, 22); let cx = x + 8; g.textBaseline = 'middle';
    items.forEach((it, i) => { const [k, col, lab] = it, cy = y + 11;
      if (k === 'line') { g.strokeStyle = col; g.lineWidth = 2.4; g.setLineDash(it[3] || []); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 16, cy); g.stroke(); g.setLineDash([]); }
      else dot(g, cx + 8, cy, 3.6, '#fff', col, 1.6);
      g.fillStyle = C.deep; g.textAlign = 'left'; g.fillText(lab, cx + 22, cy); cx += wds[i]; });
    g.restore();
  }
  function legend(id, items) {
    const wrap = document.getElementById(id).closest('.canvas-wrap'); let el = wrap.querySelector('.chart-key');
    if (!el) { el = document.createElement('div'); el.className = 'chart-key'; wrap.insertBefore(el, wrap.firstChild); }
    el.innerHTML = items.map(([k, col, lab]) => `<span><i class="${k === 'line' ? 'k-line' : k === 'sq' ? 'k-sq' : 'k-dot'}" style="border-color:${col}"></i>${lab}</span>`).join('');
  }
  function arrowHead(g, x, y, ang, size, col) { g.save(); g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.lineTo(x - size * Math.cos(ang - .45), y - size * Math.sin(ang - .45)); g.lineTo(x - size * Math.cos(ang + .45), y - size * Math.sin(ang + .45)); g.closePath(); g.fill(); g.restore(); }
  function player(btn, range, state, dur, draw) {
    let raf = 0, last = 0, playing = false;
    const max = +range.max;
    const set = on => { playing = on; btnState(btn, on, +range.value >= max); if (on) { if (+range.value >= max) range.value = 0; last = performance.now(); raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf); };
    function tick(now) { if (!playing) return; const dt = (now - last) / 1000; last = now; range.value = Math.min(max, +range.value + max * dt / (reduced ? dur / 4 : dur)); fillRange(range); draw(); if (+range.value >= max) { set(false); return; } raf = requestAnimationFrame(tick); }
    btn.addEventListener('click', () => set(!playing));
    range.addEventListener('input', () => { set(false); fillRange(range); draw(); });
    fillRange(range); btnState(btn, false, +range.value >= max);
  }

  /* ---------- a potential-ordered network: nodes placed by potential, arcs are net flows ---------- */
  function network(cv, phi, T, support, order, yr, col) {
    const { g, w, h } = fit(cv), n = phi.length;
    const f = frame(w, h, [26, 22, 34, 22], [-0.6, n - 0.4], yr);
    g.save(); g.strokeStyle = C.grid; g.lineWidth = 1; [f.B].forEach(y => { g.beginPath(); g.moveTo(f.L, y); g.lineTo(f.R, y); g.stroke(); }); g.restore();
    const pos = new Array(n); order.forEach((s, k) => { pos[s] = [f.X(k), f.Y(phi[s])]; });
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (support[i][j] && support[j][i]) pairs.push([i, j, T[i][j] - T[j][i]]);
    const maxJ = Math.max(1e-6, ...pairs.map(p => Math.abs(p[2])));
    pairs.sort((a, b) => Math.abs(a[2]) - Math.abs(b[2]));
    pairs.forEach(([i, j, J]) => {
      const [a, b] = J >= 0 ? [i, j] : [j, i], s = Math.abs(J) / maxJ;
      if (s < 0.04) return;
      const [x0, y0] = pos[a], [x1, y1] = pos[b];
      const down = phi[a] >= phi[b], c = down ? col : C.up;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const bend = 0.22 * len, cx = mx - dy / len * bend, cy = my + dx / len * bend;
      g.save(); g.strokeStyle = rgba(c.startsWith('#') ? c : C.t1, down ? 0.35 + 0.6 * s : 0.9); g.lineWidth = 0.6 + 3.4 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); g.restore();
      const t = 0.62, qx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, qy = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      const tx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
      arrowHead(g, qx, qy, Math.atan2(ty, tx), 5 + 4 * s, down ? rgba(col, 0.5 + 0.5 * s) : C.up);
    });
    order.forEach(s => dot(g, pos[s][0], pos[s][1], 6.5, '#fff', col, 2));
    g.save(); g.fillStyle = C.deep; g.font = `italic 14px ${SERIF}`; g.textBaseline = 'top'; g.fillText('ϕ', f.L + 2, 4);
    g.font = `11px ${SANS}`; g.fillStyle = C.muted; g.textAlign = 'right'; g.textBaseline = 'bottom';
    g.textAlign = 'left'; g.fillText(L('← 势能高', '← high potential'), f.L, h - 6); g.textAlign = 'right'; g.fillText(L('势能低 →', 'low potential →'), f.R, h - 6); g.restore();
  }

  /* ---------- 03 task graphs (SVG) ---------- */
  function taskGraph(id, task) {
    const svg = document.getElementById(id), d = PT.tasks[task], n = d.n, cx = 110, cy = 100, R = 78, ns = 'http://www.w3.org/2000/svg';
    const P = [...Array(n).keys()].map(k => [cx + R * Math.sin(2 * Math.PI * k / n), cy - R * Math.cos(2 * Math.PI * k / n)]);
    let s = '';
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (d.support[i][j]) s += `<line x1="${P[i][0].toFixed(1)}" y1="${P[i][1].toFixed(1)}" x2="${P[j][0].toFixed(1)}" y2="${P[j][1].toFixed(1)}" stroke="${rgba(TC[task], .28)}" stroke-width="1.2"/>`;
    P.forEach(p => { s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6.5" fill="#fff" stroke="${TC[task]}" stroke-width="2"/>`; });
    svg.innerHTML = s; void ns;
  }
  taskGraph('graphT1', 'T1'); taskGraph('graphT2', 'T2');

  /* ---------- 03 round-by-round player ---------- */
  let task = 'T1';
  const roundRange = document.getElementById('roundRange'), roundOut = document.getElementById('roundOut');
  const ORDER = {}, YR = {};
  Object.entries(PT.tasks).forEach(([t, d]) => {
    const ph8 = d.rounds[8].phi; ORDER[t] = [...Array(d.n).keys()].sort((a, b) => ph8[b] - ph8[a]);
    const all = d.rounds.flatMap(r => r.phi); const m = Math.max(...all.map(Math.abs)) * 1.12; YR[t] = [-m, m];
  });
  function lerpRound(d, q) { const i = Math.min(7, Math.floor(q)), a = q - i, A = d.rounds[i], B = d.rounds[i + 1]; return { phi: A.phi.map((v, k) => v + (B.phi[k] - v) * a), T: A.T.map((row, r) => row.map((v, c) => v + (B.T[r][c] - v) * a)) }; }
  function drawRounds() {
    const d = PT.tasks[task], q = +roundRange.value / 100, s = lerpRound(d, Math.min(q, 7.9999)), m = Math.round(q);
    network(document.getElementById('netCanvas'), q >= 8 ? d.rounds[8].phi : s.phi, q >= 8 ? d.rounds[8].T : s.T, d.support, ORDER[task], YR[task], TC[task]);
    const { g, w, h } = fit(document.getElementById('rCanvas'));
    const rs = d.rounds.slice(1), xs = rs.map(r => r.x), x0 = Math.min(...d.fit.x, ...xs) - 0.15, x1 = Math.max(...xs) + 0.15;
    const ylo = Math.floor((Math.min(...rs.map(r => r.r - r.hw), ...d.fit.r) - 0.03) * 20) / 20, yhi = Math.ceil((Math.max(...rs.map(r => r.r + r.hw)) + 0.03) * 20) / 20;
    const f = frame(w, h, [24, 18, 52, 56], [x0, x1], [ylo, yhi]);
    axes(g, f, { xt: ticks(x0, x1, 0.5), yt: ticks(ylo, yhi, 0.1), yf: v => v.toFixed(1), xl: '−log β_{eff}', yl: 'r' });
    line(g, d.fit.x, d.fit.r, f, TC[task], 2.2);
    points(g, xs, rs.map(r => r.r), f, TC[task], { lo: rs.map(r => r.r - r.hw), hi: rs.map(r => r.r + r.hw) });
    if (m >= 1) dot(g, f.X(rs[m - 1].x), f.Y(rs[m - 1].r), 6.5, C.gold, C.ink, 1.2);
    roundOut.textContent = L(m === 0 ? `初始 · r = ${d.rounds[0].r.toFixed(2)}` : `第 ${m} 轮 · r = ${d.rounds[m].r.toFixed(2)}`, m === 0 ? `initial · r = ${d.rounds[0].r.toFixed(2)}` : `round ${m} · r = ${d.rounds[m].r.toFixed(2)}`);
  }
  player(document.getElementById('roundPlay'), roundRange, null, 4, drawRounds);
  document.querySelectorAll('#taskTabs .tab').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#taskTabs .tab').forEach(x => x.classList.toggle('is-active', x === b)); task = b.dataset.task; drawRounds(); }));

  /* ---------- 03 scatter panels ---------- */
  function drawDT() {
    const { g, w, h } = fit(document.getElementById('dtCanvas')), lim = 0.8, f = frame(w, h, [24, 18, 52, 60], [-lim, lim], [-lim, lim]);
    axes(g, f, { xt: [-0.8, -0.4, 0, 0.4, 0.8], yt: [-0.8, -0.4, 0, 0.4, 0.8], xl: L('预言 ', 'predicted ') + 'T_{ij} − Q_{ij}', yl: L('实测 ', 'measured ') + 'T_{ij} − Q_{ij}' });
    line(g, [-lim, lim], [-lim, lim], f, C.faint, 1.2, [5, 4]);
    ['T2', 'T1'].forEach(t => PT.dT[t].forEach(p => dot(g, f.X(p[1]), f.Y(p[2]), 3.2, 'rgba(255,255,255,.85)', TC[t], 1.3)));
    legend('dtCanvas', [['dot', C.t1, 'T1'], ['dot', C.t2, 'T2']]);
  }
  function drawPhi() {
    const { g, w, h } = fit(document.getElementById('phiCanvas'));
    const all = ['T1', 'T2'].flatMap(t => [...PT.phi8[t].x, ...PT.phi8[t].y.map((y, i) => y + PT.phi8[t].hw[i]), ...PT.phi8[t].y.map((y, i) => y - PT.phi8[t].hw[i])]);
    const lo = Math.floor((Math.min(...all) - 0.05) * 10) / 10, hi = Math.ceil((Math.max(...all) + 0.05) * 10) / 10, f = frame(w, h, [24, 18, 52, 60], [lo, hi], [lo, hi]);
    axes(g, f, { xt: ticks(lo, hi, 0.2), yt: ticks(lo, hi, 0.2), xf: v => v.toFixed(1), yf: v => v.toFixed(1), xl: L('理论极限 ', 'theoretical limit ') + 'Φ_i', yl: L('实测 ', 'measured ') + 'β_{eff} φ_i' });
    line(g, [lo, hi], [lo, hi], f, C.faint, 1.2, [5, 4]);
    ['T2', 'T1'].forEach(t => { const d = PT.phi8[t]; points(g, d.x, d.y, f, TC[t], { lo: d.y.map((y, i) => y - d.hw[i]), hi: d.y.map((y, i) => y + d.hw[i]) }); });
    legend('phiCanvas', [['dot', C.t1, 'T1'], ['dot', C.t2, 'T2']]);
  }
  function drawRH(id, key, yl) {
    const { g, w, h } = fit(document.getElementById(id));
    const lohi = ['T1', 'T2'].flatMap(t => { const d = PT.RH[t]; return [...d.curve[key + 'lo'], ...d.curve[key + 'hi'], ...d[key].y]; });
    const xs = ['T1', 'T2'].flatMap(t => PT.RH[t].x.concat(PT.RH[t].curve.x));
    const x0 = Math.min(...xs) - 0.1, x1 = Math.max(...xs) + 0.1;
    let ylo = Math.min(...lohi), yhi = Math.max(...lohi); const pad = (yhi - ylo) * 0.06; ylo -= pad; yhi += pad;
    const f = frame(w, h, [24, 18, 52, 56], [x0, x1], [ylo, yhi]);
    axes(g, f, { xt: ticks(x0, x1, 0.5), yt: ticks(ylo, yhi, key === 'R' ? 0.2 : 0.3), yf: v => v.toFixed(1), xl: '−log β_{eff}', yl });
    ['T2', 'T1'].forEach(t => { const d = PT.RH[t]; band(g, d.curve.x, d.curve[key + 'lo'], d.curve[key + 'hi'], f, rgba(TC[t], .10)); });
    ['T2', 'T1'].forEach(t => { const d = PT.RH[t]; line(g, d.curve.x, d.curve[key], f, TC[t], 2.2); points(g, d.x, d[key].y, f, TC[t], { lo: d[key].y.map((y, i) => y - d[key].hw[i]), hi: d[key].y.map((y, i) => y + d[key].hw[i]) }); });
    if (id === 'rewCanvas') legend(id, [['dot', C.t1, 'T1'], ['dot', C.t2, 'T2']]);
  }

  /* ---------- 04 tests ---------- */
  const AX = PT.abl_x;
  function seriesChart(id, list, key, yl, o) {
    o = o || {};
    const { g, w, h } = fit(document.getElementById(id));
    const vals = list.flatMap(s => [...PT.abl[s[0]][key].lo, ...PT.abl[s[0]][key].hi]);
    const step = o.step || 0.1; let ylo = Math.floor((Math.min(...vals) - 0.02) / step) * step, yhi = Math.ceil((Math.max(...vals) + 0.02) / step) * step;
    const x0 = AX[0] - 0.15, x1 = AX[7] + 0.15, f = frame(w, h, [24, 18, 52, 56], [x0, x1], [ylo, yhi]);
    axes(g, f, { xt: ticks(1, 3, 0.5), yt: ticks(ylo, yhi, step * (yhi - ylo > 8 * step ? 2 : 1)), yf: v => v.toFixed(1), xl: '−log β_{nominal}', yl });
    list.forEach(([name, col]) => { const d = PT.abl[name][key]; line(g, AX, d.y, f, rgba(col, .55), 1.4); points(g, AX, d.y, f, col, { lo: d.lo, hi: d.hi, r: 3.3 }); });
    if (o.key) legend(id, list.map(([, col, lab]) => ['dot', col, lab]));
  }
  const ALPHA = [['direct_9B', C.t1, 'α = 0'], ['E5_0.25', '#b3aae0', '0.25'], ['E5_0.5', '#968ad6', '0.5'], ['E5_1', '#7162c8', '1'], ['E5_2', '#5546a6', '2'], ['E5_4', '#372a78', '4']];
  function drawAlpha() {
    seriesChart('alphaR', ALPHA, 'r', 'r', { key: true });
    seriesChart('alphaRew', ALPHA, 'reward', L('平均奖励 R', 'mean reward R'), { step: 0.2 });
  }
  const ABL = {
    infer: { list: () => [['direct_9B', C.t1, L('直接回答', 'direct')], ['thinking_9B', C.violet, L('思考模式', 'thinking')], ['direct_temperature_07', '#4b988d', 'τ = 0.7']],
      zh: '思考模式与低温采样都保留 $r$ 的上升。降温让选择更集中，却不提高 $r$：选择集中与势能结构是两种不同的性质。',
      en: 'Thinking mode and lower-temperature sampling both keep the rise of $r$. Lowering the temperature concentrates choices without raising $r$: concentration and potential structure are different things.' },
    model: { list: () => [['direct_9B', C.t1, 'Qwen3.5-9B'], ['direct_4B', '#4b988d', 'Qwen3.5-4B'], ['gemma4', C.violet, 'Gemma-4-E4B']],
      zh: '换成更小的 Qwen3.5-4B 和另一家族的 Gemma-4-E4B，同样的训练也让 $r$ 上升；Gemma 的区间较宽。',
      en: 'With the smaller Qwen3.5-4B and Gemma-4-E4B from another family, the same training also raises $r$; Gemma has wide intervals.' },
    prompt: { list: () => [['direct_9B', C.t1, L('训练用的提示', 'training prompt')], ['six_variant_mean', C.violet, L('六个新提示的平均', 'six new prompts, mean')]],
      zh: '六个训练中没见过的提示（改写、换选项编号、换应用场景），$r$ 同样上升，只是幅度小一些。',
      en: 'On six prompts never seen in training (rewording, relabelled options, new scenarios), $r$ also rises, by a smaller amount.' }
  };
  let ablKey = 'infer';
  const ablText = document.getElementById('ablText');
  function drawAbl() { const a = ABL[ablKey]; seriesChart('ablCanvas', a.list(), 'r', 'r', { key: true }); ablText.textContent = L(a.zh, a.en); tex(ablText); }
  document.querySelectorAll('#ablTabs .tab').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#ablTabs .tab').forEach(x => x.classList.toggle('is-active', x === b)); ablKey = b.dataset.abl; drawAbl(); }));

  const KLC = { 'kl_0.2': '#3b2a78', 'kl_0.3': '#5546a6', 'kl_0.5': '#7162c8', 'kl_0.7': '#968ad6', 'kl_1.5': '#b3aae0', 'kl_3': '#9aa6b2', 'kl_5': '#c3ccd5' };
  function drawKL() {
    let { g, w, h } = fit(document.getElementById('klR'));
    const br = PT.kl.branches, d1 = PT.tasks.T1, all = Object.values(br).flat();
    const x0 = Math.min(...all.map(p => p[0]), ...d1.fit.x) - 0.15, x1 = Math.max(...all.map(p => p[0]), ...d1.rounds.slice(1).map(r => r.x)) + 0.15;
    let f = frame(w, h, [24, 18, 52, 56], [x0, x1], [0.3, 0.85]);
    axes(g, f, { xt: ticks(x0, x1, 1), yt: ticks(0.3, 0.85, 0.1), yf: v => v.toFixed(1), xl: '−log β_{eff}', yl: 'r' });
    line(g, d1.fit.x, d1.fit.r, f, C.t1, 2.2);
    Object.entries(br).forEach(([k, pts]) => pts.forEach(p => dot(g, f.X(p[0]), f.Y(p[1]), 3.6, '#fff', KLC[k], 1.6)));
    const rs = d1.rounds.slice(1); rs.forEach(r => { g.save(); g.strokeStyle = C.t1; g.lineWidth = 1.6; g.strokeRect(f.X(r.x) - 3.5, f.Y(r.r) - 3.5, 7, 7); g.restore(); });
    legend('klR', [['sq', C.t1, L('主实验 β₀ = 0.375', 'main, β₀ = 0.375')]].concat(Object.keys(KLC).map(k => ['dot', KLC[k], 'β₀ = ' + k.slice(3)])));
    ({ g, w, h } = fit(document.getElementById('klC')));
    const lx = v => Math.log10(v);
    f = frame(w, h, [24, 18, 52, 56], [lx(0.15), lx(7)], [lx(0.5), lx(8)]);
    axes(g, f, { xt: [0.2, 0.5, 1, 2, 5].map(lx), yt: [0.5, 1, 2, 5].map(lx), xf: v => String(+Math.pow(10, v).toPrecision(2)), yf: v => String(+Math.pow(10, v).toPrecision(2)), xl: 'β_0', yl: 'c' });
    line(g, [lx(0.15), lx(7)], [0, 0], f, C.faint, 1.4, [5, 4]);
    PT.kl.c.forEach(([b, k, c, hw]) => {
      if (b === 'main') { if (hw) { g.save(); g.strokeStyle = C.t1; g.lineWidth = 1.2; g.beginPath(); g.moveTo(f.X(lx(k)), f.Y(lx(c - hw))); g.lineTo(f.X(lx(k)), f.Y(lx(c + hw))); g.stroke(); g.restore(); }
        g.save(); g.fillStyle = '#fff'; g.strokeStyle = C.t1; g.lineWidth = 1.6; g.fillRect(f.X(lx(k)) - 4, f.Y(lx(c)) - 4, 8, 8); g.strokeRect(f.X(lx(k)) - 4, f.Y(lx(c)) - 4, 8, 8); g.restore(); }
      else dot(g, f.X(lx(k)), f.Y(lx(c)), 4.2, '#fff', KLC[b], 1.8);
    });
    g.save(); g.fillStyle = C.muted; g.font = `11px ${MONO}`; g.textAlign = 'right'; g.fillText('c = 1', f.R - 6, f.Y(0) - 6); g.restore();
  }

  /* ---------- all ---------- */
  function drawAll() { drawRounds(); drawDT(); drawPhi(); drawRH('rewCanvas', 'R', L('平均奖励 R', 'mean reward R')); drawRH('entCanvas', 'H', L('状态熵 H', 'state entropy H')); drawAlpha(); drawAbl(); drawKL(); }
  let rz = 0; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(drawAll); });
  let saved = null; try { saved = localStorage.getItem('pt-lang'); } catch (e) { /* none */ }
  const q = new URLSearchParams(location.search).get('lang');
  tex(document.body);
  setLang(q || saved || 'zh');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
