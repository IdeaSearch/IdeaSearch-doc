"""Rebuild the PHYBench median-normalized CoT bins (stdlib port of plot_median_control.py)."""
import json, sys, zipfile, re, math, statistics as st
import xml.etree.ElementTree as ET
D = sys.argv[1]; OUT = sys.argv[2]
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z = zipfile.ZipFile(D + '/master_data_new.xlsx')
ss = [''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
sheet = sorted(n for n in z.namelist() if n.startswith('xl/worksheets/sheet'))[0]
rows = []
for r in ET.fromstring(z.read(sheet)).iter('{%s}row' % NS['m']):
    cells = {}
    for c in r.findall('m:c', NS):
        col = re.match(r'[A-Z]+', c.get('r')).group(0); v = c.find('m:v', NS)
        if v is None: continue
        cells[col] = ss[int(v.text)] if c.get('t') == 's' else v.text
    rows.append((int(r.get('r')), cells))
hdr_row = [c for n, c in rows if n == 9][0]
hdr = {}
for k, v in hdr_row.items(): hdr.setdefault(v, k)  # pandas keeps the first of duplicate headers
MODELS = [('gpt-4.1-2025-04-14', 'GPT-4.1', 'gpt-4.1-2025-04-14', False), ('gpt-4o', 'GPT-4o', 'gpt-4o', False), ('o4-mini', 'o4-mini', 'o4-mini', True),
          ('deepseek-reasoner', 'DeepSeek-R1', 'deepseek-reasoner', True), ('deepseek-chat', 'DeepSeek-V3', 'DeepSeek-V3', False), ('qwen-max', 'Qwen2.5-Max', 'Qwen2.5-max', False)]
def num(x):
    try: v = float(x); return None if math.isnan(v) else v
    except (TypeError, ValueError): return None
scores = {}
for n, c in rows:
    if n <= 9 or 'id' not in hdr or num(c.get(hdr['id'])) is None: continue
    pid = str(int(float(c[hdr['id']]))); scores[pid] = {}
    for api, disp, col, _ in MODELS:
        for k in (col, disp):
            if k in hdr and num(c.get(hdr[k])) is not None: scores[pid][api] = num(c[hdr[k]]); break
para = json.load(open(D + '/para_results.json'))
def pct(a, q):
    k = (len(a) - 1) * q / 100; f = math.floor(k); cc = min(f + 1, len(a) - 1); return a[f] + (a[cc] - a[f]) * (k - f)
toks = {}
for d in para:
    if not d.get('completion_tokens') or d['completion_tokens'] <= 100: continue
    pid, api = str(d['id']), d['model']
    if pid in scores and api in scores[pid] and scores[pid][api] >= 0: toks.setdefault((api, pid), []).append(d['completion_tokens'])
med = {k: st.median(v) for k, v in toks.items() if len(v) >= 3}
out = []
for api, disp, col, reasoning in MODELS:
    pts = []
    for d in para:
        if d['model'] != api or not d.get('completion_tokens') or d['completion_tokens'] <= 100: continue
        pid = str(d['id'])
        if pid not in scores or api not in scores[pid] or scores[pid][api] < 0: continue
        if med.get((api, pid), 0) > 0: pts.append((d['completion_tokens'] / med[(api, pid)], 1 if scores[pid][api] >= 70 else 0, pid))
    pts.sort(); xs = [p[0] for p in pts]
    edges = sorted(set(pct(xs, q) for q in [100 * i / 8 for i in range(9)]))
    bins = []
    for i in range(len(edges) - 1):
        last = i == len(edges) - 2
        sel = [p for p in pts if p[0] >= edges[i] and (p[0] <= edges[i + 1] if last else p[0] < edges[i + 1])]
        if len(sel) < 5: continue
        p = sum(s[1] for s in sel) / len(sel); ne = len(set(s[2] for s in sel))
        bins.append([sum(s[0] for s in sel) / len(sel), max(p, 1e-4), math.sqrt(p * (1 - p) / max(ne, 1))])
    f = bins[1:]; x = [b[0] for b in f]; y = [math.log(b[1]) for b in f]; w = [1 / (b[2] / b[1]) ** 2 if b[2] > 0 else 1 for b in f]
    W = sum(w); mx = sum(a * b for a, b in zip(w, x)) / W; my = sum(a * b for a, b in zip(w, y)) / W
    slope = sum(a * (b - mx) * (c - my) for a, b, c in zip(w, x, y)) / sum(a * (b - mx) ** 2 for a, b in zip(w, x))
    icpt = my - slope * mx; d = -slope
    pred = [icpt + slope * a for a in x]; ym = sum(y) / len(y)
    r = math.sqrt(max(1 - sum((a - b) ** 2 for a, b in zip(y, pred)) / sum((a - ym) ** 2 for a in y), 0))
    gm = int(st.median([d2['completion_tokens'] for d2 in para if d2['model'] == api and d2.get('completion_tokens') and d2['completion_tokens'] > 100]))
    out.append({'name': disp, 'reasoning': reasoning, 'median': gm, 'bins': [[round(a, 4), round(b, 5), round(c, 5)] for a, b, c in bins], 'L0': round(1 / d, 2), 'c': round(icpt, 4), 'd': round(d, 5), 'r': round(r, 2), 'n': len(pts)})
    print(disp, 'L0', round(1 / d, 2), 'r', round(r, 2), 'n', len(pts), 'median', gm)
json.dump(out, open(OUT, 'w'))
