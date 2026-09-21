const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const nav = $('#site-nav');
const menu = $('.menu-toggle');
const links = $('.nav-links');
window.addEventListener('scroll', () => nav?.classList.toggle('is-scrolled', window.scrollY > 14), { passive: true });
menu?.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  links?.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
});
links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu?.classList.remove('is-open'); links?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false');
}));

// The article page is bilingual.  These translations follow the paper's
// terminology: agent, semantic state, transition channel, conditional free
// energy, exact 1-form, effective potential, and detailed balance.
const englishText = {
  '动机':'Motivation','理论':'Theory','实验':'Experiment','应用':'Application','讨论':'Discussion',
  '当生成变成一种':'When generation becomes','可测的动力学':'a measurable dynamics',
  '一个生活在特定 context 中的 LLM agent，如何在语义状态间移动？把它的转移通道量出来，再寻找组织这些转移的有效势。':'How does an LLM agent living in a fixed context move between semantic states? Measure its transition channels, then look for the effective potential that organizes them.',
  '阅读论文 ↗':'Read the paper ↗',
  '定义语义状态，':'Define semantic states,','并用 MCMC 测量通道。':'and measure channels with MCMC.',
  '同一个意思，可以由许多不同的 token 序列表达。要理解 agent 的行为，就要从逐 token 的生成概率走向语义状态。':'The same meaning can be expressed by many token sequences. To understand an agent, move from token-by-token generation probabilities to semantic states.',
  '语义状态':'Semantic state','采样与计数':'Sampling and counting','语义转移通道':'Semantic transition channel',
  '同一语义允许多条不同的 token 序列实现':'One semantic state can have many token realizations',
  '重复生成并测量固定 context 下不同语义出现的频率':'Repeat generation and measure semantic frequencies in a fixed context',
  '如何描述语义状态间的动力学联系？':'How should the dynamics between semantic states be described?',
  '𝒯 是一整束微观轨迹的概率之和':'𝒯 is the probability sum over a bundle of microscopic trajectories',
  '固定环境 c':'fixed context c','01 / 同一个输入':'01 / The same input','由状态 f 与固定 context 构造 prompt':'Build a prompt from state f and the fixed context',
  'LLM 逐 token 生成：不同序列，不同概率':'LLM token-by-token generation: different sequences, different probabilities',
  '轨迹 y⁽¹⁾':'Trajectory y⁽¹⁾','轨迹 y⁽²⁾':'Trajectory y⁽²⁾','语义提取':'Semantic extraction',
  '许多不同轨迹，同一个语义状态':'Many trajectories, one semantic state','把所有通向 g 的轨迹概率相加':'Sum the probabilities of all trajectories reaching g',
  '沿一条轨迹：条件概率相乘':'Along one trajectory: multiply conditional probabilities','由所有能够实现 g 的轨迹推出':'Collect all trajectories that realize g',
  '找出唯一主导通路，':'Find the unique dominant path,','再让低概率边显现。':'then reveal low-probability return edges.',
  '先取一个可控极限：可达两态之间只有一条主导路径。再为每条转移加入微弱返回，让有序骨架获得可返回的概率。正逆概率的强弱比，成为有效描述的入口。':'First take a controlled limit: at most one dominant path connects any reachable pair. Add a weak return edge to every transition so the ordered backbone remains probabilistic. The forward–reverse ratio is the entry point for an effective description.',
  '假设 A：任意可达 f → g，路径至多一条':'Assumption A: at most one path connects any reachable f → g',
  '美丽的贝加尔湖有许多儿子，':'Beautiful Lake Baikal has many sons,','却只有一个女儿。':'but only one daughter.',
  '假设训练在模型中塑造的是一个势函数，而不只是一份规则清单。在这个极限中，竞争路径在训练中被压低，只留下一条主导通路，同一祖先不能经两条路抵达同一叶子。':'Assume that training shapes a potential function, not merely a list of rules. In this limit, competing paths are suppressed and one dominant route remains: the same ancestor cannot reach the same leaf by two routes.',
  '假设 B：每条路径都带着概率返回边':'Assumption B: every path carries a probabilistic return edge',
  '我们所有探索的终点，':'The end of all our exploring','将是回到出发的地方。':'will be to arrive where we started.',
  '语言模型不是逻辑推理而是概率预测，因此有主导方向，不应该代表绝不返回。概率采样与语义的不确定性，启发我们为每条主导转移加入微弱回边。在这项假设下，正逆概率比由有效势差组织。':'An LLM is a probabilistic predictor, not a deductive logic engine. A dominant direction therefore does not mean an impossible return. Sampling and semantic uncertainty motivate a weak return edge for every dominant transition. Under this assumption, forward–reverse ratios are organized by effective potential differences.',
  '从真实转移中剪出唯一通路骨架':'Prune a unique-path backbone from real transitions','真实数据结构':'Real data structure','主导路径':'Dominant path','概率返回边':'Probabilistic return edge','状态编号对应一个实测状态':'Each state index denotes a measured state',
  '唯一通路骨架 + 概率返回边':'Unique-path backbone + probabilistic return edges','同一组通道的 𝒯(f | g) · 按势能排序':'𝒯(f | g) for the same channels · ordered by potential','蓝色主导通路与金色返回边来自同一组真实观测；右侧矩阵按势能排序。':'The blue dominant paths and gold return edges come from the same observations; the matrix on the right is ordered by potential.',
  'F：一整束轨迹的条件自由能':'F: conditional free energy of a trajectory bundle','把序列 y 的概率写成下面的能量形式。E θ 描述这条序列的有效能量，Z θ (x f ) 是所有可能输出的权重总和，用于归一化。':'Write the probability of sequence y in the energy form below. Eθ is the effective energy of the sequence; Zθ(xf) is the total weight of all possible outputs and normalizes the distribution.',
  '固定输入 f，把所有通向 g 的序列权重加起来，再取负对数，就是 F(g|f)。它描述转移中的整体能量差。':'For fixed input f, sum the weights of all sequences reaching g and take the negative logarithm: this is F(g|f), the aggregate energy difference of the transition.',
  'F 与 𝒯：相差一个归一化项':'F and 𝒯: separated by a normalization term','对同一个输入 f，F(g|f) 越低，转移到 g 的概率越高。但 F 并非直接等同于 −log𝒯，还要计入输入对应的归一化项。':'For the same input f, a lower F(g|f) means a higher probability of reaching g. But F is not simply −log𝒯; the input-dependent normalization term must also be included.',
  'F 与 V：局部方向差由全局势组织':'F and V: local directional differences organized by a global potential','在细致平衡成立时，正逆通道的条件自由能之差满足：':'When detailed balance holds, the conditional free-energy difference of forward and reverse channels obeys:',
  '右侧是同一个状态函数 βV+log Z θ 在 f、g 两点的差。这表明当条件自由能F满足 exact 1-form 时，存在一个全局有效势 V，可以用来描述系统的局部行为。这就是所假设条件的微观含义。':'The right-hand side is the difference of one state function, βV + log Zθ, evaluated at f and g. When the conditional free energy F is an exact 1-form, a global effective potential V exists to describe local behavior. This is the microscopic meaning of the assumption.',
  '让真实的边，':'Let real edges','决定势能的排序。':'determine the potential ordering.',
  '从排序算法中抽象出一个目标：寻找让转移更倾向于“向下”的势能排列。最小作用量把这个目标变成可优化的量。保留真实数据中的局部转移通道，让状态逐渐找到对应全局有效势，看作用量如何随之下降。':'Abstract a target from sorting algorithms: find a potential ordering that makes transitions preferentially move downhill. The minimum action turns this target into an optimizable quantity. Keep the measured local channels, let states discover a global effective potential, and watch the action decrease.',
  '只更新 V，不改动任何转移计数':'Update V only; do not change any transition counts','在真实通道上寻找势能':'Find the potential on real channels','开始优化 ↗':'Play optimization ↗','重置':'Reset','可视化势能':'Visualize potential','排序转移矩阵':'Order transition matrix','检验细致平衡':'Test detailed balance',
  '沿同一批真实状态与转移边更新势能；点沿势能方向移动，代表转移中势能下降的绿色边增多，作用量下降。':'Update the potential on the same measured states and transition edges. Points move along the potential direction; more green downhill edges indicate a decreasing action.',
  '下降 V(g)<V(f)':'Downhill V(g)<V(f)','上升 V(g)>V(f)':'Uphill V(g)>V(f)','箭头指向下一状态 · 线宽 ∝𝒯':'Arrows point to the next state · width ∝ 𝒯','点击节点查看状态表达式、采样数和势能。':'Click a node to inspect its state expression, sample count, and potential.','作用量随迭代下降':'Action decreases with iteration','迭代':'Iteration','全图作用量 𝒮':'Global action 𝒮','下降边 / 总边数':'Downhill edges / total edges','显示状态 / 拟合总状态':'Displayed states / fitted states',
  '行是目标 f，列是源 g。按势能重新排列状态，深色表示更强的转移，上三角对应向低势能流动。观察转移的方向性在热图中显现。':'Rows are target f and columns are source g. Reorder states by potential; darker cells are stronger transitions, and the upper triangle corresponds to downhill flow.',
  '点击格子查看转移概率 𝒯(f|g)。':'Click a cell to inspect the transition probability 𝒯(f|g).','每个点连接一对状态的势差与实测正逆概率比。优化只改变势差，观察点云如何向对角线靠拢。':'Each point pairs a state-potential difference with a measured forward–reverse probability ratio. Optimization changes only the potential difference; watch the cloud approach the diagonal.','点击点查看势差与实测正逆概率比。':'Click a point to inspect the potential difference and measured forward–reverse ratio.',
  '跨越任务和时间检验理论':'Test the theory across tasks and time','跨任务检验':'Across tasks','跨模型检验':'Across models','从表达式到单词与数字，切换任务，看同一条势差关系如何出现在不同的生成空间中。每个任务的 Pearson r 都在该任务的全部合格双向状态对上计算。不同任务上模型均表现出向细致平衡的趋势。':'Switch from expressions to words and numbers to see the same potential-difference relation across generation spaces. Pearson r is computed on every qualified bidirectional state pair in each task. The trend toward detailed balance appears across tasks.','选择任务':'Choose a task','沿时间比较同一任务池中的模型版本。这里先对每个任务的合格双向状态对计算 r t （比较 log[T(g←f)/T(f←g)] 与 ΔV），再按该任务的双向对数量 n t 加权计算皮尔逊相关系数： R = Σ n t r t / Σ n t 。横轴按版本先后排列，快照于 2026-08-14 09:38（北京时间）冻结。随着模型迭代，细致平衡的趋势逐渐增强。':'Compare model versions on the same task pool over time. First compute rₜ for qualified bidirectional pairs in each task, comparing log[T(g←f)/T(f←g)] with ΔV; then compute the Pearson coefficient weighted by the number nₜ of bidirectional pairs: R = Σ nₜrₜ / Σ nₜ. Versions are ordered chronologically; the snapshot was frozen on 2026-08-14 09:38 Beijing time. The trend toward detailed balance strengthens across model iterations.',
  '论文与补充材料 ↗':'Paper and Supplemental Material ↗','公开数据 · CC BY 4.0 ↗':'Public data · CC BY 4.0 ↗','分析代码· MIT Licence ↗':'Analysis code · MIT Licence ↗',
  '从描述行为，':'From describing behavior,','走向设计行为。':'to designing behavior.','模型容易到达的地方，未必是任务需要的地方。若有效势描述满足稳态收敛条件，π(f)∝e −βV(f) 。通过加入目标偏置重塑稳态，可以让搜索更多地到达目标区域。':'Where a model easily goes is not necessarily where the task requires. When the effective-potential description admits a stationary limit, π(f)∝e−βV(f). An external target bias reshapes the stationary distribution and can steer search toward the target region.',
  '识别原有偏好':'Identify the existing preference','改变外部偏置':'Change the external bias','引导模型行为':'Steer model behavior','外部偏置如何把随机轨迹推向目标区域？':'How does an external bias steer random trajectories toward a target region?','真实状态空间演示':'Measured state-space demonstration','在给定的状态空间中，逐渐增加偏置的大小，观察一个迭代智能体在状态空间上游走的轨迹如何从原本的方向向外部偏置鼓励的方向漂移。':'In a fixed state space, gradually increase the bias and observe how an iterated agent drifts from its original direction toward the direction favored by the external bias.','外部偏置 β':'External bias β','增加偏置 ↗':'Increase bias ↗','最低势能所在的 MSE':'MSE at the lowest potential','全图最低 MSE':'Lowest MSE in the full graph','当前偏置下轨迹可达的最低 MSE':'Lowest MSE reachable by the current biased trajectory','探索阶段':'Exploration regime','当前轨迹的最低 MSE':'Lowest MSE on the current trajectory',
  '费曼积分约化 ↗':'Feynman-integral reduction ↗','搜索 priority function，确定性优化 IBP 约化算法':'Search for a priority function and deterministically optimize IBP reduction','量子线路初态制备 ↗':'Quantum-circuit initial-state preparation ↗','生成式搜索发现高效的线路结构':'Generative search discovers efficient circuit structures','迭代式符号回归 ↗':'Iterated symbolic regression ↗','在表达式状态空间中持续搜索':'Continue searching in an expression state space',
  '若干讨论，':'Three discussions:','非平衡效应、方法论和意义。':'nonequilibrium effects, methodology, and meaning.','一个势能，不必穷尽生成的全部细节。它的价值在于：明确主要结构，并说明如何修正。它把不同视角的研究连接起来。':'A potential need not exhaust every detail of generation. Its value is to make the dominant structure explicit and show how to correct it. It connects several levels of description.',
  '转移路径有环时的平衡态':'Equilibrium when transition paths form cycles','主导转移':'Dominant transition','弱返回':'Weak return','现实的多路径结构会构成双向闭环，为细致平衡的描述能力画出边界。':'Multiple paths in reality form bidirectional cycles, marking the boundary of a detailed-balance description.','定义势差时，正向与返回通道已经同时存在。现实中，同一祖先可能经不同路径抵达同一后继，此时，':'When defining a potential difference, forward and return channels already coexist. In reality, the same ancestor may reach the same successor by different paths; then,','就是待检验的零假设，其中正向一周的概率乘积 P₊ ，逆向为 P₋。即：这些环上的正逆概率比，能否仍由同一个势能统一描述？':'is the null hypothesis to test. The forward cycle has probability product P₊ and the reverse cycle P₋. Can the forward–reverse ratio around these cycles still be unified by one potential?','正文闭环检验':'Main-text cycle test','在当前采样误差内，':'Within current sampling error,','尚不能拒绝正逆对称。':'forward–reverse symmetry cannot be rejected.','若检测到可靠的非零环流，单一势能才不足以描述全部方向性，需要进一步引入非平衡修正。':'Only a reliable nonzero circulation would show that one potential is insufficient for all directional structure and that a nonequilibrium correction is needed.',
  '微扰论的应用':'Applying perturbation theory','不必先给复杂现实找到一条精确规律。先提取主导结构，把它推进到可解的极限，再用数据判断这个极限是否能够描述现实。':'We need not first find an exact law for a complex reality. Extract the dominant structure, push it to a solvable limit, and use data to test whether that limit describes reality.','识别主导结构':'Identify the dominant structure','从转移中看见结构':'Read structure from transitions','语言模型的生成有倾向性，生成通道稀疏。':'LLM generation is directional and its transition channels are sparse.','建立自洽描述':'Build a self-consistent description','由正逆概率比定义势':'Define a potential from forward–reverse ratios','基于概率模型的本质给出最小描述。':'The probability model itself supplies the minimal description.','检验现实情况':'Test the real system','在实际通道上检验势':'Test the potential on real channels','比较绕现实中多路径的正逆概率乘积，检验势能描述。':'Compare forward and reverse probability products around real multistep paths to test the potential description.',
  '向微观追溯，向宏观预测':'Trace the microscopic, predict the macroscopic','如同热力学不必追踪每个粒子，势能表示把完整输出的 token 序列构成的系综压缩为可测的宏观状态关系：向下可以追溯生成过程的 token 动力学，向上可以组织稳态、响应与搜索的设计。':'As thermodynamics need not track every particle, the potential representation compresses the ensemble of complete token sequences into measurable macroscopic state relations: downward it traces token dynamics; upward it organizes stationary behavior, response, and search design.','微观生成':'Microscopic generation','许多 token 轨迹':'Many token trajectories','研究生成过程中 token 的微观动力学':'Study token-level microscopic dynamics during generation','桥梁':'Bridge','用全局势能表示组织局部状态转移':'Use a global potential to organize local state transitions','宏观行为':'Macroscopic behavior','少数可检验的量':'A few measurable quantities','稳态 π':'Stationary π','响应 χ':'Response χ','研究真实 agent 的宏观行为模式':'Study macroscopic patterns of real agents'
  ,'02 / 通向同一个 g 的微观轨迹':'02 / Microscopic trajectories reaching the same g','03 / 汇总这些轨迹的概率':'03 / Aggregate the probabilities of these trajectories','——俄罗斯传说 贝加尔湖与安加拉河':'— Russian legend: Lake Baikal and the Angara River','从 f 经中介状态 h₁ 或 h₂ 到达 g：保留蓝色主导路径 f→h₁→g，压低灰色竞争路径 f→h₂→g':'From f to g through intermediate h₁ or h₂: retain the blue dominant path f→h₁→g and suppress the gray competing path f→h₂→g','唯一主导路径':'Unique dominant path','竞争路径被压低':'Competing path suppressed','——艾略特《四个四重奏 · 小吉丁》':'— T. S. Eliot, Four Quartets: Little Gidding','两个状态 f 与 g：蓝色粗箭头从 f 指向 g，金色细箭头从 g 返回 f':'Two states f and g: a thick blue arrow goes from f to g; a thin gold arrow returns from g to f','弱概率返回':'Weak-probability return','条件自由能 F 和有效势 V':'Conditional free energy F and effective potential V','把序列 y 的概率写成下面的能量形式。E':'Write the probability of sequence y in the energy form below. E','描述这条序列的有效能量，Z':' is the effective energy of the sequence; Z',') 是所有可能输出的权重总和，用于归一化。':') is the total weight of all possible outputs and normalizes the distribution.','右侧是同一个状态函数 βV+log Z':'The right-hand side is one state function, βV + log Z','在 f、g 两点的差。这表明当条件自由能F满足 exact 1-form 时，存在一个全局有效势 V，可以用来描述系统的局部行为。这就是所假设条件的微观含义。':' evaluated at f and g. When the conditional free energy F is an exact 1-form, a global effective potential V exists to describe local behavior. This is the microscopic meaning of the assumption.','沿时间比较同一任务池中的模型版本。这里先对每个任务的合格双向状态对计算':'Compare model versions on the same task pool over time. First compute','（比较 log[T(g←f)/T(f←g)] 与 ΔV），再按该任务的双向对数量':'(comparing log[T(g←f)/T(f←g)] with ΔV), then weight by the number','加权计算皮尔逊相关系数：':'of bidirectional pairs to compute the Pearson coefficient:','。横轴按版本先后排列，快照于 2026-08-14 09:38（北京时间）冻结。随着模型迭代，细致平衡的趋势逐渐增强。':'. Versions are ordered chronologically; the snapshot was frozen on 2026-08-14 09:38 Beijing time. The trend toward detailed balance strengthens across model iterations.','模型容易到达的地方，未必是任务需要的地方。若有效势描述满足稳态收敛条件，π(f)∝e':'Where a model easily goes is not necessarily where the task requires. When the effective-potential description admits a stationary limit, π(f)∝e','。通过加入目标偏置重塑稳态，可以让搜索更多地到达目标区域。':'. An external target bias reshapes the stationary distribution and can steer search toward the target region.','原有偏好':'existing preference','同一祖先经两条路径抵达同一后继':'the same ancestor reaches the same successor by two paths','定义概率势能的基准模型已经包含正向与返回通道。现实中额外存在不同中介路径，图中 f 经 h₁ 或 h₂ 到 g，且每条边均可反向通过，构成正、逆闭环。':'The baseline model for a probabilistic potential already contains forward and return channels. Reality adds distinct intermediate paths: here f reaches g through h₁ or h₂, and every edge can be traversed in reverse, forming forward and reverse cycles.','双向闭环':'Bidirectional cycle','比较正逆权重之积':'Compare the products of forward and reverse weights','· 数据与方法可由论文、公开数据集及分析代码追溯；实验图来自真实记录，网页动画为基于真实状态的演示。':'· Data and methods are traceable to the paper, public dataset, and analysis code; figures use measured records, while animations are replays built from real states.'
};
let locale='zh';
const originalText=new WeakMap();
function applyLocale(next){
  locale=next==='en'?'en':'zh';
  document.documentElement.lang=locale==='en'?'en':'zh-CN';
  document.title=locale==='en'?'Detailed Balance':'细致平衡';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest('script,style'))continue;
    if(!originalText.has(node))originalText.set(node,node.nodeValue||'');
    const raw=originalText.get(node)||'', key=raw.trim();
    if(!key)continue;
    const value=locale==='en'?(englishText[key]||key):key;
    node.nodeValue=raw.replace(key,value);
  }
  const toggle=$('#languageToggle');
  if(toggle){toggle.textContent=locale==='en'?'中文':'EN';toggle.setAttribute('aria-label',locale==='en'?'Switch to Chinese':'切换到英文');}
  updateDynamicLabels();
  if(typeof graphData!=='undefined' && graphData){drawDag();drawTheoryMatrix();drawMatrix();drawSort();drawAction();drawScatter();drawCrossTask();drawBias();updateActionReadout();updateBias();}
}
const languageToggle=$('#languageToggle');
languageToggle?.addEventListener('click',()=>{const next=locale==='en'?'zh':'en';localStorage.setItem('detailed-balance-locale',next);applyLocale(next);});
const uiText={
  zh:{sortStatus:'点击节点查看状态表达式、采样数和势能。',loadError:'动画暂未载入，请点击播放重试。',matrixAxis:'列：源 g',matrixRow:'行：目标 f',matrixLegend:'列：源 g · 行：目标 f',unmeasured:'自转移未测量',matrixHint:'12 个真实状态 · 色阶 0–0.30 · 点击格子查看转移概率',scatterHint:'点击点查看状态对、势差与实测正逆概率比。',potentialAxis:'势能 V',actionAxis:'作用量 𝒮',scatterAxis:'log[𝒯(g←f)/𝒯(f←g)]',crossAxisX:'势差 ΔV = V(f) − V(g)',crossAxisY:'log[𝒯(g←f) / 𝒯(f←g)]',crossMeasured:'实测双向状态对',crossPrediction:'细致平衡预测：y = x',actualIteration:'实际迭代',action:'全图作用量 𝒮',states:'显示状态 / 拟合总状态',downhill:'下降边 / 总边数',frob:'Frobenius 范数中上三角部分比例',play:'播放优化 ↗',prepare:'准备动画…',retry:'重试播放 ↻',pause:'暂停',line:'虚线 y = x · 实测双向转移',pairs:'个合格双向对 · 展示',point:'点',taskR:'按双向状态对数量加权的任务 Pearson r',biasPlay:'增加偏置 ↗',biasNone:'无偏置',biasZero:'零温极限',biasContinuous:'连续偏置'},
  en:{sortStatus:'Click a node to inspect its state expression, sample count, and potential.',loadError:'Animation is not loaded. Click play to retry.',matrixAxis:'Columns: source g',matrixRow:'Rows: target f',matrixLegend:'Columns: source g · rows: target f',unmeasured:'self-transition not measured',matrixHint:'12 measured states · scale 0–0.30 · click a cell to inspect 𝒯',scatterHint:'Click a point to inspect the state pair, potential difference, and measured forward–reverse ratio.',potentialAxis:'Potential V',actionAxis:'Action 𝒮',scatterAxis:'log[𝒯(g←f)/𝒯(f←g)]',crossAxisX:'Potential difference ΔV = V(f) − V(g)',crossAxisY:'log[𝒯(g←f) / 𝒯(f←g)]',crossMeasured:'Measured reciprocal state pairs',crossPrediction:'Detailed-balance prediction: y = x',actualIteration:'Iteration',action:'Global action 𝒮',states:'Displayed states / fitted states',downhill:'Downhill edges / total edges',frob:'Upper-triangle share of the Frobenius norm',play:'Play optimization ↗',prepare:'Preparing animation…',retry:'Retry playback ↻',pause:'Pause',line:'dashed y = x · measured bidirectional transitions',pairs:'qualified bidirectional pairs · showing',point:'points',taskR:'Task Pearson r weighted by bidirectional-state-pair counts',biasPlay:'Increase bias ↗',biasNone:'No bias',biasZero:'Zero-temperature limit',biasContinuous:'Continuous bias'}
};
const taskProblemEnglish={
  idea:'Starting from an expression in a symbolic-fitting problem, generate new candidate expressions.',
  gpt5nano_sum100:'Given an English word whose letter values sum to 100, generate another word with the same constraint.',
  sum100:'Given a word, generate another English word whose letter values sum to 100 (A=1, …, Z=26).',
  five_letter_s:'Given an example, generate another five-letter English word beginning with S.',
  digit_sum_15:'Given a three-digit number, generate another three-digit number whose digit sum is 15.',
  sum_div10:'Given a word, generate another English word whose letter sum is divisible by 10.',
  seven_letter_words:'Given an example, generate another common English word with exactly seven letters.',
  four_digit_div7:'Given a four-digit number, generate another four-digit number divisible by 7.'
};
function updateDynamicLabels(){
  const u=uiText[locale];
  if($('#sortStatus'))$('#sortStatus').textContent=u.sortStatus;
  if($('#matrixStatus'))$('#matrixStatus').textContent=u.matrixHint;
  if($('#scatterStatus'))$('#scatterStatus').textContent=u.scatterHint;
  if($('#crossTaskCanvas'))$('#crossTaskCanvas').setAttribute('aria-label',`${u.crossAxisY}; x: ${u.crossAxisX}; ${u.crossMeasured}; ${u.crossPrediction}`);
  if($('#homeBrand')){
    $('#homeBrand').setAttribute('href',locale==='en'?'/en':'/cn');
    $('#homeBrand').setAttribute('aria-label',locale==='en'?'Back to PHYSICS OF AI':'返回主页');
  }
  if($('#metricLabel1'))$('#metricLabel1').textContent=u.action;
  if($('#metricLabel2'))$('#metricLabel2').textContent=u.downhill;
  if($('#metricLabel3'))$('#metricLabel3').textContent=u.states;
  if($('#sortButton')&&(typeof actionState==='undefined'||!actionState.running))$('#sortButton').textContent=u.play;
  if($('#biasPlay')&&(typeof biasState==='undefined'||!biasState.running))$('#biasPlay').textContent=u.biasPlay;
}
applyLocale(new URLSearchParams(location.search).get('lang')||localStorage.getItem('detailed-balance-locale')||'en');

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => observer.observe(el));

