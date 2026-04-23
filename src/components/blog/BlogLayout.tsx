import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type BlogLayoutProps = {
  children: ReactNode;
};

export const BlogLayout = ({ children }: BlogLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="shrink-0">
              <img
                src="/logo-horizontal.png"
                alt="Lead Rápido"
                className="h-10 w-auto object-contain sm:h-12"
              />
            </Link>
            <span className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />
            <Link
              to="/blog"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-800"
            >
              Blog
            </Link>
          </div>
          <Button
            asChild
            className="h-9 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            size="sm"
          >
            <Link to="/checkout">Comprar leads</Link>
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
};
