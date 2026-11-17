"""Build assets/data/data.js for the site from the paper's analysis outputs (side_experiments/v12).
Usage: python3 build_data.py <v12 dir> ../assets/data/data.js   (needs numpy, scipy, matplotlib)
Everything drawn on the site comes from here; numbers match the paper (Figs. 2-5)."""
import sys, os, glob, json, re
import numpy as np
V = sys.argv[1]; OUT = sys.argv[2]
L10 = lambda x: np.log10(np.clip(x, 1e-12, None))
r3 = lambda a: [round(float(v), 3) for v in a]
NAMES = {'qwen1.5': 'Qwen2.5-1.5B', 'qwen7': 'Qwen2.5-7B', 'qwen14': 'Qwen2.5-14B', 'mistral7': 'Mistral-7B-v0.3',
         'falcon3': 'Falcon3-7B', 'granite': 'Granite-3.1-8B', 'qwen35_4b': 'Qwen3.5-4B', 'qwen35_9b': 'Qwen3.5-9B'}
def traj(f):
    Z = np.load(f); return r3(L10(np.median(Z['u'], 1))), r3(L10(np.median(Z['dC'], 1)))
D = {}
D['pstar'] = [0.03371, 2.06960]; D['win'] = r3([np.log10(0.3), np.log10(3), np.log10(30), np.log10(400)]); D['dmin'] = 1536; D['dmax'] = 5120
# trained models
D['trained'] = []
for m, nm in NAMES.items():
    x, y = traj(f'{V}/raw_reduced/trained__{m}__0.npz'); D['trained'].append(dict(id=m, name=nm, x=x, y=y))
# untrained: v12 groups (F family sigma 0.02 = native; G family sigma 0.02 = init; G sigma 1 = unit) and v13 sweep
D['untrained'] = []
for g, fam, sig in [('native', 'F', 0.02), ('init', 'G', 0.02), ('unit', 'G', 1.0)]:
    for f in sorted(glob.glob(f'{V}/raw_reduced/{g}__*.npz')):
        _, arch, seed = os.path.basename(f)[:-4].split('__'); x, y = traj(f)
        D['untrained'].append(dict(arch=NAMES.get(arch, arch), fam=fam, sigma=sig, seed=int(seed), x=x, y=y))
for f in sorted(glob.glob(f'{V}/raw_reduced/v13__*.npz')):
    _, arch, fs, seed = os.path.basename(f)[:-4].split('__'); fam = fs[0]; sig = float(fs[1:].replace('p', '.')); x, y = traj(f)
    D['untrained'].append(dict(arch=NAMES.get(arch, arch), fam=fam, sigma=sig, seed=int(seed), x=x, y=y))
# Pythia checkpoints
P = []
for f in glob.glob(f'{V}/raw_reduced/pythia__step*__0.npz'):
    st = int(re.search(r'step(\d+)', f).group(1)); x, y = traj(f)
    # late half (relative depth >= 1/2), as in the paper's Fig. 6: per-document medians over layers, then the median over documents
    Z = np.load(f); n = Z['dC'].shape[0]; k = int(np.ceil(0.5 * (n - 1) - 1e-9)); du = np.median(Z['u'][k:], 0); dd = np.median(Z['dC'][k:], 0)
    P.append(dict(step=st, x=x, y=y, lu=r3(L10(du)), ld=r3(L10(dd)), mu=round(float(L10(np.median(du))), 4), md=round(float(L10(np.median(dd))), 4)))
D['pythia'] = sorted(P, key=lambda r: r['step'])
# Fig. 2 (b)(c): u and d_C versus relative depth, 8 trained models on a common grid + median
grid = np.linspace(0, 1, 41); cur = {'u': [], 'dC': []}
for m in NAMES:
    Z = np.load(f'{V}/raw_reduced/trained__{m}__0.npz')
    for k in cur:
        y = L10(np.median(Z[k], 1)); cur[k].append(np.interp(grid, np.linspace(0, 1, len(y)), y))
D['depth'] = dict(grid=r3(grid), u=[r3(c) for c in cur['u']], dC=[r3(c) for c in cur['dC']], u_med=r3(np.median(cur['u'], 0)), dC_med=r3(np.median(cur['dC'], 0)))
# phase map: P(working) on the grid (downsampled 2x), and the smoothed 0.16 / 0.84 contours
Z = np.load(f'{V}/phase_band_final.npz'); gx, gy, Pw = Z['gx'], Z['gy'], Z['P']
from scipy.ndimage import gaussian_filter
m = np.isfinite(Pw); ws = gaussian_filter(m.astype(float), 1.5); Ps = gaussian_filter(np.where(m, Pw, 0.0), 1.5) / np.maximum(ws, 1e-9); Ps = np.where(ws > 0.5, Ps, np.nan)
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
cs = plt.contour(gx, gy, Ps, levels=[0.16, 0.84]); lines = []
for lev, segs in zip([0.16, 0.84], cs.allsegs):
    for s in segs:
        if len(s) > 8: lines.append(dict(level=lev, x=r3(s[::2, 0]), y=r3(s[::2, 1])))
