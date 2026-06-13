type CardType = 'animal' | 'joker';

type Gender = 'female' | 'male';

interface GameCard {
  id: number;
  type: CardType;
  name: string;
  emoji: string;
  gender?: Gender;
  matchId: number;
}

interface GameState {
  cards: GameCard[];
  cardMap: ReadonlyMap<number, GameCard>;
  flippedIds: number[];
  matchedIds: Set<number>;
  players: string[];
  scores: Record<string, number>;
  activePlayerIndex: number;
  isBusy: boolean;
}

const ANIMALS = [
  { name: 'Leão', femaleEmoji: '🦁', maleEmoji: '🦁' },
  { name: 'Tigre', femaleEmoji: '🐅', maleEmoji: '🐅' },
  { name: 'Zebra', femaleEmoji: '🦓', maleEmoji: '🦓' },
  { name: 'Gato', femaleEmoji: '🐱', maleEmoji: '😺' },
  { name: 'Cachorro', femaleEmoji: '🐶', maleEmoji: '🐕' },
  { name: 'Urso', femaleEmoji: '🧸', maleEmoji: '🐻' },
  { name: 'Panda', femaleEmoji: '🐼', maleEmoji: '🐼' },
  { name: 'Coelho', femaleEmoji: '🐰', maleEmoji: '🐇' },
  { name: 'Raposa', femaleEmoji: '🦊', maleEmoji: '🦊' },
  { name: 'Lobo', femaleEmoji: '🐺', maleEmoji: '🐺' },
  { name: 'Cabra', femaleEmoji: '🐐', maleEmoji: '🐐' },
  { name: 'Vaca', femaleEmoji: '🐄', maleEmoji: '🐂' },
  { name: 'Porco', femaleEmoji: '🐷', maleEmoji: '🐷' },
  { name: 'Ovelha', femaleEmoji: '🐑', maleEmoji: '🐑' },
  { name: 'Cavalo', femaleEmoji: '🐴', maleEmoji: '🐎' },
  { name: 'Camelo', femaleEmoji: '🐫', maleEmoji: '🐪' },
  { name: 'Girafa', femaleEmoji: '🦒', maleEmoji: '🦒' },
  { name: 'Elefante', femaleEmoji: '🐘', maleEmoji: '🐘' },
  { name: 'Rinoceronte', femaleEmoji: '🦏', maleEmoji: '🦏' },
  { name: 'Hipopótamo', femaleEmoji: '🦛', maleEmoji: '🦛' },
  { name: 'Chimpanzé', femaleEmoji: '🐵', maleEmoji: '🐵' },
  { name: 'Macaco', femaleEmoji: '🐒', maleEmoji: '🐒' },
  { name: 'Avestruz', femaleEmoji: '🐦', maleEmoji: '🐦' },
  { name: 'Flamingo', femaleEmoji: '🦩', maleEmoji: '🦩' }
] as const;

const JOKER = { name: 'Coringa', emoji: '🎭' } as const;

const dom = {
  homeScreen: document.getElementById('homeScreen') as HTMLElement,
  gameScreen: document.getElementById('gameScreen') as HTMLElement,
  finalScreen: document.getElementById('finalScreen') as HTMLElement,
  playerCount: document.getElementById('playerCount') as HTMLInputElement,
  playerNames: document.getElementById('playerNames') as HTMLElement,
  startButton: document.getElementById('startButton') as HTMLButtonElement,
  newGameButton: document.getElementById('newGameButton') as HTMLButtonElement,
  restartButton: document.getElementById('restartButton') as HTMLButtonElement,
  currentPlayerName: document.getElementById('currentPlayerName') as HTMLElement,
  statusText: document.getElementById('statusText') as HTMLElement,
  scoreBoard: document.getElementById('scoreBoard') as HTMLElement,
  board: document.getElementById('board') as HTMLElement,
  finalMessage: document.getElementById('finalMessage') as HTMLElement
};

const state: GameState = {
  cards: [],
  cardMap: new Map(),
  flippedIds: [],
  matchedIds: new Set(),
  players: [],
  scores: {},
  activePlayerIndex: 0,
  isBusy: false
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createPlayerInputs(): void {
  const count = clamp(parseInt(dom.playerCount.value, 10) || 2, 2, 5);
  dom.playerCount.value = String(count);
  dom.playerNames.innerHTML = '';

  for (let index = 0; index < count; index += 1) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-nome';

    const label = document.createElement('label');
    label.textContent = `Jogador ${index + 1}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Nome do jogador ${index + 1}`;
    input.dataset.playerIndex = String(index);

    wrapper.append(label, input);
    dom.playerNames.append(wrapper);
  }
}

function getPlayerNames(): string[] {
  return Array.from(dom.playerNames.querySelectorAll<HTMLInputElement>('input')).map((input, index) => {
    return input.value.trim() || `Jogador ${index + 1}`;
  });
}

function buildCards(): GameCard[] {
  const cards: GameCard[] = ANIMALS.flatMap((animal, index) => [
    {
      id: index * 2,
      type: 'animal',
      name: animal.name,
      emoji: animal.femaleEmoji,
      gender: 'female',
      matchId: index * 2 + 1
    },
    {
      id: index * 2 + 1,
      type: 'animal',
      name: animal.name,
      emoji: animal.maleEmoji,
      gender: 'male',
      matchId: index * 2
    }
  ]);

  cards.push({
    id: ANIMALS.length * 2,
    type: 'joker',
    name: JOKER.name,
    emoji: JOKER.emoji,
    matchId: -1
  });

  return shuffle(cards);
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
}

