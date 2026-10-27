"""Application data: PRBench DMRG tool x iteration slices (M1) and the five-PRL optimizer benchmark (results only)."""
import json, sys, csv, collections, statistics as st
M1_RUN, OPT_CSV, OUT = sys.argv[1:4]
rows = json.load(open(M1_RUN + '/m1_progress_slice_analysis.json'))['rows']
its = [1, 5, 10, 20, 30, 40, 50, 60]; V = ['tools_1', 'tools_2', 'tools_4', 'tools_6', 'tools_9']
agg = collections.defaultdict(list)
for r in rows:
    if r['all_observed']['mean'] is not None: agg[(r['resource_variant'], r['target_iteration'])].append(r['all_observed']['mean'])
recs = [json.loads(l) for l in open(M1_RUN + '/records.jsonl')]
m1 = {'iters': its, 'sizes': [1, 2, 4, 6, 9], 'byIter': {v: [round(st.mean(agg[(v, i)]), 4) for i in its] for v in V},
      'models': len({r['model_id'] for r in recs}), 'runs': len(recs),
      'status': {'ok': sum(r['status'] == 'ok' for r in recs), 'quota': sum('429' in (r.get('error') or '') for r in recs)}}
m1['status']['maxit'] = m1['runs'] - m1['status']['ok'] - m1['status']['quota']
opt = collections.defaultdict(dict)
for r in csv.DictReader(open(OPT_CSV)):
    if r['policy'] == 'warm': continue   # warm start is under maintenance and not reported
    opt[r['article']][r['policy']] = {'good': int(r['good_outputs']), 'traj': int(r['trajectory_count']), 'tokens': int(r['total_tokens']), 'tasks': int(r['task_count'])}
arts = list(opt)
pooled = {p: {'tokens': sum(opt[a][p]['tokens'] for a in arts), 'good': sum(opt[a][p]['good'] for a in arts), 'tasks': sum(opt[a][p]['tasks'] for a in arts)} for p in ['fixed', 'random', 'cold']}
json.dump({'m1': m1, 'optimizer': {'articles': arts, 'rows': opt, 'pooled': pooled, 'model': 'deepseek-v4-flash', 'k_good': 3, 'trajectories_per_task': 10}}, open(OUT, 'w'), separators=(',', ':'))
for p, v in pooled.items(): print(p, 'tok/good %.2fM' % (v['tokens'] / v['good'] / 1e6), 'tok/task %.2fM' % (v['tokens'] / v['tasks'] / 1e6))
print(m1['status'])

# --- model-averaged fitted response surface J(t, i) and its frontier t*(i) (appended step) ---
def surface(m1_run):
    s = json.load(open(m1_run + '/m1_smooth_iteration_toolsize_score_surface_guarded.json'))
    ms = list(s['surfaces']); g = s['surfaces'][ms[0]]; it, tg = g['iteration_grid'], g['tool_grid']
    z = [[sum(s['surfaces'][m]['score_surface'][i][j] for m in ms) / len(ms) for j in range(len(tg))] for i in range(len(it))]
    front = [tg[max(range(len(tg)), key=lambda j: row[j])] for row in z]
    return {'it': [round(v, 3) for v in it], 'tool': [round(v, 3) for v in tg], 'z': [[round(v, 4) for v in r] for r in z],
            'frontier': [round(v, 3) for v in front], 'models': len(ms)}
if __name__ == '__main__' and len(sys.argv) > 4:
    out = json.load(open(OUT)); out['m1']['surface'] = surface(M1_RUN); json.dump(out, open(OUT, 'w'), separators=(',', ':'))

# --- per-model same-turn slices and per-model fitted surfaces (appended step) ---
def per_model(m1_run, surf_json):
    rows = json.load(open(m1_run + '/m1_progress_slice_analysis.json'))['rows']
    surf = json.load(open(surf_json))
    pm = {}
    for r in rows:
        if r['all_observed']['mean'] is None: continue
        d = pm.setdefault(r['model_id'], {'slices': {}})
        d['slices'].setdefault(r['resource_variant'], {})[str(r['target_iteration'])] = [round(r['all_observed']['mean'], 4), r['all_observed']['n']]
    for m, s in surf.items():
        pm.setdefault(m, {})['surface'] = {'it': s['it'], 'tool': s['tool'], 'z': s['z']}
    return pm
if __name__ == '__main__' and len(sys.argv) > 5:
    out = json.load(open(OUT)); out['m1']['perModel'] = per_model(M1_RUN, sys.argv[5]); json.dump(out, open(OUT, 'w'), separators=(',', ':'))
