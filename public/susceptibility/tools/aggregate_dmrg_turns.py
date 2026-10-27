"""Measured DMRG score at every turn: per model and tool count, the mean over seeds of each trajectory's
latest checkpoint score (carried forward after a trajectory ends, so an early stop becomes a plateau).

usage: python3 aggregate_dmrg_turns.py <M1 run dir> <out.json>
"""
import json, sys, glob, collections
RUN, OUT = sys.argv[1:3]
TURNS = 60
acc = collections.defaultdict(list)
for f in glob.glob(RUN + '/trajectories/*.json'):
    d = json.load(open(f))
    model, variant = d['agent']['model_id'], d['resource_variant']
    cps = sorted(d['run']['artifacts']['progress_checkpoints'], key=lambda c: c['iteration'])
    series, k, last = [], 0, 0.0
    for i in range(1, TURNS + 1):
        while k < len(cps) and cps[k]['iteration'] <= i:
            last = float(cps[k].get('task_score') or 0.0); k += 1
        series.append(last)
    acc[(model, variant)].append(series)
out = {}
for (m, v), runs in acc.items():
    out.setdefault(m, {})[v] = [round(sum(r[i] for r in runs) / len(runs), 4) for i in range(TURNS)]
json.dump({'turns': TURNS, 'perTurn': out}, open(OUT, 'w'), separators=(',', ':'))
print(len(out), 'models;', {m: len(v) for m, v in out.items()})