sub = Pw[::2, ::2]; q = np.where(np.isfinite(sub), np.round(sub * 100), -1).astype(int)
D['phase'] = dict(x0=round(float(gx[0, 0]), 4), x1=round(float(gx[0, -1]), 4), y0=round(float(gy[0, 0]), 4), y1=round(float(gy[-1, 0]), 4),
                  nx=int(q.shape[1]), ny=int(q.shape[0]), P=q.flatten().tolist(), contours=lines)
# Fig. 4: force field and Peclet number per cell; linearization at P*
E = json.load(open(f'{V}/eta_stats.json')); J = json.load(open(f'{V}/fig4_J.json')); H = 0.1
D['force'] = {}
for g in ['untrained', 'trained']:
    cells = []
    for k, b in E[g]['bins'].items():
        ij = [int(v) for v in re.findall(r'int64\((-?\d+)\)', k)]; c = (np.array(ij) * H + H / 2)
        cells.append([round(float(c[0]), 3), round(float(c[1]), 3), round(float(b['F'][0]), 5), round(float(b['F'][1]), 5), round(float(b['ratio']), 3)])
    Jm = np.array(J[g]['J']); ev, Vv = np.linalg.eig(Jm); ev, Vv = ev.real, Vv.real
    D['force'][g] = dict(cells=cells, J=[r3(r) for r in Jm.tolist()], eig=r3(ev), vec=[r3(Vv[:, i] / np.linalg.norm(Vv[:, i])) for i in range(2)],
                         kind='saddle' if ev.min() < 0 < ev.max() else ('stable node' if ev.max() < 0 else 'unstable node'))
# Fig. 5: Pythia training; lever-rule fit with a checkpoint bootstrap (same as the paper)
SH = json.load(open(f'{V}/pythia_share.json')); CK = json.load(open(f'{V}/pythia_ck_fixedP.json'))['at_Ppy']; MB = json.load(open(f'{V}/pythia_bins.json'))['main']
RP = json.load(open(f'{V}/fig5_alpha_q.json'))
shm = {r['step']: r for r in SH}
ck = [r for r in CK if r['step'] > 0]; s = np.array([r['step'] for r in ck], float); a = np.array([r['gamma'] for r in ck]); ph = np.array([shm[int(v)]['share'] for v in s])
X = np.c_[ph, 1 - ph]; c0 = np.linalg.lstsq(X, a, rcond=None)[0]
rng = np.random.default_rng(0); iD, iW = np.where(s < 400)[0], np.where(s > 400)[0]
B = np.array([np.linalg.lstsq(X[i], a[i], rcond=None)[0] for i in (np.r_[rng.choice(iD, len(iD)), rng.choice(iW, len(iW))] for _ in range(2000))])
lo, hi = np.percentile(B @ X.T, [16, 84], axis=0)
D['training'] = dict(
    share=[dict(step=r['step'], v=round(r['share'], 4), lo=round(r['q'][0], 4), hi=round(r['q'][1], 4)) for r in SH],
    alpha=[dict(step=r['step'], v=round(r['gamma'], 4), lo=round(r['gamma_q'][0], 4), hi=round(r['gamma_q'][1], 4)) for r in CK],
    rate=[dict(steps=st['steps'], v=round(st['R'], 4), lo=round(st['R_q'][0], 4), hi=round(st['R_q'][1], 4)) for st in MB],
    lever=dict(aW=round(float(c0[0]), 4), aD=round(float(c0[1]), 4), steps=[int(v) for v in s], fit=r3(X @ c0), lo=r3(lo), hi=r3(hi)),
    groups={g: dict(alpha=round(RP[g]['gamma'], 4), alpha_q=r3(RP[g]['gamma_q']), rate=round(RP[g]['R'], 4), rate_q=[round(v, 4) for v in RP[g]['R_q']]) for g in ['untrained', 'trained']})
open(OUT, 'w').write('window.PD = ' + json.dumps(D, separators=(',', ':')) + ';\n')
print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB;', len(D['untrained']), 'untrained,', len(D['trained']), 'trained,', len(D['pythia']), 'pythia')
