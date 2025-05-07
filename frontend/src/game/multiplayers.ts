import { currentTheme, setTheme, tournamentTheme, neonTheme, classicTheme, localTheme, GameTheme } from "./objects";
import { startGame, stopGame } from "./engine";

export enum GameMode {
    LOCAL = "local",
    TOURNAMENT = "tournament",
    ONLINE = "online",
    AI = "ai"
}

export interface GameOptions {
    mode: GameMode;
    scoreLimit?: number;
    theme?: GameTheme;
    aiDifficulty?: "easy" | "medium" | "hard";
    callback?: (winner: string) => void;
}

export function startGameWithOptions(canvas: HTMLCanvasElement, options: GameOptions) {

    if (options.theme) {
        setTheme(options.theme);
    } else {
        switch (options.mode) {
            case GameMode.TOURNAMENT:
                setTheme(tournamentTheme);
                break;
            case GameMode.LOCAL:
                setTheme(localTheme);
                break;
            case GameMode.ONLINE:
                setTheme(neonTheme);
                break;
            default:
                setTheme(classicTheme);
        }
    }

    let scoreLeft = 0;
    let scoreRight = 0;

    startGame(canvas, (scorer: "left" | "right") => {
        if (scorer === "left") {
            scoreRight++;
        } else {
            scoreLeft++;
        }
        
        if (options.callback && options.scoreLimit) {
            if (scoreLeft >= options.scoreLimit) {
                options.callback("left");
            } else if (scoreRight >= options.scoreLimit) {
                options.callback("right");
            }
        }
    });
    
    return () => {
        stopGame();
    };
}

export function updateAI(ballY: number, paddle2Y: number, paddleHeight: number, difficulty: "easy" | "medium" | "hard") {
    let reactionSpeed = 0;
    let errorMargin = 0;
    
    switch (difficulty) {
        case "easy":
            reactionSpeed = 0.02;
            errorMargin = 50;
            break;
        case "medium":
            reactionSpeed = 0.05;
            errorMargin = 20;
            break;
        case "hard":
            reactionSpeed = 0.1;
            errorMargin = 5;
            break;
    }
    const targetY = ballY - paddleHeight / 2 + (Math.random() * errorMargin - errorMargin / 2);
    return paddle2Y + (targetY - paddle2Y) * reactionSpeed;
}

export function createTournamentMatch(player1: string, player2: string, options: GameOptions) {
    return {
        player1,
        player2,
        winner: null as string | null,
        options
    };
}

export function finishMatch(winner: string) {
    console.log(`🏆 Fin du match, vainqueur: ${winner}`);
}
