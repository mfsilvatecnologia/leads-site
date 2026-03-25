Contexto e objetivo

Você é um assistente de codificação que irá atualizar o código React do site Disparo Rápido (https://disparorapido.com.br/
). Esse site é um funil de vendas de uma extensão de Chrome para WhatsApp que permite enviar mensagens individuais em massa. A página inicial anuncia que a ferramenta permite “envios em massa no WhatsApp com apenas 3 cliques” e descreve que o envio é individual (não é lista de transmissão), automatizado e destinado a toda a base
disparorapido.com.br
. Há depoimentos sobre mais de 1.200 empreendedores ativos, média de 10.000 envios por mês e público-alvo de profissionais liberais, autônomos, lojistas e infoprodutores
disparorapido.com.br
. A seção “Como funciona” explica que o usuário deve instalar a extensão no Chrome, carregar os contatos (via CSV ou grupos do WhatsApp), configurar intervalos entre mensagens e disparar textos, áudios, imagens e vídeos
disparorapido.com.br
. A página também lista funcionalidades como disparos ilimitados, importação de contatos, intervalos configuráveis, visão dos envios, envio de mídias e facilidade de uso
disparorapido.com.br
. A oferta inclui planos mensal e anual com preços promocionais, fornecendo bônus como guias de vendas, manual antibanimento e agentes de IA para copywriting e estratégias de marketing
disparorapido.com.br
. Há botões para baixar uma versão gratuita com 10 mensagens
disparorapido.com.br
 e uma garantia de satisfação para cancelamento em até 7 dias
disparorapido.com.br
. Existem páginas adicionais de Termos de Uso e Política de Privacidade que descrevem aceitação dos termos, uso responsável, riscos de bloqueio, pagamentos, limitações de responsabilidade
disparorapido.com.br
 e políticas de coleta e uso de dados
disparorapido.com.br
disparorapido.com.br
.

Seu objetivo é atualizar esse site para torná-lo “Agents First”, permitindo que agentes conversacionais (ChatGPT, Perplexity, Gemini etc.) possam entender e navegar pelo conteúdo de forma semântica. Isso requer expor metadados estruturados, permitir indexação por bots de IA, disponibilizar sumários amigáveis para LLMs e, opcionalmente, publicar embeddings vetorizados do conteúdo. O resultado esperado é um conjunto de arquivos e componentes React (ou Next.js) que adicionam essas capacidades sem modificar o design ou a experiência do usuário.

Tarefas principais

Criação ou ajuste de robots.txt

Coloque um arquivo public/robots.txt permitindo a indexação por bots de IA. Por exemplo:

User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: AnthropicAI
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: *
Disallow: /admin/


Ajuste as regras de acordo com as seções que você deseja bloquear (ex. área do cliente) e documente nos comentários.

Inserir marcação semântica (Schema.org) via JSON‑LD

No <head> de cada página principal, adicione um script JSON‑LD descrevendo a extensão como um SoftwareApplication ou Product.

Inclua campos como @context, @type, name, description (use o texto “Faça Envios em Massa no WhatsApp…”
disparorapido.com.br
 resumido), applicationCategory: "CommunicationApplication", operatingSystem: "Chrome", browserRequirements, softwareVersion (se conhecido), offers com preço e frequência (mensal/anual) e campos provider com o nome e CNPJ do empreendimento.

Para a seção de funcionalidades, adicione featureList como array com itens: “Disparos ilimitados”, “Importação de contatos via CSV ou grupos”, “Configuração de intervalos”, “Visão dos envios em tempo real”, “Envio de mídias (texto, áudio, imagem e vídeo)”, “Instalação simples no Chrome”
disparorapido.com.br
.

Para a seção de “Como funciona”, adicione um HowTo ou HowToStep no JSON‑LD, listando os passos: instalar a extensão, carregar contatos, configurar intervalos e enviar mensagens
disparorapido.com.br
.

Para a página de FAQ, use o tipo FAQPage com um array de objetos Question/Answer, utilizando as perguntas frequentes do site (“É API oficial do WhatsApp?”, “Existe risco de bloqueio do número?”, etc.) e escrevendo respostas objetivas baseadas nos Termos de Uso (ex.: “O Disparo Rápido usa automação no WhatsApp Web, não a API oficial”
disparorapido.com.br
).

Adicione campos termsOfService e privacyPolicy apontando para as URLs das páginas correspondentes.

Criar arquivo /llms.txt

Na raiz pública (ex.: public/llms.txt), crie um arquivo Markdown que sirva como um guia para agentes de LLMs. Estrutura sugerida:

# Sobre Disparo Rápido
Disparo Rápido é uma extensão de Chrome que automatiza o envio de mensagens individuais via WhatsApp Web. Permite envios em massa sem utilizar listas de transmissão:contentReference[oaicite:14]{index=14}.

## Páginas essenciais
- https://disparorapido.com.br/ — Página inicial com visão geral, funcionalidades:contentReference[oaicite:15]{index=15} e planos:contentReference[oaicite:16]{index=16}.
- https://disparorapido.com.br/termos-de-uso — Termos de uso que descrevem a aceitação dos termos, uso responsável, riscos de bloqueio e política de cancelamento:contentReference[oaicite:17]{index=17}.
- https://disparorapido.com.br/politica-de-privacidade — Política de privacidade explicando quais dados são coletados e como são usados:contentReference[oaicite:18]{index=18}:contentReference[oaicite:19]{index=19}.
- Área do cliente — páginas internas para contratar, fazer download da extensão ou alterar licença (requer login).
- Tutorial — passo a passo de instalação e uso (linkado no menu).
- Versão gratuita — link para Chrome Web Store oferecendo 10 mensagens gratuitas:contentReference[oaicite:20]{index=20}.