function setupCanvas(canvas, height = 300) {
  if (!canvas) return null;
  if (canvas.__ctx) { canvas.__resize?.(); return canvas.__ctx; }
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(20, rect.width || 500);
    const h = Math.max(20, rect.height || height);
    canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.__size = { w, h };
    canvas.__draw?.();
  };
  canvas.__resize = resize;
  new ResizeObserver(resize).observe(canvas); resize();
  canvas.__ctx = ctx;
  return ctx;
}
const palette = { blue: '#4f96cc', deep: '#173b62', gold: '#efb83e', muted: '#9db6c9', violet: '#7162c8', grid: 'rgba(63,119,168,.14)' };
const line = (ctx, a, b, color, width = 1, dash = []) => { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a.px ?? a.x, a.py ?? a.y); ctx.lineTo(b.px ?? b.x, b.py ?? b.y); ctx.stroke(); ctx.restore(); };

// The theory and experiment visuals are generated from the real IdeaSearchFitter database.
// These state holders are declared with `var` because the initial locale pass
// runs before the data/animation declarations below.  `var` keeps the guards
// in applyLocale/updateDynamicLabels safe during first-page startup; the
// values themselves are still assigned exactly once during initialization.
var graphData = null;
var crossTaskData = null;
var gptWordData = null;
var graphPromise = null;
function loadGraphData(){
  if(graphData)return Promise.resolve(graphData);
  if(graphPromise)return graphPromise;
  // Version the derived data URL as well as the script URL.  Static hosts may
  // otherwise keep an older JSON asset that predates the frame-wise Pearson
  // trace, which must never be rendered as a misleading zero.
  graphPromise=fetch('assets/data/ideasearchfitter-pruned.json?v=20260920-symmetric-pearson-v3',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error(`Graph request: HTTP ${response.status}`);return response.json();})
    .then(data=>{
      if(!data?.frames?.length||!data?.nodes?.length)throw new Error('Missing graph frames or nodes');
      graphData=data;
      // The static landing view opens on the published terminal frame. Any
      // deliberate interaction (playback, dragging, or reset) then uses the
      // ordinary 0→99 presentation timeline.
      drawDag();drawTheoryMatrix();drawMatrix();drawSort();drawAction();drawScatter();drawCrossTask();drawBias();updateActionReadout();updateBias();
      $('#sortStatus').textContent=uiText[locale].sortStatus;
      return data;
    })
    .catch(error=>{
      graphData=null;graphPromise=null;
      $('#sortStatus').textContent=uiText[locale].loadError;
      console.error('IdeaSearchFitter visualisation failed:',error);
      return null;
    });
  return graphPromise;
}
// Open the static landing view on the published terminal frame only when no
// interaction happened while the graph JSON was loading. A pending play or
// reset must retain control of the timeline.
loadGraphData().then(data=>{
  if(!data||actionState.requestId!==0||actionState.pending||actionState.running)return;
  actionState.iteration=actionState.steps;
  actionState.plotPosition=actionState.steps;
  actionState.rawOverride=null;
  actionState.playbackElapsed=null;
  renderExperiment();
  drawBias();
  updateActionReadout();
});
const crossTaskPromise = fetch('assets/data/qwen-timeline.json').then(r => r.ok ? r.json() : null).then(data => { crossTaskData=data; drawCrossTask(); return data; }).catch(error => { console.error('Cross-task summary visualisation failed:', error); return null; });
const gptWordPromise = fetch('assets/data/gpt5nano-sum100.json').then(r => r.ok ? r.json() : null).then(data => { gptWordData=data; drawCrossTask(); return data; }).catch(error => { console.error('GPT-5 nano word visualisation failed:', error); return null; });

