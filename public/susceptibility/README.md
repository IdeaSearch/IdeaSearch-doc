# Information Susceptibility 网页

《A Theory of LLM Information Susceptibility》的静态展示页，视觉风格沿用 Detailed Balance 网页（冰蓝底色、深蓝墨色、衬线中文标题、等宽眉题、金色标记 LLM 路径），中英双语切换。

## 查看与部署

- 纯静态页面，没有构建步骤。把整个目录上传到任意静态托管（GitHub Pages、Nginx、对象存储等）即可。
- 数据以 `assets/data/data.js` 的形式内嵌，直接双击 `index.html` 也能离线查看全部图表。
- 默认语言跟随浏览器（中文环境显示中文），右上角可切换；选择会记在浏览器本地。

## 目录

- `index.html`：页面结构与中英文内容（`.zh` / `.en` 成对出现，按 `<html lang>` 切换）
- `styles.css`：样式与响应式布局
- `script.js`：语言切换、导航、全部 canvas 图表与交互
- `assets/data/data.js`：全部图表的数据点（聚合后的均值、标准误、分箱、拟合曲面网格）。页面不含任何位图，所有图表都由这些数据在浏览器中绘制
- `assets/fonts/`：西文 fallback 字体（许可见 `NOTICE-DEJAVU.txt`）
- `tools/`：从原始数据重新生成 `data.js` 所用的聚合脚本
- `favicon.svg`、`favicon.ico`：沿用 Detailed Balance 的图标

## 字体

中文标题与正文字体（Noto Serif SC / Noto Sans SC）从 Google Fonts 加载，加载失败时回落到系统中文字体（苹方、微软雅黑等）。若部署在 Google Fonts 不可达的网络环境，并希望显示与设计一致，可以把这两款字体按本页字符子集化后放进 `assets/fonts/`，并在 `fonts.css` 中声明。

## 设计原则

审阅与修改依据见 `DESIGN_PRINCIPLES.md`（17 条，涵盖论证结构、发布会原则、图表、交互与工程）。

## 结构

动机（线性响应的黑箱）→ 推导（上界与多通道推广）→ 实验（两条预言的检验）→ 应用（嵌套架构、PRBench DMRG 工具与轮次、可观测轨迹优化器）→ 讨论（思维链、异质通道、自我演化）。

## 数据来源

| 板块 | 来源 |
|---|---|
| 03 预言一：排序、AIME（样本数 k）、Tetris | HuggingFace `Nondegeneracy/LLM-Susceptibility-theory`（CC BY 4.0）；AIME 配对差值按 60 道题聚类 |
| 03 预言二：20 个固定配置与嵌套配置的 α | 同上；斜率对 log₂ℬ（AIME 对 log₁₀ 参数量）拟合，区间为误差传递的 ±1.96 SE |
| 04 嵌套 vs 固定（AIME） | 同上 |
| 04 PRBench DMRG 工具比较与响应地形 | Milestone 1 运行记录的逐轨迹检查点：柱图为各工具数的逐轮实测平均分（轨迹提前结束时沿用最后得分）；地形图为原版归档中的逐模型平滑拟合曲面。两图共用模型和轮次控件，页面展示 6 个模型 |
| 04 可观测轨迹优化器 | 优化器基准索引 `real_benchmark_index_20260914.csv`（五篇 PRL）：每百万 token 合格题数，优化器相对随机分配的倍数；warm 处于维护中，未列入。只展示原理与结果，不涉及实现 |
| 05 思维链长度与正确率 | follow-up 归档 PHYBench_TTS：四个非推理模型，按 plot_median_control.py 的逐题中位数归一化、8 个分位数分箱和加权指数拟合重绘；淡色首箱不参与拟合，误差棒采用题目数计算的标准误，阴影为 1σ 拟合带。页面以 HTML canvas 绘制，不嵌入原图 |
| 首屏立体图、01 黑箱响应示意、04 嵌套架构与优化器闭环示意、05 异质通道、自我演化迭代阶梯（动画：自进化 / 塌缩 / 收敛） | 示意图，不是实验数据 |

未入选的数据：0/1 背包（α 的标准误约为 5，无区分度）。

## 重新生成数据

```bash
python3 tools/aggregate_core.py      <HF 数据集目录> core.json
python3 tools/aggregate_phybench.py  <归档>/PHYBench_TTS/data phy.json
python3 tools/aggregate_evidence.py  <HF 数据集目录> core.json phy.json evidence.json
python3 tools/aggregate_applications.py <M1 运行目录> <优化器 benchmark CSV> apps.json   # 优化器结果
python3 tools/make_hero.py hero.svg   # 首屏一维示意图
python3 tools/make_hero_svg.py hero2d.svg wave.svg   # 其中 wave.svg 为动机章的黑箱示意
python3 tools/aggregate_dmrg_turns.py <M1 运行目录> turns.json   # DMRG 逐轮实测分数，写入 data.js 的 m1 字段
python3 tools/aggregate_m1_surface.py <M1 运行目录> surface.json   # 原版拟合曲面，按模型写入 m1.perModel[模型].surface；保留 m1.perTurn
```

再把 core.json 中的 tetris、ranking、aime，evidence.json（phybench 只保留非推理模型）与 apps.json 合并写成 `assets/data/data.js`（`window.SUS_DATA = {...}`）。只用 Python 标准库。

PHYBench 的 fit_cov 为 log(p) = c - d x 中 (d, c) 的绝对加权协方差，由 aggregate_phybench.py 与分箱一起生成。网页保留归档中基于逐题模型评分的正确性判定；这些跨题观测不构成逐次续写干预的因果估计。
