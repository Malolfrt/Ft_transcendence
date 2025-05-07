import { ball, paddle1, paddle2, canvasWidth, canvasHeight, resetBall } from "./objects";
import { increaseBallSpeed, GameTheme, currentTheme, particles, createExplosion, resetPaddleSpeeds } from "./objects";

let gameInterval: number | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let lastTime = 0;
const FPS = 60;
const frameTime = 1000 / FPS;

export function startGame(canvas: HTMLCanvasElement, onScore?: (scorer: "left" | "right") => void) {
    ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (gameInterval !== null) {
        cancelAnimationFrame(gameInterval);
        gameInterval = null;
    }

    resetGame();
    lastTime = performance.now();

    if (currentTheme.glowEffect) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = currentTheme.ballColor;
    }

    function gameLoop(timestamp: number) {
        const deltaTime = timestamp - lastTime;
        
        if (deltaTime >= frameTime) {
            lastTime = timestamp - (deltaTime % frameTime);
            update();
            render();
        }
        
        gameInterval = requestAnimationFrame(gameLoop);
    }

    function update() {

        ball.x += ball.speedX;
        ball.y += ball.speedY;

        if (currentTheme.particlesEnabled) {
            ball.trail.push({
                x: ball.x,
                y: ball.y,
                alpha: 1.0
            });

            if (ball.trail.length > 10) {
                ball.trail.shift();
            }

            ball.trail.forEach(point => {
                point.alpha -= 0.1;
            });
        }

        if (ball.y - ball.radius <= 0) {
            ball.speedY = Math.abs(ball.speedY);
            ball.y = ball.radius;
            if (currentTheme.particlesEnabled) {
                createExplosion(ball.x, ball.y, 5);
            }
        } else if (ball.y + ball.radius >= canvasHeight) {
            ball.speedY = -Math.abs(ball.speedY);
            ball.y = canvasHeight - ball.radius;
            if (currentTheme.particlesEnabled) {
                createExplosion(ball.x, ball.y, 5);
            }
        }

        if (
            ball.x - ball.radius <= paddle1.x + paddle1.width &&
            ball.x + ball.radius >= paddle1.x &&
            ball.y >= paddle1.y &&
            ball.y <= paddle1.y + paddle1.height &&
            ball.speedX < 0
        ) {
            const impactPoint = (ball.y - paddle1.y) / paddle1.height;
            const bounceAngle = (impactPoint - 0.5) * Math.PI * 0.7;
            
            const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            ball.speedX = Math.cos(bounceAngle) * speed;
            ball.speedY = Math.sin(bounceAngle) * speed;

            if (ball.speedX <= 0) ball.speedX = 2;

            ball.x = paddle1.x + paddle1.width + ball.radius;
            
            if (currentTheme.particlesEnabled) {
                createExplosion(ball.x, ball.y, 10);
            }
            
            increaseBallSpeed();
        }

        if (
            ball.x + ball.radius >= paddle2.x &&
            ball.x - ball.radius <= paddle2.x + paddle2.width && 
            ball.y >= paddle2.y &&
            ball.y <= paddle2.y + paddle2.height &&
            ball.speedX > 0
        ) {
            const impactPoint = (ball.y - paddle2.y) / paddle2.height;
            const bounceAngle = (impactPoint - 0.5) * Math.PI * 0.7 + Math.PI;
            
            const speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            ball.speedX = Math.cos(bounceAngle) * speed;
            ball.speedY = Math.sin(bounceAngle) * speed;
            
            if (ball.speedX >= 0) ball.speedX = -2;

            ball.x = paddle2.x - ball.radius;
            
            if (currentTheme.particlesEnabled) {
                createExplosion(ball.x, ball.y, 10);
            }
            
            increaseBallSpeed();
        }

        if (ball.x + ball.radius <= 0) {
            if (onScore) onScore("right");
            resetBall();
        }

        if (ball.x - ball.radius >= canvasWidth) {
            if (onScore) onScore("left");
            resetBall();
        }

        if (currentTheme.particlesEnabled) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life--;
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                
                const angle = Math.random() * Math.PI * 2;
                p.x += Math.cos(angle) * p.speed * 0.5;
                p.y += Math.sin(angle) * p.speed * 0.5;
            }
        }
    }

    function render() {
        if (!ctx) return;
        
        if (currentTheme.background.includes("gradient")) {
            const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
            if (currentTheme.background.includes("1e1b4b")) {
                gradient.addColorStop(0, "#1e1b4b");
                gradient.addColorStop(0.5, "#581c87");
                gradient.addColorStop(1, "#1e1b4b");
            } else if (currentTheme.background.includes("172554")) {
                gradient.addColorStop(0, "#172554");
                gradient.addColorStop(0.5, "#1d4ed8");
                gradient.addColorStop(1, "#172554");
            } else if (currentTheme.background.includes("064e3b")) {
                gradient.addColorStop(0, "#064e3b");
                gradient.addColorStop(0.5, "#22c55e");
                gradient.addColorStop(1, "#064e3b");
            } else if (currentTheme.background.includes("7c2d12")) {
                gradient.addColorStop(0, "#92400e");
                gradient.addColorStop(0.5, "#f97316");
                gradient.addColorStop(1, "#92400e");
            } else if (currentTheme.background.includes("92400e")) {
                gradient.addColorStop(0, "#92400e");
                gradient.addColorStop(0.5, "#f97316");
                gradient.addColorStop(1, "#92400e");
            } else if (currentTheme.background.includes("7f1d1d")) {
                gradient.addColorStop(0, "#7f1d1d");
                gradient.addColorStop(0.5, "#ef4444");
                gradient.addColorStop(1, "#7f1d1d");
            } else {
                gradient.addColorStop(0, "#000000");
                gradient.addColorStop(0.5, "#333333");
                gradient.addColorStop(1, "#000000");
            }
            
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = currentTheme.background;
        }
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.strokeStyle = currentTheme.netColor;
        ctx.setLineDash(currentTheme.netDashPattern);
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2, 0);
        ctx.lineTo(canvasWidth / 2, canvasHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        if (currentTheme.particlesEnabled && ball.trail.length > 0) {
            ball.trail.forEach(point => {
                if (point.alpha <= 0 || !ctx) return;
                
                ctx.globalAlpha = point.alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, ball.radius * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = currentTheme.ballColor;
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        if (currentTheme.particlesEnabled) {
            particles.forEach(p => {
                if (!ctx) return;
                ctx.globalAlpha = p.life / 50;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }

        if (currentTheme.glowEffect) {
            ctx.shadowColor = currentTheme.paddle1Color;
            ctx.shadowBlur = 10;
        }
        ctx.fillStyle = currentTheme.paddle1Color;
        ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
        
        if (currentTheme.glowEffect) {
            ctx.shadowColor = currentTheme.paddle2Color;
        }
        ctx.fillStyle = currentTheme.paddle2Color;
        ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

        if (currentTheme.glowEffect) {
            ctx.shadowColor = currentTheme.ballColor;
        }
        ctx.fillStyle = currentTheme.ballColor;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        if (currentTheme.glowEffect) {
            ctx.shadowBlur = 0;
        }
    }

    gameLoop(performance.now());
}

export function resetGame() {
    ball.x = canvasWidth / 2;
    ball.y = canvasHeight / 2;
    ball.speedX = 4;
    ball.speedY = 4;
    ball.trail = [];

    paddle1.y = canvasHeight / 2 - paddle1.height / 2;
    paddle2.y = canvasHeight / 2 - paddle2.height / 2;

    resetPaddleSpeeds();

    particles.length = 0;

    if (gameInterval !== null) {
        cancelAnimationFrame(gameInterval);
        gameInterval = null;
    }
}

export function stopGame() {
    if (gameInterval !== null) {
        cancelAnimationFrame(gameInterval);
        gameInterval = null;
    }
}
