"""Build the discussion table (paper Table I, Appendix A) for the site.
Usage: python3 build_dictionary.py <phase_diagram-2 dir> <site dir>
Writes assets/data/dictionary.js (rows for the page), assets/downloads/phase_diagram_dictionary.csv and .bib.
Row text is the paper's Table I, with a Chinese translation; the citation keys of every row are checked against the tex."""
import sys, re, json, csv, os
P, S = sys.argv[1], sys.argv[2]
tex = open(f'{P}/sections/90_appendices/A_dictionary.tex').read()
bib = open(f'{P}/refs.bib').read()
# rows: (group, item_en, item_zh, lit_en, lit_zh, this paper)
ROWS = [
 ('F', 'Inference flow: a discrete dynamical system along depth', '推理流：沿深度演化的离散动力系统',
  'Residual networks are discretizations of ordinary differential equations', '残差网络是常微分方程的离散化', 'Sec. II'),
 ('F', 'd_C: participation ratio of the within-document covariance', 'd_C：文档内协方差的参与比',
  'Participation ratio; effective rank and intrinsic dimension measure dimensionality in other ways', '参与比；有效秩和内在维数以其他方式度量维数', 'Sec. II'),
 ('F', 'u: ratio of the between-document offset to the within-document variation', 'u：文档间偏移与文档内变化之比',
  'Ratio of between-class to within-class scatter', '类间散布与类内散布之比', 'Sec. II'),
 ('F', 'E = u/(√d_C + u): approximately the average cosine similarity between two tokens of the same document; document identification accuracy rises with it', 'E = u/(√d_C + u)：近似为同一文档两个 token 表示的平均余弦相似度；文档识别准确率随它上升',
  'Accuracy of linear probes', '线性探针的准确率', 'App. C, Fig. 9'),
 ('F', 'δ: offset of the document mean relative to the reference', 'δ：文档均值相对参照的偏移',
  'Difference-of-means directions: linear directions of concepts such as truth and gender', '均值差方向：真假、性别等概念的线性方向', 'Sec. II'),
 ('F', 'The mean shared by all documents, removed in δ', '所有文档共有的均值，在 δ 中扣除',
  'Anisotropy: high cosine similarity between representations in upper layers', '各向异性：高层表示之间余弦相似度高', 'Sec. II'),
 ('P', 'Inference flows of trained models: u rises with depth, and d_C first rises slightly and then falls slightly', '训练后模型的推理流：u 随深度上升，d_C 先略升后略降',
  'Linear-probe accuracy rises with depth; intrinsic dimension first rises and then falls with depth', '线性探针准确率随深度上升；内在维数随深度先升后降', 'Fig. 2'),
 ('P', 'Inference flows of trained models reside in the working phase', '训练后模型的推理流驻留在工作相',
  'Layer redundancy: some intermediate and deep layers can be deleted or reordered with little change in performance', '深层冗余：部分中间层和深层可以删去或换序，而性能变化很小', 'Fig. 3(b)'),
 ('P', 'Inference flows of untrained runs go to the collapse region or the noise region depending on the initialization scale', '未训练网络的推理流随初始化尺度去往坍缩区或噪声区',
  'Random Transformers exhibit rank collapse or entropy collapse depending on the initialization scale of attention; signal propagation in random deep networks lies in an ordered or a chaotic phase depending on the initialization scale; networks initialized near the boundary between the two are most easily trained',
  '随机 Transformer 随注意力的初始化尺度出现秩坍缩或熵坍缩；随机深层网络中的信号传播随初始化尺度处在有序相或混沌相；在两者分界附近初始化的网络最易训练', 'Fig. 3(a)'),
 ('P', 'The u → ∞ limit of the drifting phase', '漂移相的 u → ∞ 极限',
  'Rank collapse; merging of token representations into a single cluster in self-attention dynamics; neural collapse with documents as classes', '秩坍缩；自注意力动力学中 token 表示合并为一簇；以文档为类的神经坍缩', 'Sec. III'),
 ('P', 'During training, the inference flow enters the working phase from the drifting phase; d_C first drops sharply, then recovers, and falls back late in training, and E rises early',
  '训练中，推理流从漂移相进入工作相；d_C 先骤降、后恢复、后期回落，E 很早上升',
  'During pretraining, the effective rank of representations first drops sharply, then recovers, and later decreases as the representations are compressed toward a few principal directions; during long loss plateaus, the hidden states of different tokens are nearly parallel; probe accuracy is established early in pretraining',
  '预训练中，表示的有效秩先骤降、后恢复，之后随表示被压缩到少数主方向而下降；在长的损失平台期，不同 token 的隐藏状态几乎平行；探针准确率在预训练早期就已建立', 'Fig. 5, Fig. 6'),
]
# citation keys per row, in table order
body = tex[tex.index(r'\midrule'):tex.index(r'\bottomrule')]
rows_tex = [r for r in re.split(r'\\tabularnewline', body) if r'\nm{' in r]
KEYS = [re.findall(r'\\nm\{([^}]+)\}', r) for r in rows_tex]
assert len(KEYS) == len(ROWS), (len(KEYS), len(ROWS))
entries = {}
for m in re.finditer(r'@(\w+)\{\s*([^,\s]+),', bib):
    start = m.start(); depth = 0
    for i in range(bib.index('{', start), len(bib)):
        depth += bib[i] == '{'; depth -= bib[i] == '}'
        if depth == 0: entries[m.group(2)] = bib[start:i + 1]; break