function drawArrow(ctx, A, B, color, width = 1, head = 7) {
  const ax=A.px ?? A.x, ay=A.py ?? A.y, bx=B.px ?? B.x, by=B.py ?? B.y;
  const angle=Math.atan2(by-ay,bx-ax); const x=bx-Math.cos(angle)*5, y=by-Math.sin(angle)*5;
  ctx.save(); ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(x,y);
  ctx.lineTo(x-Math.cos(angle-.55)*head,y-Math.sin(angle-.55)*head);
  ctx.lineTo(x-Math.cos(angle+.55)*head,y-Math.sin(angle+.55)*head); ctx.closePath(); ctx.fill(); ctx.restore();
}
function norm(values, x) { const lo=Math.min(...values), hi=Math.max(...values); return (x-lo)/(hi-lo || 1); }
function graphPositions(data, w, h) {
  const xs=data.nodes.map(n=>n.x), vs=data.nodes.map(n=>n.v); const out={};
  data.nodes.forEach((n,i)=>{ const jitter=((i*17)%9-4)*.004; out[n.id]={px:58+norm(xs,n.x)*(w-92), py:h-40-(norm(vs,n.v)+jitter)*(h-78), id:n.id, node:n}; });
  return out;
}
function drawDag() {
  const canvas=$('#dagCanvas'); if(!canvas || !graphData)return;
  const ctx=setupCanvas(canvas); canvas.__draw=()=>{
    const {w,h}=canvas.__size; ctx.clearRect(0,0,w,h); ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    const td=graphData.theory, marginX=Math.max(32,w*.06), marginY=28;
    const ys=td.nodes.map(n=>n.y),yMin=Math.min(...ys),yMax=Math.max(...ys);
    const pos=Object.fromEntries(td.nodes.map(n=>{
      const yNorm=(n.y-yMin)/(yMax-yMin||1), yScaled=.14+yNorm*.72;
      return [n.id,{px:marginX+n.x*(w-marginX-28),py:marginY+yScaled*(h-2*marginY)}];
    }));
    const nodeRadius=Math.max(13,Math.min(22,w/18));
    const drawEdge=(e,color,width,dash=[])=>{const A=pos[e.source],B=pos[e.target];if(!A||!B)return;line(ctx,A,B,color,width,dash);drawArrow(ctx,A,B,color,width>1?8:6);};
    graphData.theory.edges.forEach(e=>drawEdge(e,'#2f77ad',4));
    graphData.theory.reverse.forEach(e=>drawEdge(e,'#efb83e',1.8,[7,5]));
    td.nodes.forEach(n=>{
      const P=pos[n.id];
      ctx.beginPath();ctx.arc(P.px,P.py,nodeRadius,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#173b62';ctx.stroke();
      ctx.fillStyle='#173b62';ctx.font=`600 ${Math.max(10,Math.min(14,nodeRadius*.78))}px DM Mono, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.id,P.px,P.py);
    });
  };canvas.__draw();
}

function drawTheoryMatrix(){
  const canvas=$('#theoryMatrix'); if(!canvas||!graphData?.theory)return;
  const ctx=setupCanvas(canvas); canvas.__draw=()=>{
    const fitted=Object.fromEntries(graphData.nodes.map(node=>[node.id,node.v]));
    const {w,h}=canvas.__size, ids=[...graphData.theory.order].sort((a,b)=>fitted[a]-fitted[b] || a.localeCompare(b)), n=ids.length;
    const p={l:68,r:18,t:54,b:72}, size=Math.min(w-p.l-p.r,h-p.t-p.b), cell=size/n;
    const vals=Object.fromEntries(ids.map(r=>[r,Object.fromEntries(ids.map(c=>[c,0]))]));
    [...graphData.theory.edges,...graphData.theory.reverse].forEach(e=>{ if(vals[e.target]?.[e.source]!==undefined) vals[e.target][e.source]=e.t; });
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    const valueFont=Math.max(6.5,Math.min(12,cell*.25));
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      const v=vals[ids[i]][ids[j]], t=Math.min(1,v/.3);
      ctx.fillStyle=v?mix('#eaf6ff','#2f77ad',t):'#edf2f5';ctx.fillRect(p.l+j*cell,p.t+i*cell,Math.max(1,Math.floor(cell-1)),Math.max(1,Math.floor(cell-1)));
      if(v>0){
        ctx.fillStyle=t>.54?'#fff':'#173b62';ctx.font=`${valueFont}px DM Mono, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v.toFixed(2),p.l+(j+.5)*cell,p.t+(i+.52)*cell);
      }
    }
    ctx.strokeStyle='rgba(23,59,98,.35)';ctx.strokeRect(p.l,p.t,size,size);
    // Self-transitions are not measured in this kernel. Cross the diagonal
    // explicitly instead of letting empty cells look like zero probability.
    ctx.save();ctx.strokeStyle='#d95f59';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(p.l,p.t);ctx.lineTo(p.l+size,p.t+size);ctx.stroke();ctx.restore();

    // State labels make the row/column convention explicit. Rows are targets f,
    // columns are sources g, both in the same fitted-potential order.
    ctx.fillStyle='#173b62';ctx.font=`${Math.max(7,Math.min(12,cell*.24))}px DM Mono, monospace`;ctx.textBaseline='middle';
    ids.forEach((id,i)=>{
      ctx.textAlign='center';ctx.fillText(id,p.l+(i+.5)*cell,p.t-20);
      ctx.textAlign='right';ctx.fillText(id,p.l-10,p.t+(i+.5)*cell);
    });
    ctx.textAlign='center';ctx.font='11px DM Mono, monospace';ctx.fillStyle='#68809a';ctx.fillText(uiText[locale].matrixAxis,p.l+size/2,Math.min(h-14,p.t+size+31));
    ctx.save();ctx.translate(15,p.t+size/2);ctx.rotate(-Math.PI/2);ctx.fillText(uiText[locale].matrixRow,0,0);ctx.restore();
    ctx.textAlign='left';ctx.font='10px DM Mono, monospace';ctx.fillStyle='#68809a';ctx.fillText('T(f|g)',p.l,p.t-39);

    canvas.dataset.order=ids.join(',');canvas.dataset.sorted='true';
  };canvas.__draw();
}

