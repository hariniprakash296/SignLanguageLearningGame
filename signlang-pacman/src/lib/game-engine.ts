/**
 * =============================================================================
 * FILE: game-engine.ts
 * =============================================================================
 * 
 * C4 MODEL CONTEXT:
 * - Container: Frontend (Next.js/React Application)
 * - Component: GameEngine
 * - Responsibility: Core game loop, physics, rendering, pellet collision
 * 
 * DATA FLOW:
 * 1. User presses arrow key → setDirection() called from GameCanvas.tsx
 * 2. gameLoop() runs at 60fps via requestAnimationFrame
 * 3. update() moves Pacman, checks pellet collisions
 * 4. When pellet hit → onCollect callback → triggers React state update
 * 5. render() draws maze, pellets, Pacman to HTML5 Canvas
 * 
 * DEPENDENCIES:
 * - Called by: src/components/game/GameCanvas.tsx
 * - Calls: onCollect callback passed from React
 * 
 * KEY CONCEPTS:
 * - Grid-based movement: Positions are in grid units (float), converted to pixels for rendering
 * - Delta time: Ensures consistent speed regardless of frame rate
 * - Freeze state: Pauses Pacman while user practices a sign
 * 
 * =============================================================================
 */

// * Direction type for Pacman movement
// * null means Pacman is stationary (no direction set)
export type Direction = 'up' | 'down' | 'left' | 'right' | null;

/**
 * * Point interface for 2D coordinates
 * Used for Pacman position in grid units (not pixels)
 */
interface Point {
    x: number;  // * Horizontal position in grid units
    y: number;  // * Vertical position in grid units
}

/**
 * * Generic game object interface
 * Base shape for any rectangular game entity
 */
export interface GameObject {
    x: number;      // * X position in grid units
    y: number;      // * Y position in grid units
    width: number;  // * Width in grid units
    height: number; // * Height in grid units
}

/**
 * * Pellet interface - collectible items in the maze
 * Each pellet represents a word the user needs to learn
 */
export interface Pellet {
    x: number;         // * X position in grid units (center of pellet)
    y: number;         // * Y position in grid units (center of pellet)
    word: string;      // * The word this pellet teaches (e.g., "HELLO")
    collected: boolean; // * true = pellet has been eaten and removed from maze
    learned: boolean;   // * true = pellet has triggered learning (prevents re-trigger)
}

/**
 * =============================================================================
 * GameEngine Class
 * =============================================================================
 * 
 * The main game engine that handles:
 * - Game loop (60fps rendering)
 * - Pacman movement and physics
 * - Pellet collision detection
 * - Canvas rendering (maze, pellets, Pacman)
 * 
 * LIFECYCLE:
 * 1. constructor() - Initialize canvas, pellets, resize
 * 2. start() - Begin game loop
 * 3. setDirection() - Handle user input
 * 4. pause() - Stop game loop (when overlay shown)
 * 5. unfreeze() - Resume after sign practice
 * 
 * @example
 * const engine = new GameEngine(canvas, (word) => console.log(`Collected: ${word}`));
 * engine.start();
 */
export class GameEngine {
    // * Canvas references
    private canvas: HTMLCanvasElement;       // * The HTML canvas element
    private ctx: CanvasRenderingContext2D;   // * 2D rendering context for drawing

    // * Game loop timing
    private lastTime: number = 0;   // * Timestamp of last frame (ms)
    private isRunning: boolean = false; // * true = game loop is active

    // * Pacman state
    private pacmanPos: Point = { x: 1.5, y: 1.5 }; // * Current position in grid units
    private direction: Direction = null;            // * Current movement direction
    private nextDirection: Direction = null;        // * Buffered direction (for smooth cornering)
    private speed: number = 2.5;                    // * Movement speed (grid units per second)

