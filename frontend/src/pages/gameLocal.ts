import Layout from "../components/layout";
import { state } from "../state";
import { navigateTo } from "../router";
import { startGame, resetGame } from "../game/engine";
import { setupControls, cleanupControls } from "../game/controls";
import { paddle1, paddle2, resetPaddleSpeeds, PLAYER_PADDLE_SPEED, ball } from "../game/objects";
import { localTheme, setTheme } from "../game/objects";
import { GameMode, GameOptions } from "../game/multiplayers";
import { translateText } from "../translate";
import API_CONFIG from "../config/apiConfig";

async function saveMatch(winner: string) {
    if (!state.localMatch) {
        return;
    }

    const { player1, player2 } = state.localMatch;
    if (!player1 || !player2) {
        return;
    }

    try {
        const responseUsers = await fetch(`${API_CONFIG.API_BASE_URL}/users?username=${player1}&username=${player2}`);
        const usersData = await responseUsers.json();

        if (!usersData || usersData.length < 2) {
            return;
        }

        const player1_id = usersData.find(user => user.username === player1)?.id;
        const player2_id = usersData.find(user => user.username === player2)?.id;
        const winner_id = usersData.find(user => user.username === winner)?.id;

        if (!player1_id || !player2_id || !winner_id) {
            return;
        }

        const matchData = { player1_id, player2_id, winner_id };

        const response = await fetch(`${API_CONFIG.API_BASE_URL}/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matchData)
        });

        const result = await response.json();
    } catch (error) {
        console.error("Erreur serveur lors de l'enregistrement du match :", error);
    }
}


async function getUserId(username: string) {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/users`);
    const users = await response.json();
    const user = users.find((u: any) => u.username === username);
    return user ? user.id : null;
}

export default async function GameLocal() {
    const textToTranslate: string[] = [
        "Match Local",
        " a gagné la partie",
        "Retour au tableau de bord dans quelques secondes...",
    ];

    const [
        translatedLocalMatch,
        translatedWinParty,
        translatedReturnToDashboard
    ] = await Promise.all(textToTranslate.map(text => translateText(text)));
    document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
    }); 
    resetGame();
    
    if (!state.localMatch && localStorage.getItem('localMatchData')) {
        try {
            state.localMatch = JSON.parse(localStorage.getItem('localMatchData')!);
        } catch (error) {
            console.error("Erreur lors de la restauration des données:", error);
        }
    }
    
    if (!state.localMatch) {
        const currentPage = localStorage.getItem('currentPage');
        if (currentPage === 'local-match') {
            navigateTo(new Event("click"), "/local-match");
        } else {
            navigateTo(new Event("click"), "/");
        }
        return document.createElement("div");
    }
    
    localStorage.setItem('currentPage', 'game-local');
    localStorage.setItem('localMatchData', JSON.stringify(state.localMatch));
    
    setTheme(localTheme);
    
    resetPaddleSpeeds();
    paddle1.speed = PLAYER_PADDLE_SPEED;
    paddle2.speed = PLAYER_PADDLE_SPEED;
    
    let player1Score = 0;
    let player2Score = 0;
    let matchEnded = false;
    let lastStateSave = Date.now();

    if (localStorage.getItem('localGameScores')) {
        try {
            const savedScores = JSON.parse(localStorage.getItem('localGameScores')!);
            if (Date.now() - savedScores.timestamp < 180000) {
                player1Score = savedScores.player1;
                player2Score = savedScores.player2;
            } else {
                localStorage.removeItem('localGameScores');
            }
        } catch (error) {
            console.error("Erreur lors de la restauration des scores:", error);
        }
    }
    
    window.addEventListener('beforeunload', (event) => {
        localStorage.setItem('localGameScores', JSON.stringify({
            player1: player1Score,
            player2: player2Score,
            timestamp: Date.now()
        }));

        localStorage.setItem('gameState', JSON.stringify({
            paddle1: { y: paddle1.y },
            paddle2: { y: paddle2.y },
            ball: { x: ball.x, y: ball.y, speedX: ball.speedX, speedY: ball.speedY },
            timestamp: Date.now()
        }));
    });

    const container = document.createElement("div");
    container.className = "absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-blue-950 via-blue-700 to-blue-950 text-white";

    const header = document.createElement("div");
    header.className = "w-full max-w-3xl bg-black bg-opacity-40 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-blue-500/30 mb-8";
    
    const title = document.createElement("h1");
    title.className = "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-200 text-center";
    title.innerHTML = `🏓 ${translatedLocalMatch}`;


    const subtitle = document.createElement("div");
    subtitle.className = "mt-2 text-2xl text-center";
    
    const player1Span = document.createElement("span");
    player1Span.className = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500 font-bold";
    player1Span.innerHTML = state.localMatch.player1;
    
    const vsSpan = document.createElement("span");
    vsSpan.className = "text-blue-200 mx-3";
    vsSpan.innerHTML = "vs";
    
    const player2Span = document.createElement("span");
    player2Span.className = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500 font-bold";
    player2Span.innerHTML = state.localMatch.player2;
    
    subtitle.append(player1Span, vsSpan, player2Span);
    header.append(title, subtitle);

    const gameContainer = document.createElement("div");
    gameContainer.className = "bg-black bg-opacity-30 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-blue-500/30";

    const gameCanvas: HTMLCanvasElement = document.createElement("canvas");
    gameCanvas.width = 1000;
    gameCanvas.height = 500;
    gameCanvas.className = "border-4 border-blue-500/30 rounded-xl shadow-lg";
    gameCanvas.style.background = localTheme.background; // Définir explicitement l'arrière-plan du canvas

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "relative";
    canvasContainer.appendChild(gameCanvas);
    
    const endMessage = document.createElement("div");
    endMessage.className = "hidden absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl z-10";
    
    const victoryContent = document.createElement("div");
    victoryContent.className = "bg-black/60 p-8 rounded-xl border border-blue-500/50 shadow-2xl text-center";
    endMessage.appendChild(victoryContent);
    canvasContainer.appendChild(endMessage);

    const scoreBoard = document.createElement("div");
    scoreBoard.className = "text-3xl font-bold mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-800/80 to-blue-700/80 shadow-lg border border-blue-500/30 flex justify-center items-center space-x-8";
    
    const player1Container = document.createElement("div");
    player1Container.className = "flex flex-col items-center";
    
    const player1Name = document.createElement("div");
    player1Name.className = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500 font-medium mb-2";
    player1Name.innerHTML = state.localMatch.player1;
    
    const player1ScoreDisplay = document.createElement("div");
    player1ScoreDisplay.className = "text-4xl font-bold bg-black/50 w-16 h-16 flex items-center justify-center rounded-xl border border-blue-500/30";
    player1ScoreDisplay.innerHTML = "0";
    
    player1Container.append(player1Name, player1ScoreDisplay);
    
    const versus = document.createElement("div");
    versus.className = "text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-200 font-bold";
    versus.innerHTML = "VS";
    
    const player2Container = document.createElement("div");
    player2Container.className = "flex flex-col items-center";
    
    const player2Name = document.createElement("div");
    player2Name.className = "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500 font-medium mb-2";
    player2Name.innerHTML = state.localMatch.player2;
    
    const player2ScoreDisplay = document.createElement("div");
    player2ScoreDisplay.className = "text-4xl font-bold bg-black/50 w-16 h-16 flex items-center justify-center rounded-xl border border-blue-500/30";
    player2ScoreDisplay.innerHTML = "0";
    
    player2Container.append(player2Name, player2ScoreDisplay);
    
    scoreBoard.append(player1Container, versus, player2Container);

    gameContainer.append(canvasContainer, scoreBoard);
    container.append(header, gameContainer);

    function updateScoreBoard() {
        player1ScoreDisplay.innerHTML = String(player1Score);
        player2ScoreDisplay.innerHTML = String(player2Score);

        localStorage.setItem('localGameScores', JSON.stringify({
            player1: player1Score,
            player2: player2Score,
            timestamp: Date.now()
        }));
    }

    function endMatch(winner: string) {
        if (matchEnded) return;
        matchEnded = true;

        cleanupControls();

        victoryContent.innerHTML = `
            <div class="text-7xl mb-6">🏆</div>
            <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-4">${winner}</h2>
            <p class="text-xl text-white/90 mb-2">${translatedWinParty}</p>
            <div class="mt-6 text-blue-200/80 text-sm">${translatedReturnToDashboard}</div>
        `;
        
        endMessage.classList.remove("hidden");
        
        victoryContent.style.animation = "scale-up 0.5s ease-out forwards";
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes scale-up {
                0% { transform: scale(0.7); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(styleElement);

        setTimeout(() => {
            localStorage.removeItem('localMatchData');
            localStorage.removeItem('localGameScores');
            localStorage.removeItem('gameState');
        }, 4500);

        saveMatch(winner);
        setTimeout(() => navigateTo(new Event("click"), "/matches"), 5000);
    }

    const gameOptions: GameOptions = {
        mode: GameMode.LOCAL,
        scoreLimit: state.localMatch?.target,
        theme: localTheme,
        callback: (winner: string) => {
            if (matchEnded || !state.localMatch) return;
            if (winner === "left") {
                endMatch(state.localMatch.player1);
            } else {
                endMatch(state.localMatch.player2);
            }
        }
    };

    const onScore = (scorer: "left" | "right") => {
        if (matchEnded || !state.localMatch) return;

        if (scorer === "left") {
            player1Score += 1;
        } else {
            player2Score += 1;
        }

        updateScoreBoard();

        if (player1Score >= state.localMatch.target) {
            endMatch(state.localMatch.player1);
        } else if (player2Score >= state.localMatch.target) {
            endMatch(state.localMatch.player2);
        }
    };
    
    startGame(gameCanvas, onScore);
    resetPaddleSpeeds();
    setupControls(paddle1, paddle2, gameCanvas.height);

    window.addEventListener("popstate", () => {
        resetGame();
    });

    function saveGameState() {
        if (matchEnded) return;
        
        if (Date.now() - lastStateSave > 2000) {
            localStorage.setItem('gameState', JSON.stringify({
                paddle1: { y: paddle1.y },
                paddle2: { y: paddle2.y },
                ball: { x: ball.x, y: ball.y, speedX: ball.speedX, speedY: ball.speedY },
                timestamp: Date.now()
            }));
            lastStateSave = Date.now();
        }
    }

    if (localStorage.getItem('gameState')) {
        try {
            const savedState = JSON.parse(localStorage.getItem('gameState')!);
            if (Date.now() - savedState.timestamp < 10000) {
                paddle1.y = savedState.paddle1.y;
                paddle2.y = savedState.paddle2.y;
                ball.x = savedState.ball.x;
                ball.y = savedState.ball.y;
                ball.speedX = savedState.ball.speedX;
                ball.speedY = savedState.ball.speedY;
            } else {
                localStorage.removeItem('gameState');
            }
        } catch (error) {
            console.error("Erreur lors de la restauration de l'état du jeu:", error);
        }
    }

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

    updateScoreBoard();
    return Layout(container);
}