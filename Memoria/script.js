// ===== CONFIGURACIÓN DEL JUEGO =====
const TOTAL_PAIRS = 8; // 8 parejas = 16 cartas
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameLocked = false;
let timer = null;
let seconds = 0;
let gameStarted = false;

// Emojis para las cartas (8 pares)
const emojis = [
    '🐶', '🐱', '🐭', '🐹',
    '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮'
];

// Tomamos solo los primeros TOTAL_PAIRS emojis
const gameEmojis = emojis.slice(0, TOTAL_PAIRS);

// ===== DOM ELEMENTS =====
const boardElement = document.getElementById('gameBoard');
const movesDisplay = document.getElementById('movesDisplay');
const pairsFoundDisplay = document.getElementById('pairsFound');
const timerDisplay = document.getElementById('timerDisplay');
const resetBtn = document.getElementById('resetGameBtn');
const newGameBtn = document.getElementById('newGameBtn');
const victoryModal = document.getElementById('victoryModal');
const finalMovesSpan = document.getElementById('finalMoves');
const finalTimeSpan = document.getElementById('finalTime');
const playAgainBtn = document.getElementById('playAgainBtn');

// ===== INICIALIZAR JUEGO =====
function initGame() {
    // Reiniciar variables
    stopTimer();
    seconds = 0;
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameLocked = false;
    gameStarted = false;
    
    // Actualizar displays
    updateStats();
    timerDisplay.textContent = '00:00';
    victoryModal.style.display = 'none';
    
    // Crear array de cartas (cada emoji aparece dos veces)
    let deck = [...gameEmojis, ...gameEmojis];
    
    // Mezclar deck (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Crear objetos de cartas
    cards = deck.map((emoji, index) => ({
        id: index,
        emoji: emoji,
        flipped: false,
        matched: false
    }));
    
    renderBoard();
}

// ===== RENDERIZAR TABLERO =====
function renderBoard() {
    boardElement.innerHTML = cards.map(card => `
        <div class="card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}" data-id="${card.id}">
            ${card.flipped || card.matched ? card.emoji : '?'}
        </div>
    `).join('');
    
    // Agregar event listeners a las cartas
    document.querySelectorAll('.card').forEach(cardElement => {
        cardElement.addEventListener('click', () => handleCardClick(parseInt(cardElement.dataset.id)));
    });
}

// ===== MANEJAR CLIC EN CARTA =====
function handleCardClick(id) {
    // Si el juego está bloqueado, la carta ya está volteada o ya está emparejada, ignorar
    if (gameLocked) return;
    
    const card = cards.find(c => c.id === id);
    if (card.flipped || card.matched) return;
    
    // Iniciar temporizador en el primer movimiento
    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }
    
    // Voltear carta
    card.flipped = true;
    flippedCards.push(card);
    renderBoard();
    
    // Verificar si tenemos dos cartas volteadas
    if (flippedCards.length === 2) {
        moves++;
        updateStats();
        checkMatch();
    }
}

// ===== VERIFICAR SI HAY MATCH =====
function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.emoji === card2.emoji) {
        // Match encontrado
        card1.matched = true;
        card2.matched = true;
        matchedPairs++;
        
        flippedCards = [];
        updateStats();
        renderBoard();
        
        // Verificar si el juego terminó
        if (matchedPairs === TOTAL_PAIRS) {
            endGame();
        }
    } else {
        // No hay match: voltear cartas de vuelta después de un delay
        gameLocked = true;
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            flippedCards = [];
            gameLocked = false;
            renderBoard();
        }, 800);
    }
}

// ===== ACTUALIZAR ESTADÍSTICAS EN PANTALLA =====
function updateStats() {
    movesDisplay.textContent = moves;
    pairsFoundDisplay.textContent = `${matchedPairs}/${TOTAL_PAIRS}`;
}

// ===== TEMPORIZADOR =====
function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// ===== FINALIZAR JUEGO (VICTORIA) =====
function endGame() {
    stopTimer();
    gameStarted = false;
    
    finalMovesSpan.textContent = moves;
    finalTimeSpan.textContent = timerDisplay.textContent;
    victoryModal.style.display = 'flex';
}

// ===== REINICIAR PARTIDA (mantiene la misma mezcla) =====
function resetGame() {
    stopTimer();
    gameStarted = false;
    seconds = 0;
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameLocked = false;
    
    timerDisplay.textContent = '00:00';
    updateStats();
    
    // Reiniciar estado de las cartas
    cards.forEach(card => {
        card.flipped = false;
        card.matched = false;
    });
    
    // Volver a mezclar
    let deck = [...gameEmojis, ...gameEmojis];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    cards = deck.map((emoji, index) => ({
        id: index,
        emoji: emoji,
        flipped: false,
        matched: false
    }));
    
    renderBoard();
    victoryModal.style.display = 'none';
}

// ===== NUEVA PARTIDA =====
function newGame() {
    stopTimer();
    initGame();
}

// ===== EVENT LISTENERS =====
resetBtn.addEventListener('click', resetGame);
newGameBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', () => {
    victoryModal.style.display = 'none';
    newGame();
});

// ===== INICIAR JUEGO =====
initGame();

console.log('🧠 Juego de Memoria cargado. ¡Buena suerte!');