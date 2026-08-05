/**
 * Source repository of this site, used for the nav link, the "last updated"
 * lookup and the per-page "edit on GitHub" link.
 */
export const repo = {
  owner: "IdeaSearch",
  name: "IdeaSearch-doc",
  branch: "main",
};

export const repoUrl = `https://github.com/${repo.owner}/${repo.name}`;

/** Link to a docs source file on GitHub. */
export function repoBlobUrl(pagePath: string) {
  return `${repoUrl}/blob/${repo.branch}/content/docs/${pagePath}`;
}
