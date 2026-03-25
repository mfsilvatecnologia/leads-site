import { Check, MailCheck, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Obrigado = () => {
  return (
    <main className="dark min-h-screen bg-[#070A12] px-4 py-14 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Pagamento confirmado</h1>
          <p className="mt-2 text-slate-400">Recebemos sua compra com sucesso.</p>
        </div>

        <Card className="border-white/10 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Próximos passos</CardTitle>
            <CardDescription className="text-slate-400">
              Seu pedido já está sendo processado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-medium text-slate-100">Entrega por e-mail</p>
                  <p className="text-sm text-slate-400">
                    Vamos enviar o arquivo da base para o e-mail informado no checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-indigo-300" />
                <div>
                  <p className="font-medium text-slate-100">Caso não receba em alguns minutos</p>
                  <p className="text-sm text-slate-400">
                    Verifique também as pastas de spam, promoções e lixeira.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button asChild className="h-11 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link to="/checkout">Fazer nova compra</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Obrigado;
