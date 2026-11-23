# Potential emergence in LLM agents: a statistical physics perspective

- 作者 / Authors：宋卓洋、朱华星 / Zhuo-Yang Song, Hua Xing Zhu
- 论文 / Paper：https://arxiv.org/abs/2611.27618
- 封面图 / Cover：`assets/hero-square.png`（1800×1800，透明底，浅色和深色卡片上都可读）

## 项目卡简介 / Card summary

后训练让 LLM 智能体的选择服从一个全局势能。把智能体状态作为中间变量，状态空间上的一个配分函数预言了这一过程，并在两个智能体任务中得到检验。

Post-training organises LLM agents' choices along a global potential. With agent states as intermediate variables, a partition function on the state space predicts this process, tested in two agent tasks.

## 摘要 / Abstract

后训练如何塑造 LLM 智能体的行为，通常从人类偏好或语料统计的角度理解，缺少与训练目标之间的定量联系。我们提出以智能体状态作为中间变量，使后训练可以被测量和预言。从统计物理的视角，我们研究支配 LLM 智能体推理中状态转移的全局势能的涌现。我们引入配分函数来描述理想的 KL 正则化转移分布，并追踪势结构、平均奖励与状态熵。我们在 Qwen3.5-9B 的两个任务上演示这一方法：安全测试选择与物理推理审核。势结构在后训练中按框架的预言增强，奖励与状态熵的联合变化提供一致性证据。加入逐边奖励的对照表明，仅靠奖励提升不足以产生同样的结构。状态因此为后训练如何组织智能体行为提供了定量描述。

How post-training shapes the behaviour of LLM agents is usually understood through human preferences or corpus statistics, without a quantitative link to the training objective. We propose agent states as intermediate variables through which post-training can be measured and predicted. From a statistical physics perspective, we study the emergence of a global potential governing state transitions in LLM agent reasoning. We introduce a partition function to model the ideal KL-regularised transition distribution and track potential structure, mean reward and state entropy. We demonstrate our approach in two Qwen3.5-9B tasks: safety-test selection and physics-reasoning auditing. We observe that the potential structure strengthens during post-training as predicted from our framework, while joint changes in reward and state entropy provide consistency evidence. A control with edge-specific rewards shows that reward improvement alone is insufficient to produce the same structure. States thus provide a quantitative description of how post-training organises agent behaviour.
