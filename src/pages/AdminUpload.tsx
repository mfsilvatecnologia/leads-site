import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, UploadCloud, ShieldCheck, FileCheck2, DatabaseZap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiDownload, apiRequest, getSupportRequestId, toUserMessage } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type Segment = { segment: string; availableLeads: number };
type CatalogState = { state: string; segments: Segment[] };

const AdminUpload = () => {
  const [adminToken, setAdminToken] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [delimiter, setDelimiter] = useState(',');
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorSupportId, setErrorSupportId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogState[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [allSegments, setAllSegments] = useState(false);
  const [allStates, setAllStates] = useState(false);
  const [segmentDropdownOpen, setSegmentDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const segmentDropdownRef = useRef<HTMLDivElement | null>(null);
  const stateDropdownRef = useRef<HTMLDivElement | null>(null);
  const busy = loading || promoting || downloading;

  useEffect(() => {
    const loadCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const data = await apiRequest<{ states?: CatalogState[] }>('/public-leads/catalog');
        setCatalog(Array.isArray(data.states) ? data.states : []);
      } catch {
        setCatalog([]);
      } finally {
        setLoadingCatalog(false);
      }
    };
    void loadCatalog();
  }, []);

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

  const availableStateNames = useMemo(() => catalog.map((item) => item.state), [catalog]);
  const availableSegments = useMemo(() => {
    const segmentMap = new Map<string, Segment>();
    for (const entry of catalog) {
      for (const segmentItem of entry.segments || []) {
        const current = segmentMap.get(segmentItem.segment);
        segmentMap.set(segmentItem.segment, {
          segment: segmentItem.segment,
          availableLeads: (current?.availableLeads || 0) + Number(segmentItem.availableLeads || 0),
        });
      }
    }
    return Array.from(segmentMap.values()).sort((a, b) => a.segment.localeCompare(b.segment, 'pt-BR'));
  }, [catalog]);

  const estimatedCount = useMemo(() => {
    if (!allSegments && selectedSegments.length === 0) return 0;
    if (!allStates && selectedStates.length === 0) return 0;
    let total = 0;
    for (const entry of catalog) {
      if (!allStates && !selectedStates.includes(entry.state)) continue;
      for (const segmentItem of entry.segments || []) {
        if (!allSegments && !selectedSegments.includes(segmentItem.segment)) continue;
        total += Number(segmentItem.availableLeads || 0);
      }
    }
    return total;
  }, [allSegments, allStates, catalog, selectedSegments, selectedStates]);

  const segmentLabel = allSegments
    ? 'Todos os segmentos'
    : selectedSegments.length > 0
      ? selectedSegments.join(', ')
      : 'Selecione um ou mais segmentos';
  const stateLabel = allStates
    ? 'Todos os estados'
    : selectedStates.length > 0
      ? selectedStates.join(', ')
      : 'Selecione um ou mais estados';

  const handlePromote = async () => {
    setError('');
    setErrorSupportId(null);
    setMessage('');
    if (!adminToken.trim()) {
      setError('Informe o token admin.');
      return;
    }
    setPromoting(true);
    try {
      const data = await apiRequest<{ success: boolean; promotedRows?: number; skippedRows?: number }>(
        '/public-leads/admin/promote-staging',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken.trim(),
          },
        }
      );
      setMessage(
        `Base atualizada: ${data.promotedRows} leads promovidos da staging para leadrapido` +
          (data.skippedRows ? ` (${data.skippedRows} ignorados por falta de place_id)` : '') +
          '.'
      );
    } catch (err) {
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    } finally {
      setPromoting(false);
    }
  };

  const handleUpload = async () => {
    setError('');
    setErrorSupportId(null);
    setMessage('');
    if (!adminToken.trim()) {
      setError('Informe o token admin.');
      return;
    }
    if (files.length === 0) {
      setError('Selecione um ou mais arquivos CSV.');
      return;
    }

    setLoading(true);
    try {
      let totalInserted = 0;
      const perFile: Array<{ fileName: string; insertedRows: number }> = [];

      for (const file of files) {
        const csvContent = await file.text();
        const data = await apiRequest<{ success: boolean; insertedRows?: number }>(
          '/public-leads/admin/upload-staging',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminToken.trim(),
            },
            body: JSON.stringify({
              csvContent,
              delimiter,
              fileName: file.name,
            }),
          }
        );

        const insertedRows = Number(data.insertedRows || 0);
        totalInserted += insertedRows;
        perFile.push({ fileName: file.name, insertedRows });
      }

      setMessage(
        `Upload concluído: ${totalInserted} linhas inseridas em leadrapido_staging.\n` +
          perFile.map((f) => `- ${f.fileName}: ${f.insertedRows}`).join('\n')
      );
    } catch (err) {
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTreated = async () => {
    setError('');
    setErrorSupportId(null);
    setMessage('');
    if (!adminToken.trim()) {
      setError('Informe o token admin.');
      return;
    }
    if (!allSegments && selectedSegments.length === 0) {
      setError('Selecione um segmento ou marque todos os segmentos.');
      return;
    }
    if (!allStates && selectedStates.length === 0) {
      setError('Selecione um estado ou marque todos os estados.');
      return;
    }

    setDownloading(true);
    try {
      const { fileName } = await apiDownload(
        '/public-leads/admin/download-treated',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken.trim(),
          },
          body: JSON.stringify({
            segment: allSegments ? 'ALL' : selectedSegments.join(', '),
            state: allStates ? 'ALL' : selectedStates.join(', '),
            allSegments,
            allStates,
          }),
        },
        'leads-tratados.csv'
      );
      setMessage(
        `Download iniciado: ${fileName}` +
          (estimatedCount > 0 ? ` (${estimatedCount.toLocaleString('pt-BR')} leads estimados).` : '.')
      );
    } catch (err) {
      setError(toUserMessage(err));
      setErrorSupportId(getSupportRequestId(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-[#070A12] px-4 py-10 text-white">
      <Helmet>
        <title>Admin — importação | Lead Rápido</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Importar CSV para staging</h1>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Link to="/checkout">Voltar ao site</Link>
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
            {errorSupportId ? (
              <div className="mt-1 text-xs text-red-300">Codigo de suporte: {errorSupportId}</div>
            ) : null}
          </div>
        ) : null}
        {message ? (
          <div className="whitespace-pre-line rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        <Card className="border-white/10 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-300" />
              Upload CSV para staging
            </CardTitle>
            <CardDescription className="text-slate-400">
              Envie um CSV para inserir dados em `leadrapido_staging`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-indigo-300" />
                  Acesso protegido
                </div>
                <p className="text-xs text-slate-400">Use o token admin para autorizar a importação e o download.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-200">
                  <FileCheck2 className="h-4 w-4 text-emerald-300" />
                  Tabela de destino
                </div>
                <p className="text-xs text-slate-400">Os registros serão inseridos em `leadrapido_staging`.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminToken">Token admin</Label>
              <Input
                id="adminToken"
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="LEADRAPIDOS_ADMIN_TOKEN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimitador</Label>
              <Input id="delimiter" value={delimiter} onChange={(e) => setDelimiter(e.target.value || ',')} maxLength={1} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csvFile">Arquivo CSV</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv,text/csv"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-200">{files.length} arquivo(s) selecionado(s)</span>
                    <button
                      type="button"
                      className="text-slate-300 underline underline-offset-2 hover:text-white disabled:opacity-50"
                      onClick={() => setFiles([])}
                      disabled={busy}
                    >
                      Limpar
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {files.map((f) => (
                      <li key={`${f.name}-${f.size}-${f.lastModified}`} className="flex items-center justify-between gap-3">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-slate-300 underline underline-offset-2 hover:text-white disabled:opacity-50"
                          onClick={() =>
                            setFiles((prev) => prev.filter((p) => !(p.name === f.name && p.size === f.size && p.lastModified === f.lastModified)))
                          }
                          disabled={busy}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Button type="button" onClick={handleUpload} disabled={busy} className="h-11 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              {loading ? 'Enviando...' : 'Enviar para leadrapido_staging'}
            </Button>

            <div className="relative flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Button
              type="button"
              onClick={handlePromote}
              disabled={busy}
              variant="outline"
              className="h-11 w-full border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 hover:text-indigo-100"
            >
              <DatabaseZap className="mr-2 h-4 w-4" />
              {promoting ? 'Atualizando base...' : 'Atualizar base de leads'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-sky-300" />
              Baixar base já tratada
            </CardTitle>
            <CardDescription className="text-slate-400">
              Exporte CSV de `leadrapido` por segmento, estado ou todos os estados, usando o token admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="treatedSegment">Segmentos</Label>
              <div ref={segmentDropdownRef} className="relative">
                <button
                  id="treatedSegment"
                  type="button"
                  disabled={loadingCatalog || availableSegments.length === 0}
                  className="flex h-auto min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-left text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setSegmentDropdownOpen((prev) => !prev)}
                >
                  <span className="min-w-0 flex-1 break-words text-left leading-snug">{loadingCatalog ? 'Carregando segmentos...' : segmentLabel}</span>
                  <span className="shrink-0 text-xs text-slate-500">{segmentDropdownOpen ? '▲' : '▼'}</span>
                </button>
                {segmentDropdownOpen ? (
                  <div className="absolute left-0 right-0 z-[60] mt-2 max-h-[min(14rem,50vh)] w-full min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-slate-900 p-2 shadow-lg">
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm font-semibold text-slate-100 hover:bg-white/5">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-sky-500"
                        checked={allSegments}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAllSegments(checked);
                          if (checked) setSelectedSegments([]);
                        }}
                      />
                      <span className="min-w-0 flex-1 leading-snug">Todos os segmentos</span>
                    </label>
                    {availableSegments.map((item) => {
                      const checked = allSegments || selectedSegments.includes(item.segment);
                      return (
                        <label
                          key={item.segment}
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-white/5',
                            allSegments && 'opacity-60'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-sky-500"
                            checked={checked}
                            disabled={allSegments}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedSegments, item.segment]
                                : selectedSegments.filter((name) => name !== item.segment);
                              setSelectedSegments(next);
                            }}
                          />
                          <span className="min-w-0 flex-1 break-words leading-snug">{item.segment}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatedState">Estados</Label>
              <div ref={stateDropdownRef} className="relative">
                <button
                  id="treatedState"
                  type="button"
                  disabled={loadingCatalog || availableStateNames.length === 0}
                  className="flex h-auto min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-left text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setStateDropdownOpen((prev) => !prev)}
                >
                  <span className="min-w-0 flex-1 break-words text-left leading-snug">{loadingCatalog ? 'Carregando estados...' : stateLabel}</span>
                  <span className="shrink-0 text-xs text-slate-500">{stateDropdownOpen ? '▲' : '▼'}</span>
                </button>
                {stateDropdownOpen ? (
                  <div className="absolute left-0 right-0 z-[60] mt-2 max-h-[min(14rem,50vh)] w-full min-w-0 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-slate-900 p-2 shadow-lg">
                    <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm font-semibold text-slate-100 hover:bg-white/5">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-sky-500"
                        checked={allStates}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAllStates(checked);
                          if (checked) setSelectedStates([]);
                        }}
                      />
                      <span className="min-w-0 flex-1 leading-snug">Todos os estados</span>
                    </label>
                    {availableStateNames.map((stateName) => {
                      const checked = allStates || selectedStates.includes(stateName);
                      return (
                        <label
                          key={stateName}
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-white/5',
                            allStates && 'opacity-60'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-sky-500"
                            checked={checked}
                            disabled={allStates}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...selectedStates, stateName]
                                : selectedStates.filter((name) => name !== stateName);
                              setSelectedStates(next);
                            }}
                          />
                          <span className="min-w-0 flex-1 break-words leading-snug">{stateName}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {loadingCatalog
                ? 'Carregando catálogo da base tratada...'
                : catalog.length === 0
                  ? 'Não foi possível carregar o catálogo da base tratada deste ambiente.'
                  : estimatedCount > 0
                    ? `${estimatedCount.toLocaleString('pt-BR')} leads estimados para o filtro atual.`
                    : 'Selecione segmento e estado para estimar a quantidade.'}
            </p>

            <Button
              type="button"
              onClick={handleDownloadTreated}
              disabled={busy || loadingCatalog}
              className="h-11 w-full bg-sky-500 text-slate-950 hover:bg-sky-400"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Gerando CSV...' : 'Baixar CSV da base tratada'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUpload;