def field(e, f):
    m = re.search(r'\b' + f + r'\s*=\s*', e, re.I)
    if not m: return ''
    i = m.end()
    if e[i] in '{"':
        close = '}' if e[i] == '{' else '"'; depth = 0
        for j in range(i, len(e)):
            if e[j] == '{': depth += 1
            elif e[j] == '}': depth -= 1
            if (close == '}' and depth == 0) or (close == '"' and j > i and e[j] == '"'): return e[i + 1:j]
    return re.match(r'[^,\n]+', e[i:]).group(0).strip()
def short(k):
    e = entries[k]; a = field(e, 'author'); y = field(e, 'year')
    names = [n.strip() for n in re.split(r'\s+and\s+', a)]
    last = lambda n: (n.split(',')[0] if ',' in n else n.split()[-1]).strip('{} ')
    s = last(names[0]) if len(names) != 2 else f'{last(names[0])} & {last(names[1])}'
    if len(names) > 2: s += ' et al.'
    return re.sub(r'\\.|[{}]', lambda m: {'\\"': ''}.get(m.group(0), ''), s) + ' ' + y
for ks in KEYS:
    for k in ks: assert k in entries, k
OURS = '''@misc{song2026phasediagramtraininginference,
      title={A phase diagram for training and inference in language models}, 
      author={Zhuo-Yang Song and Zeyu Li and Qing-Hong Cao and Ming-xing Luo and Hua Xing Zhu},
      year={2026},
      eprint={2611.19848},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/2611.19848}, 
}'''   # arXiv BibTeX export, verbatim
out = [dict(g=g, ie=ie, iz=iz, le=le, lz=lz, refs=[dict(k=k, s=short(k)) for k in ks]) for (g, ie, iz, le, lz, o), ks in zip(ROWS, KEYS)]
# this paper: one row, first in the phenomena group
OURS_ROW = dict(g='P', ie='Two phases on the (u, d_C) plane: trained models enter and stay in the working phase, untrained networks drift; at P* the effective force is a stable node for trained models and a saddle for untrained ones; training is a transition between the two phases',
                iz='(u, d_C) 平面上的两个相：训练后模型进入并停在工作相，未训练网络漂移；有效力在 P* 处对训练后模型是稳定结点、对未训练网络是鞍点；训练是两相之间的转变',
                le='A phase diagram for training and inference in language models', lz='语言模型训练与推理的相图', refs=[dict(k='song2026phasediagramtraininginference', s='Song et al. 2026')])
first_p = next(i for i, r in enumerate(out) if r['g'] == 'P'); out.insert(first_p, OURS_ROW)
os.makedirs(f'{S}/assets/downloads', exist_ok=True)
open(f'{S}/assets/data/dictionary.js', 'w').write('window.PD_DICT = ' + json.dumps(out, ensure_ascii=False) + ';\n')
with open(f'{S}/assets/downloads/phase_diagram_dictionary.csv', 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.writer(fh)
    w.writerow(['group', 'quantity or phenomenon on the phase diagram', '相图上的量或现象', 'description in the literature', '文献中的描述', 'sources', 'bibtex keys'])
    for r in out:
        w.writerow(['Foundations' if r['g'] == 'F' else 'Phenomena', r['ie'], r['iz'], r['le'], r['lz'], '; '.join(x['s'] for x in r['refs']), '; '.join(x['k'] for x in r['refs'])])
keys = list(dict.fromkeys(k for ks in KEYS for k in ks))
open(f'{S}/assets/downloads/phase_diagram_dictionary.bib', 'w').write(OURS + '\n\n' + '\n\n'.join(entries[k].strip() for k in keys) + '\n')
print(len(out), 'rows,', len(keys), 'sources + this paper')
for r in out: print(r['g'], '|', '; '.join(x['s'] for x in r['refs']))
