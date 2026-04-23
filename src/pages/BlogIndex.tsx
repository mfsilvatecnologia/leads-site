import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { getAllPostSummaries } from "@/lib/blogRegistry";
import { SITE_URL } from "@/lib/siteUrl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BLOG_INDEX_URL = `${SITE_URL}/blog`;
const PAGE_TITLE = "Blog | Lead Rápido";
const PAGE_DESCRIPTION =
  "Artigos sobre prospecção B2B, qualificação de leads e listas de empresas para acelerar vendas com dados.";

const BlogIndex = () => {
  const posts = getAllPostSummaries();

  return (
    <BlogLayout>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={BLOG_INDEX_URL} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={BLOG_INDEX_URL} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content={`${SITE_URL}/leads-link.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-800">
            <BookOpen className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Blog</h1>
            <p className="mt-1 text-slate-600">
              Prospecção B2B, listas e boas práticas para o seu time de vendas.
            </p>
          </div>
        </div>
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                <Card className="border-slate-200 transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <p className="text-xs font-medium text-slate-500">{formatPtDate(post.date)}</p>
                    <CardTitle className="text-lg text-blue-900">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600">{post.description}</p>
                    <p className="mt-2 text-sm font-medium text-blue-600">Ler artigo</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        {posts.length === 0 ? (
          <p className="text-center text-slate-500">Nenhum artigo publicado ainda.</p>
        ) : null}
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

export default BlogIndex;
