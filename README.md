# Olha o Macaco! com Carta Coringa

Este projeto contém duas versões do jogo:

1. **Versão JavaScript tradicional**
   - `index.html`
   - `style.css`
   - `script.js`
   - `docs/game-design.md`
   - Atualização responsiva e otimizada para navegação em desktop e mobile.

2. **Versão TypeScript moderna**
   - `modern-ts/index.html`
   - `modern-ts/styles.css`
   - `modern-ts/main.ts`
   - `modern-ts/tsconfig.json`
   - `modern-ts/design.md`

## Como usar

### Versão JavaScript
1. Abra `index.html` no navegador.
2. Se quiser, utilize um servidor local para evitar eventuais bloqueios de arquivos.

### Versão TypeScript
1. O arquivo `main.ts` é a implementação moderna.
2. Para compilar, use um ambiente com TypeScript instalado ou Deno.
3. O `index.html` em `modern-ts/` carrega `main.ts` como módulo ES quando o navegador suporta TypeScript nativamente em ambientes de desenvolvimento.

## Observações

- A versão JavaScript está funcional e já otimizada para responsividade.
- A versão TypeScript foi projetada para ser mais organizada, tipada e escalável.
- Há documentação de design em `docs/game-design.md` e `modern-ts/design.md`.

## Multiplayer local

- O servidor multiplayer está em `multiplayer/server.cs`.
- Para jogar com amigos na mesma máquina, execute `multiplayer/server.exe` e abra `http://localhost:8003/`.
- O servidor atual está ligado a `localhost`, portanto não fica acessível pela internet sem hospedagem ou redirecionamento de portas.

## Para disponibilizar online

1. Instale `git` localmente e configure sua conta GitHub.
2. Crie um repositório no GitHub e envie o código com:
   - `git init`
   - `git add .`
   - `git commit -m "Versão inicial do Olha o Macaco!"`
   - `git branch -M main`
   - `git remote add origin <URL_DO_REPO>`
   - `git push -u origin main`
3. Para publicar a versão multiplayer online, use um serviço de hospedagem de aplicação que suporte C#/.NET, como Azure App Service, Railway, Fly.io ou uma VM com porta 8003 liberada.
4. Se quiser apenas o modo solo, a parte web pode ser hospedada como site estático (GitHub Pages, Netlify, Vercel), mas o multiplayer exige backend.

## GitHub e publicação

- Aqui não há `git` ou `gh` instalados, então não consigo criar o repositório nem enviar o projeto direto para o seu GitHub neste ambiente.
- Posso ajudar você a criar o repositório e configurar o deploy passo a passo.