function initializeGame(): void {
  const players = getPlayerNames();
  state.players = players;
  state.scores = Object.fromEntries(players.map((player) => [player, 0]));
  state.activePlayerIndex = 0;
  state.flippedIds = [];
  state.matchedIds.clear();
  state.isBusy = false;
  state.cards = buildCards();
  state.cardMap = new Map(state.cards.map((card) => [card.id, card]));

  showScreen('game');
  render();
}

function showScreen(screenName: 'home' | 'game' | 'final'): void {
  dom.homeScreen.classList.toggle('screen--hidden', screenName !== 'home');
  dom.gameScreen.classList.toggle('screen--hidden', screenName !== 'game');
  dom.finalScreen.classList.toggle('screen--hidden', screenName !== 'final');
}

function render(): void {
  renderCurrentPlayer();
  renderScoreboard();
  renderBoard();
}

function renderCurrentPlayer(): void {
  const currentPlayer = state.players[state.activePlayerIndex];
  dom.currentPlayerName.textContent = currentPlayer;
  dom.statusText.textContent = 'É sua vez!';
}

function renderScoreboard(): void {
  const fragment = document.createDocumentFragment();

  state.players.forEach((player, index) => {
    const scoreItem = document.createElement('div');
    scoreItem.className = 'item-placar';
    if (index === state.activePlayerIndex) {
      scoreItem.classList.add('atual');
    }

    scoreItem.innerHTML = `
      <div class="nome">${player}</div>
      <div class="pontos">${state.scores[player]}</div>
    `;

    fragment.appendChild(scoreItem);
  });

  dom.scoreBoard.innerHTML = '';
  dom.scoreBoard.appendChild(fragment);
}

function renderBoard(): void {
  const fragment = document.createDocumentFragment();

  state.cards.forEach((card) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carta';
    button.dataset.id = String(card.id);
    button.ariaLabel = card.type === 'joker'
      ? 'Carta coringa'
      : `${card.name} ${card.gender === 'female' ? 'fêmea' : 'macho'}`;

    if (state.matchedIds.has(card.id)) {
      button.classList.add('pareada');
      button.disabled = true;
    }

    if (state.flippedIds.includes(card.id)) {
      button.classList.add('virada');
      button.textContent = card.emoji;
      if (card.type === 'joker') {
        button.classList.add('coringa');
      }
    } else {
      button.textContent = '⛭';
    }

    fragment.appendChild(button);
  });

  dom.board.innerHTML = '';
  dom.board.appendChild(fragment);
}

function handleBoardClick(event: MouseEvent): void {
  const element = (event.target as HTMLElement).closest('button.carta');
  if (!element) {
    return;
  }

  const cardId = Number(element.dataset.id);
  if (!Number.isInteger(cardId)) {
    return;
  }

  flipCard(cardId);
}

function flipCard(cardId: number): void {
  if (
    state.isBusy ||
    state.flippedIds.length >= 2 ||
    state.flippedIds.includes(cardId) ||
    state.matchedIds.has(cardId)
  ) {
    return;
  }

  state.flippedIds.push(cardId);
  renderBoard();

  if (state.flippedIds.length === 2) {
    evaluateTurn();
  }
}

function evaluateTurn(): void {
  const [firstId, secondId] = state.flippedIds;
  const firstCard = state.cardMap.get(firstId);
  const secondCard = state.cardMap.get(secondId);

  if (!firstCard || !secondCard) {
    state.flippedIds = [];
    renderBoard();
    return;
  }

  const currentPlayer = state.players[state.activePlayerIndex];

  if (firstCard.type === 'joker' || secondCard.type === 'joker') {
    state.isBusy = true;
    setTimeout(() => {
      state.matchedIds.add(firstId);
      state.matchedIds.add(secondId);
      showFinalScreen(currentPlayer);
    }, 500);
    return;
  }

  const matched = firstCard.name === secondCard.name && firstCard.gender !== secondCard.gender;
  if (matched) {
    state.scores[currentPlayer] += 1;
    state.matchedIds.add(firstId);
    state.matchedIds.add(secondId);
    state.flippedIds = [];
    render();
    return;
  }

  state.isBusy = true;
  setTimeout(() => {
    state.flippedIds = [];
    advancePlayer();
    state.isBusy = false;
    render();
  }, 900);
}

function advancePlayer(): void {
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
}

function showFinalScreen(loser: string): void {
  dom.finalMessage.innerHTML = `
    <div class="coringa-emoji">${JOKER.emoji}</div>
    <div class="perdedor">O jogador que ficou com a carta coringa foi:</div>
    <div class="perdedor-nome">${loser}</div>
    <div class="perdedor">${loser} é o perdedor da rodada!</div>
  `;

  showScreen('final');
  state.isBusy = false;
}

function resetToHome(): void {
  showScreen('home');
  createPlayerInputs();
}

function attachEvents(): void {
  dom.playerCount.addEventListener('change', createPlayerInputs);
  dom.startButton.addEventListener('click', initializeGame);
  dom.newGameButton.addEventListener('click', resetToHome);
  dom.restartButton.addEventListener('click', resetToHome);
  dom.board.addEventListener('click', handleBoardClick);
}

function initialize(): void {
  attachEvents();
  createPlayerInputs();
}

initialize();
