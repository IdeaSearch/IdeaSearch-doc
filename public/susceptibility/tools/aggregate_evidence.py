"""Evidence layer for the page: AIME vs sample count (problem-clustered SE), slope ratios with SE, PHYBench decay rates with SE."""
import json, sys, collections, statistics as st, math
D, CORE, PHY, OUT = sys.argv[1:5]
c = json.load(open(CORE)); phy = json.load(open(PHY))
MODELS = ['qwen-7b', 'qwen-14b', 'qwen-32b', 'qwen-72b', 'qwen3-max']
# AIME: accuracy vs k, fixed-selector configuration; SE clustered over the 60 problems
lc = json.load(open(D + '/scaling_results/phase3_lechatelier.json'))
mv = collections.defaultdict(list); ag = collections.defaultdict(list)
for r in lc:
    if r['config'] != 'var+const': continue
    key = (r['k'], r['problem_type'], r['problem_id'])
    (mv if r['method'] == 'majority_vote' else ag)[key].append(r['correct'])
ks = sorted({k[0] for k in mv})
aime_k = []
for k in ks:
    probs = sorted({(t, p) for (kk, t, p) in mv if kk == k})
    m = [st.mean(mv[(k,) + q]) for q in probs]; a = [st.mean(ag[(k,) + q]) for q in probs]; d = [x - y for x, y in zip(a, m)]
    se = lambda v: st.stdev(v) / math.sqrt(len(v))
    aime_k.append([k, round(st.mean(m), 4), round(se(m), 4), round(st.mean(a), 4), round(se(a), 4), round(st.mean(d), 4), round(se(d), 4)])
# slope ratios
def slope_se(x, ys, ses):
    n = len(x); mx = sum(x) / n; sxx = sum((a - mx) ** 2 for a in x); w = [(a - mx) / sxx for a in x]
    return sum(wi * y for wi, y in zip(w, ys)), math.sqrt(sum((wi * s) ** 2 for wi, s in zip(w, ses)))
def alpha(x, base, llm):
    sb, eb = slope_se(x, [b[0] for b in base], [b[1] for b in base]); sl, el = slope_se(x, [b[0] for b in llm], [b[1] for b in llm])
    a = sl / sb; return [round(a, 3), round(abs(a) * math.sqrt((el / sl) ** 2 + (eb / sb) ** 2), 3)]
T = c['tetris']; xt = [math.log2(b) for b in T['B']]
NAME = {'qwen-7b': '7B', 'qwen-14b': '14B', 'qwen-32b': '32B', 'qwen-72b': '72B', 'qwen3-max': 'Qwen3-Max'}
forest = []
for m in MODELS: forest.append(['tetris', NAME[m], 'model'] + alpha(xt, T['dfs']['aggressive'], T['llm'][m]))
for p in ['minimal', 'cot', 'expert']: forest.append(['tetris', '32B · ' + p, 'prompt'] + alpha(xt, T['dfs']['aggressive'], T['prompt'][p]))
for r in ['conservative', 'default']: forest.append(['tetris', '32B · ' + r, 'reward'] + alpha(xt, T['dfs'][r], T['reward_llm'][r]))
xr = [math.log2(b) for b in c['ranking']['B']]
for m in MODELS: forest.append(['ranking', NAME[m], 'model'] + alpha(xr, c['ranking']['dfs'], c['ranking']['llm'][m]))
A = c['aime']; xa = [math.log10(p) for p in [7, 14, 32, 72, 236]]
bse = lambda p, n: math.sqrt(p * (1 - p) / n)
base = [[p, bse(p, 240)] for p in A['mv_big']]
for s in MODELS: forest.append(['aime', NAME[s], 'fixed'] + alpha(xa, base, [[p, bse(p, 240)] for p in A['fixed'][s]]))
forest.append(['aime', 'nested', 'nested'] + alpha(xa, base, [[p, bse(p, 240)] for p in A['nested']]))
xk = [math.log2(b) for b in c['knapsack']['B']]
knap = [alpha(xk, c['knapsack']['dfs'], c['knapsack']['llm'][m]) for m in MODELS]
# PHYBench: decay rate d = 1/L0 with SE from the weighted fit
for m in phy:
    f = m['bins'][1:]; x = [b[0] for b in f]; w = [1 / (b[2] / b[1]) ** 2 if b[2] > 0 else 1 for b in f]
    W = sum(w); mx = sum(a * b for a, b in zip(w, x)) / W
    m['d_se'] = round(1 / math.sqrt(sum(a * (b - mx) ** 2 for a, b in zip(w, x))), 4)
    m['mean_p'] = round(sum(b[1] for b in m['bins']) / len(m['bins']), 5)
json.dump({'aime_k': aime_k, 'forest': forest, 'knapsack_alpha': knap, 'phybench': phy}, open(OUT, 'w'), separators=(',', ':'))
for r in aime_k: print('k', r)
for f in forest: print(f)
print('knap', knap); print([(m['name'], m['d'], m['d_se']) for m in phy])
