// --- Global Variables and Constants ---
const modeSelect = document.getElementById('mode');
const player1Input = document.getElementById('player1');
const player2Input = document.getElementById('player2');
const symbolSelect = document.getElementById('symbol');
const board = document.getElementById('board');
const statusDisplay = document.getElementById('status');
const overlay = document.getElementById('overlay');
const resultText = document.getElementById('resultText');
const btnClose = document.getElementById('btnClose');
const symbolLabel = document.getElementById('symbol-label');

// New Page Elements
const pageStart = document.getElementById('page-start');
const pageGame = document.getElementById('page-game');
const btnStartGame = document.getElementById('btnStartGame');
const btnBackToSettings = document.getElementById('btnBackToSettings');

// Scoreboard Elements
const p1ScoreDisplay = document.getElementById('p1-score');
const p2ScoreDisplay = document.getElementById('p2-score');
const drawsDisplay = document.getElementById('draws');

// Sound elements (Ensure these MP3 files are in the same folder!)
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const startSound = document.getElementById('startSound');
const tossSound = document.getElementById('tossSound');

// Game State Variables
let gameBoard = [];
let currentPlayer = '';
let gameActive = false;
let player1Symbol = 'X';
let player2Symbol = 'O';
let isComputerTurn = false;

// Score Tracking Variables
let p1Wins = 0;
let p2Wins = 0;
let totalDraws = 0;

const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- Core Functions ---

const playSound = (audioElement) => {
    // Improved audio playback logic for better browser compatibility
    if (audioElement) {
        audioElement.pause(); // Pause if currently playing
        audioElement.currentTime = 0; // Rewind to start
        
        audioElement.play().catch(error => {
            // Log error if playback fails (often due to browser autoplay policy)
            console.error("Audio Playback Error:", error.message);
            console.warn(`Could not play: ${audioElement.id}. Please ensure audio files are in the same folder.`);
        });
    } else {
        console.error("Audio element not found in HTML!");
    }
};

function showPage(pageToShow) {
    pageStart.classList.remove('visible', 'hidden');
    pageGame.classList.remove('visible', 'hidden');
    
    if (pageToShow === 'start') {
        pageStart.classList.add('visible');
        pageGame.classList.add('hidden');
    } else { // 'game' page
        pageGame.classList.add('visible');
        pageStart.classList.add('hidden');
    }
}

function updatePlayerInputs() {
    const isPVP = modeSelect.value === 'pvp';
    player2Input.disabled = !isPVP;
    player2Input.value = isPVP ? player2Input.value || 'Player 2' : 'Computer';
    updateSymbols();
    updateScoreboard(); 
}

function updateSymbols() {
    player1Symbol = symbolSelect.value;
    player2Symbol = player1Symbol === 'X' ? 'O' : 'X';
}

function updateScoreboard() {
    const p1Name = player1Input.value;
    const p2Name = modeSelect.value === 'pvc' ? 'Computer' : player2Input.value;
    
    p1ScoreDisplay.textContent = `${p1Name} Wins: ${p1Wins}`;
    p2ScoreDisplay.textContent = `${p2Name} Wins: ${p2Wins}`;
    drawsDisplay.textContent = `Draws: ${totalDraws}`;
}

function updateStatus() {
    let currentName = currentPlayer === player1Symbol ? player1Input.value : 
                      (modeSelect.value === 'pvc' ? 'Computer' : player2Input.value);
                      
    statusDisplay.textContent = `It's ${currentName}'s (${currentPlayer}) turn.`;
}

function hideOverlay() {
    overlay.classList.remove('visible');
    showStartSequence(); 
}

// --- Game Start Sequence (1-2-3 Countdown & Toss) ---

function showStartSequence() {
    btnStartGame.disabled = true; 
    btnBackToSettings.disabled = true; 
    board.innerHTML = '';
    statusDisplay.className = 'status toss-active';
    
    // START SOUND CHALU HAI
    playSound(startSound); 

    // 1-2-3 Countdown
    let count = 3;
    statusDisplay.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            statusDisplay.textContent = count;
        } else {
            clearInterval(countdownInterval);
            startToss();
        }
    }, 1000);
}

function startToss() {
    statusDisplay.textContent = 'TOSSING...';
    
    // TOSS SOUND CHALU HAI
    playSound(tossSound); 

    setTimeout(() => {
        const tossResult = Math.random() < 0.5;
        
        let firstPlayerName;
        if (tossResult) {
            currentPlayer = player1Symbol;
            firstPlayerName = player1Input.value;
        } else {
            currentPlayer = player2Symbol;
            firstPlayerName = modeSelect.value === 'pvp' ? player2Input.value : 'Computer';
        }

        statusDisplay.textContent = `${firstPlayerName} won the toss! ${firstPlayerName} plays first.`;
        
        setTimeout(() => {
            btnStartGame.disabled = false; 
            btnBackToSettings.disabled = false;
            statusDisplay.className = 'status';
            initializeGame();
        }, 1500);

    }, 2000);
}