    /**
     * * Maze definition - 2D array where:
     * - 0 = walkable path
     * - 1 = wall (impassable)
     * 
     * Dimensions: 27 columns × 15 rows
     * This size fills the game canvas while maintaining arcade feel
     */
    private maze: number[][] = [
        // ! Each row represents a horizontal slice of the maze
        // ? Why 27 columns? This width fills a 16:9 canvas nicely
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // * Center corridor
        [1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // * Pellet management
    private pellets: Pellet[] = [];  // * Array of all pellets in the maze
    private gridSize: number = 30;   // * Size of one grid cell in pixels (recalculated on resize)

    // * Freeze state for sign practice
    private isFrozen: boolean = false;  // * true = Pacman is stopped, waiting for sign practice

    // * Active practice tracking
    private activelyPracticingPellet: Pellet | null = null;  // * The pellet currently being practiced
    private cancelCooldownPellet: Pellet | null = null;      // * Pellet in cooldown after cancel (legacy)
    private cancelCooldownTimer: number = 0;                  // * Remaining cooldown time (legacy)

    // * Callback to React component
    private onCollect: (word: string) => void;  // * Called when pellet is collected

    /**
     * * Constructor - Initialize the game engine
     * 
     * @param canvas - The HTML canvas element to render to
     * @param onCollect - Callback function called when a pellet is collected
     *                    This triggers the React state update to show the sign overlay
     * 
     * @example
     * new GameEngine(canvasRef.current, (word) => setIsWaitingForSign(true, word));
     */
    constructor(canvas: HTMLCanvasElement, onCollect: (word: string) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;  // ! Non-null assertion: canvas always has 2d context
        this.onCollect = onCollect;
        this.initPellets();  // * Place pellets in the maze
        this.resize();       // * Calculate grid size based on canvas dimensions
    }

    /**
     * * Initialize pellets in the maze
     * 
     * Places word pellets at specific positions in walkable areas.
     * Uses modulo arithmetic to create a sparse, even distribution.
     * 
     * PELLET PLACEMENT LOGIC:
     * - Only place on walkable cells (maze[y][x] === 0)
     * - Place every 8th cell (based on x+y sum) to keep pellets spread out
     * - Stop when all words are placed
     */
    private initPellets() {
        // * List of words to learn - these become pellets in the maze
        const words = ["HELLO", "YES", "NO", "THANK", "PLEASE", "SORRY", "GOOD", "HELP", "LOVE", "EAT"];
        let wordIdx = 0;  // * Current word index

        // * Iterate through entire maze grid
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                // * Only place pellets on walkable paths (not walls)
                if (this.maze[y][x] === 0) {
                    // * Place word pellets on specific indices to keep them sparse
                    // ? Why modulo 8? Creates ~10-12 pellets evenly distributed
                    if ((x + y) % 8 === 0 && wordIdx < words.length) {
                        this.pellets.push({
                            x: x + 0.5,    // * Center of cell (grid units)
                            y: y + 0.5,    // * Center of cell (grid units)
                            word: words[wordIdx],
                            collected: false,  // * Not yet eaten
                            learned: false     // * Not yet triggered learning
                        });
                        wordIdx++;
                    }
                }
            }
        }
    }

    /**
     * * Resize handler - recalculate grid size based on canvas dimensions
     * 
     * Called on:
     * - Initial load
     * - Window resize
     * 
     * Updates gridSize to ensure maze fills the canvas while maintaining aspect ratio
     */
    public resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            // * Match canvas size to parent container
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;

