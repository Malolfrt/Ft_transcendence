import { startGame, stopGame } from "../game/engine";
import { resetScores, incrementScore, getScores, setTheme, easyAITheme, normalAITheme, hardAITheme, paddle1, paddle2, canvasHeight, PLAYER_PADDLE_SPEED, resetPaddleSpeeds, ball } from "../game/objects";
import { setupControls, cleanupControls } from "../game/controls";
import { setAIDifficulty, AIDifficulty, updateAI, resetAI, onAILoss, onAIWin } from "../game/ai";
import { translateText } from "../translate";

let animationId: number | null = null;
let gameStarted = false;
let gameCanvas: HTMLCanvasElement;
let scoreInterval: number | null = null;

export default async function GameAI(): Promise<HTMLElement> {
    const textToTranslate: string[] = [
        "Match contre l'IA",
        "Tu",
        " a gagné la partie",
        "Le jeu se terminera automatiquement...",
        "Novice Bot",
        "Master Bot",
        "Advanced Bot"
    ];

    const [
        translatedTitleMatchIA,
        translatedYou,
        translatedWinParty,
        translatedEndGameAuto,
        translatedNoviceBot,
        translatedMasterBot,
        translatedAdvancedBot,
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (scoreInterval) {
        clearInterval(scoreInterval);
        scoreInterval = null;
    }
    
    gameStarted = false;
    resetScores();

    localStorage.setItem('currentPage', 'game-ai');
    
    const urlParams = new URLSearchParams(window.location.search);
    const difficulty = urlParams.get('difficulty') || 'normal';
    
    let lastStateSave = Date.now();
    if (localStorage.getItem('aiGameScores')) {
        try {
            const savedScores = JSON.parse(localStorage.getItem('aiGameScores')!);
            if (Date.now() - savedScores.timestamp < 300000 && savedScores.difficulty === difficulty) {
                const { score1, score2 } = getScores();
                resetScores();
                for (let i = 0; i < savedScores.score1; i++) {
                    incrementScore(1);
                }
                for (let i = 0; i < savedScores.score2; i++) {
                    incrementScore(2);
                }
            } else {
                localStorage.removeItem('aiGameScores');
            }
        } catch (error) {
            console.error("Erreur lors de la restauration des scores:", error);
        }
    }
    
    switch(difficulty) {
        case 'easy':
            setAIDifficulty(AIDifficulty.EASY);
            setTheme(easyAITheme);
            break;
        case 'hard':
            setAIDifficulty(AIDifficulty.HARD);
            setTheme(hardAITheme);
            break;
        default:
            setAIDifficulty(AIDifficulty.NORMAL);
            setTheme(normalAITheme);
    }

    paddle1.speed = PLAYER_PADDLE_SPEED;

    const container = document.createElement("div");
    
    switch(difficulty) {
        case 'easy':
            container.className = "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-green-950 via-green-800 to-green-950 text-white";
            break;
        case 'hard':
            container.className = "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-red-950 via-red-800 to-red-950 text-white";
            break;
        default:
            container.className = "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-orange-950 via-orange-800 to-orange-950 text-white";
    }

    const header = document.createElement("div");
    header.className = "w-full max-w-3xl bg-black bg-opacity-40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border mb-8";
    
    switch(difficulty) {
        case 'easy':
            header.classList.add("border-green-500/30");
            break;
        case 'hard':
            header.classList.add("border-red-500/30");
            break;
        default:
            header.classList.add("border-yellow-500/30");
    }
    
    const title = document.createElement("h1");
    title.className = "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r text-center";
    title.innerHTML = `🏓 ${translatedTitleMatchIA}`;
    
    switch(difficulty) {
        case 'easy':
            title.classList.add("from-green-400", "to-emerald-400");
            break;
        case 'hard':
            title.classList.add("from-red-400", "to-pink-400");
            break;
        default:
            title.classList.add("from-yellow-400", "to-amber-400");
    }
    
    const subtitle = document.createElement("div");
    subtitle.className = "mt-2 text-2xl text-center";
    
    const player1Span = document.createElement("span");
    player1Span.className = "text-transparent bg-clip-text bg-gradient-to-r font-bold";
    player1Span.innerText = translatedYou;
    
    
    switch(difficulty) {
        case 'easy':
            player1Span.classList.add("from-green-400", "to-green-600");
            break;
        case 'hard':
            player1Span.classList.add("from-red-400", "to-pink-500");
            break;
        default:
            player1Span.classList.add("from-yellow-400", "to-amber-500");
    }
    
    const vsSpan = document.createElement("span");
    vsSpan.className = "mx-3";
    
    switch(difficulty) {
        case 'easy':
            vsSpan.classList.add("text-green-300");
            break;
        case 'hard':
            vsSpan.classList.add("text-red-300");
            break;
        default:
            vsSpan.classList.add("text-yellow-300");
    }
    
    vsSpan.innerHTML = "vs";
    
    const player2Span = document.createElement("span");
    player2Span.className = "text-transparent bg-clip-text bg-gradient-to-r font-bold";
    const aiName = difficulty === 'easy' ? translatedNoviceBot : (difficulty === 'hard' ? translatedMasterBot : translatedAdvancedBot);
    player2Span.innerHTML = aiName;
    
    switch(difficulty) {
        case 'easy':
            player2Span.classList.add("from-green-400", "to-green-600");
            break;
        case 'hard':
            player2Span.classList.add("from-red-400", "to-pink-500");
            break;
        default:
            player2Span.classList.add("from-yellow-400", "to-amber-500");
    }
    
    subtitle.append(player1Span, vsSpan, player2Span);
    header.append(title, subtitle);

    const gameContainer = document.createElement("div");
    gameContainer.className = "bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-2xl shadow-xl border";
    
    switch(difficulty) {
        case 'easy':
            gameContainer.classList.add("border-green-500/30");
            break;
        case 'hard':
            gameContainer.classList.add("border-red-500/30");
            break;
        default:
            gameContainer.classList.add("border-yellow-500/30");
    }

    gameCanvas = document.createElement("canvas");
    gameCanvas.width = 1000;
    gameCanvas.height = 500;
    gameCanvas.className = "border-4 rounded-xl shadow-lg";
    
    switch(difficulty) {
        case 'easy':
            gameCanvas.classList.add("border-green-500/30");
            break;
        case 'hard':
            gameCanvas.classList.add("border-red-500/30");
            break;
        default:
            gameCanvas.classList.add("border-yellow-500/30");
    }
    
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "relative";
    canvasContainer.appendChild(gameCanvas);
    
    const endMessage = document.createElement("div");
    endMessage.className = "hidden absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl z-10";
    
    const victoryContent = document.createElement("div");
    victoryContent.className = "bg-black/60 p-8 rounded-xl border shadow-2xl text-center";
    
    switch(difficulty) {
        case 'easy':
            victoryContent.classList.add("border-green-500/50");
            break;
        case 'hard':
            victoryContent.classList.add("border-red-500/50");
            break;
        default:
            victoryContent.classList.add("border-yellow-500/50");
    }
    
    endMessage.appendChild(victoryContent);
    canvasContainer.appendChild(endMessage);

    const scoreBoard = document.createElement("div");
    scoreBoard.className = "text-3xl font-bold mt-6 p-6 rounded-xl bg-opacity-80 shadow-lg border flex justify-center items-center space-x-8";
    
    switch(difficulty) {
        case 'easy':
            scoreBoard.classList.add("bg-gradient-to-r", "from-green-900/80", "to-emerald-900/80", "border-green-500/30");
            break;
        case 'hard':
            scoreBoard.classList.add("bg-gradient-to-r", "from-red-900/80", "to-rose-900/80", "border-red-500/30");
            break;
        default:
            scoreBoard.classList.add("bg-gradient-to-r", "from-amber-900/80", "to-yellow-900/80", "border-yellow-500/30");
    }
    
    const player1Container = document.createElement("div");
    player1Container.className = "flex flex-col items-center";
    
    const player1Name = document.createElement("div");
    player1Name.className = "text-transparent bg-clip-text bg-gradient-to-r font-medium mb-2";
    player1Name.innerHTML = translatedYou;
    
    switch(difficulty) {
        case 'easy':
            player1Name.classList.add("from-green-400", "to-green-600");
            break;
        case 'hard':
            player1Name.classList.add("from-red-400", "to-pink-500");
            break;
        default:
            player1Name.classList.add("from-yellow-400", "to-amber-500");
    }
    
    const player1ScoreDisplay = document.createElement("div");
    player1ScoreDisplay.className = "text-4xl font-bold bg-black/50 w-16 h-16 flex items-center justify-center rounded-xl border";
    
    switch(difficulty) {
        case 'easy':
            player1ScoreDisplay.classList.add("border-green-500/30");
            break;
        case 'hard':
            player1ScoreDisplay.classList.add("border-red-500/30");
            break;
        default:
            player1ScoreDisplay.classList.add("border-yellow-500/30");
    }
    
    player1ScoreDisplay.innerHTML = "0";
    player1ScoreDisplay.id = "player1-score";
    
    player1Container.append(player1Name, player1ScoreDisplay);
    
    const versus = document.createElement("div");
    versus.className = "text-transparent bg-clip-text bg-gradient-to-r font-bold";
    versus.innerHTML = "VS";
    
    switch(difficulty) {
        case 'easy':
            versus.classList.add("from-green-400", "to-emerald-400");
            break;
        case 'hard':
            versus.classList.add("from-red-400", "to-pink-400");
            break;
        default:
            versus.classList.add("from-yellow-400", "to-amber-400");
    }
    
    const player2Container = document.createElement("div");
    player2Container.className = "flex flex-col items-center";
    
    const player2Name = document.createElement("div");
    player2Name.className = "text-transparent bg-clip-text bg-gradient-to-r font-medium mb-2";
    player2Name.innerHTML = aiName;
    
    switch(difficulty) {
        case 'easy':
            player2Name.classList.add("from-green-400", "to-green-600");
            break;
        case 'hard':
            player2Name.classList.add("from-red-400", "to-pink-500");
            break;
        default:
            player2Name.classList.add("from-yellow-400", "to-amber-500");
    }
    
    const player2ScoreDisplay = document.createElement("div");
    player2ScoreDisplay.className = "text-4xl font-bold bg-black/50 w-16 h-16 flex items-center justify-center rounded-xl border";
    player2ScoreDisplay.innerHTML = "0";
    player2ScoreDisplay.id = "player2-score";
    
    switch(difficulty) {
        case 'easy':
            player2ScoreDisplay.classList.add("border-green-500/30");
            break;
        case 'hard':
            player2ScoreDisplay.classList.add("border-red-500/30");
            break;
        default:
            player2ScoreDisplay.classList.add("border-yellow-500/30");
    }
    
    player2Container.append(player2Name, player2ScoreDisplay);
    
    scoreBoard.append(player1Container, versus, player2Container);

    // Mise à jour des scores
    function updateScoreDisplay() {
        const { score1, score2 } = getScores();
        const player1ScoreElement = document.getElementById("player1-score");
        const player2ScoreElement = document.getElementById("player2-score");
        
        if (player1ScoreElement) player1ScoreElement.innerHTML = score1.toString();
        if (player2ScoreElement) player2ScoreElement.innerHTML = score2.toString();
        
        localStorage.setItem('aiGameScores', JSON.stringify({
            score1,
            score2,
            difficulty,
            timestamp: Date.now()
        }));
        
        if (score1 >= 5) {
            endMatch(translatedYou);
        } else if (score2 >= 5) {
            endMatch(aiName);
        }
    }

    let matchEnded = false;
    
    function endMatch(winner: string) {
        if (matchEnded) return;
        matchEnded = true;
        
        stopGame();
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        setTimeout(() => {
            localStorage.removeItem('aiGameScores');
            localStorage.removeItem('aiGameState');
        }, 1000);
        
        if (winner === translatedYou) {
            onAILoss();
        } else {
            onAIWin();
        }
        
        let gradientClasses = "";
        if (winner === translatedYou) {
            gradientClasses = "from-green-400 to-emerald-500";
        } else {
            switch(difficulty) {
                case 'easy':
                    gradientClasses = "from-green-400 to-green-600";
                    break;
                case 'hard':
                    gradientClasses = "from-red-400 to-pink-500";
                    break;
                default:
                    gradientClasses = "from-yellow-400 to-amber-500";
            }
        }
        
        victoryContent.innerHTML = `
            <div class="text-7xl mb-6">🏆</div>
            <h2 class="text-4xl font-bold bg-gradient-to-r ${gradientClasses} bg-clip-text text-transparent mb-4">${winner}</h2>
            <p class="text-xl text-white/90 mb-2">${translatedWinParty}</p>
            <div class="mt-6 text-white/80 text-sm">${translatedEndGameAuto}</div>
        `;

        // Afficher le message avec une animation
        endMessage.classList.remove("hidden");
        endMessage.classList.add("animate-fadeIn");
        
        victoryContent.style.animation = "scale-up 0.5s ease-out forwards";
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes scale-up {
                0% { transform: scale(0.7); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-out forwards;
            }
        `;
        document.head.appendChild(styleElement);
    }

    function saveGameState() {
        if (matchEnded) return;
        
        // Sauvegarder l'état toutes les 2 secondes
        if (Date.now() - lastStateSave > 2000) {
            localStorage.setItem('aiGameState', JSON.stringify({
                paddle1: { y: paddle1.y },
                paddle2: { y: paddle2.y },
                ball: { x: ball.x, y: ball.y, speedX: ball.speedX, speedY: ball.speedY },
                difficulty,
                timestamp: Date.now()
            }));
            lastStateSave = Date.now();
        }
    }

    if (localStorage.getItem('aiGameState')) {
        try {
            const savedState = JSON.parse(localStorage.getItem('aiGameState')!);
            // Vérifier si l'état est récent (moins de 10 secondes) et de la même difficulté
            if (Date.now() - savedState.timestamp < 10000 && savedState.difficulty === difficulty) {
                paddle1.y = savedState.paddle1.y;
                paddle2.y = savedState.paddle2.y;
                ball.x = savedState.ball.x;
                ball.y = savedState.ball.y;
                ball.speedX = savedState.ball.speedX;
                ball.speedY = savedState.ball.speedY;
            } else {
                localStorage.removeItem('aiGameState');
            }
        } catch (error) {
            console.error("Erreur lors de la restauration de l'état du jeu contre IA:", error);
        }
    }

    function startGameWithAI() {
        gameStarted = true;
        
        resetPaddleSpeeds();
        paddle1.speed = PLAYER_PADDLE_SPEED;
        resetAI();
        setupControls(paddle1, paddle2, canvasHeight);
        
        const originalStartGame = startGame;
        // @ts-ignore - On étend l'interface window
        window.startGame = (canvas, onScoreCallback) => {
            const result = originalStartGame(canvas, onScoreCallback);
            
            // @ts-ignore - On étend l'interface window
            const originalGameLoop = window.gameLoop;
            // @ts-ignore - On étend l'interface window
            window.gameLoop = (timestamp) => {
                const result = originalGameLoop(timestamp);
                saveGameState();
                return result;
            };
            
            return result;
        };
        
        startGame(gameCanvas, (scorer) => {
            if (scorer === "left") {
                incrementScore(1);
            } else {
                incrementScore(2);
            }
            updateScoreDisplay();
        });
        
        function aiLoop(timestamp: number) {
            updateAI(timestamp);
            animationId = requestAnimationFrame(aiLoop);
        }
        
        animationId = requestAnimationFrame(aiLoop);
        scoreInterval = window.setInterval(updateScoreDisplay, 100);
    }

    // Démarrer le jeu au chargement de la page
    window.setTimeout(startGameWithAI, 500);
    gameContainer.append(canvasContainer, scoreBoard);
    container.append(header, gameContainer);

    return container;
} 