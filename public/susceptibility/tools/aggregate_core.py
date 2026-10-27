import json,sys,os,math,collections,statistics as st
D=sys.argv[1]; OUT=sys.argv[2]
L=lambda f: json.load(open(os.path.join(D,f)))
def ms(xs):
    m=st.mean(xs); s=st.stdev(xs)/math.sqrt(len(xs)) if len(xs)>1 else 0
    return [round(m,4),round(s,4),len(xs)]
MODELS=['qwen-7b','qwen-14b','qwen-32b','qwen-72b','qwen3-max']
def ols(x,y):
    n=len(x);mx=sum(x)/n;my=sum(y)/n
    sxx=sum((a-mx)**2 for a in x); b=sum((a-mx)*(c-my) for a,c in zip(x,y))/sxx
    a=my-b*mx; res=[c-(a+b*u) for u,c in zip(x,y)]
    se=math.sqrt(sum(r*r for r in res)/(n-2)/sxx) if n>2 else 0
    return b,a,se
out={}
# Tetris
dfs=L('results/dfs_baseline.json'); BW=[1,2,4,8,16,32]
def by(rows,key,val):
    g=collections.defaultdict(list)
    for r in rows: g[r[key]].append(r[val])
    return g
T={'B':BW,'dfs':{},'llm':{}}
for rf in ['aggressive','conservative','default']:
    g=by([r for r in dfs if r['reward_fn']==rf],'beam_width','lines_cleared'); T['dfs'][rf]=[ms(g[b]) for b in BW]
for m in MODELS:
    g=by(L(f'results/llm_{m}_aggressive.json'),'beam_width','lines_cleared'); T['llm'][m]=[ms(g[b]) for b in BW]
avg=[st.mean(T['llm'][m][i][0] for m in MODELS) for i in range(6)]
T['llm_avg']=[round(v,4) for v in avg]
for xs,name in [(BW,'linearB'),([math.log2(b) for b in BW],'log2B')]:
    print('tetris slope',name,'dfs',ols(xs,[v[0] for v in T['dfs']['aggressive']])[0],'llm',ols(xs,avg)[0])
T['prompt']={}
for p in ['minimal','cot','expert']:
    g=by(L(f'results/tetris_prompt_{p}.json'),'beam_width','lines_cleared'); T['prompt'][p]=[ms(g[b]) if g[b] else None for b in BW]
T['prompt']['standard']=T['llm']['qwen-32b']
T['reward_llm']={}
for rf in ['aggressive','conservative','default']:
    g=by(L(f'results/llm_qwen-32b_{rf}.json'),'beam_width','lines_cleared'); T['reward_llm'][rf]=[ms(g[b]) if g[b] else None for b in BW]
out['tetris']=T
# Knapsack
KB=[1,2,4,8,16,32,64]
g=by(L('results/knapsack_v2_dfs_baseline.json'),'beam_width','total_value')
K={'B':KB,'dfs':[ms(g[b]) for b in KB],'llm':{}}
for m in MODELS:
    g=by(L(f'results/knapsack_v2_llm_{m}_standard.json'),'beam_width','total_value'); K['llm'][m]=[ms(g[b]) for b in KB]
out['knapsack']=K
# Ranking
RB=[1,2,4,8,16,32,64,128]
rd=L('results/ranking_dfs_baseline.json'); print('rank dfs keys',list(rd[0].keys()))
ck='correct' if 'correct' in rd[0] else 'algo_correct'
g=by(rd,'budget',ck)
R={'B':RB,'dfs':[ms([float(x) for x in g[b]]) for b in RB],'llm':{}}
for m in MODELS:
    g=by(L(f'results/ranking_llm_{m}_standard.json'),'budget','correct'); R['llm'][m]=[ms([float(x) for x in g[b]]) for b in RB]
out['ranking']=R
# AIME
lc=L('scaling_results/phase3_lechatelier.json'); p3=L('scaling_results/phase3_results.json')
print('lc configs',collections.Counter((r['method'],r['config'],r['selector']) for r in lc).most_common(14))
KS=[1,3,5,9,15,17,19,21]; BIG=[15,17,19,21]
mv=collections.defaultdict(list); ag=collections.defaultdict(list)
for r in lc:
    if r['method']=='majority_vote': mv[(r['generator'],r['k'])].append(r['correct'])
    else: ag[(r['generator'],r['selector'],r['k'])].append(r['correct'])
mvacc=lambda g,k: st.mean(mv[(g,k)])
agacc=lambda g,s,k: st.mean(ag[(g,s,k)])
alpha=[]
for k in KS:
    x=[mvacc(g,k) for g in MODELS]; y=[st.mean(agacc(g,s,k) for s in MODELS) for g in MODELS]
    b,a,se=ols(x,y); alpha.append([k,round(b,4),round(se,4)])
print('alpha',alpha)
A={'models':MODELS,'k':KS,'alpha':alpha}
A['mv_big']=[round(st.mean(mvacc(g,k) for k in BIG),4) for g in MODELS]
A['agent_big_avg']=[round(st.mean(agacc(g,s,k) for s in MODELS for k in BIG),4) for g in MODELS]
A['fixed']={s:[round(st.mean(agacc(g,s,k) for k in BIG),4) for g in MODELS] for s in MODELS}
nv=collections.defaultdict(list); nmv=collections.defaultdict(list)
for r in p3:
    if r['k'] in BIG: (nv if r['method']=='agent' else nmv)[r['model']].append(r['correct'])
A['nested']=[round(st.mean(nv[m]),4) for m in MODELS]; A['nested_mv']=[round(st.mean(nmv[m]),4) for m in MODELS]
A['n_mv']=60*len(BIG); A['n_agent']=60*5*len(BIG)
print('AIME',json.dumps(A)[:1500])
out['aime']=A
json.dump(out,open(OUT,'w'))
print('tetris dfs',[v[0] for v in T['dfs']['aggressive']],'llm avg',T['llm_avg'])
print('knap dfs',[v[0] for v in K['dfs']],'llm',[round(st.mean(K['llm'][m][i][0] for m in MODELS),1) for i in range(7)])
print('rank dfs',[v[0] for v in R['dfs']],'llm',[round(st.mean(R['llm'][m][i][0] for m in MODELS),3) for i in range(8)])
print('prompts',{p:[v and v[0] for v in T['prompt'][p]] for p in T['prompt']})
print('reward llm',{p:[v and v[0] for v in T['reward_llm'][p]] for p in T['reward_llm']})
