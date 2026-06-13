let playerName = '';
let playMode = 'single';
let maxPlayers = 2;
let gameState = null;
let pollingId = null;
let localGame = null;
let aiMemory = new Map();
let aiMemoryChance = 0.45;
let aiUseKnownChance = 0.5;
let aiMemoryMax = 8;
const aiDifficulties = {
  easy: { memoryChance: 0.18, useKnownChance: 0.2, memoryMax: 4 },
  medium: { memoryChance: 0.45, useKnownChance: 0.55, memoryMax: 8 },
  hard: { memoryChance: 0.82, useKnownChance: 0.9, memoryMax: 12 }
};

const dom = {
  homeScreen: document.getElementById('homeScreen'),
  gameScreen: document.getElementById('gameScreen'),
  finalScreen: document.getElementById('finalScreen'),
  playerName: document.getElementById('playerName'),
  playMode: document.getElementById('playMode'),
  maxPlayers: document.getElementById('maxPlayers'),
  joinStatus: document.getElementById('joinStatus'),
  joinButton: document.getElementById('joinButton'),
  resetButton: document.getElementById('resetButton'),
  playAgainButton: document.getElementById('playAgainButton'),
  currentPlayerName: document.getElementById('currentPlayerName'),
  gameStatus: document.getElementById('gameStatus'),
  scoreBoard: document.getElementById('scoreBoard'),
  board: document.getElementById('board'),
  serverInfo: document.getElementById('serverInfo'),
  finalMessage: document.getElementById('finalMessage'),
  avatarPicker: document.getElementById('avatarPicker'),
  difficulty: document.getElementById('difficulty')
};

let selectedAvatar = '🐵';
const avatarsByPlayer = {};

function showScreen(screen) {
  dom.homeScreen.classList.toggle('screen--hidden', screen !== 'home');
  dom.gameScreen.classList.toggle('screen--hidden', screen !== 'game');
  dom.finalScreen.classList.toggle('screen--hidden', screen !== 'final');
}

function updateJoinStatus(message) {
  dom.joinStatus.textContent = message;
}

function requestJson(path, options) {
  return fetch(path, options)
    .then((response) => response.json())
    .catch(() => ({ error: 'Falha na comunicação com o servidor.' }));
}

function fetchState() {
  if (!playerName || playMode !== 'multiplayer') {
    return;
  }

  requestJson(`api/state?playerName=${encodeURIComponent(playerName)}`)
    .then((data) => {
      if (data.error) {
        updateJoinStatus(data.error);
        return;
      }
      gameState = data;
      renderGame();
      if (gameState.isGameOver) {
        if (pollingId) {
          clearInterval(pollingId);
          pollingId = null;
        }
        showFinal(gameState.loser);
      }
    });
}

function setAiDifficulty(level) {
  const settings = aiDifficulties[level] || aiDifficulties.medium;
  aiMemoryChance = settings.memoryChance;
  aiUseKnownChance = settings.useKnownChance;
  aiMemoryMax = settings.memoryMax;
}

function startLocalGame() {
  playerName = dom.playerName.value.trim() || 'Jogador';
  setAiDifficulty(dom.difficulty?.value || 'medium');
  localGame = {
    players: [playerName, 'IA'],
    scores: { [playerName]: 0, IA: 0 },
    currentPlayer: playerName,
    cards: buildLocalCards(),
    isGameOver: false,
    loser: '',
    selectedCards: []
  };
  aiMemory = new Map();
  avatarsByPlayer[playerName] = selectedAvatar;
  avatarsByPlayer['IA'] = '🤖';
  gameState = localGame;
  updateJoinStatus('Modo solo iniciado. Boa sorte!');
  showScreen('game');
  renderGame();
}

