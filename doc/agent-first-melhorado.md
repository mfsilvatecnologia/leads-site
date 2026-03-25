# Transformação do Site Disparo Rápido para Abordagem "Agents First"

## 1. Contexto do Projeto

O site [Disparo Rápido](https://disparorapido.com.br/) é uma plataforma de vendas para uma extensão Chrome que automatiza o envio de mensagens individuais em massa via WhatsApp. 

**Proposta de valor principal:**
- Envio em massa de mensagens no WhatsApp com apenas 3 cliques
- Envios individuais (não é lista de transmissão), automatizados para toda a base de contatos
- Mais de 1.200 empreendedores ativos e média de 10.000 envios mensais
- Público-alvo: profissionais liberais, autônomos, lojistas e infoprodutores

**Fluxo de uso:**
1. Instalar a extensão no Chrome
2. Carregar contatos (CSV ou grupos do WhatsApp)
3. Configurar intervalos entre mensagens
4. Disparar textos, áudios, imagens e vídeos

**Funcionalidades principais:**
- Disparos ilimitados
- Importação de contatos de diversas fontes
- Intervalos configuráveis entre mensagens
- Monitoramento em tempo real
- Suporte a múltiplos formatos (texto, áudio, imagem, vídeo)

**Modelo de negócio:**
- Planos mensal e anual com preços promocionais
- Versão gratuita limitada a 10 mensagens
- Garantia de satisfação com cancelamento em até 7 dias

## 2. Objetivo da Transformação "Agents First"

Transformar o site para que seja otimizado para agentes de IA (ChatGPT, Claude, Gemini, etc.), permitindo que esses agentes:

1. **Compreendam corretamente** o propósito e funcionamento do produto
2. **Naveguem semanticamente** pelo conteúdo do site
3. **Recuperem informações precisas** sobre funcionalidades, preços e termos
4. **Respondam perguntas** de usuários com dados atualizados e factuais
5. **Evitem mal-entendidos** ou confusões sobre o que o produto faz ou não faz

Essa transformação deve ser implementada **sem modificar o design visual ou a experiência do usuário final**, focando exclusivamente na camada semântica e estrutural do site.

## 3. Implementação - Tarefas Prioritárias

### 3.1. Otimização para Indexação por IA (Alta prioridade)

#### robots.txt Atualizado
```
# Permissões para agentes de IA
User-agent: GPTBot           # OpenAI/ChatGPT
Allow: /
User-agent: PerplexityBot    # Perplexity AI
Allow: /
User-agent: AnthropicAI      # Claude
Allow: /
User-agent: Google-Extended  # Gemini/Bard
Allow: /
User-agent: CCBot           # Common Crawl (usado por vários LLMs)
Allow: /

# Áreas restritas para todos os bots
User-agent: *
Disallow: /admin/
Disallow: /cliente/login/
Disallow: /api/
Disallow: /checkout/

# Sitemap
Sitemap: https://disparorapido.com.br/sitemap.xml
```

Colocar no diretório: `public/robots.txt`

### 3.2. Metadados Estruturados (Alta prioridade)

#### JSON-LD para Página Principal
Implementar no `<head>` do site:

```javascript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Disparo Rápido",
  "description": "Extensão para Chrome que permite enviar mensagens individuais em massa pelo WhatsApp com apenas 3 cliques, de forma automatizada e personalizada.",
  "applicationCategory": "CommunicationApplication",
  "operatingSystem": "Chrome",
  "offers": {
    "@type": "AggregateOffer",
    "offers": [
      {
        "@type": "Offer",
        "name": "Plano Mensal",
        "price": "39.90",
        "priceCurrency": "BRL",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        "name": "Plano Anual",
        "price": "297.00",
        "priceCurrency": "BRL",
        "priceValidUntil": "2025-12-31",
        "availability": "https://schema.org/InStock"
      }
    ]
  },
  "provider": {
    "@type": "Organization",
    "name": "M.F. Silva Tecnologia",
    "legalName": "M.F. Silva Tecnologia LTDA",
    "url": "https://disparorapido.com.br"
  },
  "featureList": [
    "Disparos ilimitados de mensagens",
    "Importação de contatos via CSV ou grupos do WhatsApp",
    "Configuração de intervalos entre mensagens",
    "Visualização dos envios em tempo real",
    "Suporte a múltiplos formatos (texto, áudio, imagem, vídeo)",
    "Instalação simples no Google Chrome"
  ],
  "screenshot": "https://disparorapido.com.br/extencao_google_chrome.png",
  "softwareVersion": "2.0",
  "url": "https://disparorapido.com.br",
  "downloadUrl": "https://chrome.google.com/webstore/detail/[ID-DA-EXTENSÃO]",
  "browserRequirements": "Google Chrome 80+",
  "termsOfService": "https://disparorapido.com.br/termos-de-uso",
  "privacyPolicy": "https://disparorapido.com.br/politica-de-privacidade"
}
</script>
```

#### JSON-LD para "Como Funciona"
```javascript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Como usar o Disparo Rápido",
  "description": "Passo a passo para enviar mensagens em massa pelo WhatsApp usando a extensão Disparo Rápido",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Instale a extensão",
      "text": "Adicione a extensão Disparo Rápido ao seu navegador Chrome através da Chrome Web Store",
      "image": "https://disparorapido.com.br/tutorial-disparo-rapido/1.png",
      "url": "https://chrome.google.com/webstore/detail/[ID-DA-EXTENSÃO]"
    },
    {
      "@type": "HowToStep",
      "name": "Carregue seus contatos",
      "text": "Importe contatos através de arquivos CSV ou diretamente de grupos do WhatsApp",
      "image": "https://disparorapido.com.br/tutorial-disparo-rapido/2.png"
    },
    {
      "@type": "HowToStep",
      "name": "Configure os intervalos",
      "text": "Defina intervalos entre as mensagens para evitar bloqueios e garantir entregas naturais",
      "image": "https://disparorapido.com.br/tutorial-disparo-rapido/3.png"
    },
    {
      "@type": "HowToStep",
      "name": "Envie suas mensagens",
      "text": "Crie sua mensagem com texto, imagens, áudios ou vídeos e inicie o disparo automatizado",
      "image": "https://disparorapido.com.br/tutorial-disparo-rapido/4.png"
    }
  ],
  "tool": {
    "@type": "HowToTool",
    "name": "Google Chrome"
  }
}
</script>
```

#### JSON-LD para FAQ
```javascript
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O Disparo Rápido usa a API oficial do WhatsApp?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Não. O Disparo Rápido utiliza automação no WhatsApp Web através de uma extensão para Chrome, não a API oficial do WhatsApp Business."
      }
    },
    {
      "@type": "Question",
      "name": "Existe risco de bloqueio do número?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sim. Por se tratar de automação, existe risco de bloqueio. Recomendamos seguir o manual antibanimento e usar um chip exclusivo para disparos em massa."
      }
    },
    {
      "@type": "Question",
      "name": "Como funcionam os planos de assinatura?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oferecemos um plano mensal recorrente e um plano anual com desconto que pode ser parcelado. Ambos incluem disparos ilimitados, suporte e acesso às atualizações."
      }
    },
    {
      "@type": "Question",
      "name": "Posso cancelar quando quiser?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oferecemos garantia de satisfação de 7 dias. Você pode solicitar o cancelamento e reembolso integral neste período. Após este prazo, as condições de cancelamento estão detalhadas nos Termos de Uso."
      }
    }
  ]
}
</script>
```

### 3.3. Guia para Agentes de IA (Alta prioridade)

Criar arquivo: `public/llms.txt`

```markdown
# Guia Disparo Rápido para Agentes de IA
Última atualização: 20 de agosto de 2025

## Sobre o produto
Disparo Rápido é uma extensão para Google Chrome que automatiza o envio de mensagens individuais via WhatsApp Web. A ferramenta permite realizar envios em massa sem utilizar listas de transmissão, preservando a aparência de mensagens personalizadas enviadas manualmente.

## Detalhes técnicos
- Tipo: Extensão para Google Chrome
- Compatibilidade: Chrome 80+, WhatsApp Web
- Método de funcionamento: Automação via extensão do navegador (não utiliza API oficial)
- Formatos suportados: Texto, áudio, imagem e vídeo
- Fontes de contatos: Arquivos CSV e grupos do WhatsApp

## Páginas principais do site
- **Home**: https://disparorapido.com.br/ - Visão geral, funcionalidades e planos
- **Termos de Uso**: https://disparorapido.com.br/termos-de-uso - Direitos, responsabilidades e condições
- **Política de Privacidade**: https://disparorapido.com.br/politica-de-privacidade - Tratamento de dados
- **Tutorial**: https://disparorapido.com.br/tutorial - Passo a passo de instalação e uso
- **Versão Gratuita**: https://disparorapido.com.br/download-gratis - Acesso à versão com 10 mensagens gratuitas

## Modelo de negócio
- **Plano Mensal**: R$ 39,90/mês, acesso completo, cobrança recorrente
- **Plano Anual**: R$ 297,00/ano (equivalente a R$ 24,75/mês), acesso completo + bônus
- **Versão Gratuita**: Limitada a 10 mensagens, sem custo
- **Garantia**: 7 dias para cancelamento com reembolso integral

## Informações importantes para usuários
1. A ferramenta **não utiliza API oficial** do WhatsApp, mas sim automação via WhatsApp Web
2. Existe **risco de bloqueio** do número de telefone por uso de automação
3. Recomenda-se seguir o manual antibanimento e usar chip exclusivo para disparos
4. Os envios são individuais e não detectáveis como mensagem em massa pelo destinatário
5. A ferramenta permite configurar intervalos entre mensagens para parecer natural

## FAQ comum
- **É possível usar no celular?** Não, funciona apenas no Google Chrome em computadores
- **Preciso manter o computador ligado?** Sim, durante o processo de envio
- **Como são cobrados os planos?** Mensal: recorrente mensalmente; Anual: pagamento único ou parcelado
- **Posso usar para SPAM?** Não recomendado e contra os termos de uso
- **Há limite de mensagens?** Não na versão paga; a versão gratuita permite 10 mensagens

## Contato e suporte
- Email: contato@disparorapido.com.br
- Horário: Segunda a sexta, 9h às 18h (horário de Brasília)
- WhatsApp: +55 (XX) XXXXX-XXXX
```

### 3.4. Indexação Vetorial para Pesquisa Semântica (Média prioridade)

Criar estrutura: `public/.well-known/vectors.json`

```javascript
{
  "version": "1.0",
  "site": "https://disparorapido.com.br",
  "updatedAt": "2025-08-20T10:00:00Z",
  "chunks": [
    {
      "url": "https://disparorapido.com.br/",
      "content": "Disparo Rápido é uma extensão para Chrome que permite enviar mensagens em massa pelo WhatsApp de forma individual e automatizada. Com apenas 3 cliques, você pode enviar mensagens para toda sua base de contatos sem usar listas de transmissão.",
      "vector": [0.123, -0.456, 0.789, ...],
      "metadata": {
        "title": "Envios em massa no WhatsApp | Disparo Rápido",
        "tags": ["whatsapp", "marketing", "automação", "envio-em-massa"]
      }
    },
    {
      "url": "https://disparorapido.com.br/#como-funciona",
      "content": "Como funciona o Disparo Rápido: 1. Instale a extensão no Chrome, 2. Carregue seus contatos via CSV ou grupos, 3. Configure intervalos entre mensagens, 4. Dispare textos, áudios, imagens e vídeos automaticamente.",
      "vector": [0.234, -0.567, 0.890, ...],
      "metadata": {
        "title": "Como Funciona | Disparo Rápido",
        "tags": ["tutorial", "passo-a-passo", "como-usar"]
      }
    }
  ]
}
```

## 4. Implementação - Script de Geração de Embeddings

Criar arquivo: `scripts/generate-embeddings.js`

```javascript
/**
 * Script para gerar embeddings vetoriais do conteúdo do site
 * 
 * Este script:
 * 1. Acessa as principais páginas do site
 * 2. Extrai o conteúdo textual relevante
 * 3. Segmenta em chunks de tamanho adequado
 * 4. Gera embeddings via API (OpenAI)
 * 5. Salva no formato .well-known/vectors.json
 * 
 * Instruções de uso:
 * - Instale as dependências: npm install openai cheerio node-fetch
 * - Configure a API key da OpenAI nas variáveis de ambiente: OPENAI_API_KEY
 * - Execute: node scripts/generate-embeddings.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configurações
const SITE_URL = 'https://disparorapido.com.br';
const PAGES_TO_SCAN = [
  '/',
  '/termos-de-uso',
  '/politica-de-privacidade',
  '/tutorial'
];
const OUTPUT_PATH = path.join(__dirname, '../public/.well-known/vectors.json');
const CHUNK_SIZE = 500; // caracteres por chunk

async function fetchPage(url) {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    console.error(`Erro ao carregar ${url}:`, error);
    return null;
  }
}

function extractContent(html) {
  const $ = cheerio.load(html);
  
  // Remover elementos irrelevantes
  $('script, style, nav, footer, header').remove();
  
  // Extrair texto de elementos relevantes
  const textContent = $('main, article, section, .content, p, h1, h2, h3, h4, h5, li')
    .map((_, el) => $(el).text().trim())
    .get()
    .join(' ')
    .replace(/\s+/g, ' ');
    
  return textContent;
}

function splitIntoChunks(text, size) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= size) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Erro ao gerar embedding:', error);
    return null;
  }
}

async function main() {
  const vectors = {
    version: "1.0",
    site: SITE_URL,
    updatedAt: new Date().toISOString(),
    chunks: []
  };
  
  for (const page of PAGES_TO_SCAN) {
    console.log(`Processando página: ${page}`);
    const url = `${SITE_URL}${page}`;
    const html = await fetchPage(url);
    
    if (html) {
      const content = extractContent(html);
      const chunks = splitIntoChunks(content, CHUNK_SIZE);
      
      console.log(`  Extraídos ${chunks.length} chunks`);
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`  Gerando embedding para chunk ${i+1}/${chunks.length}`);
        const vector = await generateEmbedding(chunks[i]);
        
        if (vector) {
          vectors.chunks.push({
            url: url + (i > 0 ? `#chunk${i}` : ''),
            content: chunks[i],
            vector: vector,
            metadata: {
              title: page === '/' ? 'Página Inicial' : page.substring(1).split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
              tags: [page === '/' ? 'home' : page.substring(1).toLowerCase()]
            }
          });
        }
      }
    }
  }
  
  // Criar diretório se não existir
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Salvar arquivo
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(vectors, null, 2));
  console.log(`Arquivo de vetores salvo em: ${OUTPUT_PATH}`);
  console.log(`Total de chunks processados: ${vectors.chunks.length}`);
}

