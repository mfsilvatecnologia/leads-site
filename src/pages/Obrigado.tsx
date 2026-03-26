import { Check, MailCheck, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Obrigado = () => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <img src="/logo-horizontal.png" alt="Lead Rápido" className="h-12 w-auto object-contain sm:h-14" />
          <Button asChild variant="secondary" size="sm" className="border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100">
            <Link to="/checkout">Voltar ao checkout</Link>
          </Button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-6 py-14 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200/50 bg-emerald-400/20 text-emerald-100">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Pagamento confirmado</h1>
          <p className="mt-3 text-base text-blue-100">Recebemos sua compra com sucesso e já iniciamos o processamento.</p>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-3xl px-6 pb-14">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-blue-900">Próximos passos</CardTitle>
            <CardDescription className="text-slate-600">A sua base de leads está sendo preparada para envio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">Entrega por e-mail</p>
                  <p className="text-sm text-slate-600">Vamos enviar o arquivo da base para o e-mail informado no checkout.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Caso não receba em alguns minutos</p>
                  <p className="text-sm text-slate-600">Verifique também as pastas de spam, promoções e lixeira.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                <Link to="/checkout">Fazer nova compra</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Obrigado;
