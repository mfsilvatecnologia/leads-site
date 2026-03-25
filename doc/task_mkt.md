# Checklist de Execução: Otimização de Marketing

Este documento detalha as tarefas necessárias para executar o plano de marketing definido em `plan_mkt.md`. Marque cada item conforme for concluído.

### Fase 1: Otimização de Copywriting e Estrutura da Página

**[x] Tarefa 1: Refinar a `HeroSection.tsx`**
- [x] Alterar o título (H1) para uma das opções focadas em benefício:
  - Opção A: "Automatize seu WhatsApp e Venda Todos os Dias."
  - Opção B: "A Ferramenta que Transforma seu WhatsApp em uma Máquina de Vendas."
- [x] Atualizar o subtítulo para: "Envie centenas de mensagens personalizadas com 1 clique. Seguro, simples e eficiente."
- [x] Verificar se o botão de CTA principal está visível e claro.

**[x] Tarefa 2: Otimizar e Reposicionar a `SocialProof.tsx`**
- [x] Mover a seção `SocialProof` para logo abaixo da `HeroSection` no arquivo `src/pages/Index.tsx`.
- [x] Coletar e substituir os depoimentos genéricos por 3 depoimentos focados em resultados: tempo economizado, aumento de vendas e facilidade de uso.
- [x] (Opcional) Substituir os ícones por fotos reais dos clientes que deram os depoimentos.

**[x] Tarefa 3: Clarificar os Benefícios em `Benefits.tsx`**
- [x] Reescrever os títulos dos benefícios para serem mais específicos e tangíveis (ex: "Economize +10 horas por semana").
- [x] Revisar os ícones para garantir que eles representam visualmente cada novo benefício de forma clara.

**[x] Tarefa 4: Adicionar Urgência e Valor em `Pricing.tsx`**
- [x] Adicionar um selo ou destaque visual de "Mais Popular" no plano Anual.
- [x] Incluir um texto de ancoragem de valor abaixo do preço anual, como por exemplo: `(Economize R$XX em relação ao plano mensal!)`.
- [x] Adicionar um elemento de urgência/escassez, como um texto "Oferta por tempo limitado".

**[x] Tarefa 5: Fortalecer a Garantia em `Guarantee.tsx`**
- [x] Alterar o título para "Seu Risco é Absolutamente Zero".
- [x] Revisar o texto para garantir que a política de reembolso de 7 dias seja comunicada de forma clara e direta, reforçando a segurança da compra.

**[x] Tarefa 6: Otimizar o `CallToAction.tsx` Final**
- [x] Simplificar a chamada para ação com um texto mais direto, como: "Comece a Automatizar Suas Vendas Agora".

### Fase 2: Execução Técnica e Análise

**[x] Tarefa 7: Reordenar Componentes em `src/pages/CopyIndex.tsx`**
- [x] Abrir o arquivo `src/pages/CopyIndex.tsx`.
- [x] Mover o componente `<SocialProofV2 />` para ficar imediatamente após o componente `<HeroSectionV2 />`.
- [x] Validar se a nova ordem dos componentes está correta e renderiza sem erros.

**[ ] Tarefa 8: Publicação (Deploy)**
- [ ] Fazer o deploy das alterações para o ambiente de produção.
- [ ] Verificar o site no ar para garantir que todas as mudanças foram aplicadas corretamente.

**[ ] Tarefa 9: Configuração da Análise de Performance**
- [ ] Garantir que o Google Analytics (ou outra ferramenta de análise) está corretamente instalado e coletando dados.
- [ ] Criar uma anotação no Google Analytics para marcar a data da atualização e facilitar a análise de impacto.
- [ ] (Opcional) Configurar mapas de calor (Hotjar, Clarity) para analisar o comportamento do usuário com a nova versão da página.

**[ ] Tarefa 10: Planejamento de Testes A/B**
- [ ] Documentar as hipóteses para os testes A/B (ex: "O Título A na HeroSection irá gerar mais cliques que o Título B").
- [ ] Configurar o primeiro teste A/B na ferramenta escolhida (ex: Google Optimize) para os títulos da `HeroSection`.
