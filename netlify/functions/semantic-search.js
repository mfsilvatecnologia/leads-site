const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function getRequestId(event) {
  const incoming = event?.headers?.['x-request-id'] || event?.headers?.['X-Request-Id'];
  if (incoming && String(incoming).trim()) return String(incoming).trim();
  return randomUUID();
}

function errorResponse(statusCode, requestId, code, message, details) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "x-request-id": requestId,
    },
    body: JSON.stringify({
      success: false,
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && details ? { details } : {}),
    }),
  };
}

// Função para calcular similaridade de cosseno
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Carregar os vetores do arquivo
function loadVectors() {
  try {
    const filePath = path.resolve(__dirname, '../../public/.well-known/vectors.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Erro ao carregar os vetores:', error);
    return { chunks: [] };
  }
}

// Endpoint para pesquisa semântica
exports.handler = async (event, context) => {
  const requestId = getRequestId(event);

  // Verifica se é uma requisição POST
  if (event.httpMethod !== "POST") {
    return errorResponse(405, requestId, "METHOD_NOT_ALLOWED", "Método não permitido");
  }

  try {
    // Parse do corpo da requisição
    const { query, vector, limit = 3 } = JSON.parse(event.body);
    
    if (!query && !vector) {
      return errorResponse(400, requestId, "MISSING_QUERY_OR_VECTOR", "É necessário fornecer 'query' ou 'vector'");
    }
    
    let queryVector;
    
    // Se não tiver vetor, precisa gerar a partir da query
    if (!vector && query) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        return errorResponse(500, requestId, "OPENAI_KEY_NOT_CONFIGURED", "Serviço temporariamente indisponível");
      }
      
      // Gerar embedding via OpenAI
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "text-embedding-3-large",
          input: query
        })
      });
      
      const data = await response.json();
      queryVector = data.data[0].embedding;
    } else {
      queryVector = vector;
    }
    
    // Carregar vetores do arquivo
    const vectorsData = loadVectors();
    
    // Calcular similaridade para cada chunk
    const results = vectorsData.chunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryVector, chunk.vector)
    }));
    
    // Ordenar por similaridade e retornar os top N
    const topResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({ vector, ...rest }) => rest); // Remover o vetor para economizar banda
      
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "x-request-id": requestId,
      },
      body: JSON.stringify({
        success: true,
        results: topResults
      })
    };
    
  } catch (error) {
    console.error('semantic-search error', { requestId, error });
    return errorResponse(
      500,
      requestId,
      "INTERNAL_SERVER_ERROR",
      "Internal server error",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
};