            // * Calculate grid size to fit maze in canvas
            // * Use minimum of width/height ratio to prevent overflow
            this.gridSize = Math.min(
                this.canvas.width / this.maze[0].length,   // * Width-based size
                this.canvas.height / this.maze.length      // * Height-based size
            );
        }
    }

    /**
     * * Start the game loop
     * 
     * Begins the requestAnimationFrame cycle that runs at ~60fps.
     * Call this to start or resume the game.
     */
    public start() {
        this.isRunning = true;
        this.lastTime = performance.now();  // * Record start time
        this.gameLoop(this.lastTime);       // * Kick off the loop
    }

    /**
     * * Pause the game loop
     * 
     * Stops the requestAnimationFrame cycle.
     * Call this when showing overlay or pausing.
     */
    public pause() {
        this.isRunning = false;
    }

    /**
     * * Set the next direction for Pacman
     * 
     * Buffers the direction for smooth cornering.
     * The actual direction change happens in update() when Pacman reaches a valid turning point.
     * 
     * @param dir - The direction to move: 'up', 'down', 'left', 'right'
     */
    public setDirection(dir: Direction) {
        this.nextDirection = dir;
    }

    /**
     * * Unfreeze after successful sign practice
     * 
     * Called when user completes a word.
     * Clears the active pellet reference and allows Pacman to move again.
     */
    public unfreeze() {
        this.isFrozen = false;
        this.activelyPracticingPellet = null;
    }

    /**
     * * Cancel sign practice (user closed overlay)
     * 
     * Called when user clicks X to close the sign overlay.
     * Marks the pellet as collected so it won't re-trigger.
     * 
     * BEHAVIOR:
     * - Pellet is removed from maze (collected = true)
     * - Pacman unfreezes and can move again
     */
    public cancelPractice() {
        if (this.activelyPracticingPellet) {
            // * Keep pellet.learned = true so it won't re-trigger
            // * The user cancelled, so skip this pellet entirely
            this.activelyPracticingPellet.collected = true; // * Mark as collected to remove from maze
        }
        this.isFrozen = false;
        this.activelyPracticingPellet = null;
        this.cancelCooldownPellet = null;
        this.cancelCooldownTimer = 0;
    }

    /**
     * * Main game loop - runs at 60fps
     * 
     * This is the heartbeat of the game. It:
     * 1. Calculates deltaTime for frame-rate independent movement
     * 2. Calls update() to move objects and check collisions
     * 3. Calls render() to draw everything to canvas
     * 4. Schedules the next frame via requestAnimationFrame
     * 
     * @param currentTime - Timestamp from requestAnimationFrame (ms since page load)
     */
    private gameLoop = (currentTime: number) => {
        // * Stop if game is paused
        if (!this.isRunning) return;

        // * Calculate time since last frame in seconds
        // * This ensures consistent speed regardless of frame rate
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // * Update game state
        this.update(deltaTime);

        // * Render to canvas
        this.render();

        // * Schedule next frame (creates the ~60fps loop)
        requestAnimationFrame(this.gameLoop);
    };

    /**
     * * Check if Pacman can move to a position
     * 
     * Uses corner-based collision detection:
     * - Checks all 4 corners of Pacman's bounding box
     * - If any corner is in a wall, movement is blocked
     * 
     * @param x - Target X position in grid units
     * @param y - Target Y position in grid units
     * @returns true if position is valid, false if blocked by wall
     */
    private canMove(x: number, y: number): boolean {
        // * Margin from center to edge of Pacman's hitbox
        const margin = 0.3;

        // * Define all 4 corners of Pacman's bounding box
        const checkPoints = [
            { x: x - margin, y: y - margin },  // * Top-left
            { x: x + margin, y: y - margin },  // * Top-right
            { x: x - margin, y: y + margin },  // * Bottom-left
            { x: x + margin, y: y + margin },  // * Bottom-right
        ];

        // * Check each corner
        for (const p of checkPoints) {
            // * Convert to grid indices
            const gridX = Math.floor(p.x);
            const gridY = Math.floor(p.y);

            // * Check bounds - prevent going outside maze
            if (gridY < 0 || gridY >= this.maze.length || gridX < 0 || gridX >= this.maze[0].length) {
                return false;  // ! Out of bounds
            }

            // * Check for wall collision
            if (this.maze[gridY][gridX] === 1) {
                return false;  // ! Hit a wall
            }
        }
        return true;  // * All corners clear
    }

    /**
     * * Update game state for one frame
     * 
     * This handles:
     * 1. Direction changes (user input processing)
     * 2. Pellet collision detection
     * 3. Pacman movement
     * 
     * @param deltaTime - Time since last frame in seconds
     */
    private update(deltaTime: number) {
        // =========================================================================
        // STEP 1: DIRECTION CHANGE LOGIC
        // =========================================================================

        // * Try to change direction if user has pressed a key
        if (this.nextDirection) {
            // * Check for 180-degree turn (always allowed, no centering needed)
            const isOpposite =
                (this.direction === 'up' && this.nextDirection === 'down') ||
                (this.direction === 'down' && this.nextDirection === 'up') ||
                (this.direction === 'left' && this.nextDirection === 'right') ||
                (this.direction === 'right' && this.nextDirection === 'left');

            if (isOpposite) {
                // * Instant 180 turn
                this.direction = this.nextDirection;
                this.nextDirection = null;
            } else {
                // * 90-degree turn: only allowed when near center of a cell
                // ? Why center? Prevents getting stuck or clipping through walls
                const snapThreshold = 0.35;  // * How close to center we need to be
                const snappedX = Math.floor(this.pacmanPos.x) + 0.5;  // * Center of current cell X
                const snappedY = Math.floor(this.pacmanPos.y) + 0.5;  // * Center of current cell Y
                const isCenteredX = Math.abs(this.pacmanPos.x - snappedX) < snapThreshold;
                const isCenteredY = Math.abs(this.pacmanPos.y - snappedY) < snapThreshold;

                if (isCenteredX && isCenteredY) {
                    // * Check if the new direction is valid from the snapped center
                    let canTurn = false;
                    if (this.nextDirection === 'up' && this.canMove(snappedX, snappedY - 0.1)) canTurn = true;
                    if (this.nextDirection === 'down' && this.canMove(snappedX, snappedY + 0.1)) canTurn = true;
                    if (this.nextDirection === 'left' && this.canMove(snappedX - 0.1, snappedY)) canTurn = true;
                    if (this.nextDirection === 'right' && this.canMove(snappedX + 0.1, snappedY)) canTurn = true;

                    if (canTurn) {
                        this.direction = this.nextDirection;
                        // * Snap to center when turning to keep in lane
                        this.pacmanPos.x = snappedX;
                        this.pacmanPos.y = snappedY;
                        this.nextDirection = null;
                    }
                }
            }
        }

        // =========================================================================
        // STEP 2: PELLET COLLISION DETECTION
        // =========================================================================

        // * Update cancel cooldown timer (legacy, kept for safety)
        if (this.cancelCooldownTimer > 0) {
            this.cancelCooldownTimer -= deltaTime;
            if (this.cancelCooldownTimer <= 0) {
                this.cancelCooldownPellet = null;
            }
        }

        // * Check each pellet for collision
        for (const pellet of this.pellets) {
            if (!pellet.collected) {
                // * Calculate distance from Pacman to pellet center
                const dx = this.pacmanPos.x - pellet.x;
                const dy = this.pacmanPos.y - pellet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);  // * Euclidean distance

                // * CONSUMPTION: Very close and not frozen = eat the pellet
                if (distance < 0.35 && !this.isFrozen && pellet !== this.cancelCooldownPellet) {
                    pellet.collected = true;  // * Mark as eaten
                }

                // * PRACTICE TRIGGER: Medium distance = start learning
                // * Only triggers once per pellet (learned flag prevents re-trigger)
                if (distance < 0.8 && !this.isFrozen && !pellet.collected && !pellet.learned && pellet !== this.cancelCooldownPellet) {
                    this.isFrozen = true;                    // * Stop Pacman
                    this.activelyPracticingPellet = pellet;  // * Track active pellet
                    this.direction = null;                   // * Clear movement
                    pellet.learned = true;                   // * Prevent re-trigger
                    this.onCollect(pellet.word);             // * Notify React to show overlay
                    return;  // ! Stop update for this frame to freeze immediately
                }
            }
        }

        // =========================================================================
        // STEP 3: PACMAN MOVEMENT
        // =========================================================================

        // * Only move if not frozen (practicing a sign)
        if (!this.isFrozen) {
            let nextX = this.pacmanPos.x;
            let nextY = this.pacmanPos.y;

            // * Calculate next position based on direction
            // * deltaTime ensures consistent speed regardless of frame rate
            if (this.direction === 'up') nextY -= this.speed * deltaTime;
            if (this.direction === 'down') nextY += this.speed * deltaTime;
            if (this.direction === 'left') nextX -= this.speed * deltaTime;
            if (this.direction === 'right') nextX += this.speed * deltaTime;

            // * Only move if the next position is valid
            if (this.canMove(nextX, nextY)) {
                this.pacmanPos.x = nextX;
                this.pacmanPos.y = nextY;
            }
            // * No wrap-around - Pacman stops at maze boundaries
        }
    }

    /**
     * * Render the game to canvas
     * 
     * Drawing order (back to front):
     * 1. Black background
     * 2. Maze walls
     * 3. Pellets with word labels
     * 4. Pacman
     * 5. Frozen overlay (if practicing)
     */
    private render() {
        // * Clear canvas with black background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // * Dim maze when frozen (practicing a sign)
        const mazeColor = this.isFrozen ? '#0a0a4d' : '#1919A6';

        // =========================================================================
        // DRAW MAZE WALLS
        // =========================================================================
        this.ctx.fillStyle = mazeColor;
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1) {
                    // * Draw wall block with 2px padding for visual separation
                    this.ctx.fillRect(
                        x * this.gridSize + 2,      // * X position in pixels
                        y * this.gridSize + 2,      // * Y position in pixels
                        this.gridSize - 4,          // * Width (minus padding)
                        this.gridSize - 4           // * Height (minus padding)
                    );
                }
            }
        }

        // =========================================================================
        // DRAW PELLETS
        // =========================================================================
        for (const pellet of this.pellets) {
            if (!pellet.collected) {
                // * Draw pellet dot
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(
                    pellet.x * this.gridSize,       // * X center in pixels
                    pellet.y * this.gridSize,       // * Y center in pixels
                    this.gridSize * 0.15,           // * Radius (15% of cell size)
                    0,
                    Math.PI * 2                      // * Full circle
                );
                this.ctx.fill();

                // * Draw word label on pellet
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

        // =========================================================================
        // DRAW PACMAN
        // =========================================================================
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        const radius = this.gridSize * 0.4;                    // * Pacman size (40% of cell)
        const centerX = this.pacmanPos.x * this.gridSize;      // * X center in pixels
        const centerY = this.pacmanPos.y * this.gridSize;      // * Y center in pixels

        // * Calculate mouth angles based on direction
        // * The gap in the arc creates the "mouth" effect
        let startAngle = 0.15 * Math.PI;
        let endAngle = 1.85 * Math.PI;

        // * Rotate Pacman to face movement direction
        if (this.direction === 'up') { startAngle = 1.65 * Math.PI; endAngle = 1.35 * Math.PI; }
        if (this.direction === 'down') { startAngle = 0.65 * Math.PI; endAngle = 0.35 * Math.PI; }
        if (this.direction === 'left') { startAngle = 1.15 * Math.PI; endAngle = 0.85 * Math.PI; }
        if (this.direction === 'right' || !this.direction) { startAngle = 0.15 * Math.PI; endAngle = 1.85 * Math.PI; }

        // * Draw Pacman arc (pie slice shape)
        this.ctx.moveTo(centerX, centerY);
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        this.ctx.fill();

        // =========================================================================
        // DRAW FROZEN OVERLAY (when practicing sign)
        // =========================================================================
        if (this.isFrozen) {
            // * Semi-transparent dark overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // * Draw centered pill with "SHOW YOUR SIGN" text
            const text = "SHOW YOUR SIGN";
            const fontSize = Math.min(this.gridSize * 0.5, 24);
            this.ctx.font = `bold ${fontSize}px Arial`;
            const textWidth = this.ctx.measureText(text).width;
            const pillWidth = textWidth + 40;
            const pillHeight = fontSize + 20;
            const pillX = (this.canvas.width - pillWidth) / 2;
            const pillY = (this.canvas.height - pillHeight) / 2;

            // * Blue pill background
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';  // * Blue-500 with 90% opacity
            this.ctx.beginPath();
            this.ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 10);  // * Rounded corners
            this.ctx.fill();

            // * White centered text
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
        }
    }
}
