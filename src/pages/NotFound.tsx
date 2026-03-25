import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-[#070A12] px-4 text-white">
      <main className="w-full max-w-lg">
        <Card className="border-white/10 bg-slate-950 text-slate-100 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-slate-900">
              <SearchX className="h-6 w-6 text-indigo-300" />
            </div>
            <h1 className="text-5xl font-extrabold text-emerald-300">404</h1>
            <p className="mt-2 text-xl font-semibold text-slate-100">Página não encontrada</p>
            <p className="mt-2 text-sm text-slate-400">
              Desculpe, a página que você procura não existe ou foi movida.
            </p>
            <div className="mt-6">
              <Button asChild className="h-11 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link to="/">Voltar para a página inicial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotFound;
