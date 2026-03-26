import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, getSupportRequestId, toUserMessage } from '@/lib/apiClient';
const DEMO_URL = import.meta.env.VITE_DEMO_URL || '';
const LEAD_UNIT_PRICE = 0.01;

type Segment = { segment: string; availableLeads: number };
type CatalogState = { state: string; segments: Segment[] };

const LeadCheckout = () => {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogState[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorSupportId, setErrorSupportId] = useState<string | null>(null);
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
  const [cepLookupLoading, setCepLookupLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState('');
  const [cepResolved, setCepResolved] = useState(false);
  const checkoutModalScrollRef = useRef<HTMLDivElement | null>(null);
  const pixSectionRef = useRef<HTMLDivElement | null>(null);

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
    endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
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
        const data = await apiRequest<{ success: boolean; states: CatalogState[] }>('/public-leads/catalog');
        const loadedStates: CatalogState[] = data.states || [];
        setCatalog(loadedStates);
        if (loadedStates.length > 0) {
          setForm((prev) => ({ ...prev, state: loadedStates[0].state }));
        }
      } catch (e) {
        setError(toUserMessage(e));
        setErrorSupportId(getSupportRequestId(e));
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

  const grossAmount = useMemo(() => Number(form.quantity || 0) * LEAD_UNIT_PRICE, [form.quantity]);
  const chargedAmount = useMemo(() => Math.max(0, grossAmount - discountAmount), [grossAmount, discountAmount]);

  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const isValidCardNumber = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 13 && digits.length <= 16;
  };

  const normalizeCardExpiryYear = (value: string): number => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 2) return 2000 + Number(digits);
    if (digits.length === 4) return Number(digits);
    return NaN;
  };

  useEffect(() => {
    const digits = form.cep.replace(/\D/g, '');

    if (digits.length !== 8) {
      setCepResolved(false);
      setCepLookupError('');
      setCepLookupLoading(false);
      setForm((prev) => ({
        ...prev,
        endereco: '',
        bairro: '',
        cidade: '',
        uf: '',
      }));
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      setCepLookupLoading(true);
      setCepLookupError('');
      setCepResolved(false);

      try {
        // Requisição pública para busca de CEP (sem chave).
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (cancelled) return;
        if (data?.erro) {
          throw new Error('CEP não encontrado');
        }

        setForm((prev) => ({
          ...prev,
          endereco: String(data.logradouro || ''),
          bairro: String(data.bairro || ''),
          cidade: String(data.localidade || ''),
          uf: String(data.uf || '').toUpperCase(),
        }));
        setCepResolved(true);
      } catch {
        if (cancelled) return;
        setCepResolved(false);
        setCepLookupError('Não foi possível buscar o endereço para este CEP.');
        setForm((prev) => ({
          ...prev,
          endereco: '',
          bairro: '',
          cidade: '',
          uf: '',
        }));
      } finally {
        if (!cancelled) setCepLookupLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [form.cep]);

  useEffect(() => {
    const run = async () => {
      if (!form.state || !form.segment) {
        setAvailableCount(null);
        return;
      }
      setQuoteLoading(true);
      try {
        const data = await apiRequest<{ success: boolean; availableCount?: number; discountAmount?: number }>(
          `/public-leads/quote?state=${encodeURIComponent(form.state)}&segment=${encodeURIComponent(
            form.segment
          )}${couponApplied ? `&couponCode=${encodeURIComponent(couponApplied)}` : ''}`
        );
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

  useEffect(() => {
    if (!error) return;

    if (checkoutOpen && checkoutModalScrollRef.current) {
      checkoutModalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error, checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen) return;
    if (!pixSectionRef.current) return;
    if (!invoiceUrl && !pixQrCodeImage && !pixCopyPaste) return;

    pixSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [checkoutOpen, invoiceUrl, pixQrCodeImage, pixCopyPaste]);

  const applyCoupon = async () => {
    setError('');
    setErrorSupportId(null);
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponApplied('');
      setDiscountAmount(0);
      return;
    }
    try {
      const data = await apiRequest<{ success: boolean; discountAmount?: number }>(
        `/public-leads/quote?state=${encodeURIComponent(
          form.state
        )}&segment=${encodeURIComponent(form.segment)}&couponCode=${encodeURIComponent(normalized)}`
      );
      setCouponApplied(normalized);
      setDiscountAmount(Number(data.discountAmount || 0));
      setStatusMessage(`Cupom ${normalized} aplicado com sucesso.`);
    } catch (err) {
      setCouponApplied('');
      setDiscountAmount(0);
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    }
  };

  const openCheckout = () => {
    setError('');
    setErrorSupportId(null);
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
    setErrorSupportId(null);
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
        const year = normalizeCardExpiryYear(form.cardExpiryYear);
        const cvv = form.cardCvv.replace(/\D/g, '');

        if (!isValidCardNumber(form.cardNumber)) {
          throw new Error('Número do cartão inválido. Use entre 13 e 16 dígitos.');
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
          throw new Error('Mês de validade inválido. Use de 01 a 12.');
        }
        if (!Number.isInteger(year) || year < 2024 || year > 2099) {
          throw new Error('Ano de validade inválido. Use 2 dígitos (ex: 30) ou 4 dígitos (ex: 2030).');
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
            cardExpiryYear: String(year),
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
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        couponCode: couponApplied || undefined,
      };

      if (form.paymentMethod === 'CREDIT_CARD') {
        payload.creditCard = {
          holderName: form.cardHolderName,
          number: form.cardNumber.replace(/\D/g, ''),
          expiryMonth: form.cardExpiryMonth.padStart(2, '0'),
          expiryYear: String(normalizeCardExpiryYear(form.cardExpiryYear)),
          ccv: form.cardCvv.replace(/\D/g, ''),
        };
      }

      const data = await apiRequest<{
        success: boolean;
        paymentId?: string;
        invoiceUrl?: string;
        paymentStatus?: string;
        pix?: { copyPaste?: string; qrCodeImage?: string };
      }>('/public-leads/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

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
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    } finally {
      setSubmitting(false);
    }
  };

  const checkPayment = async () => {
    if (!paymentId) return;
    setError('');
    setErrorSupportId(null);
    try {
      const data = await apiRequest<{ success: boolean; paid: boolean; status?: string }>(
        `/public-leads/payment-status?paymentId=${encodeURIComponent(paymentId)}`
      );
      if (data.paid) {
        navigate('/obrigado');
      } else {
        setStatusMessage(`Status do pagamento: ${data.status}`);
      }
    } catch (err) {
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <img
              src="/logo-horizontal.png"
              alt="Lead Rápido"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>
          <div className="flex items-center gap-2">
            {DEMO_URL ? (
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
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
        <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-6 py-12 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                Melhores Leads de <span className="text-blue-100">Empresas e Negócios</span> do Brasil
              </h1>
              <p className="mt-6 max-w-xl text-lg text-blue-100">
                Leads coletados diretamente do Google Meu Negócio através de Inteligência Artificial.
                Inclui nome, endereço, telefone, site, e-mail, Facebook, LinkedIn e validação de WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-white px-8 text-blue-900 hover:bg-slate-100"
                  onClick={() => document.getElementById('gerar')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Gerar minha lista
                </Button>
                <div className="flex items-center rounded-xl border border-blue-300/50 bg-blue-500/30 px-6 py-3 text-sm font-semibold">
                  <span className="mr-3 inline-flex h-2 w-2 animate-pulse rounded-full bg-green-300" />
                  Atualizado em {new Date().getFullYear()}
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-blue-100">
                <span>Dados Atualizados</span>
                <span>Validação de WhatsApp</span>
                <span>Prospectado com IA</span>
              </div>
            </div>

            <Card id="gerar" className="rounded-3xl border border-white/30 bg-white/95 text-slate-800 shadow-2xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900">Gere sua lista de leads</CardTitle>
                <CardDescription className="text-slate-600">
                  Selecione os filtros, confira o total estimado e avance para o checkout seguro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingCatalog ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Carregando catálogo...
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                    {errorSupportId ? (
                      <div className="mt-1 text-xs text-red-500">Codigo de suporte: {errorSupportId}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="segment">Segmentos</Label>
                    <select
                      id="segment"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
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
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
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
                      <div className="text-xs text-slate-500">
                        {quoteLoading
                          ? 'Calculando...'
                          : availableCount !== null
                          ? `Total disponível: ${availableCount}`
                          : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase text-blue-700">Total estimado</span>
                        <span className="text-xl font-black text-blue-950">{form.quantity || '--'} leads</span>
                      </div>
                      {availableCount !== null ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Leads no filtro</span>
                          <span className="font-medium text-slate-800">{availableCount}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase text-blue-700">Preço</span>
                        <span className="text-2xl font-black text-blue-950">
                          R$ {chargedAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {discountAmount > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">
                            Desconto {couponApplied ? `(${couponApplied})` : ''}
                          </span>
                          <span className="font-medium text-emerald-600">
                            - R$ {discountAmount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : null}
                      <div className="text-xs text-slate-600">R$ 0,01 por lead.</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        placeholder="Cupom de desconto (ex: DESC10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        onClick={applyCoupon}
                        disabled={!form.state || !form.segment}
                      >
                        Aplicar cupom
                      </Button>
                    </div>
                    {couponApplied ? (
                      <div className="mt-2 text-xs text-emerald-600">Cupom ativo: {couponApplied}</div>
                    ) : null}
                  </div>

                  <Button
                    size="lg"
                    className="h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    disabled={loadingCatalog || !form.state || !form.segment || submitting}
                    onClick={openCheckout}
                  >
                    Comprar leads
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl border-b border-slate-100 px-6 py-12">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 md:text-4xl">Como Funciona</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-blue-600" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {['Selecione', 'Compre', 'Receba'].map((title, idx) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm transition hover:shadow-md"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
                  {idx + 1}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">
                  {idx === 0 && 'Selecione os segmentos e os estados que deseja prospectar.'}
                  {idx === 1 && 'Realize o pagamento de forma segura e rápida diretamente na plataforma.'}
                  {idx === 2 && 'Receba no e-mail os leads prontos para sua equipe comercial abordar.'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 md:text-4xl">Perguntas Frequentes</h2>
            <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-blue-600" />
          </div>
          <div className="space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                1. A base é atualizada?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Sim. Nossa plataforma utiliza robôs com Inteligência Artificial que realizam varreduras
                mensalmente para garantir os dados mais atualizados.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                2. Qual a origem dos dados coletados?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Os dados são extraídos diretamente do Google Meu Negócio para garantir a maior precisão
                possível. Não utilizamos bases do cartão CNPJ da Receita Federal.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                3. Como recebo os leads?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Após a confirmação do pagamento, os leads são enviados automaticamente para o e-mail
                cadastrado em formato de planilha.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                4. A compra é segura?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Sim. Utilizamos o gateway de pagamento Asaas, que segue os principais protocolos de segurança.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                5. Posso pagar com PIX?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Sim. Aceitamos PIX com liberação imediata dos leads após confirmação do pagamento.
                Também aceitamos cartão de crédito.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                6. Onde recebo a nota fiscal da compra?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                A nota fiscal de serviço é emitida e enviada automaticamente para o e-mail de cadastro
                em até 24 horas úteis após a confirmação da transação.
              </p>
            </details>
          </div>
        </section>

        <section className="mx-auto max-w-7xl rounded-t-3xl border-t border-slate-100 bg-white px-6 py-12 shadow-inner">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-blue-900 md:text-3xl">Conheça Outros Serviços Parceiros</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
              Soluções para potencializar marketing e gestão comercial.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Disparo Rápido</h3>
              <p className="mt-2 text-sm text-slate-500">
                Envio em massa de mensagens via WhatsApp com praticidade.
              </p>
              <a
                href="https://www.disparorapido.com.br"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center font-bold text-blue-600 hover:text-blue-700"
              >
                Acessar site
              </a>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800">Publix CRM</h3>
              <p className="mt-2 text-sm text-slate-500">
                CRM com IA para organizar leads e acelerar conversões.
              </p>
              <a
                href="https://publix.ia.br"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center font-bold text-blue-600 hover:text-blue-700"
              >
                Acessar site
              </a>
            </div>
          </div>
        </section>

        <footer className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-6 py-12 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-white/20 font-bold">LR</span>
                <span className="text-xl font-bold">Lead Rápido</span>
              </div>
              <p className="max-w-sm text-sm text-blue-100">
                A maior plataforma de extração de dados do Google Meu Negócio, potencializando o
                crescimento de empresas B2B em todo o Brasil.
              </p>
              <div className="mt-4 space-y-1 text-xs text-blue-100/80">
                <p className="font-bold uppercase text-white">M F SILVA TECNOLOGIA DA INFORMAÇÃO LTDA</p>
                <p>CNPJ: 35.185.351/0001-07</p>
                <p>Rua Antônio Torres Penedo, 147, Sala 02, São Joaquim, Franca-SP - CEP 14.406-352</p>
              </div>
            </div>
            <div className="text-sm">
              <h4 className="mb-4 text-lg font-bold">Contato e Suporte</h4>
              <ul className="space-y-2">
                <li>
                  WhatsApp:{' '}
                  <a href="https://wa.me/5516981362498" className="font-medium hover:text-blue-200">
                    (16) 98136-2498
                  </a>
                </li>
                <li>
                  E-mail:{' '}
                  <a href="mailto:contato@leadrapido.com.br" className="font-medium hover:text-blue-200">
                    contato@leadrapido.com.br
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-sm md:text-right">
              <h4 className="mb-4 text-lg font-bold">Legal</h4>
              <p className="text-blue-100">Políticas de Privacidade • Termos de Uso • LGPD</p>
              <p className="mt-6 text-xs text-blue-100/60">Copyright © 2026 Lead Rápido. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </main>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-blue-950/40"
            aria-label="Fechar checkout"
            onClick={() => {
              if (!submitting) setCheckoutOpen(false);
            }}
          />

          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] bg-white text-gray-900 shadow-2xl animate-in fade-in duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50/50 p-6">
              <div>
                <h3 className="text-xl font-black text-blue-950">Checkout Seguro</h3>
                <p className="text-xs text-gray-500">Finalize a sua compra em 3 etapas rápidas</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) setCheckoutOpen(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div ref={checkoutModalScrollRef} className="checkout-modal-scroll min-h-0 flex-1 overflow-y-auto p-8">
              {error ? (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  ⚠️ {error}
                  {errorSupportId ? (
                    <div className="mt-1 text-xs text-red-500">Codigo de suporte: {errorSupportId}</div>
                  ) : null}
                </div>
              ) : null}

              {statusMessage ? (
                <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  ✓ {statusMessage}
                </div>
              ) : null}

              <form onSubmit={handleCreateCheckout} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      1
                    </span>
                    <h4 className="font-bold text-gray-800">Dados do Comprador</h4>
                  </div>
                  <div className="grid gap-4 text-gray-900 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor="buyerNameModal" className="text-[10px] font-bold uppercase text-gray-400">
                        Nome Completo
                      </label>
                      <Input
                        id="buyerNameModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.buyerName}
                        onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="buyerEmailModal" className="text-[10px] font-bold uppercase text-gray-400">
                        E-mail
                      </label>
                      <Input
                        id="buyerEmailModal"
                        type="email"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.buyerEmail}
                        onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                        placeholder="voce@empresa.com"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="buyerWhatsappModal" className="text-[10px] font-bold uppercase text-gray-400">
                        WhatsApp
                      </label>
                      <Input
                        id="buyerWhatsappModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.buyerWhatsapp}
                        onChange={(e) => setForm({ ...form, buyerWhatsapp: e.target.value })}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      2
                    </span>
                    <h4 className="font-bold text-gray-800">Endereço e Documento</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-gray-900 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <label htmlFor="cpfCnpjModal" className="text-[10px] font-bold uppercase text-gray-400">
                        CPF ou CNPJ *
                      </label>
                      <Input
                        id="cpfCnpjModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.cpfCnpj}
                        onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                        placeholder="Somente números"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="cepModal" className="text-[10px] font-bold uppercase text-gray-400">
                        CEP *
                      </label>
                      <Input
                        id="cepModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })}
                        placeholder="00000-000"
                        required
                      />
                      {cepLookupLoading ? (
                        <p className="mt-1 text-[10px] text-gray-500">Buscando endereço...</p>
                      ) : cepLookupError ? (
                        <p className="mt-1 text-[10px] text-red-600">{cepLookupError}</p>
                      ) : null}
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="addressNumberModal" className="text-[10px] font-bold uppercase text-gray-400">
                        Número *
                      </label>
                      <Input
                        id="addressNumberModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.addressNumber}
                        onChange={(e) => setForm({ ...form, addressNumber: e.target.value })}
                        placeholder="123"
                        required
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="enderecoModal" className="text-[10px] font-bold uppercase text-gray-400">
                        Endereço *
                      </label>
                      <Input
                        id="enderecoModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.endereco}
                        onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                        placeholder="Rua, Avenida..."
                        required
                        readOnly={!cepResolved}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="bairroModal" className="text-[10px] font-bold uppercase text-gray-400">
                        Bairro *
                      </label>
                      <Input
                        id="bairroModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                        placeholder="Bairro"
                        required
                        readOnly={!cepResolved}
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label htmlFor="ufModal" className="text-[10px] font-bold uppercase text-gray-400">
                        UF *
                      </label>
                      <Input
                        id="ufModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50 uppercase"
                        value={form.uf}
                        onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase().slice(0, 2) })}
                        placeholder="SP"
                        required
                        maxLength={2}
                        readOnly={!cepResolved}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="cidadeModal" className="text-[10px] font-bold uppercase text-gray-400">
                        Cidade *
                      </label>
                      <Input
                        id="cidadeModal"
                        className="mt-1 h-11 border-gray-200 bg-gray-50"
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                        placeholder="Cidade"
                        required
                        readOnly={!cepResolved}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        3
                      </span>
                      <h4 className="font-bold text-gray-800">Forma de Pagamento</h4>
                    </div>
                    <div className="flex gap-2">
                      {(['PIX', 'CREDIT_CARD'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, paymentMethod: m })}
                          className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                            form.paymentMethod === m
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'border border-gray-200 bg-white text-gray-500'
                          }`}
                        >
                          {m === 'PIX' ? 'PIX' : 'Cartão de Crédito'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm text-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-gray-600">
                        {form.segment} • {form.state}
                      </span>
                      <span className="font-semibold">{form.quantity} leads</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-gray-600">Total</span>
                      <span className="text-base font-bold text-blue-900">
                        R$ {chargedAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {discountAmount > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-gray-600">Desconto</span>
                        <span className="font-semibold text-emerald-600">
                          - R$ {discountAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {form.paymentMethod === 'CREDIT_CARD' ? (
                    <div className="grid grid-cols-1 gap-4 text-gray-900 animate-in fade-in duration-200 sm:grid-cols-4">
                      <div className="sm:col-span-4">
                        <label htmlFor="cardHolderNameModal" className="text-[10px] font-bold uppercase text-gray-400">
                          Nome Impresso no Cartão
                        </label>
                        <Input
                          id="cardHolderNameModal"
                          className="mt-1 h-11 border-gray-200 bg-white uppercase"
                          value={form.cardHolderName}
                          onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label htmlFor="cardNumberModal" className="text-[10px] font-bold uppercase text-gray-400">
                          Número do Cartão
                        </label>
                        <Input
                          id="cardNumberModal"
                          className="mt-1 h-11 border-gray-200 bg-white"
                          value={form.cardNumber}
                          onChange={(e) =>
                            setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })
                          }
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          maxLength={19}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400">
                          Validade (MM/AAAA)
                        </label>
                        <div className="mt-1 flex gap-2">
                          <Input
                            id="cardExpiryMonthModal"
                            className="h-11 w-1/2 min-w-0 border-gray-200 bg-white text-center"
                            placeholder="Mês"
                            value={form.cardExpiryMonth}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                cardExpiryMonth: e.target.value.replace(/\D/g, '').slice(0, 2),
                              })
                            }
                            inputMode="numeric"
                            autoComplete="cc-exp-month"
                            maxLength={2}
                            required
                          />
                          <Input
                            id="cardExpiryYearModal"
                            className="h-11 w-1/2 min-w-0 border-gray-200 bg-white text-center"
                            placeholder="Ano"
                            value={form.cardExpiryYear}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                cardExpiryYear: e.target.value.replace(/\D/g, '').slice(0, 4),
                              })
                            }
                            inputMode="numeric"
                            autoComplete="cc-exp-year"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="cardCvvModal" className="text-[10px] font-bold uppercase text-gray-400">
                          CVV
                        </label>
                        <Input
                          id="cardCvvModal"
                          className="mt-1 h-11 border-gray-200 bg-white"
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
                  ) : (
                    <div className="flex animate-in items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 duration-200">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 font-black text-white">
                        PIX
                      </div>
                      <p className="text-sm leading-tight text-emerald-800">
                        Liberação <b>imediata</b> após o pagamento. Você receberá o código copia e cola após clicar em
                        pagar.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6 rounded-[24px] border border-blue-300/50 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 p-6 text-white md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase text-blue-100/90">Total a pagar</p>
                    <p className="text-3xl font-black text-white">
                      R$ {chargedAmount.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-100/80">
                      Pagamento Seguro
                    </p>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="h-14 min-w-[10rem] rounded-xl bg-emerald-400 font-black text-gray-900 shadow-none hover:scale-[1.02] hover:bg-emerald-300 hover:shadow-none disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting ? 'PROCESSANDO...' : 'PAGAR'}
                  </Button>
                </div>
              </form>

              {invoiceUrl || pixQrCodeImage || pixCopyPaste ? (
                <div
                  ref={pixSectionRef}
                  className="mt-8 rounded-[32px] border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center animate-in fade-in duration-200"
                >
                  <h4 className="mb-4 font-black text-blue-900">Finalize o seu PIX</h4>
                  {pixQrCodeImage ? (
                    <img
                      src={pixQrCodeImage}
                      alt="QR Code PIX"
                      className="mx-auto mb-4 h-48 w-48 rounded-xl border border-gray-200 bg-white p-2"
                    />
                  ) : null}
                  {pixCopyPaste ? (
                    <div className="mx-auto mb-4 max-w-xs text-left">
                      <p className="mb-2 text-left text-[10px] font-bold uppercase text-gray-400">
                        Código Copia e Cola
                      </p>
                      <div className="mb-2 break-all rounded-lg border border-gray-200 bg-white p-3 font-mono text-[10px] text-gray-600">
                        {pixCopyPaste}
                      </div>
                      <Button
                        type="button"
                        className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700"
                        onClick={() => navigator.clipboard.writeText(pixCopyPaste)}
                      >
                        Copiar Código PIX
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-sm font-medium text-blue-600">
                    Os leads serão enviados para <b>{form.buyerEmail}</b> após a confirmação.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .checkout-modal-scroll::-webkit-scrollbar { width: 4px; }
        .checkout-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .checkout-modal-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .checkout-modal-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default LeadCheckout;