const matrixState={ordered:true};
var actionState={running:false,pending:false,requestId:0,iteration:0,plotPosition:0,rawOverride:null,playbackElapsed:0,playbackDuration:0,steps:99,view:'sort',timer:null,stepMs:120};
function organizeExperimentWorkspace(){
  const stage=$('#experimentStage'),detail=$('.experiment-detail-grid');
  if(!stage||!detail||stage.dataset.organized)return;
  ['sortView','matrixView','scatterView'].forEach(id=>{const view=$('#'+id);if(view)stage.appendChild(view);});
  detail.remove();stage.dataset.organized='true';
}
organizeExperimentWorkspace();
function mix(a,b,t){const ah=parseInt(a.slice(1),16),bh=parseInt(b.slice(1),16);return 'rgb('+[16,8,0].map(shift=>Math.round(((ah>>shift)&255)*(1-t)+((bh>>shift)&255)*t)).join(',')+')';}
function rawRelaxationPosition(displayPos){
  // A single smooth, quantile-matched logistic map gives the visible early
  // relaxation more room while compressing the nearly-flat L-BFGS-B tail.
  // There is no hidden breakpoint or clipped branch: all 240 source callbacks
  // remain reachable.
  const p=Math.max(0,Math.min(actionState.steps,displayPos))/actionState.steps;
  const rawMax=Math.max(1,(graphData?.frames?.length||241)-1);
  if(p<=0)return 0;
  if(p>=1)return rawMax;
  const logit=.2259*Math.log(p)+2.4407*(-Math.log1p(-p))-5.9445;
  return rawMax/(1+Math.exp(-logit));
}
function frameAt(displayPos,rawOverride=null){
  const raw=Number.isFinite(rawOverride)?rawOverride:rawRelaxationPosition(displayPos),i=Math.floor(raw),t=raw-i;
  const a=graphData.frames[Math.min(i,graphData.frames.length-1)], b=graphData.frames[Math.min(i+1,graphData.frames.length-1)];
  return {v:a.v.map((v,j)=>v+(b.v[j]-v)*t),action:a.action+(b.action-a.action)*t,raw};
}
function currentFrame(){
  return frameAt(actionState.plotPosition,actionState.rawOverride);
}
function fullPearsonAtRaw(raw){
  // The canvas is a readable 70-state slice, while this readout uses the
  // complete IdeaSearchFitter reciprocal-pair population. The data builder
  // stores one statistic for every recorded optimizer frame; interpolate it
  // at the same raw-frame position used for the visible potentials.
  const trace=graphData?.meta?.fullPearsonByFrame;
  if(!Array.isArray(trace)||!trace.length){
    const fallback=Number(graphData?.meta?.fullPearson);
    return Number.isFinite(fallback)?fallback:null;
  }
  const bounded=Math.max(0,Math.min(trace.length-1,Number(raw)||0));
  const i=Math.floor(bounded),j=Math.min(i+1,trace.length-1),t=bounded-i;
  const a=Number(trace[i]),b=Number(trace[j]);
  if(Number.isFinite(a)&&Number.isFinite(b))return a+(b-a)*t;
  if(Number.isFinite(a))return a;
  if(Number.isFinite(b))return b;
  return null;
}
function activeCanvas(id,draw){
  const canvas=$(id); if(!canvas||!graphData||!canvas.getClientRects().length)return;
  const ctx=setupCanvas(canvas);canvas.__draw=()=>draw(ctx,canvas.__size,canvas);canvas.__draw();
}
function drawMatrix(){
  activeCanvas('#matrixCanvas',(ctx,{w,h},canvas)=>{
    // Twelve measured states are large enough to read at phone width; the
    // original s01–s02–… order is the unsorted reference and is not a second tab.
    const states=graphData.matrixIDs.slice(0,12),n=states.length,v=currentFrame().v;
    const values=Object.fromEntries(graphData.nodes.map((node,i)=>[node.id,v[i]]));
    const order=[...states].sort((a,b)=>values[a]-values[b]);
    const l=47,t=54,size=Math.min(w-l-20,h-t-46),cell=size/n;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    order.forEach((target,i)=>order.forEach((source,j)=>{
      const row=graphData.matrixIDs.indexOf(target),col=graphData.matrixIDs.indexOf(source),value=graphData.matrix[row][col]||0;
      ctx.fillStyle=value?mix('#eaf6ff','#2f77ad',Math.min(1,value/.3)):'#e8eef3';
      ctx.fillRect(l+j*cell,t+i*cell,cell-1,cell-1);
      if(value&&cell>32){ctx.font='12px monospace';ctx.fillStyle=value>.16?'white':palette.deep;ctx.textAlign='center';ctx.fillText(value.toFixed(2),l+(j+.5)*cell,t+(i+.65)*cell);}
    }));
    // The diagonal is f=g. Self-transitions were not measured, so mark this
    // region explicitly rather than presenting blank cells as zero T.
    ctx.save();ctx.strokeStyle='#d95f59';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(l+size,t+size);ctx.stroke();ctx.restore();
    ctx.fillStyle=palette.deep;ctx.font='12px monospace';ctx.textAlign='center';
    order.forEach((id,i)=>{ctx.save();ctx.translate(l+(i+.5)*cell,t-9);ctx.rotate(-Math.PI/2);ctx.fillText(id,0,0);ctx.restore();ctx.textAlign='right';ctx.fillText(id,l-8,t+(i+.65)*cell);ctx.textAlign='center';});
    ctx.textAlign='left';ctx.font='13px sans-serif';ctx.fillStyle='#58758e';ctx.fillText(uiText[locale].matrixLegend,l,t+size+30);
    canvas.dataset.order=order.join(',');canvas.dataset.iteration=actionState.iteration.toFixed(2);canvas.dataset.sorted='true';
    canvas.onclick=event=>{const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;if(x<l||y<t||x>=l+size||y>=t+size)return;const target=order[Math.floor((y-t)/cell)],source=order[Math.floor((x-l)/cell)];if(target===source){$('#matrixStatus').textContent='f='+target+' · g='+source+' · '+uiText[locale].unmeasured;return;}const value=graphData.matrix[graphData.matrixIDs.indexOf(target)][graphData.matrixIDs.indexOf(source)]||0;$('#matrixStatus').textContent='f='+target+' · g='+source+' · T(f|g)='+value.toFixed(4);};
    $('#matrixStatus').textContent=uiText[locale].matrixHint;
  });
}
function drawSort(){
  activeCanvas('#sortCanvas',(ctx,{w,h},canvas)=>{
    const values=currentFrame().v,xs=graphData.nodes.map(n=>n.logMSE);
    const p={l:60,r:20,t:48,b:36},P={};
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    graphData.nodes.forEach((n,i)=>P[n.id]={x:p.l+norm(xs,n.logMSE)*(w-p.l-p.r),y:h-p.b-norm(values,values[i])*(h-p.t-p.b),v:values[i]});
    for(let i=0;i<5;i++)line(ctx,{x:p.l,y:p.t+i*(h-p.t-p.b)/4},{x:w-p.r,y:p.t+i*(h-p.t-p.b)/4},palette.grid);
    graphData.edges.filter(e=>e.t>=.05).forEach(e=>{const a=P[e.source],b=P[e.target],color=a.v>b.v?'#47a66f':'#d95f59';line(ctx,a,b,color,Math.max(.8,e.t*8));drawArrow(ctx,a,b,color,1,5);});
    graphData.nodes.forEach(n=>{const a=P[n.id];ctx.beginPath();ctx.arc(a.x,a.y,4.5,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle=palette.deep;ctx.lineWidth=1.3;ctx.stroke();});
    ctx.textAlign='left';ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.fillText('log₁₀(MSE) →',Math.max(44,w-150),h-12);
    ctx.save();ctx.translate(17,h/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='11px sans-serif';ctx.fillText(uiText[locale].potentialAxis,0,0);ctx.restore();
    canvas.__points=P;canvas.dataset.iteration=actionState.iteration.toFixed(2);
    canvas.onclick=event=>{const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const node=graphData.nodes.find(n=>Math.hypot(P[n.id].x-x,P[n.id].y-y)<10);if(node)$('#sortStatus').textContent=node.id+' · '+node.expression+' · samples '+node.samples+' · V='+P[node.id].v.toFixed(3);};
  });
}
function reciprocalPairs(){
  // build_demo_data.py follows the published plot.py procedure: from all
  // Eligible reciprocal pairs from the fixed 70-state display slice. The
  // generator stores a seeded, uniformly sampled dense panel; only ΔV moves
  // during replay while measured log(T/T) remains fixed.
  return graphData?.scatter||[];
}
function drawScatter(){
  activeCanvas('#scatterCanvas',(ctx,{w,h},canvas)=>{
    const pairs=reciprocalPairs(),p={l:68,r:18,t:52,b:48};
    const frame=currentFrame(),index=Object.fromEntries(graphData.nodes.map((n,i)=>[n.id,i]));
    const points=pairs.map(d=>({...d,x:(frame.v[index[d.source]]-frame.v[index[d.target]])*(d.flip||1)}));
    // Fixed bounds keep the moving ΔV cloud on the same ruler throughout
    // the recorded optimization playback.
    const limit=8;
    const sx=x=>p.l+(x+limit)/(2*limit)*(w-p.l-p.r),sy=y=>h-p.b-(y+limit)/(2*limit)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    line(ctx,{x:p.l,y:sy(0)},{x:w-p.r,y:sy(0)},palette.grid);line(ctx,{x:sx(0),y:p.t},{x:sx(0),y:h-p.b},palette.grid);
    line(ctx,{x:sx(-limit),y:sy(-limit)},{x:sx(limit),y:sy(limit)},palette.deep,1.8,[6,5]);
    [-limit,0,limit].forEach(t=>{ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(t,sx(t),h-p.b+18);ctx.textAlign='right';ctx.fillText(t,p.l-8,sy(t)+4);});
    points.forEach(d=>{ctx.beginPath();ctx.arc(sx(d.x),sy(d.y),3.6,0,Math.PI*2);ctx.fillStyle='rgba(47,119,173,.65)';ctx.fill();});
    ctx.textAlign='right';ctx.fillStyle='#58758e';ctx.font='12px sans-serif';ctx.fillText('ΔV = V(f) − V(g)',w-p.r,h-10);
    ctx.save();ctx.translate(17,h/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='10px monospace';ctx.fillText(uiText[locale].scatterAxis,0,0);ctx.restore();
    canvas.dataset.iteration=String(Math.round(frame.raw));canvas.dataset.displayIteration=actionState.iteration.toFixed(2);canvas.dataset.pairs=pairs.length;canvas.dataset.x=JSON.stringify(points.map(d=>d.x));
    canvas.onclick=event=>{
      const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      let nearest=null,best=Infinity;
      points.forEach((d,i)=>{const px=sx(d.x),py=sy(d.y),distance=Math.hypot(px-x,py-y);if(distance<best){best=distance;nearest={d,i};}});
      if(!nearest||best>14){$('#scatterStatus').textContent=uiText[locale].scatterHint;return;}
      const d=nearest.d;
      $('#scatterStatus').textContent=`${d.source} → ${d.target} · ΔV=${d.x.toFixed(3)} · log[T(g←f)/T(f←g)]=${d.y.toFixed(3)}`;
    };
  });
}
function displayPositionForRaw(rawTarget){
  let lo=0,hi=actionState.steps;
  for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(rawRelaxationPosition(mid)<rawTarget)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
function drawAction(){
  activeCanvas('#actionCanvas',(ctx,{w,h},canvas)=>{
    const frames=Array.from({length:actionState.steps+1},(_,i)=>frameAt(i)),p={l:62,r:20,t:45,b:58},hi=frames[0].action,lo=Math.min(...frames.map(frame=>frame.action));
    const sx=i=>p.l+i/actionState.steps*(w-p.l-p.r),sy=a=>h-p.b-(a-lo)/(hi-lo||1)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);ctx.font='13px monospace';ctx.fillStyle=palette.deep;ctx.textAlign='left';
    [0,.5,1].forEach(t=>{line(ctx,{x:p.l,y:sy(t)},{x:w-p.r,y:sy(t)},palette.grid);ctx.fillText(t.toFixed(1),12,sy(t)+4);});
    for(let i=1;i<frames.length;i++)line(ctx,{x:sx(i-1),y:sy(frames[i-1].action)},{x:sx(i),y:sy(frames[i].action)},'#c7dbe9',2);
    const plotPosition=actionState.plotPosition;
    for(let i=1;i<=Math.floor(plotPosition);i++)line(ctx,{x:sx(i-1),y:sy(frames[i-1].action)},{x:sx(i),y:sy(frames[i].action)},'#2f77ad',3);
    const i=Math.floor(plotPosition),now=currentFrame();
    line(ctx,{x:sx(i),y:sy(frames[i].action)},{x:sx(plotPosition),y:sy(now.action)},'#2f77ad',3);
    ctx.beginPath();ctx.arc(sx(plotPosition),sy(now.action),6,0,Math.PI*2);ctx.fillStyle=palette.gold;ctx.fill();
    const ticks=w<420?[0,2,20,240]:[0,1,2,5,20,240];
    ctx.fillStyle='#58758e';
    ticks.forEach((raw,index)=>{
      const display=displayPositionForRaw(raw),x=sx(display);
      line(ctx,{x,y:h-p.b-2},{x,y:h-p.b+4},'#efb83e',1.4);
      ctx.textAlign=index===0?'left':index===ticks.length-1?'right':'center';ctx.fillText(raw,x,h-p.b+23);
    });
    ctx.fillStyle='#58758e';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.fillText(uiText[locale].actualIteration,w-p.r,h-8);
    ctx.save();ctx.translate(17,h/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='11px sans-serif';ctx.fillText(uiText[locale].actionAxis,0,0);ctx.restore();
    canvas.dataset.iteration=String(Math.round(currentFrame().raw));canvas.dataset.displayIteration=actionState.iteration.toFixed(2);
  });
}
function updateActionReadout(){
  if(!graphData)return;const frame=currentFrame(),idx=Object.fromEntries(graphData.nodes.map((n,i)=>[n.id,i]));
  const edges=graphData.edges.filter(e=>e.t>=.05);let down=0;
  edges.forEach(e=>{const delta=frame.v[idx[e.source]]-frame.v[idx[e.target]];if(delta>.03)down++;});
  $('#iterationValue').textContent=Math.round(frame.raw)+' / 240';
  $('#iterationRange').value=actionState.iteration;$('#actionValue').textContent=frame.action.toFixed(3);
  const fitStates=Number(graphData.meta?.fitStates||0);
  const fittedCount=fitStates.toLocaleString('en-US');
  $('#metricLabel1').textContent=uiText[locale].action;
  $('#metricLabel3').textContent=uiText[locale].states;
  if(actionState.view==='sort'){
    const downhillShare=edges.length?down/edges.length:0;
    $('#metricLabel2').textContent=uiText[locale].downhill;
    $('#secondaryValue').textContent=(downhillShare*100).toFixed(1)+'%';
    $('#countValue').textContent=`${graphData.nodes.length} / ${fittedCount}`;
  }else if(actionState.view==='matrix'){
    const states=graphData.matrixIDs.slice(0,12),values=Object.fromEntries(graphData.nodes.map((node,i)=>[node.id,frame.v[i]]));
    const order=[...states].sort((a,b)=>values[a]-values[b]);
    let upperSq=0,offDiagonalSq=0;
    order.forEach((target,i)=>order.forEach((source,j)=>{
      if(i===j)return;
      const row=graphData.matrixIDs.indexOf(target),col=graphData.matrixIDs.indexOf(source),value=graphData.matrix[row]?.[col]||0;
      offDiagonalSq+=value*value;if(i<j)upperSq+=value*value;
    }));
    const upperShare=offDiagonalSq?Math.sqrt(upperSq/offDiagonalSq):0;
    $('#metricLabel2').textContent=uiText[locale].frob;
    $('#secondaryValue').textContent=(upperShare*100).toFixed(1)+'%';
    $('#countValue').textContent=`${states.length} / ${fittedCount}`;
  }else{
    $('#metricLabel2').textContent='Pearson r';
    const pearson=fullPearsonAtRaw(frame.raw);
    $('#secondaryValue').textContent=Number.isFinite(pearson)?pearson.toFixed(2):'—';
    $('#countValue').textContent=`${graphData.nodes.length} / ${fittedCount}`;
  }
}
function renderExperiment(){drawSort();drawMatrix();drawScatter();drawAction();updateActionReadout();}
function stopAction(){
  actionState.running=false;actionState.pending=false;actionState.requestId++;
  cancelAnimationFrame(actionState.timer);actionState.timer=null;
  $('#sortButton').textContent=uiText[locale].play;$('#sortButton').setAttribute('aria-busy','false');
}
const PLAYBACK_OPENING_MS=200;
function playbackSchedule(){
  const openingEnd=displayPositionForRaw(1);
  return {openingEnd,total:PLAYBACK_OPENING_MS+(actionState.steps-openingEnd)*actionState.stepMs};
}
function playbackStateAtElapsed(elapsed,schedule){
  const bounded=Math.max(0,Math.min(schedule.total,elapsed));
  let plot,raw;
  if(bounded<=PLAYBACK_OPENING_MS){
    const openingFraction=bounded/PLAYBACK_OPENING_MS;
    raw=openingFraction;
    plot=schedule.openingEnd*openingFraction;
  }else{
    plot=schedule.openingEnd+(bounded-PLAYBACK_OPENING_MS)/actionState.stepMs;
    raw=rawRelaxationPosition(Math.min(actionState.steps,plot));
  }
  return {progress:actionState.steps*bounded/schedule.total,plot,raw,elapsed:bounded};
}
async function startAction(){
  if(actionState.running||actionState.pending){stopAction();return;}
  const requestId=++actionState.requestId;
  if(!graphData){
    actionState.pending=true;
    $('#sortButton').textContent=uiText[locale].prepare;$('#sortButton').setAttribute('aria-busy','true');
    const data=await loadGraphData();
    // Reset, a second click or a slider change cancels this pending intent.
    if(requestId!==actionState.requestId)return;
    actionState.pending=false;$('#sortButton').setAttribute('aria-busy','false');
    if(!data){$('#sortButton').textContent=uiText[locale].retry;return;}
  }
  if(actionState.iteration>=actionState.steps){
    actionState.iteration=0;actionState.plotPosition=0;actionState.rawOverride=null;actionState.playbackElapsed=0;
  }
  actionState.running=true;$('#sortButton').textContent=uiText[locale].pause;
  // Traverse only recorded iteration 0→1 in 0.2 s. Keep 1→2 at the normal
  // presentation pace so the main deformation remains visible. Only the playback
  // clock changes: the raw mapping, interpolation and final data stay intact.
  const schedule=playbackSchedule();
  actionState.playbackDuration=schedule.total;
  let elapsed=Number.isFinite(actionState.playbackElapsed)
    ? actionState.playbackElapsed
    : actionState.iteration/actionState.steps*schedule.total;
  const applyPlaybackState=()=>{
    const state=playbackStateAtElapsed(elapsed,schedule);
    actionState.iteration=state.progress;
    actionState.plotPosition=state.plot;
    actionState.rawOverride=state.raw;
    actionState.playbackElapsed=state.elapsed;
  };
  applyPlaybackState();renderExperiment();
  let previous=performance.now();
  const tick=now=>{elapsed+=Math.max(0,Math.min(100,now-previous));previous=now;applyPlaybackState();renderExperiment();if(elapsed<schedule.total&&actionState.running)actionState.timer=requestAnimationFrame(tick);else stopAction();};
  actionState.timer=requestAnimationFrame(tick);
}
$('#sortButton')?.addEventListener('click',startAction);
$('#resetButton')?.addEventListener('click',()=>{stopAction();actionState.iteration=0;actionState.plotPosition=0;actionState.rawOverride=null;actionState.playbackElapsed=0;renderExperiment();});
$('#iterationRange')?.addEventListener('input',event=>{stopAction();actionState.iteration=Number(event.target.value);actionState.plotPosition=actionState.iteration;actionState.rawOverride=null;actionState.playbackElapsed=null;renderExperiment();});
$$('.experiment-tab').forEach(tab=>tab.addEventListener('click',()=>{
  actionState.view=tab.dataset.experiment;
  $$('.experiment-tab').forEach(item=>{item.classList.toggle('is-active',item===tab);item.setAttribute('aria-selected',item===tab?'true':'false');});
  $$('.experiment-view').forEach(view=>{view.hidden=view.id!==actionState.view+'View';view.classList.toggle('is-active',!view.hidden);});
  renderExperiment();
}));
$$('.task-tab').forEach(tab=>tab.addEventListener('click',()=>{
  $$('.task-tab').forEach(item=>{item.classList.toggle('is-active',item===tab);item.setAttribute('aria-selected',item===tab?'true':'false');});
  $$('.task-panel').forEach(panel=>panel.hidden=panel.id!=='task-'+tab.dataset.task);
}));

let selectedRobustTask = 'idea';
// A task with only a handful of reciprocal pairs is useful for an audit, but
// not for the public comparison figure: the cloud would invite a stronger
// visual conclusion than the data can support. Keep the threshold explicit
// so the selector and its provenance stay synchronized.
const MIN_PUBLIC_TASK_PAIRS = 15;
const PUBLIC_TASK_POINTS = 64;
function seededTaskSample(points, target=PUBLIC_TASK_POINTS, seedText='task'){
  if(!Array.isArray(points)||points.length<=target)return points||[];
  let seed=0; for(const ch of seedText) seed=(seed*31+ch.charCodeAt(0))>>>0;
  const a=points.map((point,index)=>({point,index,key:(seed=(1664525*seed+1013904223)>>>0)}));
  a.sort((x,y)=>x.key-y.key);
  return a.slice(0,target).map(item=>item.point);
}
function drawCrossTask(){
  if(!crossTaskData || !graphData)return;
  const select=$('#robustTaskSelect');
  const allDatasets=[{id:'idea',label:'IdeaSearchFitter',model:'Mixed Model',
    problem:'从一个符号拟合问题的表达式出发，生成新的候选表达式。',
    r:.92,pairs:1317,shown:graphData.scatter.length,points:graphData.scatter},
    ...(gptWordData?[gptWordData]:[]),
    ...crossTaskData.tasks];
  const datasets=allDatasets.filter(item=>item.id==='idea' || item.pairs>=MIN_PUBLIC_TASK_PAIRS);
  if(!datasets.some(item=>item.id===selectedRobustTask))selectedRobustTask=datasets[0].id;
  if(!select.options.length){
    datasets.forEach(item=>select.add(new Option(item.label,item.id)));
    select.addEventListener('change',()=>{selectedRobustTask=select.value;drawCrossTask();});
  } else {
    const current=[...select.options].map(option=>option.value);
    if(current.join('|')!==datasets.map(item=>item.id).join('|')){
      select.replaceChildren(...datasets.map(item=>new Option(item.label,item.id)));
    }
  }
  const task=datasets.find(item=>item.id===selectedRobustTask) || datasets[0];
  const canvas=$('#crossTaskCanvas'),ctx=setupCanvas(canvas,360);
  canvas.__draw=()=>{
    const {w,h}=canvas.__size,p={l:68,r:22,t:90,b:62},u=uiText[locale];
    const points=seededTaskSample(task.points,PUBLIC_TASK_POINTS,task.id),limit=Math.ceil(Math.max(1,...points.flatMap(d=>[Math.abs(d.x),Math.abs(d.y)])));
    const sx=x=>p.l+(x+limit)/(2*limit)*(w-p.l-p.r);
    const sy=y=>h-p.b-(y+limit)/(2*limit)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    line(ctx,{x:sx(-limit),y:sy(-limit)},{x:sx(limit),y:sy(limit)},palette.deep,1.8,[6,5]);
    line(ctx,{x:p.l,y:sy(0)},{x:w-p.r,y:sy(0)},palette.grid);
    line(ctx,{x:sx(0),y:p.t},{x:sx(0),y:h-p.b},palette.grid);
    points.forEach(d=>{ctx.beginPath();ctx.arc(sx(d.x),sy(d.y),3,0,Math.PI*2);ctx.fillStyle='rgba(47,119,173,.55)';ctx.fill();});
    [-limit,0,limit].forEach(t=>{
      ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(t,sx(t),h-p.b+19);
      ctx.textAlign='right';ctx.fillText(t,p.l-8,sy(t)+4);
    });
    // Keep the plot self-explanatory: the y-axis is the measured log ratio,
    // dots are measured reciprocal pairs, and the dashed diagonal is the
    // detailed-balance prediction y=x.
    ctx.textAlign='left';ctx.fillStyle=palette.deep;ctx.font='600 13px sans-serif';
    ctx.fillText(u.crossAxisY,p.l,22);
    const legendY=43;
    ctx.save();ctx.strokeStyle=palette.deep;ctx.lineWidth=1.7;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(p.l,legendY);ctx.lineTo(p.l+23,legendY);ctx.stroke();ctx.restore();
    ctx.font='11px sans-serif';ctx.fillStyle='#58758e';ctx.fillText(u.crossPrediction,p.l+31,legendY+4);
    const dotX=w<500?p.l:Math.min(w-190,Math.max(p.l+190,w*.52));
    const dotY=w<500?63:legendY;
    ctx.beginPath();ctx.arc(dotX,dotY-1,3.5,0,Math.PI*2);ctx.fillStyle='rgba(47,119,173,.7)';ctx.fill();
    ctx.fillStyle='#58758e';ctx.fillText(u.crossMeasured,dotX+11,dotY+4);
    ctx.save();ctx.translate(17,(p.t+h-p.b)/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='11px sans-serif';ctx.fillStyle='#58758e';ctx.fillText(u.crossAxisY,0,0);ctx.restore();
    ctx.textAlign='right';ctx.fillStyle='#58758e';ctx.font='11px sans-serif';ctx.fillText(u.crossAxisX,w-p.r,h-10);
    canvas.dataset.task=task.id;canvas.dataset.points=points.length;
    canvas.dataset.source=task.id==='idea'
      ?'IdeaSearchFitter published plot sample'
      :task.id==='gpt5nano_sum100'?task.source:'public derived task slice';
  };
  canvas.__draw();
  const list=$('#crossTaskList');list.replaceChildren();
  const heading=document.createElement('h4');heading.textContent=task.label;
  const problem=document.createElement('p');problem.textContent=locale==='en'?(taskProblemEnglish[task.id]||task.problem):task.problem;
  const model=document.createElement('p');model.className='task-model';model.textContent=task.model;
  const statistic=document.createElement('strong');statistic.className='task-r';statistic.textContent='r = '+task.r.toFixed(2);
  const count=document.createElement('p');count.textContent=task.pairs.toLocaleString('en-US')+' '+uiText[locale].pairs+' '+Math.min(PUBLIC_TASK_POINTS,task.points.length)+' '+uiText[locale].point;
  list.append(heading,problem,model,statistic,count);
  drawModelTimeline();
}
function drawModelTimeline(){
  const canvas=$('#timelineCanvas'),ctx=setupCanvas(canvas,340);
  canvas.__draw=()=>{
    const {w,h}=canvas.__size,p={l:w<400?39:54,r:w<400?27:42,t:48,b:72};
    const rows=crossTaskData.timeline;
    // Each task contributes a Pearson r between its log forward/reverse
    // ratio and fitted ΔV.  The exported timeline metric is
    // sum(n_t * r_t) / sum(n_t), where n_t is that task's qualified
    // bidirectional-state-pair count; the log values themselves are not
    // used as weights.
    const metric='pair_weighted_mean';
    const label=uiText[locale].taskR;
    const values=rows.map(row=>Number(row[metric]));
    const [yMin,yMax]=[.65,.9];
    const sx=i=>p.l+i/Math.max(1,rows.length-1)*(w-p.l-p.r),sy=v=>h-p.b-(v-yMin)/(yMax-yMin)*(h-p.t-p.b);
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    [.65,.7,.75,.8,.85,.9].forEach(v=>{
      line(ctx,{x:p.l,y:sy(v)},{x:w-p.r,y:sy(v)},palette.grid);
      ctx.fillStyle='#58758e';ctx.font='12px monospace';ctx.textAlign='right';ctx.fillText(v.toFixed(2),p.l-7,sy(v)+4);
    });
    for(let i=1;i<rows.length;i++)line(ctx,{x:sx(i-1),y:sy(values[i-1])},{x:sx(i),y:sy(values[i])},palette.blue,2.5);
    rows.forEach((row,i)=>{
      const x=sx(i),y=sy(values[i]);
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=palette.gold;ctx.fill();ctx.strokeStyle=palette.deep;ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=palette.deep;ctx.font='600 12px monospace';ctx.textAlign='center';ctx.fillText(values[i].toFixed(2),x,y-14);
      // Keep the full published model name visible. On a narrow canvas split
      // only at hyphens; no Q3/Q3.7 abbreviations are introduced.
      const chunks=row.model.split('-');
      ctx.fillStyle='#58758e';ctx.font=(w<400?'8':'10')+'px monospace';
      const lines=[]; let current='';
      chunks.forEach((chunk,index)=>{
        const candidate=current?`${current}-${chunk}`:chunk;
        if(current && ctx.measureText(candidate).width>(w<400?74:145)){lines.push(current);current=chunk;}else current=candidate;
        if(index===chunks.length-1&&current)lines.push(current);
      });
      ctx.textAlign=i===0?'left':i===rows.length-1?'right':'center';
      lines.slice(0,3).forEach((text,lineIndex)=>ctx.fillText(text,i===0?p.l:i===rows.length-1?w-p.r:x,h-p.b+23+lineIndex*14));
    });
    ctx.fillStyle=palette.deep;ctx.font='600 14px sans-serif';ctx.textAlign='left';
    ctx.fillText(label,p.l,25);
    canvas.dataset.source='public derived model timeline';
    canvas.dataset.metric=metric;
    canvas.dataset.values=values.map(v=>v.toFixed(6)).join(',');
  };
  canvas.__draw();
}

// Application panel: real-state random walks under a target-domain bias.
// Each temperature uses the same deterministic seed; only the transition weights change.
// The control is a compact numerical parameterisation of the physical range
// β∈[0,∞]. The endpoint is the zero-temperature limit, not an arbitrary cap.
const BIAS_CONTROL_MAX=100;
function betaFromControl(control){
  const u=Math.max(0,Math.min(1,Number(control)/BIAS_CONTROL_MAX));
  return u>=1 ? Infinity : Math.tan(Math.PI*u/2);
}
var biasState={value:0,trajectory:[],running:false,timer:null};
const BIAS_SEED=1731;
let biasAdjacency=null;
function targetScore(node){const d=graphData.nodes;const xs=d.map(n=>n.logMSE),lo=Math.min(...xs),hi=Math.max(...xs);return 1-(node.logMSE-lo)/(hi-lo||1);}
function hitScore(node){if(!graphData||!node)return 0;const vals=graphData.nodes.map(n=>n.v),lo=Math.min(...vals),hi=Math.max(...vals);const potential=1-(node.v-lo)/(hi-lo||1);return Math.max(0,Math.min(1,.55*targetScore(node)+.45*potential));}
function hitColor(score){return mix('#dcecf8','#efb83e',Math.max(0,Math.min(1,score)));}
function getBiasAdjacency(){
  if(biasAdjacency||!graphData)return biasAdjacency;
  const out={};const observed=new Set();
  const add=(source,target,t,kind)=>{(out[source]??=[]).push({source,target,t,kind});};
  graphData.edges.forEach(e=>{add(e.source,e.target,e.t,'observed');observed.add(`${e.source}\u0000${e.target}`);});
  // Assumption B supplies a weak return channel when the public display slice
  // contains only the dominant direction. Its weight is derived from the
  // observed edge; it is a modelled leakage rail, never a new data record.
  graphData.edges.forEach(e=>{if(!observed.has(`${e.target}\u0000${e.source}`))add(e.target,e.source,e.t*.6,'modelled-return');});
  biasAdjacency=out;return out;
}
function sampleTrajectory(h){
  // Keep the original seed and finite walk budget. The walk is allowed to
  // revisit a state at most twice so the path remains readable.
  const outgoing=getBiasAdjacency();let seed=BIAS_SEED;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  let current='s67',path=[current],visits={[current]:1};
  for(let k=0;k<40;k++){
    const choices=(outgoing[current]||[]).filter(e=>(visits[e.target]||0)<3);if(!choices.length)break;
      const weighted=choices.map(e=>{
      const node=graphData.nodes.find(n=>n.id===e.target);
      // β=0 is the unbiased walk. Increasing β continuously favours states
      // with larger target utility; β=∞ is evaluated as the exact zero-
      // temperature limit below, without reversing the preference by hand.
      return targetScore(node);
    });
    let weights;
    if(!Number.isFinite(h)){
      const best=Math.max(...weighted), tolerance=1e-12;
      weights=choices.map((e,i)=>Math.abs(weighted[i]-best)<=tolerance?e.t:0);
    }else{
      const logWeights=choices.map((e,i)=>Math.log(Math.max(e.t,Number.MIN_VALUE))+h*weighted[i]);
      const pivot=Math.max(...logWeights);
      weights=logWeights.map(value=>Math.exp(value-pivot));
    }
    const total=weights.reduce((a,b)=>a+b,0);let r=rand()*total,chosen=choices[choices.length-1];
    for(let i=0;i<choices.length;i++){r-=weights[i];if(r<=0){chosen=choices[i];break;}}
    current=chosen.target;path.push(current);visits[current]=(visits[current]||0)+1;
  }
  return path;
}
// Keep the application view on the original, full-state axes.  The path and
// temperature change, but the coordinate frame stays fixed so the movement is
// comparable across the playback.
function drawBias(){
  const canvas=$('#biasCanvas'); if(!canvas)return;
  const ctx=setupCanvas(canvas,360);
  canvas.__draw=()=>{
    if(!graphData)return;
    const {w,h}=canvas.__size,d=graphData,left=70,right=w-22,top=46,bottom=h-58;
    const xs=d.nodes.map(n=>n.logMSE),values=d.frames.at(-1).v;
    const idx=Object.fromEntries(d.nodes.map((n,i)=>[n.id,i]));
    const minX=Math.min(...xs)-.35,maxX=Math.max(...xs)+.35;
    const minV=Math.min(...values)-2.4,maxV=Math.max(...values)+2.4;
    const sx=x=>left+(x-minX)/(maxX-minX||1)*(right-left);
    const sy=v=>bottom-(v-minV)/(maxV-minV||1)*(bottom-top);
    const P=Object.fromEntries(d.nodes.map(n=>[n.id,{x:sx(n.logMSE),y:sy(values[idx[n.id]])}]));
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#f8fbfe';ctx.fillRect(0,0,w,h);
    for(let i=0;i<=4;i++){const y=top+i*(bottom-top)/4;line(ctx,{x:left,y},{x:right,y},palette.grid,1,[3,4]);}
    line(ctx,{x:left,y:bottom},{x:right,y:bottom},'#87a2b7');
    line(ctx,{x:left,y:top},{x:left,y:bottom},'#87a2b7');
    textCanvas(ctx,'βV ↑',left,top-17);
    const betaLabel=Number.isFinite(biasState.value)?`β = ${biasState.value.toFixed(2)}`:'β = ∞';
    textCanvas(ctx,betaLabel,right,w<420?top+16:top-17,'right');
    textCanvas(ctx,'log₁₀(MSE) →',right,bottom+38,'right');
    const minPotential=d.nodes.reduce((best,n)=>n.v<best.v?n:best,d.nodes[0]);
    const minMSE=Math.min(...xs),pathNodes=pathNodesForBias(d,biasState.trajectory);
    const pathMSE=pathNodes.length?Math.min(...pathNodes.map(n=>n.logMSE)):minMSE;
    const marker=(x,color,dash)=>line(ctx,{x,y:top+2},{x,y:bottom},color,1.6,dash);
    marker(sx(minPotential.logMSE),'#7162c8',[6,5]);
    marker(sx(minMSE),'#b78c22',[3,5]);
    marker(sx(pathMSE),'#d95f59',[]);
    d.edges.filter(e=>e.t>=d.meta.displayThreshold).forEach(e=>{const a=P[e.source],b=P[e.target];if(a&&b)line(ctx,a,b,'rgba(79,150,204,.15)',Math.max(.7,e.t*3));});
    const vals=d.nodes.map(n=>n.v),vlo=Math.min(...vals),vhi=Math.max(...vals);
    d.nodes.forEach(n=>{const q=P[n.id];if(!q)return;ctx.beginPath();ctx.arc(q.x,q.y,3.8,0,Math.PI*2);const potential=1-(n.v-vlo)/(vhi-vlo||1),weighted=Math.max(0,Math.min(1,potential+.12*biasState.value*targetScore(n))),score=Math.max(0,Math.min(1,.55*targetScore(n)+.45*weighted));ctx.fillStyle=mix('#dcecf8','#efb83e',score);ctx.fill();ctx.strokeStyle='#527d9c';ctx.lineWidth=1;ctx.stroke();});
    const path=biasState.trajectory;
    ctx.save();
    for(let i=1;i<path.length;i++){const a=P[path[i-1]],b=P[path[i]];if(a&&b){const t=(i-1)/Math.max(1,path.length-2);arrowCanvas(ctx,a,b,mix('#4f96cc','#d95f59',t),2.3,5);}}
    ctx.restore();
    canvas.dataset.beta=Number.isFinite(biasState.value)?biasState.value.toFixed(2):'Infinity';
    canvas.dataset.bounds=JSON.stringify([minX,maxX,minV,maxV]);
    canvas.dataset.path=path.join(',');
  };
  canvas.__draw();
}
function pathNodesForBias(data,path){return path.map(id=>data.nodes.find(n=>n.id===id)).filter(Boolean);}
function textCanvas(ctx,s,x,y,align='left'){ctx.fillStyle='#173b62';ctx.font='12px DM Mono, monospace';ctx.textAlign=align;ctx.fillText(s,x,y);}
function arrowCanvas(ctx,a,b,color,width=1,head=7){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<2)return;const ux=dx/len,uy=dy/len,x=b.x-ux*5,y=b.y-uy*5;line(ctx,a,b,color,width);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-ux*head+uy*head*.6,y-uy*head-ux*head*.6);ctx.lineTo(x-ux*head-uy*head*.6,y-uy*head+ux*head*.6);ctx.fill();}
function updateBias(){const input=$('#biasRange');if(!input||!graphData)return;biasState.control=Number(input.value);biasState.value=betaFromControl(biasState.control);biasState.trajectory=sampleTrajectory(biasState.value);$('#biasValue').textContent=Number.isFinite(biasState.value)?biasState.value.toFixed(2):'∞';$('#biasTemperature').textContent=biasState.value===0?'T=∞':Number.isFinite(biasState.value)?`T≈${(1/biasState.value).toFixed(3)}`:'T=0';$('#biasDomain').textContent=biasState.value===0?uiText[locale].biasNone:biasState.value===Infinity?uiText[locale].biasZero:uiText[locale].biasContinuous;const pathNodes=pathNodesForBias(graphData,biasState.trajectory),minLogMSE=pathNodes.length?Math.min(...pathNodes.map(n=>n.logMSE)):null;$('#biasHit').textContent=minLogMSE===null?'—':(10**minLogMSE).toPrecision(3);$('#biasCanvas')?.__draw();}
$('#biasRange')?.addEventListener('input',()=>{stopBias();updateBias();});
function stopBias(){biasState.running=false;clearInterval(biasState.timer);const button=$('#biasPlay');if(button)button.textContent=uiText[locale].biasPlay;}
function playBias(){if(!graphData)return;if(biasState.running){stopBias();return;}if(biasState.control>=BIAS_CONTROL_MAX){$('#biasRange').value=0;updateBias();}biasState.running=true;$('#biasPlay').textContent=uiText[locale].pause;biasState.timer=setInterval(()=>{const next=Math.min(BIAS_CONTROL_MAX,biasState.control+1);$('#biasRange').value=next;updateBias();if(next>=BIAS_CONTROL_MAX)stopBias();},90);}
$('#biasPlay')?.addEventListener('click',playBias);
$('#biasReset')?.addEventListener('click',()=>{stopBias();$('#biasRange').value=0;updateBias();});

// Evidence tabs.
$$('.evidence-tab').forEach(tab=>tab.addEventListener('click',()=>{const panel=tab.dataset.panel;$$('.evidence-tab').forEach(item=>{const active=item===tab;item.classList.toggle('is-active',active);item.setAttribute('aria-selected',String(active));});$$('.evidence-panel').forEach(item=>{const active=item.id===`panel-${panel}`;item.hidden=!active;item.classList.toggle('is-active',active);});}));

drawDag(); drawMatrix(); drawSort(); drawScatter(); drawBias(); updateBias();