function buildLocalCards() {
  const animalPairs = [
    ['Leão', '🦁', '🦁'], ['Tigre', '🐅', '🐅'], ['Zebra', '🦓', '🦓'], ['Gato', '🐱', '😺'], ['Cachorro', '🐶', '🐕'],
    ['Urso', '🧸', '🐻'], ['Panda', '🐼', '🐼'], ['Coelho', '🐰', '🐇'], ['Raposa', '🦊', '🦊'], ['Lobo', '🐺', '🐺'],
    ['Cabra', '🐐', '🐐'], ['Vaca', '🐄', '🐂'], ['Porco', '🐷', '🐷'], ['Ovelha', '🐑', '🐑'], ['Cavalo', '🐴', '🐎'],
    ['Camelo', '🐫', '🐪'], ['Girafa', '🦒', '🦒'], ['Elefante', '🐘', '🐘'], ['Rinoceronte', '🦏', '🦏'], ['Hipopótamo', '🦛', '🦛'],
    ['Chimpanzé', '🐵', '🐵'], ['Macaco', '🐒', '🐒'], ['Avestruz', '🐦', '🐦'], ['Flamingo', '🦩', '🦩']
  ];

  const cards = [];
  animalPairs.forEach((animal, index) => {
    cards.push({ id: index * 2, type: 'animal', name: animal[0], emoji: animal[1], flipped: false, matched: false });
    cards.push({ id: index * 2 + 1, type: 'animal', name: animal[0], emoji: animal[2], flipped: false, matched: false });
  });
  cards.push({ id: animalPairs.length * 2, type: 'joker', name: 'Coringa', emoji: '🎭', flipped: false, matched: false });
  return cards.sort(() => Math.random() - 0.5);
}

function joinGame() {
  playMode = dom.playMode.value;
  playerName = dom.playerName.value.trim() || 'Jogador';
  maxPlayers = Number(dom.maxPlayers.value) || 2;

  if (playMode === 'single') {
    startLocalGame();
    return;
  }

  // enviar avatar escolhido ao servidor e armazenar localmente
  avatarsByPlayer[playerName] = selectedAvatar;
  requestJson('api/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, maxPlayers, avatar: selectedAvatar })
  }).then((data) => {
    if (data.error) {
      updateJoinStatus(data.error);
      return;
    }

    gameState = data;
    updateJoinStatus('Partida iniciada. Aguarde sua vez.');
    showScreen('game');
    renderGame();

    if (!pollingId) {
      pollingId = setInterval(fetchState, 1500);
    }
    fetchState();
  });
}

function renderGame() {
  if (!gameState) {
    return;
  }

  const waitingForPlayers = !gameState.cards || gameState.cards.length === 0;
  dom.currentPlayerName.textContent = playerName;
  dom.gameStatus.textContent = waitingForPlayers
    ? `Aguardando ${gameState.maxPlayers ? gameState.maxPlayers - gameState.players.length : 'outros'} jogador(es) para iniciar.`
    : (gameState.currentPlayer === playerName
      ? 'Sua vez! Clique em uma carta.'
      : `Vez de ${gameState.currentPlayer}`);

  const playerNames = gameState.players.map(p => typeof p === 'string' ? p : p.name);
  dom.serverInfo.textContent = waitingForPlayers
    ? `Jogadores: ${playerNames.join(', ')} (${gameState.players.length}/${gameState.maxPlayers || playerNames.length})`
    : `Jogadores: ${playerNames.join(', ')}`;

  dom.scoreBoard.innerHTML = '';
  gameState.players.forEach((player) => {
    const name = typeof player === 'string' ? player : player.name;
    const serverAvatar = typeof player === 'object' && player.avatar ? player.avatar : null;
    const avatar = serverAvatar || avatarsByPlayer[name] || '🙂';
    if (serverAvatar) avatarsByPlayer[name] = serverAvatar;
    const item = document.createElement('div');
    item.className = 'item-placar';
    if (name === gameState.currentPlayer) {
      item.classList.add('atual');
    }
    item.innerHTML = `
      <div class="nome"><span class="avatar-inline">${avatar}</span> ${name}</div>
      <div class="pontos">${gameState.scores[name] || 0}</div>
    `;
    dom.scoreBoard.appendChild(item);
  });

  dom.board.innerHTML = '';
  if (!gameState.cards || gameState.cards.length === 0) {
    dom.board.innerHTML = '<div class="board-placeholder">Aguardando outros jogadores entrarem. O tabuleiro será revelado quando a partida começar.</div>';
    return;
  }
  gameState.cards.forEach((card) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'carta';
    button.dataset.cardId = card.id;
    button.textContent = card.flipped || card.matched ? card.emoji : '⛭';

    if (card.matched) {
      button.classList.add('pareada');
      button.disabled = true;
    }

    if (card.flipped) {
      button.classList.add('virada');
      if (card.type === 'joker') {
        button.classList.add('coringa');
      }
    }

    button.addEventListener('click', () => selectCard(card.id));
    dom.board.appendChild(button);
  });
}

