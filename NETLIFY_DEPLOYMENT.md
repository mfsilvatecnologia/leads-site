# Instruções para Implantação no Netlify

Este documento contém instruções para implantar corretamente o site Disparo Rápido no Netlify, incluindo a funcionalidade de download seguro da extensão.

## Preparação

1. O arquivo da extensão já está incorporado no código como base64 dentro da função do Netlify:
   ```
   netlify/functions/secure-download.js
   ```

   Para substituir por uma nova versão da extensão, execute:
   ```bash
   base64 -w 0 caminho/para/sua/extensao.zip
   ```
   E substitua o valor da constante `EXTENSION_BASE64` no arquivo da função.

2. Verifique se o arquivo `netlify.toml` está configurado corretamente:
   ```toml
    [build]
      command = "npm run build"
      publish = "dist"
      functions = "netlify/functions"
    ```

3. Configure no Netlify a variável de ambiente `NPM_FLAGS` com o valor `--no-frozen-lockfile` para permitir a instalação das dependências mesmo quando o `pnpm-lock.yaml` não estiver sincronizado.

## Implantação no Netlify

### Opção 1: Implantação via Git

1. Faça push do seu código para um repositório Git (GitHub, GitLab ou Bitbucket)
2. Faça login no Netlify e clique em "New site from Git"
3. Selecione seu repositório
4. As configurações de build serão automaticamente detectadas do arquivo `netlify.toml`
5. Clique em "Deploy site"

### Opção 2: Implantação manual

1. Execute o build localmente:
   ```
   npm run build
   ```

2. Compacte a pasta `dist` e a pasta `netlify` em um arquivo ZIP
3. Faça login no Netlify e clique em "Sites"
4. Arraste e solte o arquivo ZIP na área designada

## Verificação da Implantação

Após a implantação, verifique se:

1. A página de download está funcionando em: `https://seu-site.netlify.app/download`
2. A função do Netlify está acessível em: `https://seu-site.netlify.app/.netlify/functions/secure-download`
3. O arquivo robots.txt está bloqueando corretamente o acesso ao arquivo da extensão

## Solução de Problemas

Se encontrar problemas na implantação:

1. Verifique os logs de build no Netlify
2. Certifique-se de que o diretório de publicação está correto (`dist`)
3. Verifique se a função do Netlify está sendo compilada corretamente
4. Confirme que o arquivo da extensão está no local correto dentro da pasta da função

## Estrutura de Arquivos Importante

```
quick-message-magic/
├── dist/                 # Diretório de build (gerado pelo Vite)
├── netlify/
│   └── functions/
│       ├── secure-download.js
│       └── secure-download/
│           └── extencao-disparo-rapido.zip
├── netlify.toml          # Configuração do Netlify
└── src/
    └── ...
```
