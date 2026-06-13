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
];

const JOKER = { name: 'Coringa', emoji: '🎭' };

const dom = {
    homeScreen: document.getElementById('telaInicial'),
    gameScreen: document.getElementById('telaJogo'),
    finalScreen: document.getElementById('telaFinal'),
    playerCount: document.getElementById('numJogadores'),
    playerNamesContainer: document.getElementById('containerNomes'),
    startButton: document.getElementById('btnIniciar'),
    resetButton: document.getElementById('btnNovoJogo'),
    restartButton: document.getElementById('btnReiniciar'),
    playerNameLabel: document.getElementById('nomeJogadorAtual'),
    playerStatusText: document.getElementById('vezAtual'),
    scoreBoard: document.getElementById('containerPlacar'),
    board: document.getElementById('tabuleiro'),
    finalMessage: document.getElementById('resultadoFinal')
};

const state = {
    cards: [],
    cardMap: new Map(),
    flippedIds: [],
    matchedIds: new Set(),
    players: [],
    scores: {},
    activePlayerIndex: 0,
    isBusy: false
};

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function createPlayerInputs() {
    const count = clamp(parseInt(dom.playerCount.value, 10) || 2, 2, 5);
    dom.playerCount.value = String(count);
    dom.playerNamesContainer.innerHTML = '';

    for (let index = 1; index <= count; index += 1) {
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-nome';

        const label = document.createElement('label');
        label.textContent = `Jogador ${index}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Nome do jogador ${index}`;
        input.dataset.playerIndex = String(index - 1);

        inputWrapper.append(label, input);
        dom.playerNamesContainer.appendChild(inputWrapper);
    }
}

function getPlayerNames() {
    const inputs = Array.from(dom.playerNamesContainer.querySelectorAll('input'));
    return inputs.map((input, index) => {
        const value = input.value.trim();
        return value || `Jogador ${index + 1}`;
    });
}

function buildCards() {
    const cards = ANIMALS.flatMap((animal, index) => [
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

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }
    return copy;
}

function initializeGame() {
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

function showScreen(screenName) {
    dom.homeScreen.classList.toggle('screen--hidden', screenName !== 'home');
    dom.gameScreen.classList.toggle('screen--hidden', screenName !== 'game');
    dom.finalScreen.classList.toggle('screen--hidden', screenName !== 'final');
}

function render() {
    renderCurrentPlayer();
    renderScoreboard();
    renderBoard();
}

function renderCurrentPlayer() {
    const currentPlayer = state.players[state.activePlayerIndex];
    dom.playerNameLabel.textContent = currentPlayer;
    dom.playerStatusText.textContent = 'É sua vez!';
}

function renderScoreboard() {
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

function renderBoard() {
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

function handleBoardClick(event) {
    const button = event.target.closest('button.carta');
    if (!button) {
        return;
    }

    const cardId = Number(button.dataset.id);
    if (!Number.isInteger(cardId)) {
        return;
    }

    flipCard(cardId);
}

function flipCard(cardId) {
    if (state.isBusy || state.flippedIds.length >= 2 || state.flippedIds.includes(cardId) || state.matchedIds.has(cardId)) {
        return;
    }

    state.flippedIds.push(cardId);
    renderBoard();

    if (state.flippedIds.length === 2) {
        evaluateTurn();
    }
}

function evaluateTurn() {
    const [firstId, secondId] = state.flippedIds;
    const firstCard = state.cardMap.get(firstId);
    const secondCard = state.cardMap.get(secondId);
    const currentPlayer = state.players[state.activePlayerIndex];

    if (!firstCard || !secondCard) {
        state.flippedIds = [];
        renderBoard();
        return;
    }

    if (firstCard.type === 'joker' || secondCard.type === 'joker') {
        state.isBusy = true;
        setTimeout(() => {
            state.matchedIds.add(firstId);
            state.matchedIds.add(secondId);
            showFinalScreen(currentPlayer);
        }, 500);
        return;
    }

    const isMatch = firstCard.name === secondCard.name && firstCard.gender !== secondCard.gender;
    if (isMatch) {
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

function advancePlayer() {
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
}

function showFinalScreen(loser) {
    dom.finalMessage.innerHTML = `
        <div class="coringa-emoji">${JOKER.emoji}</div>
        <div class="perdedor">O jogador que ficou com a carta coringa foi:</div>
        <div class="perdedor-nome">${loser}</div>
        <div class="perdedor">${loser} é o perdedor da rodada!</div>
    `;

    showScreen('final');
    state.isBusy = false;
}

function resetToHome() {
    showScreen('home');
    createPlayerInputs();
}

function attachEvents() {
    dom.playerCount.addEventListener('change', createPlayerInputs);
    dom.startButton.addEventListener('click', initializeGame);
    dom.resetButton.addEventListener('click', resetToHome);
    dom.restartButton.addEventListener('click', resetToHome);
    dom.board.addEventListener('click', handleBoardClick);
}

function initialize() {
    attachEvents();
    createPlayerInputs();
}

initialize();
