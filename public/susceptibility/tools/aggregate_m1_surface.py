"""Downsample the M1 guarded iteration x toolsize surfaces for in-page heatmaps."""
import json, sys
R = sys.argv[1]; OUT = sys.argv[2]
d = json.load(open(R + '/m1_smooth_iteration_toolsize_score_surface_guarded.json'))
out = {}
for m, s in d['surfaces'].items():
    it, tg, S = s['iteration_grid'], s['tool_grid'], s['score_surface']
    ii = list(range(0, len(it), 2)) + ([len(it) - 1] if (len(it) - 1) % 2 else [])
    jj = list(range(0, len(tg), 2)) + ([len(tg) - 1] if (len(tg) - 1) % 2 else [])
    e = d['surface_extrema'][m]
    out[m] = {'it': [round(it[i], 2) for i in ii], 'tool': [round(tg[j], 3) for j in jj],
              'z': [[round(S[i][j], 3) for j in jj] for i in ii],
              'raw': [round(e['raw_argmax']['grid_iteration'], 1), round(e['raw_argmax']['grid_toolsize'], 2), round(e['raw_argmax']['predicted_task_score'], 3)],
              'sel': [round(e['selected_sweet_point']['grid_iteration'], 1), round(e['selected_sweet_point']['grid_toolsize'], 2), round(e['selected_sweet_point']['predicted_task_score'], 3)]}
print(len(d['surfaces']), 'models; grid', len(s['iteration_grid']), 'x', len(s['tool_grid']), '-> ', len(out[m]['it']), 'x', len(out[m]['tool']), 'shape check', len(S), len(S[0]))
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
