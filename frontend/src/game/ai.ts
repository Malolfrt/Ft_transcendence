import { paddle2, ball, canvasHeight, PLAYER_PADDLE_SPEED } from './objects';

export enum AIDifficulty {
    EASY = 'easy',
    NORMAL = 'normal',
    HARD = 'hard'
}

interface AIConfig {
    reactionTime: number;
    errorMargin: number;
    predictionAccuracy: number;
    maxSpeed: number;
    minStateHoldTime: number;
    threshold: number;
    maxBounces: number;
}

const difficultyConfigs: Record<AIDifficulty, AIConfig> = {
    [AIDifficulty.EASY]: {
        reactionTime: 1000,
        errorMargin: 80,
        predictionAccuracy: 0.3,
        maxSpeed: PLAYER_PADDLE_SPEED,
        minStateHoldTime: 450,
        threshold: 100,
        maxBounces: 1
    },
    [AIDifficulty.NORMAL]: {
        reactionTime: 1000,
        errorMargin: 40,
        predictionAccuracy: 0.6,
        maxSpeed: PLAYER_PADDLE_SPEED,
        minStateHoldTime: 300,
        threshold: 50,
        maxBounces: 2
    },
    [AIDifficulty.HARD]: {
        reactionTime: 1000,
        errorMargin: 5,
        predictionAccuracy: 0.95,
        maxSpeed: PLAYER_PADDLE_SPEED,
        minStateHoldTime: 80,
        threshold: 15,
        maxBounces: 6
    }
};

type AIState = 'waiting' | 'moveUp' | 'moveDown' | 'idle';

interface AIImprovement {
    accuracyIncrease: number;
    errorReduction: number;
    bounceIncrease: number;
    thresholdReduction: number;
    stateHoldReduction: number;
}

const difficultyImprovements: Record<AIDifficulty, AIImprovement> = {
    [AIDifficulty.EASY]: {
        accuracyIncrease: 0.05,
        errorReduction: 5,
        bounceIncrease: 0.2,
        thresholdReduction: 10,
        stateHoldReduction: 20
    },
    [AIDifficulty.NORMAL]: {
        accuracyIncrease: 0.07,
        errorReduction: 7,
        bounceIncrease: 0.5,
        thresholdReduction: 5,
        stateHoldReduction: 30
    },
    [AIDifficulty.HARD]: {
        accuracyIncrease: 0.01,
        errorReduction: 1,
        bounceIncrease: 0.5,
        thresholdReduction: 2,
        stateHoldReduction: 5
    }
};

const maxValues: Record<AIDifficulty, Partial<AIConfig>> = {
    [AIDifficulty.EASY]: {
        predictionAccuracy: 0.6,
        errorMargin: 40,
        maxBounces: 2,
        minStateHoldTime: 300,
        threshold: 50
    },
    [AIDifficulty.NORMAL]: {
        predictionAccuracy: 0.85,
        errorMargin: 15,
        maxBounces: 4,
        minStateHoldTime: 150,
        threshold: 25
    },
    [AIDifficulty.HARD]: {
        predictionAccuracy: 0.99,
        errorMargin: 2,
        maxBounces: 8,
        minStateHoldTime: 50,
        threshold: 8
    }
};

let currentDifficulty: AIDifficulty = AIDifficulty.NORMAL;
let config: AIConfig = difficultyConfigs[AIDifficulty.NORMAL];
let lastStateChangeTime = 0;
let lastDecisionTime = 0;
let targetY = canvasHeight / 2;
let currentState: AIState = 'idle';
let consecutiveLosses = 0;

export const aiKeyState = {
    ArrowUp: false,
    ArrowDown: false
};

export function resetAI() {
    lastStateChangeTime = 0;
    lastDecisionTime = 0;
    targetY = canvasHeight / 2;
    currentState = 'idle';
    aiKeyState.ArrowUp = false;
    aiKeyState.ArrowDown = false;
}

export function setAIDifficulty(difficulty: AIDifficulty) {
    currentDifficulty = difficulty;
    config = difficultyConfigs[difficulty];
    
    paddle2.speed = PLAYER_PADDLE_SPEED;
    
    resetAI();
}

export function onAILoss() {
    consecutiveLosses++;

    const improvements = difficultyImprovements[currentDifficulty];
    const limits = maxValues[currentDifficulty];

    const newConfig = { ...difficultyConfigs[currentDifficulty] };

    newConfig.predictionAccuracy = Math.min(
        newConfig.predictionAccuracy + improvements.accuracyIncrease,
        limits.predictionAccuracy || 0.99
    );
    
    newConfig.errorMargin = Math.max(
        newConfig.errorMargin - improvements.errorReduction,
        limits.errorMargin || 1
    );
    
    newConfig.maxBounces = Math.min(
        newConfig.maxBounces + improvements.bounceIncrease,
        limits.maxBounces || 8
    );

    newConfig.threshold = Math.max(
        newConfig.threshold - improvements.thresholdReduction,
        limits.threshold || 5
    );
    
    newConfig.minStateHoldTime = Math.max(
        newConfig.minStateHoldTime - improvements.stateHoldReduction,
        limits.minStateHoldTime || 50
    );

    difficultyConfigs[currentDifficulty] = newConfig;

    setAIDifficulty(currentDifficulty);
    
}

