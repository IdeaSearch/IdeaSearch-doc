# Detailed Balance 网页风格交接包

这是 IdeaSearch「Detailed Balance」完整静态网页的离线副本，供另一项目参考页面结构、排版、组件、图表和交互风格。包内包含网页源码、数据文件、插图、独立交互图和离线字体。页面内容仅来自 Detailed Balance 网页。

## 离线查看

解压后进入 `detailed_balance_style_handoff` 目录，运行：

```bash
python3 -m http.server 8000
```

在浏览器打开 <http://127.0.0.1:8000>。需要通过本地 HTTP 服务查看；直接双击 `index.html` 会因浏览器对本地文件的限制而影响数据读取或交互。

网页正文、图表、语言切换和本地资源均可离线查看。页面内原有的论文、代码和数据集外链仍指向其原始网站，离线时这些外部链接不可访问。

## 目录

- `index.html`：页面结构及中英文内容
- `styles.css`：页面样式与响应式布局
- `script.js`：语言切换、图表与交互逻辑
- `assets/data/`：页面使用的数据
- `assets/figs/`：本地插图和独立交互式图表
- `assets/fonts/`：离线字体与字体声明
- `favicon.svg`、`favicon.ico`：页面图标
- `LICENSE`、`NOTICE-*.txt`：原项目及随附字体的许可信息

## 字体

网页优先使用包内字体。为保证离线显示，西文字体使用随包提供的兼容 fallback 字体，中文字体使用按本页字符子集化的 Noto Sans SC 与 Noto Serif SC。字体许可证见 `NOTICE-*.txt`。

## 2026-11-15 修订

- 01 动机：三格流程条换成四个智能体（ReAct、Reflexion、FunSearch、Voyager）的循环图 `assets/figs/agent_loops_{zh,en}.png`。图随语言切换；手机端可横向滑动，也可打开大图。
- 02 理论：假设 A 改为“方向只看终点，与路径无关”。两态之间可以有多条路径并存，只保留一条主导路径只是这一条件最简单的可解极限；示意图保留两条路径。骨架图的标题与图注同步修改，05 讨论中的闭环检验改为检验这一条件。
- 记号统一：源为 f、目标为 g，转移写作 𝒯(g←f)；矩阵的行为目标 g、列为源 f。点击读数和数据元信息 `matrixOrientation` 一并修改。
- 03 实验：弛豫图中的转移边加粗，箭头随 𝒯 放大。
- 跨任务检验：列出全部任务及其具体内容；跨模型检验列出任务池。时间线说明改为“加权平均各任务的皮尔逊相关系数”。
- 字体：等宽字体栈加入 Noto Sans SC；中文字体按新文字重新子集化，原有字形全部保留。
- 含公式的中文句子改用成对的 `.i-zh` / `.i-en` 元素，不再经由 `script.js` 的逐文本节点翻译。

## 公式渲染（KaTeX，2026-11-15）

- 网页里的公式统一由 KaTeX 0.16.11 排版，随包放在 `assets/katex/`（`katex.min.css`、`katex.min.js`、woff2 字体、MIT `LICENSE`），完全离线。
- **改公式请改 `index.src.html`，不要直接改 `index.html`。** 源文件中行内公式写作 `\( ... \)`，行间公式写作 `\[ ... \]`。改完在站点根目录运行 `node tools/render_math.mjs`，它会把公式预渲染成静态 HTML 并写入 `index.html`；只需要 Node，不需要联网或安装依赖。
- 运行时生成的读数（如点击图表后的数值）用同一份 `katex.min.js` 渲染。
- canvas 和 SVG 里的数学标签无法使用 KaTeX，改用 KaTeX 自带字体排出：变量用 KaTeX_Math 斜体，花体字母用 KaTeX_Caligraphic，数字和运算符用 KaTeX_Main。

## 2026-11-15 补丁 2

- 理论与讨论改为正面陈述：奖励 R 刻画后训练对转移倾向的重排，方向由终点决定；假设 B 与讨论段删去了辩护式措辞。
- 01 动机图改为页面内代码绘制（SVG + HTML + KaTeX），配色与页面一致：蓝为状态，金为一轮的主生成，灰为框架中的其他步骤。生成器的思路见 `index.src.html` 中的 `loop-grid`；手机端单列。
- 跨任务检验：去掉任务一览网格；选中任务后，散点图和任务卡片下方一横排显示该 agent 的一步：输入（提示词，状态 f 蓝色高亮）→ 模型 → 输出（回复，状态 g 金色高亮）。IdeaSearchFitter 与 GPT-5 nano 用真实转移（GPT-5 nano 的提示词为原文；IdeaSearchFitter 的提示词为转述，回复只显示解析出的表达式）；Qwen 任务为按规则构造的示意例子，卡片上注明。
