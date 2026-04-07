import { useState } from 'react';
import { UploadCloud, ShieldCheck, FileCheck2, DatabaseZap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, getSupportRequestId, toUserMessage } from '@/lib/apiClient';

const AdminUpload = () => {
  const [adminToken, setAdminToken] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [delimiter, setDelimiter] = useState(',');
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorSupportId, setErrorSupportId] = useState<string | null>(null);

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

  return (
    <div className="dark min-h-screen bg-[#070A12] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Importar CSV para staging</h1>
          </div>
          <Button asChild variant="outline" className="border-white/15 bg-slate-900 text-slate-200 hover:bg-slate-800">
            <Link to="/checkout">Voltar ao site</Link>
          </Button>
        </div>

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
            {error ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
                {errorSupportId ? (
                  <div className="mt-1 text-xs text-red-300">Codigo de suporte: {errorSupportId}</div>
                ) : null}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
                <div className="mb-1 flex items-center gap-2 font-medium text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-indigo-300" />
                  Acesso protegido
                </div>
                <p className="text-xs text-slate-400">Use o token admin para autorizar a importação.</p>
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
                      disabled={loading || promoting}
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
                          disabled={loading || promoting}
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Button type="button" onClick={handleUpload} disabled={loading || promoting} className="h-11 w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
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
              disabled={loading || promoting}
              variant="outline"
              className="h-11 w-full border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 hover:text-indigo-100"
            >
              <DatabaseZap className="mr-2 h-4 w-4" />
              {promoting ? 'Atualizando base...' : 'Atualizar base de leads'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUpload;
