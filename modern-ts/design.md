# Jogo dos Animais com Carta Coringa - Versão TypeScript

## Visão Geral

Título: Jogo dos Animais - Coringa (TypeScript)
Categoria: Jogo de memória / cartas / party game
Plataforma: Navegador web moderno
Linguagem: TypeScript + HTML + CSS

## Objetivo

Implementar o mesmo jogo de pares de animais com carta coringa usando uma linguagem mais atual e tipada. O jogo deve ser responsivo, acessível, otimizado e fácil de manter.

## Mecânicas

- Tabuleiro com 24 pares de animais (fêmea e macho) e 1 carta coringa.
- Cada jogador vira duas cartas por vez.
- Par correto: mesmo animal, gêneros opostos.
- Carta coringa: jogo termina imediatamente quando virada.
- Pontuação por par correto.
- Turnos alternados entre jogadores.

## Requisitos Funcionais

1. Seleção de 2 a 5 jogadores.
2. Inserção opcional de nomes de jogador.
3. Tabuleiro embaralhado a cada partida.
4. Feedback visual para cartas viradas, pareadas e coringa.
5. Indicador do jogador atual.
6. Placar atualizado em tempo real.
7. Tela final com o perdedor.
8. Reiniciar partida sem atualizar a página.

## Requisitos Técnicos

- Usar TypeScript com tipagens explícitas.
- Avoid global variables and keep state encapsulated.
- Uso de módulos ES com `type="module"` no HTML.
- Arquivo `tsconfig.json` para configuração de compilação.
- Design responsivo com CSS moderno.
- Otimização de renderização com `DocumentFragment`.

## Estrutura do Projeto

- `index.html`
- `styles.css`
- `main.ts`
- `tsconfig.json`
- `design.md`

## Estrutura de Dados

```ts
interface GameCard {
  id: number;
  type: 'animal' | 'joker';
  name: string;
  emoji: string;
  gender?: 'female' | 'male';
  matchId: number;
}

interface GameState {
  cards: GameCard[];
  flippedIds: number[];
  matchedIds: Set<number>;
  players: string[];
  scores: Record<string, number>;
  activePlayerIndex: number;
  isBusy: boolean;
}
```

## Interações do Usuário

- Cliques em `Iniciar Jogo`, `Novo Jogo` e `Jogar Novamente`.
- Cliques em cartas do tabuleiro.
- Alteração do número de jogadores atualiza os campos de nome.

## Acessibilidade

- Labels para inputs e botões claros.
- `aria-label` nas cartas.
- Boa legibilidade e contraste.

## Detalhes de Implementação

- `initialize()` prepara os campos e registra eventos.
- `buildCards()` cria pares e adiciona coringa.
- `shuffle()` embaralha com algoritmo Fisher-Yates.
- `render()` atualiza apenas o necessário no DOM.
- `evaluateTurn()` verifica combinações e controla fluxo.
- `advancePlayer()` muda turno.
- `showFinalScreen()` exibe o fim do jogo.

## Notas de Otimização

- Use fragmentos DOM para renderizar listas grandes.
- Evite re-renderizações completas quando possível.
- Use `const` e `readonly` onde cabível.
- Separe lógica de estado de lógica de apresentação.

## Observações

- Este projeto é uma implementação mais moderna e preparada para evolução futura.
- A versão TypeScript é compatível com compilação para JavaScript e uso em projetos modernos.
