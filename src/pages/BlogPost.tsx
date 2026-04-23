import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { getPostBySlug } from "@/lib/blogRegistry";
import { SITE_URL } from "@/lib/siteUrl";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams();
  if (!slug) {
    return <NotFound />;
  }
  const mod = getPostBySlug(slug);
  if (!mod) {
    return <NotFound />;
  }
  const { default: Post, meta } = mod;
  const pageUrl = `${SITE_URL}/blog/${slug}`;

  return (
    <BlogLayout>
      <Helmet>
        <title>{`${meta.title} | Lead Rápido`}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content={`${SITE_URL}/leads-link.png`} />
        <meta name="article:published_time" content={meta.date} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-slate-500">
          {formatPtDate(meta.date)} ·{" "}
          <Link to="/blog" className="font-medium text-blue-700 hover:underline">
            Blog
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-2 text-lg text-slate-600">{meta.description}</p>
        <article className="prose prose-slate mt-8 max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
          <Post />
        </article>
        <p className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
          Quer leads B2B segmentados?{" "}
          <Link to="/checkout" className="font-medium text-blue-700 hover:underline">
            Acesse o checkout
          </Link>
          .
        </p>
      </main>
    </BlogLayout>
  );
};

function formatPtDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default BlogPost;
