import type { BlogPostModule, BlogPostSummary } from "./blogTypes";

const modules = import.meta.glob<BlogPostModule>("../content/blog/*.mdx", {
  eager: true,
});

function pathToSlug(p: string): string {
  const m = p.match(/\/([^/]+)\.mdx$/);
  return m?.[1] ?? "";
}

export function getAllPostSummaries(): BlogPostSummary[] {
  return Object.entries(modules)
    .map(([path, mod]) => {
      const slug = pathToSlug(path);
      if (!mod.meta) {
        throw new Error(`[blog] Arquivo ${path} deve exportar "meta" (title, date, description).`);
      }
      return { ...mod.meta, slug };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPostModule | null {
  for (const [path, mod] of Object.entries(modules)) {
    if (pathToSlug(path) === slug) {
      return mod;
    }
  }
  return null;
}