main();
```

## 5. Implementação - Componente React para SEO e Schema.org

Criar arquivo: `src/components/SeoAgentFirst.tsx`

```typescript
import React from 'react';
import { Helmet } from 'react-helmet'; // Dependência: npm install react-helmet @types/react-helmet

interface SeoAgentFirstProps {
  title: string;
  description: string;
  pageType: 'home' | 'how-it-works' | 'faq' | 'pricing' | 'terms' | 'privacy';
  url: string;
  imageUrl?: string;
}

const SeoAgentFirst: React.FC<SeoAgentFirstProps> = ({
  title,
  description,
  pageType,
  url,
  imageUrl = 'https://disparorapido.com.br/disparo-imagem.png'
}) => {
  // Dados básicos do produto
  const productData = {
    name: "Disparo Rápido",
    description: "Extensão para Chrome que permite enviar mensagens individuais em massa pelo WhatsApp com apenas 3 cliques.",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Chrome",
    softwareVersion: "2.0",
    url: "https://disparorapido.com.br",
    termsOfService: "https://disparorapido.com.br/termos-de-uso",
    privacyPolicy: "https://disparorapido.com.br/politica-de-privacidade"
  };

  // Gerar schema de acordo com o tipo de página
  const getJsonLd = () => {
    switch (pageType) {
      case 'home':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          ...productData,
          offers: {
            "@type": "AggregateOffer",
            offers: [
              {
                "@type": "Offer",
                name: "Plano Mensal",
                price: "39.90",
                priceCurrency: "BRL",
                priceValidUntil: "2025-12-31",
                availability: "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                name: "Plano Anual",
                price: "297.00",
                priceCurrency: "BRL",
                priceValidUntil: "2025-12-31",
                availability: "https://schema.org/InStock"
              }
            ]
          },
          featureList: [
            "Disparos ilimitados de mensagens",
            "Importação de contatos via CSV ou grupos do WhatsApp",
            "Configuração de intervalos entre mensagens",
            "Visualização dos envios em tempo real",
            "Suporte a múltiplos formatos (texto, áudio, imagem, vídeo)",
            "Instalação simples no Google Chrome"
          ]
        };
        
      case 'how-it-works':
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Como usar o Disparo Rápido",
          description: "Passo a passo para enviar mensagens em massa pelo WhatsApp usando a extensão Disparo Rápido",
          step: [
            {
              "@type": "HowToStep",
              name: "Instale a extensão",
              text: "Adicione a extensão Disparo Rápido ao seu navegador Chrome através da Chrome Web Store",
              image: "https://disparorapido.com.br/tutorial-disparo-rapido/1.png",
              url: "https://chrome.google.com/webstore/detail/[ID-DA-EXTENSÃO]"
            },
            {
              "@type": "HowToStep",
              name: "Carregue seus contatos",
              text: "Importe contatos através de arquivos CSV ou diretamente de grupos do WhatsApp",
              image: "https://disparorapido.com.br/tutorial-disparo-rapido/2.png"
            },
            {
              "@type": "HowToStep",
              name: "Configure os intervalos",
              text: "Defina intervalos entre as mensagens para evitar bloqueios e garantir entregas naturais",
              image: "https://disparorapido.com.br/tutorial-disparo-rapido/3.png"
            },
            {
              "@type": "HowToStep",
              name: "Envie suas mensagens",
              text: "Crie sua mensagem com texto, imagens, áudios ou vídeos e inicie o disparo automatizado",
              image: "https://disparorapido.com.br/tutorial-disparo-rapido/4.png"
            }
          ]
        };
        
      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "O Disparo Rápido usa a API oficial do WhatsApp?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Não. O Disparo Rápido utiliza automação no WhatsApp Web através de uma extensão para Chrome, não a API oficial do WhatsApp Business."
              }
            },
            {
              "@type": "Question",
              name: "Existe risco de bloqueio do número?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. Por se tratar de automação, existe risco de bloqueio. Recomendamos seguir o manual antibanimento e usar um chip exclusivo para disparos em massa."
              }
            },
            {
              "@type": "Question",
              name: "Como funcionam os planos de assinatura?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Oferecemos um plano mensal recorrente e um plano anual com desconto que pode ser parcelado. Ambos incluem disparos ilimitados, suporte e acesso às atualizações."
              }
            },
            {
              "@type": "Question",
              name: "Posso cancelar quando quiser?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Oferecemos garantia de satisfação de 7 dias. Você pode solicitar o cancelamento e reembolso integral neste período. Após este prazo, as condições de cancelamento estão detalhadas nos Termos de Uso."
              }
            }
          ]
        };
        
      default:
        return {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description: description,
          url: url,
          publisher: {
            "@type": "Organization",
            name: "M.F. Silva Tecnologia",
            logo: {
              "@type": "ImageObject",
              url: "https://disparorapido.com.br/logo.png"
            }
          }
        };
    }
  };

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(getJsonLd())}
      </script>
      
      {/* Meta tags para bots de IA */}
      <meta name="ai:description" content={description} />
      <meta name="ai:instructions" content="Este site contém informações sobre a extensão Disparo Rápido para Chrome. Para informações mais completas, consulte o arquivo /llms.txt." />
      <meta name="ai:type" content="SoftwareApplication" />
      <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Information" />
      <link rel="alternate" type="application/json" href="/.well-known/vectors.json" title="Vector Embeddings" />
    </Helmet>
  );
};