// --- Game Initialization and Move Handling ---

function initializeGame() {
    gameBoard = Array(9).fill(null);
    board.innerHTML = '';
    gameActive = true;
    isComputerTurn = false;
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        board.appendChild(cell);
    }
    
    updateStatus();

    if (modeSelect.value === 'pvc' && currentPlayer === player2Symbol) {
        isComputerTurn = true;
        setTimeout(handleComputerMove, 1000); 
    }
}

function handleCellClick(event) {
    const clickedCell = event.target;
    if (!clickedCell.classList.contains('cell') || !gameActive || isComputerTurn) {
        return;
    }

    const clickedIndex = parseInt(clickedCell.getAttribute('data-index'));
    if (gameBoard[clickedIndex] !== null) {
        return;
    }

    makeMove(clickedCell, clickedIndex, currentPlayer);
}

function makeMove(cellElement, index, symbol) {
    gameBoard[index] = symbol;
    cellElement.textContent = symbol;
    cellElement.classList.add(symbol === 'X' ? 'player-x' : 'player-o');
    
    // MOVE SOUND CHALU HAI
    playSound(moveSound); 

    const winInfo = checkWin();
    if (winInfo) {
        handleWin(winInfo.winner, winInfo.cells);
    } else if (gameBoard.every(cell => cell !== null)) {
        handleDraw();
    } else {
        switchTurn();
        if (modeSelect.value === 'pvc' && currentPlayer === player2Symbol) {
            isComputerTurn = true;
            setTimeout(handleComputerMove, 1000);
        }
    }
}

function switchTurn() {
    currentPlayer = currentPlayer === player1Symbol ? player2Symbol : player1Symbol;
    updateStatus();
}

// --- End Game Handling ---

function checkWin(boardToCheck = gameBoard) {
    for (const condition of WINNING_CONDITIONS) {
        const [a, b, c] = condition;
        if (boardToCheck[a] && boardToCheck[a] === boardToCheck[b] && boardToCheck[a] === boardToCheck[c]) {
            return { winner: boardToCheck[a], cells: condition };
        }
    }
    return null;
}

function handleWin(winnerSymbol, winCells) {
    gameActive = false;
    isComputerTurn = false;
    
    const cells = board.querySelectorAll('.cell');
    winCells.forEach(index => {
        cells[index].classList.add('win');
    });

    // WIN SOUND CHALU HAI
    playSound(winSound); 

    let winnerName;
    if (winnerSymbol === player1Symbol) {
        p1Wins++;
        winnerName = player1Input.value;
    } else { // <-- FIX applied here (added curly braces)
        p2Wins++;
        winnerName = modeSelect.value === 'pvc' ? 'Computer' : player2Input.value;
    } // <-- FIX applied here

    updateScoreboard(); 
    
    resultText.textContent = `${winnerName} wins!`;
    overlay.classList.add('visible');
}

function handleDraw() {
    gameActive = false;
    totalDraws++;
    updateScoreboard();
    
    statusDisplay.textContent = "It's a Draw!";
    resultText.textContent = "It's a Draw!";
    overlay.classList.add('visible');
}

// --- Computer AI Logic (Simple Block/Win Strategy) ---

function getBestMove(currentBoard, selfSymbol, opponentSymbol) {
    // 1. Check for immediate win (Self)
    for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
            currentBoard[i] = selfSymbol;
            if (checkWin(currentBoard)) { currentBoard[i] = null; return i; }
            currentBoard[i] = null;
        }
    }

    // 2. Check and block opponent's win
    for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
            currentBoard[i] = opponentSymbol;
            if (checkWin(currentBoard)) { currentBoard[i] = null; return i; }
            currentBoard[i] = null;
        }
    }
    
    // 3. Play preferred spots (Center, then Corners)
    const preferredMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const index of preferredMoves) {
        if (currentBoard[index] === null) { return index; }
    }

    return -1; 
}

function handleComputerMove() {
    if (!gameActive || !isComputerTurn) return;

    let bestMove = getBestMove(gameBoard, player2Symbol, player1Symbol);
    
    if (bestMove !== -1) {
        const cellElement = board.querySelector(`[data-index="${bestMove}"]`);
        makeMove(cellElement, bestMove, player2Symbol);
        isComputerTurn = false;
    }
}

// --- Event Listeners and Initial Setup ---

modeSelect.addEventListener('change', updatePlayerInputs);
symbolSelect.addEventListener('change', updateSymbols);
board.addEventListener('click', handleCellClick);

// Page Flow buttons
btnStartGame.addEventListener('click', () => {
    showPage('game'); 
    showStartSequence();
});

btnBackToSettings.addEventListener('click', () => {
    showPage('start');
    statusDisplay.textContent = 'Click "Continue / Start Game" to start.';
});

// Game Over button
btnClose.addEventListener('click', hideOverlay); 

// Initial setup on page load
updatePlayerInputs();
updateScoreboard();
showPage('start');