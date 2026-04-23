import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '@/lib/siteUrl';

const POLITICA_PAGE_URL = `${SITE_URL}/politica-de-privacidade`;
const POLITICA_TITLE = 'Política de Privacidade | Lead Rápido';
const POLITICA_DESCRIPTION =
  'Como a Lead Rápido trata dados pessoais, bases legais (LGPD), pagamentos, cookies e direitos do titular.';

const POLITICA_PRIVACIDADE = `POLITICA DE PRIVACIDADE - LEAD RAPIDO

1. CONTROLADORA E DISPOSICOES INICIAIS
A presente Politica de Privacidade tem por finalidade esclarecer como a Lead Rapido, disponivel em https://www.leadrapido.com.br/, inscrita no CNPJ sob n 35.185.351/0001-07, com sede na Rua Antonio Torres Penedo, n 147, Sala 02, Bairro Sao Joaquim, Franca/SP, CEP 14.406-352, realiza o tratamento de dados pessoais no ambito de suas atividades.
Para os fins da Lei n 13.709/2018 (Lei Geral de Protecao de Dados - LGPD), a Lead Rapido atua como Controladora dos dados pessoais tratados.
Ao utilizar a plataforma, o usuario declara estar ciente desta Politica.

2. DADOS PESSOAIS COLETADOS DOS USUARIOS (CLIENTES)
Para viabilizar a utilizacao da plataforma e a prestacao dos servicos, a Lead Rapido coleta dados pessoais minimos dos usuarios, tais como:
- e-mail
- dados cadastrais basicos eventualmente informados no momento da compra
Os dados sao utilizados para as seguintes finalidades:
I - envio dos leads adquiridos, em formato de planilha, apos a confirmacao do pagamento;
II - emissao e envio da nota fiscal de servico;
III - comunicacao com o usuario, quando necessario para a prestacao do servico.
A coleta limita-se ao minimo necessario para execucao das atividades da plataforma.

3. BASE LEGAL PARA O TRATAMENTO
O tratamento dos dados pessoais dos usuarios fundamenta-se nas seguintes bases legais:
Execucao de contrato (art. 7, V, da LGPD) - para viabilizar a prestacao do servico contratado;
Cumprimento de obrigacao legal ou regulatoria (art. 7, II) - para fins fiscais e emissao de nota fiscal.

4. PROCESSAMENTO DE PAGAMENTOS
A Lead Rapido nao armazena dados financeiros sensiveis, como numero completo de cartao de credito.
Os pagamentos sao processados por meio do gateway Asaas, responsavel pelo tratamento dos dados financeiros, atuando como operador independente.
As transacoes observam os padroes de seguranca e conformidade exigidos pelo mercado.

5. DADOS COMERCIALIZADOS (LEADS)
A atividade da Lead Rapido consiste na organizacao e disponibilizacao de dados empresariais coletados de fontes publicas e de livre acesso, especialmente do Google Maps/Google Meu Negocio.
Esses dados podem incluir:
- nome empresarial
- telefone comercial
- endereco comercial
- outras informacoes publicas disponibilizadas pelas proprias empresas
A coleta e realizada por meio de ferramentas automatizadas, com atualizacoes periodicas.
A Lead Rapido nao realiza coleta de dados provenientes de bases restritas ou sigilosas, tampouco utiliza diretamente dados do cadastro da Receita Federal.

6. BASE LEGAL PARA OS LEADS (LEGITIMO INTERESSE)
O tratamento e a disponibilizacao dos dados constantes nos leads fundamentam-se na base legal do legitimo interesse (art. 7, IX, da LGPD), considerando que:
- os dados sao manifestamente publicos;
- referem-se a pessoas juridicas ou contatos comerciais;
- sao utilizados para fins legitimos de prospeccao empresarial.
A Lead Rapido adota medidas para garantir que o tratamento nao viole direitos e liberdades fundamentais dos titulares.

7. DIREITOS DOS TITULARES
Nos termos da LGPD, os titulares de dados pessoais poderao exercer, a qualquer tempo, os seguintes direitos:
- confirmacao da existencia de tratamento;
- acesso aos dados;
- correcao de dados incompletos ou desatualizados;
- anonimização, bloqueio ou eliminacao de dados;
- informacao sobre compartilhamento;
- revogacao do consentimento, quando aplicavel.

8. OPOSICAO E EXCLUSAO DE DADOS (OPT-OUT)
Qualquer titular que nao deseje ter seus dados utilizados para fins de prospeccao podera solicitar a exclusao de suas informacoes da base da Lead Rapido.
A solicitacao sera analisada e atendida em prazo razoavel, conforme previsto na legislacao aplicavel.

9. ARMAZENAMENTO E SEGURANCA
A Lead Rapido adota medidas tecnicas e administrativas razoaveis para proteger os dados contra acessos nao autorizados, destruicao, perda ou alteracao indevida.
Os dados sao armazenados pelo tempo necessario para cumprimento das finalidades descritas nesta Politica, respeitando obrigacoes legais e regulatorias.

10. COMPARTILHAMENTO DE DADOS
A Lead Rapido podera compartilhar dados pessoais com terceiros nas seguintes hipoteses:
- com provedores de servicos essenciais (ex.: gateway de pagamento);
- para cumprimento de obrigacoes legais;
- mediante determinacao judicial ou de autoridade competente.

11. ALTERACOES DESTA POLITICA
Esta Politica podera ser alterada a qualquer tempo, mediante publicacao de versao atualizada na plataforma.

12. CANAIS DE CONTATO
12.1. Para o exercicio de direitos previstos na Lei Geral de Protecao de Dados (Lei n 13.709/2018), bem como para esclarecimento de duvidas relacionadas a esta Politica de Privacidade, o titular podera entrar em contato por meio do e-mail: contato@leadrapido.com.br
12.2. Alternativamente, o contato podera ser realizado por correspondencia encaminhada ao endereco da sede da Lead Rapido:
Rua Antonio Torres Penedo, n 147, Sala 02, Bairro Sao Joaquim, Franca/SP, CEP 14.406-352.
12.3. A Lead Rapido atuara para responder as solicitacoes em prazo razoavel, nos termos da legislacao aplicavel.`;

const PoliticaPrivacidade = () => (
  <>
    <Helmet>
      <title>{POLITICA_TITLE}</title>
      <meta name="description" content={POLITICA_DESCRIPTION} />
      <link rel="canonical" href={POLITICA_PAGE_URL} />
      <meta property="og:title" content={POLITICA_TITLE} />
      <meta property="og:description" content={POLITICA_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={POLITICA_PAGE_URL} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:image" content={`${SITE_URL}/leads-link.png`} />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
    <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
    <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-blue-900">Politica de Privacidade</h1>
      <p className="mt-2 text-sm text-gray-500">Ultima atualizacao: 10/04/2026</p>
      <article className="mt-8 whitespace-pre-line text-sm leading-7">{POLITICA_PRIVACIDADE}</article>
    </div>
  </main>
  </>
);

export default PoliticaPrivacidade;