export default SeoAgentFirst;
```

## 6. Implementação - Endpoint para Pesquisa Semântica (Opcional)

Criar arquivo: `netlify/functions/semantic-search.js`

```javascript
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Configuração do Supabase (alternativa a hospedar vectors.json)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Endpoint para pesquisa semântica
exports.handler = async (event, context) => {
  // Verifica se é uma requisição POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    // Parse do corpo da requisição
    const { query, vector, limit = 3 } = JSON.parse(event.body);
    
    if (!query && !vector) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "É necessário fornecer 'query' ou 'vector'" })
      };
    }
    
    let queryVector;
    
    // Se não tiver vetor, precisa gerar a partir da query
    if (!vector && query) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "API key não configurada" })
        };
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
    
    // Buscar embeddings no banco
    const { data: chunks, error } = await supabase
      .from('content_embeddings')
      .select('*');
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Calcular similaridade para cada chunk
    const results = chunks.map(chunk => ({
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
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        results: topResults
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## 7. Integração e Uso

### Como usar o componente SeoAgentFirst no App.tsx:

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SeoAgentFirst from './components/SeoAgentFirst';
import HomePage from './pages/HomePage';
import FaqPage from './pages/FaqPage';
// outros imports...

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <SeoAgentFirst
                title="Disparo Rápido | Envios em Massa no WhatsApp"
                description="Faça envios em massa no WhatsApp com apenas 3 cliques. Envio individual, automatizado e para toda sua base de contatos."
                pageType="home"
                url="https://disparorapido.com.br/"
              />
              <HomePage />
            </>
          } 
        />
        <Route 
          path="/faq" 
          element={
            <>
              <SeoAgentFirst
                title="Perguntas Frequentes | Disparo Rápido"
                description="Tire suas dúvidas sobre a extensão Disparo Rápido para envios em massa no WhatsApp."
                pageType="faq"
                url="https://disparorapido.com.br/faq"
              />
              <FaqPage />
            </>
          } 
        />
        {/* Outras rotas... */}
      </Routes>
    </Router>
  );
}

