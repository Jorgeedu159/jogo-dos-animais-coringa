# Jogo dos Animais com Carta Coringa

## Visão Geral

Título do jogo: **Jogo dos Animais - Coringa**
Gênero: Jogo de cartas de combinação / memória com turnos
Número de jogadores: 2 a 5
Plataforma alvo: Navegador web (desktop e mobile)

## Objetivo

Criar um jogo de cartas onde jogadores viram cartas para encontrar pares de animais (fêmea e macho). Há 24 pares de animais e uma carta coringa. O jogo acaba quando alguém ficar com a carta coringa.

## Regras de Jogo

- O tabuleiro contém 24 pares de cartas de animais + 1 carta coringa = 49 cartas no total.
- Cada par consiste em uma versão fêmea e uma versão macho de um mesmo animal.
- Os jogadores jogam em turnos, na ordem definida.
- Em cada turno, o jogador vira duas cartas.
- Se as duas cartas formarem um par correto (mesmo animal, gêneros diferentes), o par é removido e o jogador ganha 1 ponto.
- Se o jogador encontrar o par correto, ele permanece na vez e joga novamente.
- Se as duas cartas não formarem par, o turno passa para o próximo jogador.
- Se um jogador virar a carta coringa, o jogo termina imediatamente e aquele jogador é o perdedor.

## Mecânicas Principais

### Cartas
- Cada carta possui:
  - ID único
  - tipo: `animal` ou `coringa`
  - nome do animal
  - emoji exibido
  - gênero (`femea` ou `macho`) para cartas de animal
  - par: ID do par correspondente

### Turnos
- Estado do jogo mantém índice do jogador atual.
- Avança para o próximo jogador apenas quando duas cartas viradas não formam par.
- Quando ocorre par correto, o jogador atual mantém a vez.

### Pontuação
- Cada par correto concede 1 ponto ao jogador atual.
- A carta coringa não gera par, apenas finaliza o jogo.

### Final de jogo
- O jogo termina quando qualquer jogador encontrar a carta coringa.
- Uma tela final mostra quem ficou com o coringa.

## Requisitos Técnicos

### Tecnologias
- HTML, CSS e JavaScript puro
- Estrutura de diretórios:
  - `index.html`
  - `style.css`
  - `script.js`
  - `docs/game-design.md`

### UI/UX
- Tela inicial para selecionar o número de jogadores e inserir nomes.
- Tabuleiro de cartas exibido em grade responsiva.
- Cartas mostram `?` quando viradas para baixo e emoji quando viradas para cima.
- Placar de jogadores atualizando ao vivo.
- Indicador de jogador atual.
- Tela de fim de jogo com mensagem e botão para reiniciar.

### Comportamento do Tabuleiro
- Deverá haver embaralhamento aleatório de cartas.
- Cartas pareadas devem ficar desativadas e parcialmente opacas.
- A carta coringa deve ter um estilo visual distinto.

## Casos de Uso

1. Usuário abre o jogo.
2. Usuário escolhe 2-5 jogadores.
3. Usuário insere ou mantém nomes padrão.
4. O jogo inicia e exibe o tabuleiro.
5. Usuário clica em cartas para virá-las.
6. Se houver par correto, jogador ganha ponto e joga de novo.
7. Se não houver par, próxima pessoa joga.
8. Se a carta coringa for virada, o jogo termina.
9. Tela final mostra o perdedor e permite reiniciar.

## Notas de Implementação

- Garantir que o jogo funcione offline com arquivo único ou servidor local.
- Evitar dependências externas.
- Usar emoji como estilo visual simples e compatível.
- Proteger contra cliques repetidos enquanto duas cartas estão viradas.
- Atualizar placar e jogador atual após cada turno.
- Exibir mensagem clara no fim de jogo.

## Detalhes do Coringa

- A carta coringa pode ser representada por um emoji de macaquinho ou máscara de teatro.
- O coringa não combina com nenhuma outra carta.
- Ao ser virado, o jogo termina imediatamente.

## Estrutura de Dados Sugerida

```js
const carta = {
  id: 0,
  tipo: 'animal' | 'coringa',
  nome: 'Leão',
  emoji: '🦁',
  genero: 'femea' | 'macho',
  par: 1
};
```

## Experiência do Jogador

- Texto claro de instrução e feedback em tempo real.
- Animações suaves no clique e virada.
- Interface simples com foco no jogo de memória.

## Observações

- O jogo deve suportar até 5 jogadores, mas não menos que 2.
- Cada partida deve ser autossuficiente e iniciar do zero.
- O objetivo é “quem ficar com o coringa perde”, tornando o jogo fácil de entender.
