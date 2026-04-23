import type { ComponentType } from "react";

export interface BlogPostMeta {
  title: string;
  /** YYYY-MM-DD (ordenar no índice) */
  date: string;
  description: string;
}

export interface BlogPostSummary extends BlogPostMeta {
  slug: string;
}

export interface BlogPostModule {
  default: ComponentType<Record<string, unknown>>;
  meta: BlogPostMeta;
}
