export const canvasWidth:number = 1000;
export const canvasHeight:number = 500;

export interface GameTheme {
    background: string;
    ballColor: string;
    paddle1Color: string;
    paddle2Color: string;
    netColor: string;
    netDashPattern: number[];
    glowEffect: boolean;
    particlesEnabled: boolean;
}

export const classicTheme: GameTheme = {
    background: "#000000",
    ballColor: "#FFFFFF",
    paddle1Color: "#FFFFFF",
    paddle2Color: "#FFFFFF",
    netColor: "rgba(255, 255, 255, 0.5)",
    netDashPattern: [5, 15],
    glowEffect: false,
    particlesEnabled: false
};

export const tournamentTheme: GameTheme = {
    background: "linear-gradient(to right, #1e1b4b, #581c87, #1e1b4b)",
    ballColor: "#FFFFFF",
    paddle1Color: "#8B5CF6",
    paddle2Color: "#8B5CF6",
    netColor: "rgba(139, 92, 246, 0.6)",
    netDashPattern: [5, 10],
    glowEffect: true,
    particlesEnabled: true
};

export const localTheme: GameTheme = {
    background: "linear-gradient(to right, #172554, #1d4ed8, #172554)",
    ballColor: "#FFFFFF",
    paddle1Color: "#3B82F6",
    paddle2Color: "#3B82F6",
    netColor: "rgba(96, 165, 250, 0.9)",
    netDashPattern: [5, 10],
    glowEffect: true,
    particlesEnabled: true
};

export const easyAITheme: GameTheme = {
    background: "linear-gradient(to right, #064e3b, #22c55e, #064e3b)",
    ballColor: "#FFFFFF",
    paddle1Color: "#22c55e",
    paddle2Color: "#22c55e",
    netColor: "rgba(110, 231, 183, 0.8)",
    netDashPattern: [5, 10],
    glowEffect: true,
    particlesEnabled: true
};

export const normalAITheme: GameTheme = {
    background: "linear-gradient(to right, #92400e, #f97316, #92400e)",
    ballColor: "#FFFFFF",
    paddle1Color: "#f97316",
    paddle2Color: "#f97316",
    netColor: "rgba(251, 191, 36, 0.8)",
    netDashPattern: [5, 10],
    glowEffect: true,
    particlesEnabled: true
};

export const hardAITheme: GameTheme = {
    background: "linear-gradient(to right, #7f1d1d, #ef4444, #7f1d1d)",
    ballColor: "#FFFFFF",
    paddle1Color: "#ef4444",
    paddle2Color: "#ef4444",
    netColor: "rgba(248, 113, 113, 0.8)",
    netDashPattern: [5, 10],
    glowEffect: true,
    particlesEnabled: true
};

export const neonTheme: GameTheme = {
    background: "#121212",
    ballColor: "#00FFFF",
    paddle1Color: "#FF00FF",
    paddle2Color: "#00FF00",
    netColor: "rgba(255, 255, 0, 0.7)",
    netDashPattern: [5, 5],
    glowEffect: true,
    particlesEnabled: true
};

export let currentTheme: GameTheme = classicTheme;

export function setTheme(theme: GameTheme) {
    currentTheme = theme;
}

export const PLAYER_PADDLE_SPEED = 10.0;
export const AI_PADDLE_SPEED = 10.0;

export const paddle1 = {
    x: 20,
    y: 250,
    width: 10,
    height: 100,
    speed: PLAYER_PADDLE_SPEED,
    scored: false
};

export const paddle2 = {
    x: 970,
    y: 250,
    width: 10,
    height: 100,
    speed: PLAYER_PADDLE_SPEED,
    scored: false
};

export const ball = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    radius: 10,
    speedX: 3.0,
    speedY: 3.0,
    acceleration: 1.4,
    maxSpeed: 15.0,
    trail: [] as {x: number, y: number, alpha: number}[]
};

export const particles: {x: number, y: number, size: number, color: string, speed: number, life: number}[] = [];

let score1:number = 0;
let score2:number = 0;

export function getScores() {
    return { score1, score2 };
}

export function incrementScore(player: number) {
    if (player === 1) score1++;
    else if (player === 2) score2++;
}

export function resetScores() {
    score1 = 0;
    score2 = 0;
}

export function resetBall() {
    ball.x = canvasWidth / 2;
    ball.y = canvasHeight / 2;
    ball.speedX = ball.speedX > 0 ? -3.0 : 3.0;
    ball.speedY = (Math.random() * 2 - 1) * 3.0;
    ball.trail = [];

    if (currentTheme.particlesEnabled) {
        createExplosion(ball.x, ball.y, 20);
    }
}

export function increaseBallSpeed() {
    ball.speedX *= ball.acceleration;
    ball.speedY *= ball.acceleration;
    
    const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
    if (currentSpeed > ball.maxSpeed) {
        const ratio = ball.maxSpeed / currentSpeed;
        ball.speedX *= ratio;
        ball.speedY *= ratio;
    }
}

export function createExplosion(x: number, y: number, count: number) {
    if (!currentTheme.particlesEnabled) return;
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x,
            y,
            size: 1 + Math.random() * 3,
            color: currentTheme.ballColor,
            speed,
            life: 30 + Math.random() * 20
        });
    }
}

export function resetPaddleSpeeds() {
    paddle1.speed = PLAYER_PADDLE_SPEED;
    paddle2.speed = PLAYER_PADDLE_SPEED;
}
  