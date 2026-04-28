const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

type ApiErrorPayload = {
  success?: boolean;
  code?: string;
  message?: string;
  requestId?: string;
  timestamp?: string;
};

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;

  constructor(message: string, options: { status: number; code?: string; requestId?: string }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.requestId = options.requestId;
  }
}

const ERROR_CODE_MESSAGES: Record<string, string> = {
  MISSING_STATE_OR_SEGMENT: 'Selecione estado e segmento para continuar.',
  INVALID_STATE_OR_SEGMENT: 'O estado ou segmento informado é inválido.',
  INVALID_CHECKOUT_PAYLOAD: 'Alguns dados do checkout são inválidos. Revise os campos.',
  INSUFFICIENT_LEADS_AVAILABILITY: 'A quantidade solicitada é maior que o total disponível.',
  INVALID_COUPON: 'O cupom informado é inválido ou está inativo.',
  MISSING_CREDIT_CARD_DATA: 'Preencha corretamente os dados de cartão e cobrança.',
  CHECKOUT_CREATION_FAILED: 'Não foi possível criar o checkout agora. Tente novamente.',
  MISSING_PAYMENT_ID: 'Não foi possível identificar o pagamento para consulta.',
  PAYMENT_STATUS_CHECK_FAILED: 'Não foi possível consultar o pagamento agora.',
  UNAUTHORIZED_ADMIN: 'Token admin inválido ou não autorizado.',
  SUPABASE_NOT_CONFIGURED: 'Serviço de dados indisponível no momento.',
  MISSING_CSV_CONTENT: 'Envie um CSV válido para continuar.',
  CSV_EMPTY_OR_INVALID: 'O CSV está vazio ou com formato inválido.',
  CSV_INSERT_FAILED: 'Falha ao importar o CSV. Tente novamente.',
  CSV_UPLOAD_PROCESSING_FAILED: 'Erro ao processar o upload do CSV.',
  ROUTE_NOT_FOUND: 'Rota não encontrada.',
  METHOD_NOT_ALLOWED: 'Método não permitido para esta ação.',
  ACCESS_DENIED: 'Acesso negado para esta operação.',
  MISSING_QUERY_OR_VECTOR: 'Informe os dados necessários para pesquisa semântica.',
  OPENAI_KEY_NOT_CONFIGURED: 'Serviço temporariamente indisponível.',
  INTERNAL_SERVER_ERROR: 'Serviço temporariamente indisponível.',
  REQUEST_ERROR: 'Não foi possível concluir a solicitação.',
};

function getDefaultMessageByStatus(status: number): string {
  if (status >= 500) return 'Serviço temporariamente indisponível.';
  if (status === 404) return 'Recurso não encontrado.';
  if (status === 401) return 'Não autorizado.';
  if (status === 403) return 'Acesso negado.';
  if (status === 400) return 'Dados inválidos.';
  return 'Erro ao processar requisição.';
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = await parseJsonSafe<ApiErrorPayload & T>(response);

  if (!response.ok || payload?.success === false) {
    const errorMessage = payload?.message || getDefaultMessageByStatus(response.status);
    throw new ApiClientError(errorMessage, {
      status: response.status,
      code: payload?.code,
      requestId: payload?.requestId,
    });
  }

  return (payload as T) || ({} as T);
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const mappedMessage = ERROR_CODE_MESSAGES[error.code];
    if (mappedMessage) return mappedMessage;
    const normalizedMessage = String(error.message || '').toLowerCase();
    if (
      normalizedMessage.includes('valor mínimo') ||
      normalizedMessage.includes('valor minimo') ||
      (normalizedMessage.includes('minimum') && normalizedMessage.includes('30'))
    ) {
      return 'O valor mínimo para finalizar a compra é R$ 30,00. Aumente a quantidade de leads para continuar.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro inesperado ao processar requisição.';
}

export function getSupportRequestId(error: unknown): string | null {
  if (error instanceof ApiClientError) {
    return error.requestId || null;
  }
  return null;
}
