export type Direction = 'up' | 'down' | 'left' | 'right' | null;

interface Point {
    x: number;
    y: number;
}

export interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Pellet {
    x: number;
    y: number;
    word: string;
    collected: boolean;
    learned: boolean;
}

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    // Game state
    private pacmanPos: Point = { x: 1.5, y: 1.5 }; // coordinates in grid units
    private direction: Direction = null;
    private nextDirection: Direction = null;
    private speed: number = 2.5; // units per second

    // Expanded maze: 27 columns x 15 rows to fill full canvas width
    private maze: number[][] = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    private pellets: Pellet[] = [];
    private gridSize: number = 30;
    private isFrozen: boolean = false;

    private activelyPracticingPellet: any = null;
    private cancelCooldownPellet: any = null;
    private cancelCooldownTimer: number = 0;

    private onCollect: (word: string) => void;

    constructor(canvas: HTMLCanvasElement, onCollect: (word: string) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.onCollect = onCollect;
        this.initPellets();
        this.resize();
    }

    private initPellets() {
        const words = ["HELLO", "YES", "NO", "THANK", "PLEASE", "SORRY", "GOOD", "HELP", "LOVE", "EAT"];
        let wordIdx = 0;
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 0) {
                    // Place word pellets on specific indices to keep them sparse
                    if ((x + y) % 8 === 0 && wordIdx < words.length) {
                        this.pellets.push({
                            x: x + 0.5,
                            y: y + 0.5,
                            word: words[wordIdx],
                            collected: false,
                            learned: false
                        });
                        wordIdx++;
                    }
                }
            }
        }
    }

    public resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            // Scale to fill the full canvas
            this.gridSize = Math.min(
                this.canvas.width / this.maze[0].length,
                this.canvas.height / this.maze.length
            );
        }
    }

    public start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    public pause() {
        this.isRunning = false;
    }

    public setDirection(dir: Direction) {
        this.nextDirection = dir;
    }

    public unfreeze() {
        this.isFrozen = false;
        this.activelyPracticingPellet = null;
    }

    public cancelPractice() {
        if (this.activelyPracticingPellet) {
            this.cancelCooldownPellet = this.activelyPracticingPellet;
            this.cancelCooldownTimer = 2.0; // 2 seconds cooldown
            this.activelyPracticingPellet.learned = false; // Allow re-learning later
        }
        this.isFrozen = false;
        this.activelyPracticingPellet = null;
    }

    private gameLoop = (currentTime: number) => {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    private canMove(x: number, y: number): boolean {
        const margin = 0.3;
        const checkPoints = [
            { x: x - margin, y: y - margin },
            { x: x + margin, y: y - margin },
            { x: x - margin, y: y + margin },
            { x: x + margin, y: y + margin },
        ];

        for (const p of checkPoints) {
            const gridX = Math.floor(p.x);
            const gridY = Math.floor(p.y);

            if (gridY < 0 || gridY >= this.maze.length || gridX < 0 || gridX >= this.maze[0].length) {
                return false;
            }
            if (this.maze[gridY][gridX] === 1) {
                return false;
            }
        }
        return true;
    }

    private update(deltaTime: number) {
        // Try to change direction if possible
        // Try to change direction if possible
        if (this.nextDirection) {
            // 1. Immediate 180-degree turn (always allowed)
            const isOpposite =
                (this.direction === 'up' && this.nextDirection === 'down') ||
                (this.direction === 'down' && this.nextDirection === 'up') ||
                (this.direction === 'left' && this.nextDirection === 'right') ||
                (this.direction === 'right' && this.nextDirection === 'left');

            if (isOpposite) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
            } else {
                // 2. 90-degree turn: only allowed near grid centers
                const snapThreshold = 0.35; // More lenient threshold
                const snappedX = Math.floor(this.pacmanPos.x) + 0.5;
                const snappedY = Math.floor(this.pacmanPos.y) + 0.5;
                const isCenteredX = Math.abs(this.pacmanPos.x - snappedX) < snapThreshold;
                const isCenteredY = Math.abs(this.pacmanPos.y - snappedY) < snapThreshold;

                if (isCenteredX && isCenteredY) {
                    // Check if the new direction is valid from the snapped center
                    let canTurn = false;
                    if (this.nextDirection === 'up' && this.canMove(snappedX, snappedY - 0.1)) canTurn = true;
                    if (this.nextDirection === 'down' && this.canMove(snappedX, snappedY + 0.1)) canTurn = true;
                    if (this.nextDirection === 'left' && this.canMove(snappedX - 0.1, snappedY)) canTurn = true;
                    if (this.nextDirection === 'right' && this.canMove(snappedX + 0.1, snappedY)) canTurn = true;

                    if (canTurn) {
                        this.direction = this.nextDirection;
                        // Snap to center when turning to keep in lane
                        this.pacmanPos.x = snappedX;
                        this.pacmanPos.y = snappedY;
                        this.nextDirection = null;
                    }
                }
            }
        }



        // Pellet Logic
        if (this.cancelCooldownTimer > 0) {
            this.cancelCooldownTimer -= deltaTime;
            if (this.cancelCooldownTimer <= 0) {
                this.cancelCooldownPellet = null;
            }
        }

        for (const pellet of this.pellets) {
            if (!pellet.collected) {
                const dx = this.pacmanPos.x - pellet.x;
                const dy = this.pacmanPos.y - pellet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 1. Consumption Logic (Must be close and NOT frozen)
                // If we just cancelled, don't eat it
                if (distance < 0.35 && !this.isFrozen && pellet !== this.cancelCooldownPellet) {
                    pellet.collected = true;
                }

                // 2. Proximity Practice Trigger (Only trigger once per pellet approach)
                if (distance < 0.8 && !this.isFrozen && !pellet.collected && !pellet.learned && pellet !== this.cancelCooldownPellet) {
                    this.isFrozen = true;
                    this.activelyPracticingPellet = pellet;
                    this.direction = null;
                    pellet.learned = true; // Mark as learned so we don't trigger again
                    this.onCollect(pellet.word);
                    return; // Stop update for this frame to freeze immediately
                }
            }
        }

        // Move in current direction
        if (!this.isFrozen) {
            let nextX = this.pacmanPos.x;
            let nextY = this.pacmanPos.y;

            if (this.direction === 'up') nextY -= this.speed * deltaTime;
            if (this.direction === 'down') nextY += this.speed * deltaTime;
            if (this.direction === 'left') nextX -= this.speed * deltaTime;
            if (this.direction === 'right') nextX += this.speed * deltaTime;

            if (this.canMove(nextX, nextY)) {
                this.pacmanPos.x = nextX;
                this.pacmanPos.y = nextY;
            }
            // No wrap-around - Pacman stops at maze boundaries
        }
    }

    private render() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dim maze if frozen
        const mazeColor = this.isFrozen ? '#0a0a4d' : '#1919A6';

        // Draw maze
        this.ctx.fillStyle = mazeColor;
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.gridSize + 2,
                        y * this.gridSize + 2,
                        this.gridSize - 4,
                        this.gridSize - 4
                    );
                }
            }
        }

        // Draw pellets
        for (const pellet of this.pellets) {
            if (!pellet.collected) {
                this.ctx.fillStyle = this.isFrozen && !pellet.learned ? 'white' : 'white';
                // If it's the one we are currently practicing, maybe highlight it?
                // But we don't track which one is active easily here.

                this.ctx.beginPath();
                this.ctx.arc(
                    pellet.x * this.gridSize,
                    pellet.y * this.gridSize,
                    this.gridSize * 0.15,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();

                // Draw word
                this.ctx.fillStyle = 'black';
                this.ctx.font = `bold ${this.gridSize * 0.15}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    pellet.word,
                    pellet.x * this.gridSize,
                    pellet.y * this.gridSize
                );
            }
        }

        // Draw Pacman
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        const radius = this.gridSize * 0.4;
        const centerX = this.pacmanPos.x * this.gridSize;
        const centerY = this.pacmanPos.y * this.gridSize;

        let startAngle = 0.15 * Math.PI;
        let endAngle = 1.85 * Math.PI;

        if (this.direction === 'up') { startAngle = 1.65 * Math.PI; endAngle = 1.35 * Math.PI; }
        if (this.direction === 'down') { startAngle = 0.65 * Math.PI; endAngle = 0.35 * Math.PI; }
        if (this.direction === 'left') { startAngle = 1.15 * Math.PI; endAngle = 0.85 * Math.PI; }
        if (this.direction === 'right' || !this.direction) { startAngle = 0.15 * Math.PI; endAngle = 1.85 * Math.PI; }

        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.fill();

        // Draw status text if frozen
        if (this.isFrozen) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.font = `bold ${this.gridSize * 0.8}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText("WAITING FOR SIGN...", this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}