export function onAIWin() {
    if (consecutiveLosses > 0) {
        consecutiveLosses = 0;
    }
}

export function getAIDifficulty(): AIDifficulty {
    return currentDifficulty;
}

function predictBallIntersection(): number {
    if (ball.speedX <= 0) {
        if (currentDifficulty === AIDifficulty.EASY) {
            return (canvasHeight / 2) * 0.8 + ball.y * 0.2;
        }
        if (currentDifficulty === AIDifficulty.NORMAL) {
            return (canvasHeight / 2) * 0.7 + ball.y * 0.3;
        }
        return (canvasHeight / 2) * 0.1 + ball.y * 0.9;
    }

    const distanceToRightPaddle = paddle2.x - ball.x;
    const timeToReachPaddle = ball.speedX !== 0 ? distanceToRightPaddle / ball.speedX : 1000;

    let predictedY = ball.y + (ball.speedY * timeToReachPaddle);

    let bounceCount = 0;
    
    while ((predictedY < 0 || predictedY > canvasHeight) && bounceCount < config.maxBounces) {
        if (predictedY < 0) {
            predictedY = -predictedY;
        } else if (predictedY > canvasHeight) {
            predictedY = 2 * canvasHeight - predictedY;
        }
        bounceCount++;
    }

    predictedY = Math.max(0, Math.min(canvasHeight, predictedY));

    if (currentDifficulty === AIDifficulty.EASY) {
        const centerBias = (canvasHeight / 2 - predictedY) * 0.3;
        predictedY += centerBias + (Math.random() * config.errorMargin - config.errorMargin / 2);
    } 
    else if (currentDifficulty === AIDifficulty.NORMAL) {
        if (Math.random() > config.predictionAccuracy) {
            predictedY += (Math.random() * config.errorMargin * 2 - config.errorMargin);
        }
    } 
    else {
        if (Math.random() > config.predictionAccuracy) {
            predictedY += (Math.random() * config.errorMargin - config.errorMargin / 2);
        }
        if (bounceCount === 0 && ball.speedY !== 0) {
            const anticipationFactor = 25;
            predictedY += Math.sign(ball.speedY) * anticipationFactor;
        }
        if (bounceCount > 0) {
            predictedY += Math.sign(ball.speedY) * (5 * bounceCount);
        }
    }

    predictedY = Math.max(0, Math.min(canvasHeight, predictedY));
    
    return predictedY;
}

function determineNextState(paddleCenter: number, targetPosition: number): AIState {
    const distance = targetPosition - paddleCenter;
    if (Math.abs(distance) <= config.threshold) {
        return 'idle';
    } else if (distance < 0) {
        return 'moveUp';
    } else {
        return 'moveDown';
    }
}

export function updateAI(currentTime: number) {
    const shouldMakeNewDecision = currentTime - lastDecisionTime >= config.reactionTime;
    const canChangeState = currentTime - lastStateChangeTime >= config.minStateHoldTime;
    if (shouldMakeNewDecision) {
        lastDecisionTime = currentTime;
        if (currentDifficulty === AIDifficulty.EASY && Math.random() < 0.2) {
        } else {
            targetY = predictBallIntersection();
        }
    }

    if (canChangeState) {
        const paddleCenter = paddle2.y + (paddle2.height / 2);

        const nextState = determineNextState(paddleCenter, targetY);

        if (currentDifficulty === AIDifficulty.EASY && currentState !== 'idle' && Math.random() < 0.15) {
        } 
        else if (currentDifficulty === AIDifficulty.HARD && nextState !== currentState) {
            const distance = Math.abs(targetY - paddleCenter);

            if (distance < 60) {
                lastStateChangeTime = currentTime - config.minStateHoldTime;
            }

            currentState = nextState;
            aiKeyState.ArrowUp = false;
            aiKeyState.ArrowDown = false;
            
            if (currentState === 'moveUp') {
                aiKeyState.ArrowUp = true;
            } else if (currentState === 'moveDown') {
                aiKeyState.ArrowDown = true;
            }
        }
        else if (nextState !== currentState) {
            lastStateChangeTime = currentTime;
            currentState = nextState;
            aiKeyState.ArrowUp = false;
            aiKeyState.ArrowDown = false;
            
            if (currentState === 'moveUp') {
                aiKeyState.ArrowUp = true;
            } else if (currentState === 'moveDown') {
                aiKeyState.ArrowDown = true;
            }
        }
    }

    if (paddle2.y <= 0 && aiKeyState.ArrowUp) {
        aiKeyState.ArrowUp = false;
        currentState = 'idle';
        lastStateChangeTime = currentTime;
    } else if (paddle2.y + paddle2.height >= canvasHeight && aiKeyState.ArrowDown) {
        aiKeyState.ArrowDown = false;
        currentState = 'idle';
        lastStateChangeTime = currentTime;
    }

    if (currentDifficulty === AIDifficulty.HARD) {
        if (Math.abs(paddle2.y + paddle2.height/2 - targetY) < 8) {
            aiKeyState.ArrowUp = false;
            aiKeyState.ArrowDown = false;
            currentState = 'idle';
        }
    } else {
        if (currentDifficulty === AIDifficulty.NORMAL && Math.abs(paddle2.y + paddle2.height/2 - targetY) < 20) {
            aiKeyState.ArrowUp = false;
            aiKeyState.ArrowDown = false;
            currentState = 'idle';
        }
    }
}