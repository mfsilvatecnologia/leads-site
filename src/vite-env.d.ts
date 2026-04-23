/// <reference types="vite/client" />

import type { ComponentType } from "react";
import type { BlogPostMeta } from "./lib/blogTypes";

declare module "*.mdx" {
  export const meta: BlogPostMeta;
  const Post: ComponentType<Record<string, unknown>>;
  export default Post;
}