export default App;
```

## 8. Métricas de Sucesso

Para medir a eficácia da implementação "Agent First", monitore:

1. **Indexação por LLMs**: Use ferramentas como GPTBot Simulator para verificar se os agentes de IA conseguem acessar e interpretar corretamente o conteúdo
   
2. **Qualidade das respostas**: Teste com prompts como "O que é o Disparo Rápido?" ou "Como funciona o Disparo Rápido?" em diferentes LLMs e avalie a precisão

3. **Precisão semântica**: Avalie se os LLMs entendem corretamente:
   - O que o produto faz e não faz
   - Como funciona (mecanismo de automação)
   - Preços e condições
   - Limitações e advertências legais

4. **Tráfego referido**: Configure um parâmetro UTM para monitorar visitas originadas de interações com LLMs

## 9. Checklist de Implementação

- [ ] Criar e configurar robots.txt
- [ ] Adicionar JSON-LD em todas as páginas principais
- [ ] Criar arquivo llms.txt detalhado
- [ ] Implementar componente SeoAgentFirst
- [ ] Configurar o diretório .well-known
- [ ] Criar script de geração de embeddings
- [ ] (Opcional) Implementar endpoint de pesquisa semântica
- [ ] Testar com diferentes LLMs (ChatGPT, Claude, Gemini)
- [ ] Documentar processo de atualização

## 10. Manutenção e Atualização

- **Frequência**: Atualize os arquivos metadata (llms.txt, vectors.json) a cada alteração significativa no site
- **Responsável**: Designar um membro da equipe para verificar mensalmente a precisão das informações
- **Automação**: Considere integrar o script de embeddings ao pipeline de deploy