## FAQ resumida
- **É API oficial do WhatsApp?** Não. A extensão funciona através do WhatsApp Web e não utiliza a API oficial:contentReference[oaicite:21]{index=21}.
- **Existe risco de bloqueio do número?** Existe, por se tratar de automação. O usuário deve seguir o manual antibanimento e usar chip exclusivo:contentReference[oaicite:22]{index=22}.
- **Como funcionam os planos?** O plano mensal é recorrente, o anual pode ser parcelado e inclui descontos e bônus:contentReference[oaicite:23]{index=23}.
- **Posso cancelar quando quiser?** Há garantia de 7 dias e condições específicas de cancelamento posteriores:contentReference[oaicite:24]{index=24}:contentReference[oaicite:25]{index=25}.

## Contato e suporte
- Suporte: contato@disparorapido.com.br, atendimento de segunda a sexta das 9h às 18h:contentReference[oaicite:26]{index=26}.
- Política de privacidade: [link](https://disparorapido.com.br/politica-de-privacidade).
- Termos de uso: [link](https://disparorapido.com.br/termos-de-uso).


Este arquivo deve ser simples de ler e atualizado sempre que o conteúdo do site mudar.

Publicar embeddings em /.well-known/vectors.json (VAC)

Crie o diretório .well-known na pasta public e adicione um arquivo vectors.json.

Este arquivo deve conter um objeto JSON com campos version, site, updatedAt (ISO-8601) e chunks.

Cada entrada em chunks representa um trecho relevante do site com campos:

url: URL da página (ex.: https://disparorapido.com.br/).

content: texto curto (200‑500 caracteres) resumindo o trecho; utilize os parágrafos da página inicial, termos de uso, política de privacidade, etc.

vector: array numérico com os embeddings; gere usando um modelo de linguagem (ex. OpenAI text-embedding-3-large ou gpt-4-embedding) a partir do content.

metadata: objeto com title (ex.: “Página inicial – Disparo Rápido”) e tags (ex.: ["funcionalidades","precos"]).

Escreva um script (Node.js ou Python) para varrer as principais páginas, extrair texto, segmentar em chunks de 1000 caracteres e gerar as embeddings com a API de sua escolha. Armazene os vetores no vectors.json e atualize periodicamente.

Exemplo simplificado:

{
  "version": "0.1",
  "site": "https://disparorapido.com.br",
  "updatedAt": "2025-08-20T00:00:00Z",
  "chunks": [
    {
      "url": "https://disparorapido.com.br/",
      "content": "Faça envios em massa no WhatsApp com apenas 3 cliques. Envie mensagens individualmente para toda a sua base de contatos...",
      "vector": [0.12, -0.05, 0.34, ...],
      "metadata": {"title": "Página inicial", "tags": ["visao-geral","copy"]}
    },
    {
      "url": "https://disparorapido.com.br/termos-de-uso",
      "content": "O Disparo Rápido é uma extensão para o WhatsApp Web que permite o envio automatizado de mensagens. Nossa ferramenta atua via automação no WhatsApp Web, sem utilizar a API oficial...",
      "vector": [0.01, -0.22, 0.47, ...],
      "metadata": {"title": "Termos de uso", "tags": ["termos","responsabilidade"]}
    }
    // ...
  ]
}


(Opcional) Implemente um endpoint /vac/query que aceita um vetor de consulta, calcula a similaridade (cosine similarity) com os vetores armazenados e retorna os trechos mais relevantes. Essa API facilita a busca semântica por agentes.

(Opcional) Implementar NLWeb/MCP

Avalie utilizar o servidor NLWeb (https://github.com/microsoft/nlweb
) para expor um endpoint /ask que aceita perguntas em linguagem natural e responde com trechos e links do site.

Configure a ingestão da NLWeb para ler os feeds JSON‑LD/Schema.org, os embeddings (vectors.json) e o FAQ.

Habilite o protocolo MCP para permitir a comunicação com agentes compatíveis.

Certifique-se de usar a versão mais recente do NLWeb (≥1º jul 2025) para evitar vulnerabilidades de path traversal.

Boas práticas de acessibilidade e SEO

Certifique-se de que todas as imagens possuam texto alternativo (alt) descritivo.

Utilize títulos (<h1>, <h2>…) estruturados e mantenha semântica correta nos componentes React.

Inclua meta tags description e og: apropriadas.

Entrega esperada

Código React ajustado e comentado contendo as inserções de JSON‑LD no <head> e as melhorias de acessibilidade.

Arquivo public/robots.txt configurado.

Arquivo public/llms.txt criado e populado conforme o modelo.

Arquivo public/.well-known/vectors.json com embeddings (pode conter vetores de exemplo caso a geração automatizada seja feita depois).

(Opcional) Script para gerar embeddings e endpoint /vac/query ou integração com NLWeb.

Documentação em README descrevendo como atualizar os embeddings e o llms.txt quando o conteúdo do site mudar.

Siga estas instruções com cuidado, mantendo a navegação e design atuais. Qualquer dúvida sobre o conteúdo pode ser resolvida consultando novamente as seções citadas acima.