// --- confetti and sounds ---
function playSound(type = 'match') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = type === 'match' ? 880 : type === 'gameover' ? 220 : 440;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.0001;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    setTimeout(() => { o.stop(); ctx.close(); }, 400);
  } catch (e) { /* ignore audio errors */ }
}

function burstConfetti() {
  const colors = ['#ff5c5c','#ffd166','#06d6a0','#4cc9f0','#9d4edd'];
  const count = 40;
  const container = document.createElement('div');
  container.className = 'confetti-container';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    container.appendChild(el);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 2500);
}

// Avatar picker events
if (dom.avatarPicker) {
  dom.avatarPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.avatar');
    if (!btn) return;
    dom.avatarPicker.querySelectorAll('.avatar').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAvatar = btn.dataset.avatar || '🐵';
  });
}

if (dom.difficulty) {
  dom.difficulty.addEventListener('change', () => {
    const level = dom.difficulty.value;
    setAiDifficulty(level);
  });
}

if (dom.playMode) {
  dom.playMode.addEventListener('change', () => {
    const diffGroup = document.getElementById('difficulty')?.closest('.input-grupo');
    if (diffGroup) {
      diffGroup.style.display = dom.playMode.value === 'single' ? 'block' : 'none';
    }
  });
}

function animateMatch(ids) {
  ids.forEach((id) => {
    const el = dom.board.querySelector(`[data-card-id='${id}']`);
    if (el) {
      el.classList.add('match');
      setTimeout(() => el.classList.remove('match'), 700);
    }
  });
}

function selectCard(cardId) {
  if (!gameState || gameState.currentPlayer !== playerName || gameState.isGameOver) {
    return;
  }

  if (playMode === 'single') {
    handleLocalSelection(cardId);
    return;
  }

  requestJson('api/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, cardId })
  }).then((data) => {
    if (data.error) {
      updateJoinStatus(data.error);
      return;
    }

    gameState = data;
    renderGame();
    if (gameState.isGameOver) {
      showFinal(gameState.loser);
    }
  });
}

function handleLocalSelection(cardId) {
  const card = localGame.cards.find((item) => item.id === cardId);
  if (!card || card.flipped || card.matched) {
    return;
  }

  card.flipped = true;
  localGame.selectedCards.push(cardId);
  updateAiMemory();
  renderGame();

  if (localGame.selectedCards.length === 2) {
    evaluateLocalTurn();
  }
}

function updateAiMemory() {
  localGame.cards.forEach((card) => {
    if (card.flipped && !card.matched) {
      if (Math.random() < aiMemoryChance) {
        aiMemory.set(card.id, card.name);
      }
    }
  });
  while (aiMemory.size > aiMemoryMax) {
    const firstKey = aiMemory.keys().next().value;
    aiMemory.delete(firstKey);
  }
}

