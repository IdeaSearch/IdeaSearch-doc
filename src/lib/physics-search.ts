// Searchable public navigation only; never index local research files or the
// separate IdeaSearch documentation collection into the Physics directory.
const entries = [
  { id: "detailed-balance", en: "Detailed balance in large language model-driven agents", cn: "大语言模型驱动智能体中的细致平衡", keywords: "LLM agent potential 势能 智能体", anchor: "" },
  { id: "motivation", en: "Motivation · Semantic states and MCMC", cn: "动机 · 语义状态与 MCMC", keywords: "token microscopic trajectories 微观轨迹 转移通道", anchor: "motivation" },
  { id: "theory", en: "Theory · Assumptions and effective potential", cn: "理论 · 假设与有效势", keywords: "unique path return edges free energy F 唯一路径 回边 自由能 势能", anchor: "theory" },
  { id: "experiment", en: "Experiment · Potential ordering and detailed-balance tests", cn: "实验 · 势能排序与细致平衡检验", keywords: "action optimization matrix tasks models 作用量 优化 矩阵 任务 模型", anchor: "experiment" },
  { id: "application", en: "Application · Biased search", cn: "应用 · 偏置搜索", keywords: "IdeaSearch target bias stationary distribution 目标 偏置 稳态", anchor: "application" },
  { id: "discussion", en: "Discussion · Equilibrium and nonequilibrium", cn: "讨论 · 平衡与非平衡", keywords: "cycles perturbation microscopic macroscopic 闭环 微扰 微观 宏观", anchor: "discussion" },
] as const;

export function physicsSearchResults(query: string, locale: string) {
  const lang = locale === "cn" ? "cn" : "en";
  const terms = query.trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  const base = lang === "cn" ? "/detailed-balance?lang=zh" : "/detailed-balance?lang=en";
  return entries
    .filter((entry) => {
      const text = `${entry.en} ${entry.cn} ${entry.keywords}`.toLocaleLowerCase();
      return terms.every((term) => text.includes(term));
    })
    .map((entry) => ({
      id: entry.id,
      type: "page" as const,
      content: entry[lang],
      url: `${base}${entry.anchor ? `#${entry.anchor}` : ""}`,
    }));
}
