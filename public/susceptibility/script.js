/* Information Susceptibility — language switch, navigation and canvas charts.
   All plotted numbers come from window.SUS_DATA (assets/data/data.js). */
(function () {
  "use strict";
  const D = window.SUS_DATA;
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const tok = (n) => css.getPropertyValue(n).trim();
  const C = {
    blue: tok("--blue-deep"), blueSoft: "#9fc6e6", deep: tok("--deep"), ink: tok("--ink"),
    gold: tok("--gold"), goldDeep: tok("--gold-deep"), muted: tok("--muted"),
    grid: "rgba(63,119,168,.12)", axis: "rgba(63,119,168,.35)", grey: "#9aaebc",
    green: tok("--green"), red: tok("--red"), violet: tok("--violet")
  };
  const MODELS = ["qwen-7b", "qwen-14b", "qwen-32b", "qwen-72b", "qwen3-max"];
  const MODEL_NAME = { "qwen-7b": "7B", "qwen-14b": "14B", "qwen-32b": "32B", "qwen-72b": "72B", "qwen3-max": "Qwen3-Max" };
  const PARAMS = [7, 14, 32, 72, 236];

  /* ---------- language ---------- */
  let lang = "zh";
  const L = (zh, en) => (lang === "en" ? en : zh);
  const charts = [];
  function setLang(next) {
    lang = next === "en" ? "en" : "zh";
    root.lang = lang === "en" ? "en" : "zh-CN";
    document.querySelectorAll("#languageMenu [data-locale]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.locale === lang)));
    try { localStorage.setItem("sus-lang", lang); } catch (e) { /* storage unavailable */ }
    refreshText();
    charts.forEach((c) => c.draw());
  }
  const langToggle = document.getElementById("languageToggle");
  const langMenu = document.getElementById("languageMenu");
  langToggle.addEventListener("click", () => {
    const open = langMenu.hidden;
    langMenu.hidden = !open;
    langToggle.setAttribute("aria-expanded", String(open));
  });
  langMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-locale]");
    if (!b) return;
    setLang(b.dataset.locale);
    langMenu.hidden = true;
    langToggle.setAttribute("aria-expanded", "false");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".language-select")) { langMenu.hidden = true; langToggle.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- nav ---------- */
  const nav = document.getElementById("site-nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  menuToggle.addEventListener("click", () => {
    const open = !navLinks.classList.contains("is-open");
    navLinks.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", (e) => {
    if (e.target.closest("a")) { navLinks.classList.remove("is-open"); menuToggle.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- helpers ---------- */
  function ols(x, y) {
    const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
    const b = sxy / sxx;
    return { slope: b, intercept: my - b * mx };
  }
  const binom = (p, n) => Math.sqrt(p * (1 - p) / n);
  const fmt = (v, d) => (Number.isFinite(v) ? v.toFixed(d) : "—");

  /* ---------- chart engine ---------- */
  function Chart(canvas, build) {
    this.canvas = canvas; this.build = build; this.ctx = canvas.getContext("2d");
    const ro = new ResizeObserver(() => this.draw());
    ro.observe(canvas);
    charts.push(this);
  }
  Chart.prototype.draw = function () {
    const cfg = this.build();
    const cv = this.canvas, ctx = this.ctx;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const small = w < 460 || cfg.compact;
    const pad = cfg.compact ? { l: 44, r: 16, t: 26, b: 40 } : { l: small ? 46 : 58, r: 14, t: 14, b: small ? 64 : 54 };
    if (cfg.legendRight) pad.r = 14;
    if (cfg.y.padLeft) pad.l = cfg.y.padLeft;
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const xt = cfg.x.transform || ((v) => v);
    const xs = cfg.x.ticks.map(xt);
    const xmin = cfg.x.min !== undefined ? xt(cfg.x.min) : Math.min(...xs), xmax = cfg.x.max !== undefined ? xt(cfg.x.max) : Math.max(...xs);
    const xr = (xmax - xmin) || 1, xpad = xr * 0.05;
    const X = (v) => pad.l + ((xt(v) - xmin + xpad) / (xr + 2 * xpad)) * pw;
    const ytf = cfg.y.transform || ((v) => v);
    const ymin = ytf(cfg.y.min), ymax = ytf(cfg.y.max);
    const Y = (v) => pad.t + (1 - (ytf(Math.max(v, cfg.y.min)) - ymin) / (ymax - ymin)) * ph;
    ctx.font = `${small ? 10.5 : 11.5}px "DM Mono", ui-monospace, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textBaseline = "middle";
    // grid + y ticks
    const yt = cfg.y.ticks;
    yt.forEach((v) => {
      const y = Y(v);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText(cfg.y.fmt ? cfg.y.fmt(v) : String(v), pad.l - 8, y);
    });
    // x ticks
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    cfg.x.ticks.forEach((v, i) => {
      const x = X(v);
      ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(x, pad.t + ph); ctx.lineTo(x, pad.t + ph + 4); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.fillText(cfg.x.labels ? cfg.x.labels[i] : String(v), x, pad.t + ph + 8);
    });
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    // axis titles
    ctx.fillStyle = C.deep; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(cfg.x.title, pad.l + pw / 2, h - 8);
    if (cfg.y.title) { ctx.save(); ctx.translate(3, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "top"; ctx.fillText(cfg.y.title, 0, 0); ctx.restore(); }
    if (cfg.title) { ctx.fillStyle = C.deep; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.font = `600 13px "DM Sans", "Noto Sans SC", sans-serif`; ctx.fillText(cfg.title, pad.l, 16); }
    if (cfg.note) { ctx.fillStyle = cfg.noteColor || C.muted; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.font = `11px "DM Mono", ui-monospace, monospace`; ctx.fillText(cfg.note, pad.l + pw, 16); }
    ctx.font = `${small ? 10.5 : 11.5}px "DM Mono", ui-monospace, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    // reference lines
    (cfg.hlines || []).forEach((hl) => {
      const y = Y(hl.y);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = hl.color || C.goldDeep; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke(); ctx.restore();
      if (hl.label) { ctx.fillStyle = hl.color || C.goldDeep; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(hl.label, pad.l + pw - 4, y - 4); }
    });
    // series
    ctx.save(); ctx.beginPath(); ctx.rect(pad.l - 6, pad.t - 6, pw + 12, ph + 12); ctx.clip();
    if (cfg.band) {
      // fill between two curves on a shared x grid, coloured by which one is ahead
      const a = cfg.band.a, b = cfg.band.b;
      for (let i = 0; i < a.length - 1; i++) {
        const d0 = a[i][1] - b[i][1], d1 = a[i + 1][1] - b[i + 1][1];
        const seg = (x0, ya0, yb0, x1, ya1, yb1, sign) => {
          ctx.fillStyle = sign > 0 ? "rgba(239,184,62,.30)" : "rgba(93,168,232,.20)";
          ctx.beginPath(); ctx.moveTo(x0, ya0); ctx.lineTo(x1, ya1); ctx.lineTo(x1, yb1); ctx.lineTo(x0, yb0); ctx.closePath(); ctx.fill();
        };
        const xa = X(a[i][0]), xb = X(a[i + 1][0]);
        if (d0 * d1 >= 0) seg(xa, Y(a[i][1]), Y(b[i][1]), xb, Y(a[i + 1][1]), Y(b[i + 1][1]), d0 + d1);
        else {
          const f = d0 / (d0 - d1), xc = xa + (xb - xa) * f, yc = Y(a[i][1]) + (Y(a[i + 1][1]) - Y(a[i][1])) * f;
          seg(xa, Y(a[i][1]), Y(b[i][1]), xc, yc, yc, d0); seg(xc, yc, yc, xb, Y(a[i + 1][1]), Y(b[i + 1][1]), d1);
        }
      }
    }
    (cfg.confidenceBands || []).forEach((band) => {
      if (!band.points.length) return;
      ctx.save(); ctx.fillStyle = band.color; ctx.globalAlpha = band.alpha === undefined ? 0.12 : band.alpha;
      ctx.beginPath();
      band.points.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[2])) : ctx.moveTo(X(p[0]), Y(p[2]))));
      band.points.slice().reverse().forEach((p) => ctx.lineTo(X(p[0]), Y(p[1])));
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
    cfg.series.forEach((s) => {
      const pts = s.points.filter((p) => p && Number.isFinite(p[1]));
      ctx.globalAlpha = s.alpha === undefined ? 1 : s.alpha;
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      if (s.width !== 0) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke(); }
      ctx.setLineDash([]);
      if (s.err !== false) pts.forEach((p) => {
        if (!p[2]) return;
        const x = X(p[0]), lo = Y(p[1] - p[2]), hi = Y(p[1] + (p[3] === undefined ? p[2] : p[3]));
        ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, lo); ctx.lineTo(x, hi);
        ctx.moveTo(x - 3, lo); ctx.lineTo(x + 3, lo); ctx.moveTo(x - 3, hi); ctx.lineTo(x + 3, hi); ctx.stroke();
      });
      if (s.marker !== "none") pts.forEach((p) => {
        const x = X(p[0]), y = Y(p[1]), r = s.r || 4;
        ctx.beginPath();
        if (s.marker === "square") ctx.rect(x - r, y - r, 2 * r, 2 * r); else ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = s.color; ctx.stroke();
        ctx.fillStyle = s.color; ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = s.alpha === undefined ? 1 : s.alpha;
      });
      if (s.arrows) s.arrows.forEach((a) => {
        const x = X(a[0]), y = Y(a[1]), dir = a[2];
        ctx.beginPath(); ctx.moveTo(x - 9 * dir, y - 6); ctx.lineTo(x + 7 * dir, y); ctx.lineTo(x - 9 * dir, y + 6); ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = 1;
    });
    (cfg.points || []).forEach((p) => {
      const x = X(p.x), y = Y(p.y);
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = C.deep;
      ctx.fillStyle = p.filled ? C.deep : "#fff"; ctx.fill(); ctx.stroke();
    });
    ctx.restore();
    // legend
    if (cfg.legend) {
      ctx.font = `${small ? 10.5 : 11.5}px "DM Mono", ui-monospace, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textBaseline = "middle"; ctx.textAlign = "left";
      let lx = pad.l + 10, ly = pad.t + 10;
      const items = cfg.series.filter((s) => s.legend);
      items.forEach((s) => {
        const tw = ctx.measureText(s.legend).width + 34;
        if (lx + tw > pad.l + pw) { lx = pad.l + 10; ly += 18; }
        ctx.globalAlpha = s.alpha === undefined ? 1 : Math.max(s.alpha, .6);
        ctx.strokeStyle = s.color; ctx.lineWidth = 3; ctx.setLineDash(s.dash || []);
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 20, ly); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 1; ctx.fillStyle = C.deep; ctx.fillText(s.legend, lx + 26, ly);
        lx += tw + 8;
      });
    }
  };

  const log2 = (v) => Math.log2(v), log10 = (v) => Math.log10(v);
  const toPts = (xs, arr) => arr.map((r, i) => (r ? [xs[i], r[0], r[1]] : null));
  const avgModels = (dct, xs) => xs.map((x, i) => {
    const m = MODELS.reduce((s, k) => s + dct[k][i][0], 0) / MODELS.length;
    const se = Math.sqrt(MODELS.reduce((s, k) => s + dct[k][i][1] ** 2, 0)) / MODELS.length;
    return [x, m, se];
  });

  /* ---------- 03 evidence: lead and deficit ---------- */
  const T = D.tetris, R = D.ranking, AK = D.aime_k;
  const evCfg = (o) => () => ({ x: o.x(), y: o.y(), legend: true, band: { a: o.llm, b: o.base },
    series: [{ points: o.base, color: C.blue, width: 2.4, r: 3.6, legend: o.baseName() }, { points: o.llm, color: C.goldDeep, width: 2.4, marker: "square", r: 3.4, legend: o.llmName() }] });
  new Chart(document.getElementById("evRank"), evCfg({
    x: () => ({ ticks: R.B, transform: log2, title: L("信噪比 ℬ", "signal-to-noise ℬ") }),
    y: () => ({ min: 0.4, max: 1.02, ticks: [0.4, 0.6, 0.8, 1.0], fmt: (v) => v.toFixed(1), title: L("正确率 J", "accuracy J") }),
    base: toPts(R.B, R.dfs), llm: avgModels(R.llm, R.B), baseName: () => L("带噪算法", "noisy algorithm"), llmName: () => "LLM"
  }));
  new Chart(document.getElementById("evAime"), evCfg({
    x: () => ({ ticks: [1, 5, 9, 15, 21], min: 1, max: 21, title: L("样本数 k", "samples k") }),
    y: () => ({ min: 0.08, max: 0.21, ticks: [0.1, 0.15, 0.2], fmt: (v) => v.toFixed(2), title: L("正确率 J", "accuracy J") }),
    base: AK.map((r) => [r[0], r[1]]), llm: AK.map((r) => [r[0], r[3]]), baseName: () => L("多数投票", "majority vote"), llmName: () => L("LLM 选择器", "LLM selector")
  }));
  new Chart(document.getElementById("evTetris"), evCfg({
    x: () => ({ ticks: T.B, transform: log2, title: L("束宽 ℬ", "beam width ℬ") }),
    y: () => ({ min: 0, max: 12, ticks: [0, 4, 8, 12], title: L("消除行数 J", "lines cleared J") }),
    base: toPts(T.B, T.dfs), llm: avgModels(T.llm, T.B), baseName: () => L("束搜索", "beam search"), llmName: () => "LLM"
  }));

  /* ---------- forest plots ---------- */
  function Forest(canvas, build) {
    this.canvas = canvas; this.build = build; this.ctx = canvas.getContext("2d");
    new ResizeObserver(() => this.draw()).observe(canvas); charts.push(this);
  }
  Forest.prototype.draw = function () {
    const f = this.build(), cv = this.canvas, ctx = this.ctx, w = cv.clientWidth;
    if (!w || !cv.clientHeight) return;
    const rowH = 22, h = f.rows.length * rowH + 64;
    cv.style.height = h + "px";
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const lw = Math.min(w * 0.38, 210), pad = { l: lw, r: 16, t: 10, b: 46 }, pw = w - pad.l - pad.r;
    const X = (v) => pad.l + (Math.min(Math.max(v, f.min), f.max) - f.min) / (f.max - f.min) * pw;
    const Yr = (i) => pad.t + i * rowH + rowH / 2;
    ctx.font = `11px "DM Mono", ui-monospace, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
    f.ticks.forEach((t) => {
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(t), pad.t); ctx.lineTo(X(t), h - pad.b); ctx.stroke();
      ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(String(t), X(t), h - pad.b + 6);
    });
    ctx.fillStyle = C.deep; ctx.fillText(w < 600 && f.shortTitle ? f.shortTitle : f.title, pad.l + pw / 2, h - pad.b + 24);
    f.refs.forEach((r) => { ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = r.color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(r.x), pad.t - 4); ctx.lineTo(X(r.x), h - pad.b); ctx.stroke(); ctx.restore(); });
    f.rows.forEach((r, i) => {
      const y = Yr(i);
      if (r.header) {
        ctx.fillStyle = C.blue; ctx.font = `600 11px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(r.header, 4, y + 2); return;
      }
      ctx.font = `12px "DM Sans", "Noto Sans SC", sans-serif`; ctx.fillStyle = C.deep; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(r.label, 16, y);
      const lo = r.v - 1.96 * r.se, hi = r.v + 1.96 * r.se;
      ctx.strokeStyle = r.color; ctx.lineWidth = r.strong ? 2.6 : 1.8; ctx.beginPath(); ctx.moveTo(X(lo), y); ctx.lineTo(X(hi), y); ctx.stroke();
      if (hi > f.max) { ctx.beginPath(); ctx.moveTo(X(f.max) - 6, y - 4); ctx.lineTo(X(f.max), y); ctx.lineTo(X(f.max) - 6, y + 4); ctx.stroke(); }
      if (lo < f.min) { ctx.beginPath(); ctx.moveTo(X(f.min) + 6, y - 4); ctx.lineTo(X(f.min), y); ctx.lineTo(X(f.min) + 6, y + 4); ctx.stroke(); }
      ctx.beginPath();
      if (r.diamond) { const x = X(r.v); ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y); ctx.closePath(); }
      else ctx.arc(X(r.v), y, r.strong ? 5 : 4.2, 0, Math.PI * 2);
      ctx.fillStyle = r.filled ? r.color : "#fff"; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = r.color; ctx.stroke();
    });
  };
  const F = D.forest;
  const GROUP = { tetris: ["Tetris", "Tetris"], ranking: ["排序", "Ranking"], aime: ["AIME", "AIME"] };
  const KIND = { model: ["模型", "models"], prompt: ["提示词", "prompts"], reward: ["奖励函数", "rewards"], fixed: ["固定选择器", "fixed selector"], nested: ["嵌套", "nested"] };
  const fixedRows = F.filter((r) => r[2] !== "nested");
  const sigBelow = fixedRows.filter((r) => r[3] + 1.96 * r[4] < 1).length, sigAbove = fixedRows.filter((r) => r[3] - 1.96 * r[4] > 1).length;
  const nestedRow = F.find((r) => r[2] === "nested");
  const F_FIXED = F.filter((r) => r[2] !== "nested");
  new Forest(document.getElementById("forestChart"), () => {
    const rows = []; let last = "";
    F_FIXED.forEach((r) => {
      const key = r[0] + "/" + (r[2] === "prompt" || r[2] === "reward" ? "pr" : r[2]);
      if (key !== last) {
        const kind = r[2] === "prompt" || r[2] === "reward" ? L("提示词 · 奖励函数", "prompts · rewards") : L(KIND[r[2]][0], KIND[r[2]][1]);
        rows.push({ header: `${L(GROUP[r[0]][0], GROUP[r[0]][1])} · ${kind}` }); last = key;
      }
      const nested = r[2] === "nested", below = r[3] + 1.96 * r[4] < 1;
      rows.push({ label: nested ? L("生成器 = 选择器", "generator = selector") : r[1].replace("cot", "CoT"), v: r[3], se: r[4],
        color: C.goldDeep, filled: nested || below, strong: nested, diamond: nested });
    });
    // Limits follow point estimates; out-of-range intervals keep their arrowheads.
    const estimates = rows.filter((r) => Number.isFinite(r.v)).map((r) => r.v);
    const lo = Math.min(0, ...estimates), hi = Math.max(1, ...estimates), margin = (hi - lo) * 0.06;
    const min = Math.floor((lo - margin) * 10) / 10, max = Math.ceil((hi + margin) * 10) / 10;
    const ticks = Array.from({ length: Math.floor(max / 0.25) - Math.ceil(min / 0.25) + 1 }, (_, k) => (Math.ceil(min / 0.25) + k) * 0.25);
    return { rows, min, max, ticks, shortTitle: L("传递系数 α", "transfer coefficient α"), title: L("传递系数 α（LLM 斜率 ÷ 固定策略斜率）", "transfer coefficient α (LLM slope ÷ fixed-strategy slope)"),
      refs: [{ x: 1, color: C.blue }, { x: 0, color: "#c3d2df" }] };
  });
  function forestMetrics() {
    document.getElementById("fBelow").textContent = `${sigBelow} / ${fixedRows.length}`;
    document.getElementById("fAbove").textContent = `${sigAbove} / ${fixedRows.length}`;
  }

  /* ---------- 05 nested versus fixed ---------- */
  const A = D.aime;
  new Chart(document.getElementById("nestedChart"), () => ({
    x: { ticks: PARAMS, transform: log10, labels: ["7B", "14B", "32B", "72B", "Max"], title: L("模型规模", "model size") },
    y: { min: 0, max: 0.25, ticks: [0, .05, .1, .15, .2, .25], fmt: (v) => v.toFixed(2), title: L("正确率 J", "accuracy J") },
    legend: true,
    series: [
      ...MODELS.map((m, i) => ({ points: A.fixed[m].map((p, j) => [PARAMS[j], p]), color: "rgba(224,165,38,.38)", width: 1.6, marker: "none", err: false, legend: i === 0 ? L("固定选择器 ×5", "fixed selector ×5") : undefined })),
      { points: A.mv_big.map((p, i) => [PARAMS[i], p]), color: C.blue, width: 2, dash: [6, 5], marker: "none", err: false, legend: L("多数投票", "majority vote") },
      { points: A.nested.map((p, i) => [PARAMS[i], p, binom(p, A.n_mv)]), color: C.goldDeep, width: 3, marker: "square", r: 4.5, legend: L("嵌套", "nested") }
    ]
  }));
  function nestedReadout() {}


  /* ---------- 04 application: DMRG — measured scores at every turn, as bars ---------- */
  const PT = D.m1.perTurn, M1_MODELS = Object.keys(PT).filter((m) => m !== "glm-5.2" && m !== "qwen3.7-max"), TOOLS = [1, 2, 4, 6, 9];
  let m1Model = M1_MODELS.includes("deepseek-v4-pro") ? "deepseek-v4-pro" : M1_MODELS[0], m1Turn = 1;
  const at = (arr, turn) => { const k = Math.max(0, Math.min(arr.length - 1, turn - 1)), a = Math.floor(k), f = k - a; return a + 1 < arr.length ? arr[a] * (1 - f) + arr[a + 1] * f : arr[a]; };
  const barVals = () => TOOLS.map((t) => at(PT[m1Model]["tools_" + t], m1Turn));
  const yTop = () => Math.max(0.5, Math.ceil(Math.max(...TOOLS.flatMap((t) => PT[m1Model]["tools_" + t])) * 10 + 0.3) / 10);
  function Bars(canvas, build) { this.canvas = canvas; this.build = build; this.ctx = canvas.getContext("2d"); new ResizeObserver(() => this.draw()).observe(canvas); charts.push(this); }
  Bars.prototype.draw = function () {
    const b = this.build(), cv = this.canvas, ctx = this.ctx, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const pad = { l: 44, r: 12, t: 24, b: 42 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b, n = b.vals.length, bw = pw / n;
    const Y = (v) => pad.t + (1 - v / b.max) * ph;
    ctx.font = `11px "DM Mono", ui-monospace, monospace`;
    b.ticks.forEach((t) => { ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, Y(t)); ctx.lineTo(pad.l + pw, Y(t)); ctx.stroke(); ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(t.toFixed(1), pad.l - 6, Y(t)); });
    b.vals.forEach((v, i) => {
      const x = pad.l + bw * i + bw * 0.22, ww = bw * 0.56;
      ctx.fillStyle = "#e9b64a"; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, Y(v), ww, Y(0) - Y(v), [7, 7, 0, 0]); else ctx.rect(x, Y(v), ww, Y(0) - Y(v)); ctx.fill();
      ctx.fillStyle = C.deep; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.font = `600 12px "DM Mono", ui-monospace, monospace`; ctx.fillText(v.toFixed(2), x + ww / 2, Y(v) - 6);
      ctx.fillStyle = C.muted; ctx.textBaseline = "top"; ctx.font = `12px "DM Mono", ui-monospace, monospace`; ctx.fillText(String(TOOLS[i]), x + ww / 2, pad.t + ph + 7);
    });
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    const mx = Math.max(...b.vals);
    ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = C.deep; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pad.l, Y(mx)); ctx.lineTo(pad.l + pw, Y(mx)); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.deep; ctx.font = `11px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(L("当前最高", "current best"), pad.l + 4, Y(mx) - 3);
    ctx.fillStyle = C.deep; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(L("可用工具数 t", "tools available t"), pad.l + pw / 2, h - 6);
  };
  const m1Bars = new Bars(document.getElementById("m1Bars"), () => { const top = yTop(); return { vals: barVals(), max: top, ticks: Array.from({ length: Math.round(top * 10) + 1 }, (_, k) => k / 10).filter((_, k) => k % 2 === 0) }; });
  // Original fitted terrain, restored without changing the measured per-turn bars.
  const surfaceTop = () => Math.max(0.5, Math.ceil(Math.max(...D.m1.perModel[m1Model].surface.z.flat()) * 10 + 0.3) / 10);
  const RAMP = [[247, 251, 255], [214, 234, 250], [150, 199, 238], [77, 150, 210], [35, 94, 150], [18, 52, 92]];
  const ramp = (u) => {
    const t = Math.min(Math.max(u, 0), 1) * (RAMP.length - 1), k = Math.min(Math.floor(t), RAMP.length - 2), f = t - k;
    return `rgb(${RAMP[k].map((c, n) => Math.round(c + (RAMP[k + 1][n] - c) * f)).join(",")})`;
  };
  const surfOf = () => {
    const s = D.m1.perModel[m1Model].surface, flat = s.z.flat();
    const frontier = s.z.map((row) => s.tool[row.indexOf(Math.max(...row))]);
    return { T: s.tool, I: s.it, z: s.z, zMin: Math.min(...flat), zMax: Math.max(...flat), frontier };
  };
  function SurfaceChart(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); new ResizeObserver(() => this.draw()).observe(canvas); charts.push(this); }
  SurfaceChart.prototype.draw = function () {
    const cv = this.canvas, ctx = this.ctx, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const S = surfOf(), T = S.T, I = S.I, nt = T.length, ni = I.length;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const pad = { l: 46, r: 12, t: 12, b: 44 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const X = (t) => pad.l + (t - T[0]) / (T[nt - 1] - T[0]) * pw, Y = (i) => pad.t + (1 - (i - I[0]) / (I[ni - 1] - I[0])) * ph;
    const U = (z) => z / surfaceTop();
    for (let a = 0; a < ni; a++) for (let b = 0; b < nt; b++) {
      const x0 = X(b ? (T[b - 1] + T[b]) / 2 : T[0]), x1 = X(b < nt - 1 ? (T[b] + T[b + 1]) / 2 : T[nt - 1]);
      const y0 = Y(a < ni - 1 ? (I[a] + I[a + 1]) / 2 : I[ni - 1]), y1 = Y(a ? (I[a - 1] + I[a]) / 2 : I[0]);
      ctx.fillStyle = ramp(U(S.z[a][b])); ctx.fillRect(x0, y0, x1 - x0 + 0.7, y1 - y0 + 0.7);
    }
    // contours at quarter levels of this model's range (marching squares)
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,.5)";
    [0.25, 0.5, 0.75, 0.9].map((q) => S.zMin + q * (S.zMax - S.zMin)).forEach((lv) => {
      ctx.beginPath();
      for (let a = 0; a < ni - 1; a++) for (let b = 0; b < nt - 1; b++) {
        const c = [[a, b], [a, b + 1], [a + 1, b + 1], [a + 1, b]], v = c.map(([p, q]) => S.z[p][q]), pts = [];
        for (let e = 0; e < 4; e++) {
          const [p1, q1] = c[e], [p2, q2] = c[(e + 1) % 4], v1 = v[e], v2 = v[(e + 1) % 4];
          if ((v1 - lv) * (v2 - lv) < 0) { const f = (lv - v1) / (v2 - v1); pts.push([X(T[q1] + (T[q2] - T[q1]) * f), Y(I[p1] + (I[p2] - I[p1]) * f)]); }
        }
        if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); if (pts.length === 4) { ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); } }
      }
      ctx.stroke();
    });
    // frontier from turn 5 (below it the surface is nearly flat in t and the argmax is noise)
    const fr = S.frontier.map((t, k) => [t, I[k]]).filter((p) => p[1] >= 5);
    ctx.save(); ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(16,41,68,.55)"; ctx.lineWidth = 5; ctx.beginPath(); fr.forEach(([t, i], k) => (k ? ctx.lineTo(X(t), Y(i)) : ctx.moveTo(X(t), Y(i)))); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.6; ctx.beginPath(); fr.forEach(([t, i], k) => (k ? ctx.lineTo(X(t), Y(i)) : ctx.moveTo(X(t), Y(i)))); ctx.stroke(); ctx.restore();
    // the turn currently shown in the bar chart
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.goldDeep; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pad.l, Y(m1Turn)); ctx.lineTo(pad.l + pw, Y(m1Turn)); ctx.stroke(); ctx.restore();
    ctx.fillStyle = C.goldDeep; ctx.font = `600 11px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`; ctx.textAlign = "right"; ctx.textBaseline = m1Turn > 55 ? "top" : "bottom";
    ctx.fillText(L(`当前第 ${Math.round(m1Turn)} 轮`, `current turn ${Math.round(m1Turn)}`), pad.l + pw - 4, Y(m1Turn) + (m1Turn > 55 ? 5 : -3));
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, pw, ph);
    ctx.font = `11px "DM Mono", ui-monospace, monospace`; ctx.fillStyle = C.muted;
    ctx.textAlign = "center"; ctx.textBaseline = "top"; TOOLS.forEach((t) => ctx.fillText(String(t), X(t), pad.t + ph + 6));
    ctx.textAlign = "right"; ctx.textBaseline = "middle"; [1, 20, 40, 60].forEach((i) => ctx.fillText(String(i), pad.l - 6, Y(i)));
    ctx.fillStyle = C.deep; ctx.font = `11.5px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(L("可用工具数 t", "tools available t"), pad.l + pw / 2, h - 6);
    ctx.save(); ctx.translate(13, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "top"; ctx.fillText(L("轮次 i", "turn i"), 0, 0); ctx.restore();
    document.getElementById("m1Scale").textContent = `0 – ${fmt(surfaceTop(), 1)}`;
  };
  const m1Surf = new SurfaceChart(document.getElementById("m1Surface"));
  const range = document.getElementById("m1TurnRange"), out = document.getElementById("m1TurnOut"), playBtn = document.getElementById("m1Play"), resetBtn = document.getElementById("m1Reset");
  let playing = false, lastT = 0;
  const label = () => { playBtn.textContent = playing ? L("暂停", "Pause") : L("播放 ↗︎", "Play ↗︎"); };
  const setTurn = (t) => { m1Turn = t; range.value = String(t); out.textContent = `${Math.round(t)} / 60`; m1Bars.draw(); m1Surf.draw(); };
  const setPlaying = (p) => { playing = p; label(); if (p) { lastT = 0; requestAnimationFrame(tick); } };
  function tick(now) {
    if (!playing) return;
    if (!lastT) lastT = now;
    const dt = Math.min((now - lastT) / 1000, 0.1); lastT = now;
    const t = Math.min(60, m1Turn + dt * 7.5);     // about eight seconds from turn 1 to turn 60
    setTurn(t);
    if (t >= 60) { setPlaying(false); return; }
    requestAnimationFrame(tick);
  }
  const reduceM1 = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  range.addEventListener("input", () => { setPlaying(false); setTurn(parseFloat(range.value)); });
  playBtn.addEventListener("click", () => { if (reduceM1) { setTurn(60); return; } if (playing) { setPlaying(false); return; } if (m1Turn >= 60) setTurn(1); setPlaying(true); });
  resetBtn.addEventListener("click", () => { setPlaying(false); setTurn(1); });
  function m1Controls() {
    const mc = document.getElementById("m1ModelChips"); mc.innerHTML = "";
    M1_MODELS.forEach((m) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip" + (m === m1Model ? " is-active" : ""); b.textContent = m; b.setAttribute("aria-pressed", String(m === m1Model)); b.addEventListener("click", () => { m1Model = m; m1Controls(); setTurn(m1Turn); }); mc.appendChild(b); });
    range.value = String(m1Turn); out.textContent = `${Math.round(m1Turn)} / 60`; label();
  }
  function m1Read() {}

  /* ---------- 04 application: optimizer benchmark (dumbbell, log axis) ---------- */
  const O = D.optimizer;
  const ART = { spatial_2010: "spatial 2010", spatial_2022: "spatial 2022", walk_revival_2015: "walk revival 2015", percolation_walk_2012: "percolation 2012", photonic_povm_2015: "photonic POVM 2015" };
  function MultBars(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); new ResizeObserver(() => this.draw()).observe(canvas); charts.push(this); }
  MultBars.prototype.draw = function () {
    const cv = this.canvas, ctx = this.ctx, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const narrow = w < 560, pad = { l: narrow ? 108 : 150, r: narrow ? 92 : 130, t: 30, b: 30 }, pw = w - pad.l - pad.r;
    const perM = (d, p) => d[p].good / d[p].tokens * 1e6;
    const rows = [...O.articles.map((a) => ({ name: ART[a] || a, d: O.rows[a] })), { name: L("合并", "pooled"), d: O.pooled, pooled: true }];
    const rowH = (h - pad.t - pad.b) / rows.length, XM = 2.4, X = (v) => pad.l + v / XM * pw;
    ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.blue; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(1), pad.t - 12); ctx.lineTo(X(1), h - pad.b + 4); ctx.stroke(); ctx.restore();
    ctx.font = `11px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`; ctx.fillStyle = C.blue; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(L("随机分配 ×1", "random ×1"), X(1), pad.t - 14);
    ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText(L("题 / 百万 token", "good / M tokens"), w - 4, pad.t - 14);
    [0, 1, 2].forEach((t) => { ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText("×" + t, X(t), h - pad.b + 8); });
    rows.forEach((r, i) => {
      const y = pad.t + rowH * (i + 0.5), a = perM(r.d, "random"), b = perM(r.d, "cold"), m = b / a, bh = Math.min(22, rowH * 0.56);
      if (r.pooled) { ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(8, y - rowH / 2); ctx.lineTo(w - 4, y - rowH / 2); ctx.stroke(); }
      ctx.fillStyle = "#e9b64a"; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(X(0), y - bh / 2, X(m) - X(0), bh, 6); else ctx.rect(X(0), y - bh / 2, X(m) - X(0), bh);
      ctx.fill();
      ctx.font = `${r.pooled ? 600 : 400} 12.5px "DM Sans", "Noto Sans SC", sans-serif`; ctx.fillStyle = C.deep; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(r.name, 8, y);
      ctx.font = `600 12.5px "DM Mono", ui-monospace, monospace`; ctx.fillStyle = C.deep; ctx.fillText("×" + m.toFixed(2), X(m) + 8, y);
      ctx.font = `11.5px "DM Mono", ui-monospace, monospace`; ctx.fillStyle = C.muted; ctx.textAlign = "right";
      ctx.fillText(`${a.toFixed(a < 0.1 ? 3 : 2)} → ${b.toFixed(b < 0.1 ? 3 : 2)}`, w - 4, y);
    });
  };
  new MultBars(document.getElementById("optChart"));
  function optMetrics() {
    if (!document.getElementById("oGood")) return;
    const P = O.pooled, g = (p) => P[p].good / P[p].tokens * 1e6, rate = (p) => P[p].good / (P[p].tasks * O.trajectories_per_task);
    document.getElementById("oGood").textContent = `${fmt(g("random"), 2)} → ${fmt(g("cold"), 2)} (+${fmt((g("cold") / g("random") - 1) * 100, 0)}%)`;
    document.getElementById("oTask").textContent = `${Math.round(rate("random") * 100)}% → ${Math.round(rate("cold") * 100)}%`;
  }


  /* ---------- 05 PHYBench: median-normalized chain length and accuracy ---------- */
  const P = D.phybench;
  P.forEach((model, index) => {
    const bins = model.bins.map(([x, p, se]) => {
      const logError = se / p;
      return [x, p, p * (1 - Math.exp(-logError)), p * (Math.exp(logError) - 1)];
    });
    const x0 = bins[0][0], x1 = bins[bins.length - 1][0];
    const fit = Array.from({ length: 200 }, (_, k) => {
      const x = x0 + (x1 - x0) * k / 199;
      return [x, Math.exp(model.c - model.d * x)];
    });
    const cov = model.fit_cov;
    const band = fit.map(([x, p]) => {
      const sigma = Math.sqrt(Math.max(0, x * x * cov[0][0] - 2 * x * cov[0][1] + cov[1][1]));
      return [x, p * Math.exp(-sigma), p * Math.exp(sigma)];
    });
    new Chart(document.getElementById("phyCurve" + index), () => ({
      x: { min: 0.5, max: 1.8, ticks: [0.5, 1, 1.5], title: L("归一化链长 L / median(L)", "normalized length L / median(L)") },
      y: { min: 0.01, max: 0.32, ticks: [0.01, 0.02, 0.05, 0.1, 0.2], transform: log10, padLeft: 58, title: L("正确率", "accuracy") },
      confidenceBands: [{ points: band, color: C.blue, alpha: 0.13 }],
      series: [
        { points: fit, color: C.blue, width: 2.4, marker: "none", err: false },
        { points: bins.slice(0, 1), color: C.blue, width: 0, alpha: 0.35, r: 4 },
        { points: bins.slice(1), color: C.blue, width: 0, r: 4 }
      ]
    }));
  });
  function phyReadout() {}


  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => charts.forEach((c) => c.draw()));



  /* ---------- 05 self-evolution: cobweb iteration b -> p(b) -> l^{-1}(p(b)) ---------- */
  const CASES = {
    evolve:   { p: (b) => 0.12 + 0.92 * b, l: (b) => 0.34 + 0.48 * b, b0: 0.58, col: C.goldDeep },
    collapse: { p: (b) => 0.12 + 0.92 * b, l: (b) => 0.34 + 0.48 * b, b0: 0.42, col: "#8a9bad" },
    converge: { p: (b) => 0.42 + 0.36 * b, l: (b) => 0.12 + 0.96 * b, b0: 0.08, col: C.blue }
  };
  let cwCase = "evolve", cwProg = 0, cwRun = false, cwLast = 0;
  const cwSteps = () => {
    const c = CASES[cwCase], inv = (q) => { let lo = -1, hi = 2; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (c.l(m) < q) lo = m; else hi = m; } return lo; };
    const pts = [[c.b0, 0]]; let b = c.b0;
    for (let n = 0; n < 9; n++) {
      const q = c.p(b); pts.push([b, q]);                 // generate: up to p(b)
      const nb = inv(q); pts.push([nb, q]);               // train: across to l(b') = q
      b = nb; if (b < -0.02 || b > 1.02 || q > 1.08 || q < 0) break;
    }
    return pts;
  };
  function Cobweb(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); new ResizeObserver(() => this.draw()).observe(canvas); charts.push(this); }
  Cobweb.prototype.draw = function () {
    const cv = this.canvas, ctx = this.ctx, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const c = CASES[cwCase], pad = { l: 44, r: 16, t: 14, b: 40 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const X = (b) => pad.l + b * pw, Y = (q) => pad.t + (1 - q / 1.08) * ph;
    ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
    const curve = (f, col, wd) => { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); for (let k = 0; k <= 100; k++) { const b = k / 100; k ? ctx.lineTo(X(b), Y(f(b))) : ctx.moveTo(X(b), Y(f(b))); } ctx.stroke(); };
    curve(c.p, C.goldDeep, 3); curve(c.l, C.deep, 3);
    // fixed point b*
    let lo = 0, hi = 1; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if ((c.p(m) - c.l(m)) * (c.p(0) - c.l(0)) > 0) lo = m; else hi = m; }
    const bs = lo; ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(bs), Y(c.l(bs))); ctx.lineTo(X(bs), Y(0)); ctx.stroke(); ctx.restore();
    // staircase up to the current progress
    const pts = cwSteps(), segs = pts.length - 1, upto = cwProg * segs;
    ctx.strokeStyle = c.col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    let head = pts[0];
    for (let s = 0; s < segs; s++) {
      const f = Math.max(0, Math.min(1, upto - s)); if (f <= 0) break;
      const a = pts[s], b = pts[s + 1], p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      ctx.lineTo(X(p[0]), Y(p[1])); head = p;
    }
    ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(X(head[0]), Y(Math.max(head[1], 0)), 6, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = c.col; ctx.stroke();
    ctx.beginPath(); ctx.arc(X(bs), Y(c.l(bs)), 6, 0, Math.PI * 2); ctx.fillStyle = cwCase === "converge" ? C.deep : "#fff"; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = C.deep; ctx.stroke();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
    ctx.font = `12px "DM Mono", ui-monospace, "Noto Sans SC", sans-serif`; ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("b*", X(bs), pad.t + ph + 6); ctx.fillStyle = C.deep; ctx.fillText(L("模型能力 b →", "capability b →"), pad.l + pw / 2, pad.t + ph + 22);
    ctx.save(); ctx.translate(14, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "top"; ctx.fillText(L("质量", "quality"), 0, 0); ctx.restore();
    ctx.font = `600 13px "DM Mono", ui-monospace, monospace`; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillStyle = C.goldDeep; ctx.fillText("p(b)", X(0.98), Y(c.p(0.98)) - 6); ctx.fillStyle = C.deep; ctx.fillText("l(b)", X(0.98), Y(c.l(0.98)) - 6);
  };
  const cobweb = new Cobweb(document.getElementById("cobweb"));
  const cwBtn = document.getElementById("cwPlay"), cwReset = document.getElementById("cwReset");
  const cwLabel = () => { cwBtn.textContent = cwRun ? L("暂停", "Pause") : L("播放 ↗︎", "Play ↗︎"); };
  const cwReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function cwTick(now) {
    if (!cwRun) return;
    if (!cwLast) cwLast = now;
    const segs = cwSteps().length - 1, dt = Math.min((now - cwLast) / 1000, 0.1); cwLast = now;
    cwProg = Math.min(1, cwProg + dt / (segs * 0.45));   // about 0.45 s per step
    cobweb.draw(); cwCount();
    if (cwProg >= 1) { cwRun = false; cwLabel(); return; }
    requestAnimationFrame(cwTick);
  }
  cwBtn.addEventListener("click", () => {
    if (cwReduce) { cwProg = 1; cobweb.draw(); return; }
    if (cwRun) { cwRun = false; cwLabel(); return; }
    if (cwProg >= 1) cwProg = 0;
    cwRun = true; cwLast = 0; cwLabel(); requestAnimationFrame(cwTick);
  });
  cwReset.addEventListener("click", () => { cwRun = false; cwProg = 0; cwLabel(); cobweb.draw(); cwCount(); });
  const CW_TEXT = {
    evolve: ["p 比 l 增长更快，起点在 b* 之上：每一轮生成的数据都好于模型自身，能力一路抬升。这是嵌套架构对应的情形。", "p rises faster than l and the start lies above b*: each round's data beats the model's own output, and capability keeps climbing. This is the nested case."],
    collapse: ["同样是 p 比 l 增长更快，起点却在 b* 之下：生成的数据不如模型自身，训练反而拉低能力，能力逐轮下降。", "p still rises faster than l, but the start lies below b*: the data are worse than the model's own output, so training drags capability down, round after round."],
    converge: ["l 比 p 增长更快：无论从哪里出发，阶梯都收拢到 b*。改进有界，这是固定架构对应的情形。", "l rises faster than p: from any start the staircase closes in on b*. Improvement is bounded; this is the fixed case."]
  };
  function cwCount() { const segs = cwSteps().length - 1, n = Math.floor(cwProg * segs / 2 + 1e-6), N = Math.floor(segs / 2); const o = document.getElementById("cwOut"); if (o) o.textContent = `${n} / ${N}`; }
  function cwTextUpdate() { const t = CW_TEXT[cwCase]; document.getElementById("cwText").textContent = L(t[0], t[1]); cwCount(); }
  document.querySelectorAll("[data-cw]").forEach((b) => b.addEventListener("click", () => {
    cwCase = b.dataset.cw; cwRun = false; cwProg = 0;
    document.querySelectorAll("[data-cw]").forEach((t) => { t.classList.toggle("is-active", t === b); t.setAttribute("aria-selected", String(t === b)); });
    cwLabel(); cwTextUpdate(); cobweb.draw();
  }));

  /* ---------- text refresh ---------- */
  function refreshText() { forestMetrics(); nestedReadout(); m1Controls(); m1Read(); optMetrics(); phyReadout(); cwLabel(); cwTextUpdate(); }
  let saved = null;
  try { saved = localStorage.getItem("sus-lang"); } catch (e) { /* storage unavailable */ }
  setLang(saved || ((navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en"));
})();