function evaluateLocalTurn() {
  const [firstId, secondId] = localGame.selectedCards;
  const firstCard = localGame.cards.find((card) => card.id === firstId);
  const secondCard = localGame.cards.find((card) => card.id === secondId);

  if (!firstCard || !secondCard) {
    return;
  }

  if (firstCard.type === 'joker' || secondCard.type === 'joker') {
    setTimeout(() => {
      firstCard.flipped = false;
      secondCard.flipped = false;
      localGame.selectedCards = [];
      localGame.currentPlayer = localGame.currentPlayer === playerName ? 'IA' : playerName;
      renderGame();
      if (localGame.currentPlayer === 'IA' && !localGame.isGameOver) {
        setTimeout(runAiTurn, 900);
      }
    }, 900);
    return;
  }

  if (firstCard.name === secondCard.name) {
    firstCard.matched = true;
    secondCard.matched = true;
    localGame.scores[localGame.currentPlayer] += 1;
    localGame.selectedCards = [];
    renderGame();
    animateMatch([firstCard.id, secondCard.id]);
    playSound('match');
    burstConfetti();
    const unmatched = localGame.cards.filter((card) => !card.matched);
    if (unmatched.length === 1 && unmatched[0].type === 'joker') {
      localGame.isGameOver = true;
      localGame.loser = localGame.currentPlayer === playerName ? 'IA' : playerName;
      renderGame();
      showFinal(localGame.loser);
      return;
    }
    if (localGame.currentPlayer === 'IA' && !localGame.isGameOver) {
      setTimeout(runAiTurn, 900);
    }
    return;
  }

  setTimeout(() => {
    firstCard.flipped = false;
    secondCard.flipped = false;
    localGame.selectedCards = [];
    localGame.currentPlayer = localGame.currentPlayer === playerName ? 'IA' : playerName;
    renderGame();
    if (localGame.currentPlayer === 'IA' && !localGame.isGameOver) {
      setTimeout(runAiTurn, 900);
    }
  }, 900);
}

function runAiTurn() {
  if (localGame.isGameOver) {
    return;
  }
  const knownMatches = findKnownMatchingCards();
  let first, second;
  if (knownMatches.length && Math.random() < aiUseKnownChance) {
    [first, second] = knownMatches;
  } else {
    [first, second] = pickRandomCardsForAi();
  }
  if (!first || !second) {
    return;
  }

  handleLocalSelection(first.id);
  setTimeout(() => handleLocalSelection(second.id), 700);
}

function findKnownMatchingCards() {
  const revealed = Array.from(aiMemory.entries()).reduce((acc, [id, name]) => {
    if (!acc[name]) acc[name] = [];
    acc[name].push(id);
    return acc;
  }, {});

  for (const name in revealed) {
    if (revealed[name].length >= 2) {
      const ids = revealed[name].filter((id) => {
        const card = localGame.cards.find((item) => item.id === id);
        return card && !card.matched;
      });
      if (ids.length >= 2) {
        return ids.slice(0, 2).map((id) => localGame.cards.find((card) => card.id === id));
      }
    }
  }

  return [];
}

function pickRandomCardsForAi() {
  const available = localGame.cards.filter((card) => !card.flipped && !card.matched);
  if (available.length < 2) {
    return [null, null];
  }

  shuffleArray(available);
  return [available[0], available[1]];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function showFinal(loser) {
  if (pollingId) {
    clearInterval(pollingId);
    pollingId = null;
  }

  dom.finalMessage.innerHTML = `
    <div class="coringa-emoji">🎭</div>
    <div class="perdedor">O jogador que ficou com a carta coringa foi:</div>
    <div class="perdedor-nome">${loser}</div>
    <div class="perdedor">${loser} perdeu a rodada.</div>
  `;
  // som de fim + confete especial
  playSound('gameover');
  burstConfetti();
  showScreen('final');
}

function resetGame() {
  if (playMode === 'single') {
    localGame = null;
    gameState = null;
    playerName = '';
    showScreen('home');
    updateJoinStatus('Modo solo reiniciado. Escolha uma opção para começar.');
    return;
  }

  requestJson('api/reset', { method: 'POST' }).then((data) => {
    if (data.error) {
      updateJoinStatus(data.error);
      return;
    }

    gameState = data;
    renderGame();
    showScreen('home');
    updateJoinStatus('Servidor reiniciado. Insira um novo jogador para começar.');
    playerName = '';
    if (pollingId) {
      clearInterval(pollingId);
      pollingId = null;
    }
  });
}

function setupEvents() {
  dom.joinButton.addEventListener('click', joinGame);
  dom.resetButton.addEventListener('click', resetGame);
  dom.playAgainButton.addEventListener('click', resetGame);
}

setupEvents();
