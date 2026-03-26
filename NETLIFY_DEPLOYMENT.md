# Instrucoes para Implantacao no Netlify

Este documento descreve a implantacao do site Lead Rapido no Netlify.

## Configuracao atual

O deploy usa apenas o build estatico do Vite.

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NPM_FLAGS = "--no-frozen-lockfile"
```

## Implantacao via Git (recomendada)

1. Faça push do codigo para o repositório.
2. No Netlify, clique em "New site from Git".
3. Selecione o repositório e confirme o deploy.
4. O Netlify vai usar automaticamente as configuracoes do `netlify.toml`.

## Implantacao manual

1. Rode localmente:
   ```bash
   npm run build
   ```
2. Publique a pasta `dist` no Netlify.

## Validacao apos deploy

1. Abrir a home do site e validar carregamento.
2. Confirmar rotas do frontend funcionando (ex.: checkout).
3. Validar favicon/manifest e assets estaticos.
