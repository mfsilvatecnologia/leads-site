import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { SITE_URL } from '@/lib/siteUrl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, getSupportRequestId, toUserMessage } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { taxIdDigitsOnly, validateCheckoutTaxIdClient, type BuyerKind } from '@/lib/taxId';
import { AmericanExpressFlatRoundedIcon } from 'react-svg-credit-card-payment-icons/americanexpress';
import { EloFlatRoundedIcon } from 'react-svg-credit-card-payment-icons/elo';
import { MastercardFlatRoundedIcon } from 'react-svg-credit-card-payment-icons/mastercard';
import { VisaFlatRoundedIcon } from 'react-svg-credit-card-payment-icons/visa';
const DEMO_URL = import.meta.env.VITE_DEMO_URL || '';
/** Lista de demonstração estática em `public/demo/demostração-lead-rapido.csv`. */
const DEMO_CSV_PATH = '/demo/demostração-lead-rapido.csv';
const LEAD_UNIT_PRICE = 0.01;
const QUOTE_LOADING_LABELS = ['Calculando os Leads...', 'Aguarde'] as const;
/** Tempo entre trocas de mensagem (deve ser maior que o crossfade para cada texto “respirar”). */
const QUOTE_LOADING_LABEL_INTERVAL_MS = 3500;

type Segment = { segment: string; availableLeads: number };
type CatalogState = { state: string; segments: Segment[] };

type CardSchemeForIcon = 'Visa' | 'Mastercard' | 'AmericanExpress' | 'Elo' | 'Generic';

const cardSchemeIconProps = {
  width: 44,
  height: 28,
  className: 'shrink-0',
  'aria-hidden': true as const,
};

function cardSchemeFromNumber(cardNumber: string): CardSchemeForIcon {
  const digits = cardNumber.replace(/\D/g, '');
  if (!digits) return 'Generic';
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'AmericanExpress';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|5090|6277|6362|6363|6500|6504|6505|6516|6550|6551|6552)/.test(digits))
    return 'Elo';
  return 'Generic';
}

