import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEMO_URL = import.meta.env.VITE_DEMO_URL || '';

type Segment = { segment: string; availableLeads: number };
type CatalogState = { state: string; segments: Segment[] };

const LeadCheckout = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogState[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [pixQrCodeImage, setPixQrCodeImage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerWhatsapp: '',
    state: '',
    segment: '',
    quantity: 100,
    paymentMethod: 'PIX' as 'PIX' | 'CREDIT_CARD',
    cpfCnpj: '',
    cep: '',
    addressNumber: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cardCvv: '',
    onlyWithEmail: false,
    onlyWithWhatsapp: false,
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public-leads/catalog`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Erro ao carregar catálogo');
        const loadedStates: CatalogState[] = data.states || [];
        setCatalog(loadedStates);
        if (loadedStates.length > 0) {
          setForm((prev) => ({ ...prev, state: loadedStates[0].state }));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar catálogo');
      } finally {
        setLoadingCatalog(false);
      }
    };
    void loadCatalog();
  }, []);

  const currentState = useMemo(
    () => catalog.find((c) => c.state === form.state),
    [catalog, form.state]
  );
  const selectedSegment = useMemo(
    () => currentState?.segments.find((s) => s.segment === form.segment),
    [currentState, form.segment]
  );

  const grossAmount = useMemo(() => Number(form.quantity || 0) * 0.5, [form.quantity]);
  const chargedAmount = useMemo(
    () => Math.max(30, Math.max(0, grossAmount - discountAmount)),
    [grossAmount, discountAmount]
  );

  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const isValidCardNumber = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 19;
  };

  useEffect(() => {
    const run = async () => {
      if (!form.state || !form.segment) {
        setAvailableCount(null);
        return;
      }
      setQuoteLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/public-leads/quote?state=${encodeURIComponent(form.state)}&segment=${encodeURIComponent(
            form.segment
          )}${couponApplied ? `&couponCode=${encodeURIComponent(couponApplied)}` : ''}`
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Erro ao calcular');
        setAvailableCount(typeof data.availableCount === 'number' ? data.availableCount : null);
        setDiscountAmount(Number(data.discountAmount || 0));
        // Ao escolher estado+segmento, default = quantidade total disponível (valor completo)
        if (typeof data.availableCount === 'number' && data.availableCount > 0) {
          setForm((prev) => ({ ...prev, quantity: data.availableCount }));
        }
      } catch (e) {
        setAvailableCount(null);
        setDiscountAmount(0);
      } finally {
        setQuoteLoading(false);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.state, form.segment]);

  const applyCoupon = async () => {
    setError('');
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponApplied('');
      setDiscountAmount(0);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/public-leads/quote?state=${encodeURIComponent(
          form.state
        )}&segment=${encodeURIComponent(form.segment)}&couponCode=${encodeURIComponent(normalized)}`
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Cupom inválido');
      setCouponApplied(normalized);
      setDiscountAmount(Number(data.discountAmount || 0));
      setStatusMessage(`Cupom ${normalized} aplicado com sucesso.`);
    } catch (err) {
      setCouponApplied('');
      setDiscountAmount(0);
      setError(err instanceof Error ? err.message : 'Erro ao validar cupom');
    }
  };

  const openCheckout = () => {
    setError('');
    setStatusMessage('');
    setPaymentId('');
    setInvoiceUrl('');
    setPixCopyPaste('');
    setPixQrCodeImage('');
    setCheckoutOpen(true);
  };

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);
    setPaymentId('');
    setInvoiceUrl('');
    setPixCopyPaste('');
    setPixQrCodeImage('');

    try {
      if (couponCode && !couponApplied) {
        throw new Error('Clique em "Aplicar cupom" antes de pagar.');
      }
      if (form.paymentMethod === 'CREDIT_CARD') {
        const cardDigits = form.cardNumber.replace(/\D/g, '');
        const month = Number(form.cardExpiryMonth);
        const year = Number(form.cardExpiryYear);
        const cvv = form.cardCvv.replace(/\D/g, '');

        if (!isValidCardNumber(form.cardNumber)) {
          throw new Error('Número do cartão inválido. Use entre 13 e 19 dígitos.');
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
          throw new Error('Mês de validade inválido. Use de 01 a 12.');
        }
        if (!Number.isInteger(year) || year < 2024 || year > 2099) {
          throw new Error('Ano de validade inválido. Use 4 dígitos (ex: 2030).');
        }
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          throw new Error('Cartão expirado. Verifique a validade.');
        }
        if (!/^\d{3,4}$/.test(cvv)) {
          throw new Error('CVV inválido. Use 3 ou 4 dígitos.');
        }
        if (!/^\d{8}$/.test(form.cep.replace(/\D/g, ''))) {
          throw new Error('CEP inválido. Use 8 dígitos.');
        }
        if (!form.cpfCnpj || form.cpfCnpj.replace(/\D/g, '').length < 11) {
          throw new Error('CPF/CNPJ é obrigatório para pagamento com cartão.');
        }
        if (!form.addressNumber.trim()) {
          throw new Error('Número do endereço é obrigatório para pagamento com cartão.');
        }

        // Normalize values before sending
        if (cardDigits !== form.cardNumber || cvv !== form.cardCvv) {
          setForm((prev) => ({
            ...prev,
            cardNumber: formatCardNumber(cardDigits),
            cardCvv: cvv,
          }));
        }
      }

      const payload: Record<string, unknown> = {
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerWhatsapp: form.buyerWhatsapp,
        state: form.state,
        segment: form.segment,
        quantity: Number(form.quantity),
        paymentMethod: form.paymentMethod,
        cpfCnpj: form.cpfCnpj,
        cep: form.cep,
        addressNumber: form.addressNumber,
        couponCode: couponApplied || undefined,
      };

      if (form.paymentMethod === 'CREDIT_CARD') {
        payload.creditCard = {
          holderName: form.cardHolderName,
          number: form.cardNumber.replace(/\D/g, ''),
          expiryMonth: form.cardExpiryMonth.padStart(2, '0'),
          expiryYear: form.cardExpiryYear,
          ccv: form.cardCvv.replace(/\D/g, ''),
        };
      }

      const response = await fetch(`${API_BASE_URL}/public-leads/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Falha ao criar checkout');

      setPaymentId(data.paymentId || '');
      setInvoiceUrl(data.invoiceUrl || '');
      setPixCopyPaste(data.pix?.copyPaste || '');
      setPixQrCodeImage(data.pix?.qrCodeImage || '');

      if (data.paymentStatus === 'CONFIRMED' || data.paymentStatus === 'RECEIVED') {
        navigate('/obrigado');
        return;
      }

      setStatusMessage('Checkout criado. Finalize o pagamento para receber os leads por e-mail.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar checkout');
    } finally {
      setSubmitting(false);
    }
  };

  const checkPayment = async () => {
    if (!paymentId) return;
    setError('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/public-leads/payment-status?paymentId=${encodeURIComponent(paymentId)}`
      );
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Erro ao consultar pagamento');
      if (data.paid) {
        navigate('/obrigado');
      } else {
        setStatusMessage(`Status do pagamento: ${data.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar pagamento');
    }
  };

  return (
    <div className="dark min-h-screen bg-[#070A12] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070A12]/60 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="tracking-tight">LeadRapidos</span>
          </div>
          <div className="flex items-center gap-2">
            {DEMO_URL ? (
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="bg-white/5 text-white hover:bg-white/10 ring-1 ring-white/10"
              >
                <a href={DEMO_URL} target="_blank" rel="noreferrer">
                  Ver Lista Demonstração
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        {/* HERO (inspiração, identidade própria) */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_15%_25%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(1000px_650px_at_80%_10%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(900px_600px_at_85%_70%,rgba(217,70,239,0.14),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#070A12] via-[#070A12] to-[#070A12]/70" />
          </div>

          <div className="container relative mx-auto px-4 py-14 sm:py-20">
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Base atualizada • filtros por estado e segmento
                  </div>

                  <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
                    Leads prontos para <span className="text-emerald-300">prospectar</span>, do jeito que você precisa
                  </h1>

                  <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
                    Monte sua lista, veja o preço na hora e pague dentro do site. A base chega no seu e-mail após a confirmação.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-emerald-500 px-7 text-slate-950 hover:bg-emerald-400"
                      onClick={() => document.getElementById('gerar')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Gerar minha lista
                    </Button>
                    {DEMO_URL ? (
                      <Button
                        asChild
                        size="lg"
                        variant="secondary"
                        className="h-12 rounded-full bg-white/5 px-7 text-white hover:bg-white/10 ring-1 ring-white/10"
                      >
                        <a href={DEMO_URL} target="_blank" rel="noreferrer">
                          Ver demonstração
                        </a>
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-7 grid gap-3 text-sm text-white/75 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-white/90 font-semibold">Preço simples</div>
                      <div className="mt-1 text-white/60">R$ 0,50 por lead • mínimo R$ 30</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-white/90 font-semibold">Pagamento seguro</div>
                      <div className="mt-1 text-white/60">PIX ou cartão de crédito</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-white/90 font-semibold">Entrega por e-mail</div>
                      <div className="mt-1 text-white/60">Arquivo pronto para Excel</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* GERADOR */}
        <section className="container mx-auto px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <Card id="gerar" className="shadow-xl border-white/10 bg-slate-950 text-slate-100">
              <CardHeader>
                  <CardTitle>Gere sua lista</CardTitle>
                  <CardDescription className="text-slate-400">
                    Escolha os filtros e clique em criar lista.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingCatalog ? (
                  <div className="rounded-md border border-white/10 bg-slate-900 p-4 text-sm text-slate-400">
                    Carregando catálogo...
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="segment">Segmentos</Label>
                    <select
                      id="segment"
                      className="h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                      value={form.segment}
                      onChange={(e) => {
                        setCouponApplied('');
                        setDiscountAmount(0);
                        setForm({ ...form, segment: e.target.value });
                      }}
                      required
                      disabled={!form.state}
                    >
                      <option value="" disabled>
                        Selecione os segmentos
                      </option>
                      {(currentState?.segments || []).map((s) => (
                        <option key={s.segment} value={s.segment}>
                          {s.segment}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">Estados</Label>
                      <select
                        id="state"
                        className="h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                        value={form.state}
                        onChange={(e) => {
                          setCouponApplied('');
                          setDiscountAmount(0);
                          setForm({ ...form, state: e.target.value, segment: '' });
                        }}
                        required
                      >
                        <option value="" disabled>
                          Selecione os estados
                        </option>
                        {(catalog || []).map((item) => (
                          <option key={item.state} value={item.state}>
                            {item.state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={availableCount ?? selectedSegment?.availableLeads ?? 999999}
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                        required
                      />
                      <div className="text-xs text-slate-400">
                        {quoteLoading
                          ? 'Calculando...'
                          : availableCount !== null
                          ? `Total disponível: ${availableCount}`
                          : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total de leads</span>
                        <span className="font-medium">{form.quantity || '--'}</span>
                      </div>
                      {availableCount !== null ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Leads no filtro</span>
                          <span className="font-medium">{availableCount}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Preço estimado</span>
                        <span className="text-base font-semibold">
                          R$ {chargedAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {discountAmount > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">
                            Desconto {couponApplied ? `(${couponApplied})` : ''}
                          </span>
                          <span className="font-medium text-emerald-300">
                            - R$ {discountAmount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : null}
                      {grossAmount < 30 ? (
                        <div className="text-xs text-slate-400">Valor mínimo aplicado.</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        placeholder="Cupom de desconto (ex: DESC10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
                        onClick={applyCoupon}
                        disabled={!form.state || !form.segment}
                      >
                        Aplicar cupom
                      </Button>
                    </div>
                    {couponApplied ? (
                      <div className="mt-2 text-xs text-emerald-300">Cupom ativo: {couponApplied}</div>
                    ) : null}
                  </div>

                  <Button
                    size="lg"
                    className="h-12 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    disabled={loadingCatalog || !form.state || !form.segment || submitting}
                    onClick={openCheckout}
                  >
                    Criar lista
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-slate-950 text-slate-100">
          <DialogHeader>
            <DialogTitle>Finalizar compra</DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha seus dados e faça o pagamento (PIX ou cartão).
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {statusMessage ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {statusMessage}
            </div>
          ) : null}

          <form onSubmit={handleCreateCheckout} className="grid gap-5">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500/20 px-2 text-xs font-semibold text-emerald-300">
                  Etapa 1
                </span>
                <p className="text-sm font-medium text-slate-200">Seus dados</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="buyerNameModal">Nome</Label>
                  <Input
                    id="buyerNameModal"
                    value={form.buyerName}
                    onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmailModal">E-mail</Label>
                  <Input
                    id="buyerEmailModal"
                    type="email"
                    value={form.buyerEmail}
                    onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                    placeholder="voce@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerWhatsappModal">WhatsApp</Label>
                  <Input
                    id="buyerWhatsappModal"
                    value={form.buyerWhatsapp}
                    onChange={(e) => setForm({ ...form, buyerWhatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-500/20 px-2 text-xs font-semibold text-indigo-300">
                  Etapa 2
                </span>
                <p className="text-sm font-medium text-slate-200">Resumo e forma de pagamento</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Compra</Label>
                <div className="rounded-md border border-white/10 bg-slate-900 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {form.segment} • {form.state}
                    </span>
                    <span className="font-medium">{form.quantity} leads</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="text-base font-semibold">
                      R$ {chargedAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {discountAmount > 0 ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-400">Desconto</span>
                      <span className="font-medium text-emerald-300">
                        - R$ {discountAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethodModal">Pagamento</Label>
                <select
                  id="paymentMethodModal"
                  className="h-11 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value as 'PIX' | 'CREDIT_CARD' })
                  }
                >
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão</option>
                </select>
              </div>
            </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-fuchsia-500/20 px-2 text-xs font-semibold text-fuchsia-300">
                  Etapa 3
                </span>
                <p className="text-sm font-medium text-slate-200">Dados de cobrança</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cpfCnpjModal">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpjModal"
                  value={form.cpfCnpj}
                  onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                  placeholder="Somente números"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cepModal">CEP</Label>
                <Input
                  id="cepModal"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressNumberModal">Número</Label>
                <Input
                  id="addressNumberModal"
                  value={form.addressNumber}
                  onChange={(e) => setForm({ ...form, addressNumber: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>
            </div>

            {form.paymentMethod === 'CREDIT_CARD' ? (
              <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
                <div className="mb-3 text-sm font-medium">Dados do cartão</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cardHolderNameModal">Nome no cartão</Label>
                    <Input
                      id="cardHolderNameModal"
                      value={form.cardHolderName}
                      onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cardNumberModal">Número do cartão</Label>
                    <Input
                      id="cardNumberModal"
                      value={form.cardNumber}
                      onChange={(e) =>
                        setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })
                      }
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={23}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryMonthModal">Mês (MM)</Label>
                    <Input
                      id="cardExpiryMonthModal"
                      value={form.cardExpiryMonth}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cardExpiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                        })
                      }
                      placeholder="12"
                      inputMode="numeric"
                      autoComplete="cc-exp-month"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryYearModal">Ano (AAAA)</Label>
                    <Input
                      id="cardExpiryYearModal"
                      value={form.cardExpiryYear}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cardExpiryYear: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="2030"
                      inputMode="numeric"
                      autoComplete="cc-exp-year"
                      maxLength={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvvModal">CVV</Label>
                    <Input
                      id="cardCvvModal"
                      value={form.cardCvv}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sticky bottom-0 z-20 -mx-6 mt-1 border-t border-white/10 bg-slate-950/95 px-6 py-4 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs text-slate-400">Valor total da compra</div>
                  <div className="text-lg font-semibold text-slate-100">
                    R$ {chargedAmount.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-xs text-slate-500">
                    Você receberá a base por e-mail após a confirmação do pagamento.
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="h-12 min-w-44 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  {submitting ? 'Processando...' : 'Pagar agora'}
                </Button>
              </div>
            </div>
          </form>

          {invoiceUrl || pixQrCodeImage || pixCopyPaste ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                {invoiceUrl ? (
                  <Button asChild variant="outline" className="w-full">
                    <a href={invoiceUrl} target="_blank" rel="noreferrer">
                      Abrir cobrança
                    </a>
                  </Button>
                ) : null}

                {paymentId ? (
                  <Button type="button" className="w-full" onClick={checkPayment}>
                    Verificar status do pagamento
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3">
                {pixQrCodeImage ? (
                  <div className="flex justify-center">
                    <img
                      src={pixQrCodeImage}
                      alt="QR Code PIX"
                      className="h-48 w-48 rounded-md border border-white/20 bg-white p-2"
                    />
                  </div>
                ) : null}

                {pixCopyPaste ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">PIX copia e cola</div>
                    <div className="rounded-md border border-white/10 bg-slate-900 p-3 text-xs break-all font-mono text-slate-200">
                      {pixCopyPaste}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => navigator.clipboard.writeText(pixCopyPaste)}
                    >
                      Copiar código PIX
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadCheckout;

