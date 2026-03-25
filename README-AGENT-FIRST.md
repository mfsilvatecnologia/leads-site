# Disparo Rápido - Site com Otimização "Agent First"

Este projeto contém o código-fonte do site Disparo Rápido ([disparorapido.com.br](https://disparorapido.com.br)), uma plataforma para venda de uma extensão Chrome que automatiza o envio de mensagens individuais em massa via WhatsApp.

## Otimizações para Agentes de IA

O site foi otimizado para ser facilmente compreendido por agentes de IA (como ChatGPT, Claude, Gemini), permitindo que esses agentes:

1. Compreendam corretamente o propósito e funcionamento do produto
2. Naveguem semanticamente pelo conteúdo do site
3. Recuperem informações precisas sobre funcionalidades, preços e termos
4. Respondam perguntas de usuários com dados atualizados e factuais
5. Evitem mal-entendidos sobre o que o produto faz ou não faz

### Recursos "Agent First" Implementados

- **robots.txt otimizado** - Configurado para permitir acesso aos crawlers de IA (GPTBot, PerplexityBot, etc.)
- **JSON-LD Schema.org** - Metadados estruturados para produto, FAQ e instruções passo-a-passo
- **Guia para LLMs** - Arquivo `llms.txt` com informações específicas para agentes de IA
- **Embeddings vetoriais** - Arquivo `vectors.json` no formato padrão VAC (Vector Access Control)
- **Endpoint de busca semântica** - API para consultas em linguagem natural via embeddings

## Como manter as otimizações para IA

### 1. Atualizando o arquivo llms.txt

Sempre que houver mudanças significativas no produto, preços ou políticas:

```bash
# Editar o arquivo
nano public/llms.txt

# Atualizar a data no topo do arquivo
```

### 2. Atualizando os embeddings vetoriais

Os embeddings vetoriais precisam ser regenerados quando o conteúdo do site mudar:

```bash
# Usando Node.js
node scripts/generate-embeddings.js

```

**Requisitos:**

- Node.js: Instalar `npm install openai cheerio node-fetch dotenv`
- Definir `OPENAI_API_KEY` nas variáveis de ambiente ou arquivo `.env`

**Nota importante:**

1. O projeto utiliza ESM (ECMAScript Modules). Os scripts JavaScript usam a sintaxe de importação `import/export` em vez de `require/module.exports`.
2. O script `generate-embeddings.js` possui um modo de desenvolvimento que gera embeddings simulados quando a API key da OpenAI não está configurada ou quando NODE_ENV não é "production".
3. Para gerar embeddings reais, adicione sua API key da OpenAI ao arquivo `.env` e defina `NODE_ENV=production`.

### 3. Testando a integração com LLMs

Para verificar se as otimizações estão funcionando:

1. Teste com ChatGPT: "O que é o Disparo Rápido e como ele funciona?"
2. Verifique se as respostas são precisas e contêm as informações atuais do site

## Componentes principais

- `src/components/SeoAgentFirst.tsx` - Componente React para injetar metadados Schema.org
- `public/llms.txt` - Guia informativo para agentes de IA
- `public/.well-known/vectors.json` - Embeddings vetoriais do conteúdo
- `netlify/functions/semantic-search.js` - API para busca semântica

## Desenvolvimento e Manutenção

### Adicionando a componentes de página

Para adicionar o componente SeoAgentFirst a uma nova página:

```jsx
import SeoAgentFirst from '@/components/SeoAgentFirst';

const MinhaNovaPage = () => {
  return (
    <>
      <SeoAgentFirst
        title="Título da Página | Disparo Rápido"
        description="Descrição clara e concisa da página."
        pageType="home" // ou "faq", "how-it-works", "terms", "privacy"
        url="https://disparorapido.com.br/minha-pagina"
      />
      {/* Restante do conteúdo da página */}
    </>
  );
};
```

