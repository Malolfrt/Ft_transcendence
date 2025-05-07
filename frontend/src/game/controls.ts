import { paddle1, paddle2 } from './objects';
import { aiKeyState } from './ai';

const keysPressed: { [key: string]: boolean } = {};

function handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "z", "s"].includes(event.key)) {
        keysPressed[event.key] = true;
    }
}

function handleKeyUp(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "z", "s"].includes(event.key)) {
        keysPressed[event.key] = false;
    }
}

export function setupControls(paddle1: any, paddle2: any, canvasHeight: number) {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    function updatePosition() {
        if (keysPressed['z']) {
            paddle1.y = Math.max(0, paddle1.y - paddle1.speed);
        }
        if (keysPressed['s']) {
            paddle1.y = Math.min(canvasHeight - paddle1.height, paddle1.y + paddle1.speed);
        }

        if (keysPressed['ArrowUp'] || aiKeyState.ArrowUp) {
            paddle2.y = Math.max(0, paddle2.y - paddle2.speed);
        }
        if (keysPressed['ArrowDown'] || aiKeyState.ArrowDown) {
            paddle2.y = Math.min(canvasHeight - paddle2.height, paddle2.y + paddle2.speed);
        }

        requestAnimationFrame(updatePosition);
    }

    updatePosition();
}

export function cleanupControls() {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    
    for (const key in keysPressed) {
        keysPressed[key] = false;
    }

}