function CardSchemeFlatRoundedIcon({ scheme }: { scheme: CardSchemeForIcon }) {
  switch (scheme) {
    case 'Visa':
      return <VisaFlatRoundedIcon {...cardSchemeIconProps} />;
    case 'Mastercard':
      return <MastercardFlatRoundedIcon {...cardSchemeIconProps} />;
    case 'AmericanExpress':
      return <AmericanExpressFlatRoundedIcon {...cardSchemeIconProps} />;
    case 'Elo':
      return <EloFlatRoundedIcon {...cardSchemeIconProps} />;
    default:
      return (
        <svg
          className="h-5 w-5 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      );
  }
}

function stateNamesAvailableForSegments(catalog: CatalogState[], segmentNames: string[]): Set<string> {
  const names = new Set<string>();
  for (const entry of catalog) {
    if (entry.segments.some((s) => segmentNames.includes(s.segment))) {
      names.add(entry.state);
    }
  }
  return names;
}

function segmentNamesAvailableForStates(catalog: CatalogState[], stateNames: string[]): Set<string> {
  const names = new Set<string>();
  for (const stateName of stateNames) {
    const stateEntry = catalog.find((c) => c.state === stateName);
    if (!stateEntry) continue;
    for (const seg of stateEntry.segments) {
      names.add(seg.segment);
    }
  }
  return names;
}

function preserveSegmentFieldForStates(
  catalog: CatalogState[],
  stateNames: string[],
  currentSegmentCsv: string
): string {
  const available = segmentNamesAvailableForStates(catalog, stateNames);
  return currentSegmentCsv
    .split(',')
    .map((item) => item.trim())
    .filter((s) => s && available.has(s))
    .join(', ');
}

function preserveStateFieldForSegments(
  catalog: CatalogState[],
  segmentNames: string[],
  currentStateCsv: string
): string {
  const available = stateNamesAvailableForSegments(catalog, segmentNames);
  return currentStateCsv
    .split(',')
    .map((item) => item.trim())
    .filter((s) => s && available.has(s))
    .join(', ');
}

function QuoteLoadingCrossfadeText({
  activeIndex,
  className,
}: {
  activeIndex: number;
  className?: string;
}) {
  const safeIndex = activeIndex % QUOTE_LOADING_LABELS.length;
  return (
    <span
      className={cn(
        'relative inline-grid min-h-[1.35em] w-full min-w-0 max-w-full place-items-center text-center sm:min-w-[10.5rem] sm:whitespace-nowrap',
        className
      )}
    >
      {QUOTE_LOADING_LABELS.map((label, i) => (
        <span
          key={label}
          className={cn(
            'col-start-1 row-start-1 inline-block text-center will-change-[opacity] motion-reduce:will-change-auto',
            'transition-opacity duration-[1150ms] ease-[cubic-bezier(0.42,0,0.58,1)] motion-reduce:transition-none',
            i === safeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          aria-hidden={i !== safeIndex}
        >
          {label}
        </span>
      ))}
    </span>
  );
}

const CHECKOUT_DEFAULT_TITLE = 'Lead Rápido | Leads B2B Qualificados com Inteligência Artificial';
const CHECKOUT_DEFAULT_DESCRIPTION =
  'Compre leads B2B qualificados e listas de empresas atualizadas com inteligência artificial. Dados segmentados por região para prospecção e vendas. Comece agora.';

const LeadCheckout = () => {
  const navigate = useNavigate();
  /** Home é a URL canônica para `/` e `/checkout` (mesmo conteúdo). */
  const canonicalUrl = `${SITE_URL}/`;
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
  const [quoteLoadingLabelIndex, setQuoteLoadingLabelIndex] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState('');
  const [cepResolved, setCepResolved] = useState(false);
  const checkoutModalScrollRef = useRef<HTMLDivElement | null>(null);
  const pixSectionRef = useRef<HTMLDivElement | null>(null);
  const segmentDropdownRef = useRef<HTMLDivElement | null>(null);
  const stateDropdownRef = useRef<HTMLDivElement | null>(null);
  const stateFieldGuideScrolledRef = useRef(false);

  const [form, setForm] = useState({
    buyerKind: 'PF' as BuyerKind,
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
    cidadeIbge: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cardCvv: '',
    onlyWithEmail: false,
    onlyWithWhatsapp: false,
  });

  const showQuoteCalculatingOverlay = useMemo(
    () =>
      quoteLoading &&
      Boolean(form.state?.trim()) &&
      Boolean(form.segment?.trim()) &&
      !segmentDropdownOpen &&
      !stateDropdownOpen,
    [quoteLoading, form.state, form.segment, segmentDropdownOpen, stateDropdownOpen]
  );

  useEffect(() => {
    if (!showQuoteCalculatingOverlay) {
      setQuoteLoadingLabelIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setQuoteLoadingLabelIndex((i) => (i + 1) % QUOTE_LOADING_LABELS.length);
    }, QUOTE_LOADING_LABEL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [showQuoteCalculatingOverlay]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const data = await apiRequest<{ success: boolean; states: CatalogState[] }>('/public-leads/catalog');
        const loadedStates: CatalogState[] = data.states || [];
        setCatalog(loadedStates);
      } catch (e) {
        setError(toUserMessage(e));
        setErrorSupportId(getSupportRequestId(e));
      } finally {
        setLoadingCatalog(false);
      }
    };
    void loadCatalog();
  }, []);

  const selectedStates = useMemo(
    () =>
      form.state
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.state]
  );
  const selectedSegments = useMemo(
    () =>
      form.segment
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.segment]
  );
  const availableStateNames = useMemo(() => catalog.map((item) => item.state), [catalog]);
  const allStatesSelected = useMemo(
    () => availableStateNames.length > 0 && selectedStates.length === availableStateNames.length,
    [availableStateNames, selectedStates]
  );
  const availableStates = useMemo(() => {
    if (selectedSegments.length === 0) return catalog;
    return catalog.filter((entry) => entry.segments.some((s) => selectedSegments.includes(s.segment)));
  }, [catalog, selectedSegments]);
  const promptSelectState = selectedSegments.length > 0 && selectedStates.length === 0;
  const quoteLoadingLabel = QUOTE_LOADING_LABELS[quoteLoadingLabelIndex];

  const availableSegments = useMemo(() => {
    const segmentMap = new Map<string, Segment>();
    const source = selectedStates.length > 0 ? catalog.filter((c) => selectedStates.includes(c.state)) : catalog;
    for (const stateEntry of source) {
      for (const segmentItem of stateEntry.segments || []) {
        if (!segmentMap.has(segmentItem.segment)) {
          segmentMap.set(segmentItem.segment, segmentItem);
        }
      }
    }
    // Mantém segmentos já selecionados visíveis (mesmo se não existirem no recorte atual de estados),
    // para o usuário poder revisar/desmarcar sem perder a seleção automaticamente.
    for (const name of selectedSegments) {
      if (segmentMap.has(name)) continue;
      let found: Segment | null = null;
      for (const entry of catalog) {
        const match = entry.segments.find((s) => s.segment === name);
        if (match) {
          found = match;
          break;
        }
      }
      segmentMap.set(name, found ?? { segment: name, availableLeads: 0 });
    }
    return Array.from(segmentMap.values());
  }, [catalog, selectedStates, selectedSegments]);

  const grossAmount = useMemo(() => Number(form.quantity || 0) * LEAD_UNIT_PRICE, [form.quantity]);
  const chargedAmount = useMemo(() => Math.max(0, grossAmount - discountAmount), [grossAmount, discountAmount]);

  const cardSchemeForIcon = useMemo(() => cardSchemeFromNumber(form.cardNumber), [form.cardNumber]);

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
          cidadeIbge: String(data.ibge || ''),
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
          cidadeIbge: '',
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
        setQuoteLoading(false);
        setAvailableCount(null);
        setForm((prev) => ({ ...prev, quantity: 0 }));
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

  useEffect(() => {
    if (selectedSegments.length === 0 || selectedStates.length > 0) {
      stateFieldGuideScrolledRef.current = false;
      return;
    }
    if (stateFieldGuideScrolledRef.current) return;
    stateFieldGuideScrolledRef.current = true;
    const el = stateDropdownRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  }, [selectedSegments.length, selectedStates.length]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (segmentDropdownRef.current && !segmentDropdownRef.current.contains(target)) {
        setSegmentDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(target)) {
        setStateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

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
    setAcceptedTerms(false);
    setForm((prev) => ({ ...prev, buyerKind: 'PF' }));
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
      if (!acceptedTerms) {
        throw new Error('Voce precisa aceitar os Termos de Uso para continuar.');
      }
      if (couponCode && !couponApplied) {
        throw new Error('Clique em "Aplicar cupom" antes de pagar.');
      }
      const taxIdError = validateCheckoutTaxIdClient(form.cpfCnpj, form.buyerKind);
      if (taxIdError) {
        throw new Error(taxIdError);
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
        buyerKind: form.buyerKind,
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerWhatsapp: form.buyerWhatsapp,
        state: form.state,
        segment: form.segment,
        quantity: Number(form.quantity),
        paymentMethod: form.paymentMethod,
        cpfCnpj: taxIdDigitsOnly(form.cpfCnpj),
        cep: form.cep,
        addressNumber: form.addressNumber,
        endereco: form.endereco,
        bairro: form.bairro,
        cidade: form.cidade,
        uf: form.uf,
        cidadeIbge: form.cidadeIbge,
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
      <Helmet>
        <title>{CHECKOUT_DEFAULT_TITLE}</title>
        <meta name="description" content={CHECKOUT_DEFAULT_DESCRIPTION} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={CHECKOUT_DEFAULT_TITLE} />
        <meta property="og:description" content={CHECKOUT_DEFAULT_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:image" content={`${SITE_URL}/leads-link.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Lead Rápido — Leads qualificados por apenas R$0,01 cada" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE_URL}/leads-link.png`} />
        <meta name="twitter:title" content={CHECKOUT_DEFAULT_TITLE} />
        <meta name="twitter:description" content={CHECKOUT_DEFAULT_DESCRIPTION} />
      </Helmet>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex min-w-0 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 shrink-0 items-center">
            <img
              src="/logo-horizontal.png"
              alt="Lead Rápido"
              className="h-10 w-auto max-w-full object-contain sm:h-12"
            />
          </div>
          <div className="flex w-full min-w-0 shrink-0 items-center sm:w-auto sm:justify-end">
            {DEMO_URL ? (
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="w-full border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 sm:w-auto"
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
        <section className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-4 py-10 text-white sm:px-6 sm:py-12">
          <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
                Melhores Leads de <span className="text-blue-100">Empresas e Negócios</span> do Brasil
              </h1>
              <p className="mt-6 max-w-xl text-lg text-blue-100">
                Leads coletados e qualificados diretamente do Google Meu Negócio por meio de Inteligência Artificial.</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" className="h-12 rounded-xl bg-white px-8 text-blue-900 hover:bg-slate-100" asChild>
                  <a href={DEMO_CSV_PATH} download="demostração-lead-rapido.csv" rel="noopener noreferrer">
                    Ver Lista de Demostração
                  </a>
                </Button>
                <div className="flex items-center rounded-xl border border-blue-300/50 bg-blue-500/30 px-6 py-3 text-sm font-semibold">
                  <span className="mr-3 inline-flex h-2 w-2 animate-pulse rounded-full bg-blue-300" />
                  Atualizado em {new Date().getFullYear()}
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-blue-100">
                <span>Dados Atualizados</span>
                <span>Validação de WhatsApp</span>
                <span>Prospectado com IA</span>
              </div>
            </div>

            <Card
              id="gerar"
              className="relative w-full min-w-0 max-w-full overflow-visible rounded-3xl border border-white/30 bg-white/95 text-slate-800 shadow-2xl backdrop-blur"
            >
              {showQuoteCalculatingOverlay ? (
                <div
                  className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-white/90 backdrop-blur-sm"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  aria-label={quoteLoadingLabel}
                >
                  <span
                    className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600"
                    aria-hidden
                  />
                  <p className="m-0 text-center text-base font-semibold text-blue-900">
                    <QuoteLoadingCrossfadeText activeIndex={quoteLoadingLabelIndex} />
                  </p>
                </div>
              ) : null}
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
                    <div ref={segmentDropdownRef} className="relative">
                      <button
                        id="segment"
                        type="button"
                        className="flex h-auto min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        onClick={() => setSegmentDropdownOpen((prev) => !prev)}
                      >
                        <span className="min-w-0 flex-1 break-words text-left leading-snug">
                          {selectedSegments.length > 0
                            ? selectedSegments.join(', ')
                            : 'Selecione um ou mais segmentos'}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">{segmentDropdownOpen ? '▲' : '▼'}</span>
                      </button>

                      {segmentDropdownOpen ? (
                        <div className="absolute left-0 right-0 z-[60] mt-2 max-h-[min(14rem,50vh)] w-full min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                          {availableSegments.map((s) => {
                            const checked = selectedSegments.includes(s.segment);
                            return (
                              <label
                                key={s.segment}
                                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-800 hover:bg-blue-50"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                                  checked={checked}
                                  onChange={(e) => {
                                    setCouponApplied('');
                                    setDiscountAmount(0);
                                    const next = e.target.checked
                                      ? [...selectedSegments, s.segment]
                                      : selectedSegments.filter((item) => item !== s.segment);
                                    setForm({
                                      ...form,
                                      segment: next.join(', '),
                                      state: preserveStateFieldForSegments(catalog, next, form.state),
                                    });
                                  }}
                                />
                                <span className="min-w-0 flex-1 break-words leading-snug">{s.segment}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">Estados</Label>
                      <div ref={stateDropdownRef} className="relative">
                        <button
                          id="state"
                          type="button"
                          aria-describedby={promptSelectState ? 'state-step-hint' : undefined}
                          className={cn(
                            'flex h-auto min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
                            promptSelectState &&
                              'border-blue-400 ring-2 ring-blue-500/70 animate-checkout-state-hint motion-reduce:animate-none motion-reduce:shadow-none'
                          )}
                          onClick={() => setStateDropdownOpen((prev) => !prev)}
                        >
                          <span className="min-w-0 flex-1 break-words text-left leading-snug">
                            {selectedStates.length > 0 ? selectedStates.join(', ') : 'Selecione um ou mais estados'}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">{stateDropdownOpen ? '▲' : '▼'}</span>
                        </button>

                        {stateDropdownOpen ? (
                          <div className="absolute left-0 right-0 z-[60] mt-2 max-h-[min(14rem,50vh)] w-full min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                            <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm font-semibold text-slate-800 hover:bg-blue-50">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                                checked={allStatesSelected}
                                onChange={(e) => {
                                  setCouponApplied('');
                                  setDiscountAmount(0);
                                  const nextStates = e.target.checked ? availableStateNames : [];
                                  setForm({
                                    ...form,
                                    state: nextStates.join(', '),
                                  });
                                }}
                              />
                              <span className="min-w-0 flex-1 leading-snug">Todos</span>
                            </label>
                            {(availableStates || []).map((item) => {
                              const checked = selectedStates.includes(item.state);
                              return (
                                <label
                                  key={item.state}
                                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-800 hover:bg-blue-50"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                                    checked={checked}
                                    onChange={(e) => {
                                      setCouponApplied('');
                                      setDiscountAmount(0);
                                      const nextStates = e.target.checked
                                        ? [...selectedStates, item.state]
                                        : selectedStates.filter((stateName) => stateName !== item.state);
                                      setForm({
                                        ...form,
                                        state: nextStates.join(', '),
                                      });
                                    }}
                                  />
                                  <span className="min-w-0 flex-1 break-words leading-snug">{item.state}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                      {promptSelectState ? (
                        <p id="state-step-hint" className="text-xs font-medium leading-snug text-blue-800">
                          Agora selecione o(s) estado(s) da sua lista.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={availableCount ?? 999999}
                        value={form.quantity}
                        onChange={() => undefined}
                        readOnly
                        disabled
                        required
                      />
                      <div className="text-xs text-slate-500">
                        {showQuoteCalculatingOverlay ? (
                          <QuoteLoadingCrossfadeText
                            activeIndex={quoteLoadingLabelIndex}
                            className="font-medium text-slate-500"
                          />
                        ) : availableCount !== null ? (
                          `Total disponível: ${availableCount}`
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="grid min-w-0 gap-2 text-sm">
                      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                        <span className="min-w-0 font-semibold uppercase text-blue-700">Total estimado</span>
                        <span className="shrink-0 text-right text-xl font-black tabular-nums text-blue-950">
                          {form.quantity || '--'} leads
                        </span>
                      </div>
                      {availableCount !== null ? (
                        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                          <span className="min-w-0 text-slate-600">Leads no filtro</span>
                          <span className="shrink-0 font-medium tabular-nums text-slate-800">{availableCount}</span>
                        </div>
                      ) : null}
                      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                        <span className="min-w-0 font-semibold uppercase text-blue-700">Preço</span>
                        <span className="shrink-0 text-2xl font-black tabular-nums text-blue-950">
                          R$ {chargedAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {discountAmount > 0 ? (
                        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                          <span className="min-w-0 text-slate-600">
                            Desconto {couponApplied ? `(${couponApplied})` : ''}
                          </span>
                          <span className="shrink-0 font-medium tabular-nums text-blue-600">
                            - R$ {discountAmount.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ) : null}
                      <div className="text-xs text-slate-600">R$ 0,01 por lead.</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid min-w-0 gap-2 sm:grid-cols-[1fr_auto]">
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
                      <div className="mt-2 text-xs text-blue-600">Cupom ativo: {couponApplied}</div>
                    ) : null}
                  </div>

                  {availableCount === 0 && form.state && form.segment && !quoteLoading ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                      Sem leads disponíveis para o filtro selecionado.
                    </div>
                  ) : null}

                  <Button
                    size="lg"
                    className="h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed"
                    disabled={loadingCatalog || !form.state || !form.segment || submitting || quoteLoading || availableCount === 0}
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
                1. A base de Leads é atualizada?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Sim. Nossa plataforma utiliza ferramentas de Inteligência Artificial que realizam varreduras
                mensalmente para garantir os dados mais atualizados.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none font-bold text-slate-800">
                2. Qual a origem dos dados coletados?
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                Os dados são extraídos diretamente do Google Meu Negócio para garantir a maior precisão
                possível. Não utilizamos bases do cartão CNPJ da Receita Federal, pois muitas das informações
                disponíveis são do escritório de contabilidade e não da empresa.
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
          <div className="grid gap-8 md:grid-cols-1">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center shadow-sm">
              <div className="flex justify-center">
                <img
                  src="https://disparorapido.com.br/images/logo-email.png"
                  alt="Logo Disparo Rápido"
                  className="h-auto w-56 object-contain md:w-64"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Envio em massa de mensagens via WhatsApp com praticidade.
              </p>
              <div className="mt-4 flex justify-center">
                <a
                  href="https://www.disparorapido.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="relative inline-flex items-center justify-center rounded-xl bg-[#07b42f] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#069e29] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07b42f] focus-visible:ring-offset-2"
                >
                  <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-[#07b42f]/35 blur-sm animate-pulse motion-reduce:animate-none" />
                  Acessar site
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 px-6 py-12 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
            <div>
              <div className="mb-4">
                <img
                  src="/logo-branca.png"
                  alt="Lead Rápido"
                  className="h-auto w-44 object-contain sm:w-52"
                  loading="lazy"
                />
              </div>
              <p className="max-w-sm text-sm text-blue-100">
                A melhor plataforma de leads do Brasil.
                Mais clientes. Mais vendas. Mais escala.
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
                  <a href="https://wa.me/5516992933505" className="font-medium hover:text-blue-200">
                    (16) 99293-3505
                  </a>
                </li>
                <li className="max-w-sm">
                  Solicite Leads de outros Segmentos através
                  <br />
                  do e-mail:{' '}
                  <a href="mailto:contato@leadrapido.com.br" className="font-medium break-all hover:text-blue-200">
                    contato@leadrapido.com.br
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-sm md:text-right">
              <h4 className="mb-4 text-lg font-bold">Legal</h4>
              <p className="text-blue-100">
                <Link to="/blog" className="underline-offset-4 hover:underline">
                  Blog
                </Link>
                {' '}
                •{' '}
                <Link to="/politica-de-privacidade" className="underline-offset-4 hover:underline">
                  Politica de Privacidade
                </Link>{' '}
                •{' '}
                <Link to="/termos-de-uso" className="underline-offset-4 hover:underline">
                  Termos de Uso
                </Link>{' '}
                • LGPD
              </p>
              <p className="mt-6 text-xs text-blue-100/60">Copyright © 2026 Lead Rápido. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </main>

      {checkoutOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm transition-opacity"
            aria-label="Fechar checkout"
            onClick={() => {
              if (!submitting) setCheckoutOpen(false);
            }}
          />

          <div className="relative flex max-h-[90vh] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-[24px] bg-white text-gray-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-gray-100 p-5 md:px-8 md:py-6">
              <h3 className="min-w-0 flex-1 text-xl font-extrabold tracking-tight text-blue-950">
                Finalize sua Compra
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) setCheckoutOpen(false);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div ref={checkoutModalScrollRef} className="checkout-modal-scroll min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
              {error ? (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  ⚠️ {error}
                  {errorSupportId ? (
                    <div className="mt-1 text-xs text-red-500">Codigo de suporte: {errorSupportId}</div>
                  ) : null}
                </div>
              ) : null}

              {statusMessage ? (
                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-800">
                  ✓ {statusMessage}
                </div>
              ) : null}

              <form onSubmit={handleCreateCheckout} className="space-y-8">
                <div className="space-y-4">
                  <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Dados do Comprador</h4>
                  <div className="flex rounded-xl bg-gray-100/80 p-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, buyerKind: 'PF' })}
                      className={`flex flex-1 items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-all duration-200 ${
                        form.buyerKind === 'PF'
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pessoa física
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, buyerKind: 'PJ' })}
                      className={`flex flex-1 items-center justify-center rounded-lg py-2.5 text-xs font-bold transition-all duration-200 ${
                        form.buyerKind === 'PJ'
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pessoa jurídica
                    </button>
                  </div>
                  <div className="grid gap-3 text-gray-900 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor="buyerNameModal" className="text-xs font-semibold text-gray-600">
                        {form.buyerKind === 'PF' ? 'Nome completo' : 'Razão social'}
                      </label>
                      <Input
                        id="buyerNameModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.buyerName}
                        onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                        placeholder={
                          form.buyerKind === 'PF' ? 'Nome Completo' : 'Razão social cadastrada na Receita'
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="cpfCnpjModal" className="text-xs font-semibold text-gray-600">
                        {form.buyerKind === 'PF' ? 'CPF' : 'CNPJ'}
                      </label>
                      <Input
                        id="cpfCnpjModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.cpfCnpj}
                        onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })}
                        placeholder={form.buyerKind === 'PF' ? '11 dígitos' : '14 dígitos'}
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={form.buyerKind === 'PF' ? 14 : 18}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="buyerWhatsappModal" className="text-xs font-semibold text-gray-600">
                        WhatsApp
                      </label>
                      <Input
                        id="buyerWhatsappModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.buyerWhatsapp}
                        onChange={(e) => setForm({ ...form, buyerWhatsapp: e.target.value })}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="buyerEmailModal" className="text-xs font-semibold text-gray-600">
                        E-mail de recebimento dos leads
                      </label>
                      <Input
                        id="buyerEmailModal"
                        type="email"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.buyerEmail}
                        onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                        placeholder="voce@empresa.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Endereço de Faturamento</h4>
                  <div className="grid grid-cols-1 gap-3 text-gray-900 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="cepModal" className="text-xs font-semibold text-gray-600">
                        CEP
                      </label>
                      <Input
                        id="cepModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
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
                      <label htmlFor="addressNumberModal" className="text-xs font-semibold text-gray-600">
                        Número
                      </label>
                      <Input
                        id="addressNumberModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.addressNumber}
                        onChange={(e) => setForm({ ...form, addressNumber: e.target.value })}
                        placeholder="123"
                        required
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="enderecoModal" className="text-xs font-semibold text-gray-600">
                        Endereço
                      </label>
                      <Input
                        id="enderecoModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.endereco}
                        onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                        placeholder="Rua, Avenida..."
                        required
                        readOnly={!cepResolved}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="bairroModal" className="text-xs font-semibold text-gray-600">
                        Bairro
                      </label>
                      <Input
                        id="bairroModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                        placeholder="Bairro"
                        required
                        readOnly={!cepResolved}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="ufModal" className="text-xs font-semibold text-gray-600">
                        UF
                      </label>
                      <Input
                        id="ufModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none uppercase"
                        value={form.uf}
                        onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase().slice(0, 2) })}
                        placeholder="SP"
                        required
                        maxLength={2}
                        readOnly={!cepResolved}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="cidadeModal" className="text-xs font-semibold text-gray-600">
                        Cidade
                      </label>
                      <Input
                        id="cidadeModal"
                        className="mt-1 h-10 border-gray-200 bg-gray-50 shadow-none"
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                        placeholder="Cidade"
                        required
                        readOnly={!cepResolved}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h4 className="text-sm font-bold text-gray-800">Forma de Pagamento</h4>
                  </div>

                  <div className="flex rounded-xl bg-gray-100/80 p-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: 'PIX' })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition-all duration-200 ${
                        form.paymentMethod === 'PIX'
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: 'CREDIT_CARD' })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold transition-all duration-200 ${
                        form.paymentMethod === 'CREDIT_CARD'
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Cartão de Crédito
                    </button>
                  </div>

                  {form.paymentMethod === 'CREDIT_CARD' ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-4">
                          <label htmlFor="cardHolderNameModal" className="text-xs font-semibold text-gray-600">
                            Nome impresso no cartão
                          </label>
                          <Input
                            id="cardHolderNameModal"
                            className="mt-1 h-11 border-gray-200 bg-gray-50 uppercase shadow-none focus:bg-white"
                            value={form.cardHolderName}
                            onChange={(e) => setForm({ ...form, cardHolderName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label htmlFor="cardNumberModal" className="text-xs font-semibold text-gray-600">
                            Número do Cartão
                          </label>
                          <div className="relative mt-1">
                            <div className="pointer-events-none absolute left-2.5 top-1/2 z-10 flex h-6 w-11 -translate-y-1/2 items-center justify-center [&_svg]:max-h-6 [&_svg]:max-w-full [&_svg]:object-contain">
                              <CardSchemeFlatRoundedIcon scheme={cardSchemeForIcon} />
                            </div>
                            <Input
                              id="cardNumberModal"
                              className="h-11 border-gray-200 bg-gray-50 pl-[3.75rem] pr-3 shadow-none focus:bg-white"
                              value={form.cardNumber}
                              onChange={(e) => setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })}
                              placeholder="0000 0000 0000 0000"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              maxLength={19}
                              required
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-semibold text-gray-600">Validade</label>
                          <div className="mt-1 flex gap-2">
                            <Input
                              id="cardExpiryMonthModal"
                              className="h-11 w-1/2 min-w-0 border-gray-200 bg-gray-50 text-center shadow-none focus:bg-white"
                              placeholder="MM"
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
                              className="h-11 w-1/2 min-w-0 border-gray-200 bg-gray-50 text-center shadow-none focus:bg-white"
                              placeholder="AAAA"
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
                          <label htmlFor="cardCvvModal" className="text-xs font-semibold text-gray-600">
                            CVV
                          </label>
                          <Input
                            id="cardCvvModal"
                            className="mt-1 h-11 border-gray-200 bg-gray-50 shadow-none focus:bg-white"
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
                </div>

                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="space-y-1 border-b border-gray-100 pb-3 text-sm">
                    {discountAmount > 0 ? (
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>Desconto aplicado</span>
                        <span className="font-medium">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    ) : null}
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-bold text-gray-900">Total a pagar</span>
                      <span className="text-xl font-black tabular-nums text-blue-700">
                        R$ {chargedAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <label className="group mt-3 flex cursor-pointer items-start gap-2 rounded-md py-1.5 pl-0 pr-1 transition-colors hover:bg-gray-50/80">
                    <div
                      className={`relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        acceptedTerms ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="peer absolute h-full w-full cursor-pointer opacity-0"
                        required
                      />
                      <svg
                        className={`pointer-events-none h-3.5 w-3.5 text-white transition-opacity ${
                          acceptedTerms ? 'opacity-100' : 'opacity-0'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="select-none text-sm leading-relaxed text-gray-600">
                      Concordo com os{' '}
                      <Link
                        to="/termos-de-uso"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Termos de Uso
                      </Link>{' '}
                      e autorizo o processamento do pagamento.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || !acceptedTerms}
                    className="mt-3 h-11 w-full rounded-lg bg-emerald-500 text-sm font-black uppercase tracking-wide text-white shadow-md shadow-emerald-500/15 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {submitting ? 'PROCESSANDO...' : 'PAGAR'}
                  </Button>
                </div>
              </form>

              {invoiceUrl || pixQrCodeImage || pixCopyPaste ? (
                <div
                  ref={pixSectionRef}
                  className="mt-8 rounded-[24px] border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center animate-in fade-in duration-200"
                >
                  <h4 className="mb-4 text-lg font-black text-blue-900">Finalize o seu PIX</h4>
                  {pixQrCodeImage ? (
                    <img
                      src={pixQrCodeImage}
                      alt="QR Code PIX"
                      className="mx-auto mb-4 h-48 w-48 rounded-xl border border-gray-200 bg-white p-2"
                    />
                  ) : null}
                  {pixCopyPaste ? (
                    <div className="mx-auto mb-4 max-w-xs text-left">
                      <p className="mb-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Código Copia e Cola
                      </p>
                      <div className="mb-2 break-all rounded-lg border border-gray-200 bg-white p-3 font-mono text-[10px] text-gray-600">
                        {pixCopyPaste}
                      </div>
                      <Button
                        type="button"
                        className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-none hover:bg-blue-700"
                        onClick={() => navigator.clipboard.writeText(pixCopyPaste)}
                      >
                        Copiar Código PIX
                      </Button>
                    </div>
                  ) : null}
                  <p className="mt-4 text-sm font-medium text-blue-600">
                    Os leads serão enviados para <br />
                    <b className="text-blue-800">{form.buyerEmail}</b>
                    <br /> após a confirmação.
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

