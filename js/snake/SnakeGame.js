(function () {
    // =============================================
    // SNAKE GAME CORE ENGINE
    // =============================================
    
    // Game Configuration - Change these values as needed
    const config = {
        gridSize: 20,           // Size of each grid cell in pixels
        initialSpeed: 8,        // Frames per second
        speedIncrement: 0.5,    // Speed increase per level
        initialBodyLength: 0, // Number of initial body segments excluding head
        repeatFoodImages: true,
        wrapEdges: true,        // If true, snake wraps around edges
        snakeColor: '#00ff00',  // Snake body color
        snakeHeadColor: '#00cc00', // Snake head color
        foodColor: '#ffcc00',   // Food color
        backgroundColor: '#000' // Background color
    };
    
    // Get canvas and context
    let canvas, ctx;
    
    // Game state variables (do not modify directly)
    let snake = [];
    let direction = { x: 1, y: 0 };
    let nextDirection = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };
    let gameSpeed = config.initialSpeed;
    let score = 0;
    let gameRunning = false;
    let gamePaused = false;
    let lastRenderTime = 0;
    let gridWidth, gridHeight;
    let animationFrameId = null; // For tracking animation frame
    
    // Food images array and tracking
    let foodImages = [];
    let currentFoodImageIndex = -1;
    let foodImagesLoaded = [];

    let onEatCallback, onGameOverCallback;

    // Variables for blinking snake animation
    let blinkAnimationActive = false;
    let blinkIntervalId = null;
    let blinkCounter = 0;
    const MAX_BLINKS = 13;
    const BLINK_INTERVAL = 200; // ms between blinks
    let resolveBlinkEndedPromise;

    function setOnEatCallback(clb) {
        onEatCallback = clb;
    }

    function setOnGameOverCallback(clb) {
        onGameOverCallback = clb;
    }

    // 4. Public API - Use these functions to interact with the game
    
    // Initialize the game
    function initGame(width = 600, height = 400) {
        // Cancel any existing animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Stop any blinking animation
        resolveBlinkEndedPromise?.();
        
        canvas.width = width;
        canvas.height = height;
        
        // Calculate grid dimensions
        gridWidth = Math.floor(width / config.gridSize);
        gridHeight = Math.floor(height / config.gridSize);
        
        // Reset game state
        const startX = Math.floor(gridWidth / 4);
        const startY = Math.floor(gridHeight / 2);
        
        // Add head
        snake = [
            { x: startX, y: startY }, // Head
        ];

        // Add body segments
        for (let i = 0; i < config.initialBodyLength; i++) {
            snake.push({ x: startX - (i + 1), y: startY }); 
        }
        
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        gameSpeed = config.initialSpeed;
        score = 0;
        gameRunning = true;
        gamePaused = false;
        
        // Reset image tracking
        currentFoodImageIndex = config.initialBodyLength - 1;

        // Generate initial food
        generateFood();
        
        // Start game loop
        lastRenderTime = 0;
        gameLoop(); // Call directly instead of via requestAnimationFrame
        
        return { width: gridWidth, height: gridHeight };
    }

    function setCanvas(el) {
        canvas = el;
        ctx = canvas.getContext('2d');
    }
    
    function setFoodImages(images) {
        foodImages = Array.isArray(images) ? images : [];
        foodImagesLoaded = [];
        currentFoodImageIndex = config.initialBodyLength - 1;
        
        // Preload images
        if (foodImages.length > 0) {
            foodImages.forEach((url, index) => {
                if (typeof url === 'object') { // already image
                    foodImagesLoaded[index] = url;
                } else {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        foodImagesLoaded[index] = img;
                    };
                    img.onerror = () => {
                        console.warn(`Failed to load food image: ${url}`);
                        foodImagesLoaded[index] = null;
                    };
                }
            });
        }
    }
    
    // Resize canvas while preserving game state
    function resizeCanvas(newWidth, newHeight) {
        if (!gameRunning) return false;
        
        // Store current pause state
        const wasPaused = gamePaused;
        
        // Temporarily pause to avoid update during resize
        gamePaused = true;
        
        // Store current state
        const currentScore = score;
        const currentSpeed = gameSpeed;
        const currentSnakeLength = snake.length;
        
        // Update canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Recalculate grid dimensions
        gridWidth = Math.floor(newWidth / config.gridSize);
        gridHeight = Math.floor(newHeight / config.gridSize);
        
        // Reposition snake in center while preserving length
        repositionSnakeInCenter(currentSnakeLength);
        
        // Regenerate food
        generateFood();
        
        // Restore state
        score = currentScore;
        gameSpeed = currentSpeed;
        gamePaused = wasPaused;
        
        // Force redraw
        draw();
        
        // Reset last render time to prevent timing issues
        lastRenderTime = performance.now();
        
        return true;
    }
    
    // Helper function to reposition snake in center
    function repositionSnakeInCenter(targetLength) {
        const centerX = Math.floor(gridWidth / 2);
        const centerY = Math.floor(gridHeight / 2);
        
        // Create new snake starting from center
        const newSnake = [];
        const length = Math.min(targetLength, Math.min(gridWidth, gridHeight));
        
        for (let i = 0; i < length; i++) {
            // Calculate position (snake faces right initially)
            let x = centerX - i;
            let y = centerY;
            
            // Ensure within bounds
            x = Math.max(0, Math.min(x, gridWidth - 1));
            y = Math.max(0, Math.min(y, gridHeight - 1));
            
            newSnake.push({ x, y });
        }
        
        snake = newSnake;
    }
    
    // Set snake direction (call this from UI controls)
    function setDirection(x, y) {
        if (gamePaused || !gameRunning) return false;
        
        // Prevent 180-degree turns
        if (direction.x === 0 && x !== 0) {
            nextDirection = { x, y: 0 };
            return true;
        } else if (direction.y === 0 && y !== 0) {
            nextDirection = { x: 0, y };
            return true;
        }
        return false;
    }
    
    // Toggle pause state
    function togglePause() {
        if (!gameRunning) return false;
        gamePaused = !gamePaused;
        
        // Reset timer when unpausing
        if (!gamePaused) {
            lastRenderTime = performance.now();
        }
        
        return gamePaused;
    }
    
    // Restart game
    function restartGame() {
        gameRunning = false;
        
        // Cancel animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Stop any blinking animation
        resolveBlinkEndedPromise?.();
        
        initGame(canvas.width, canvas.height);
        return true;
    }
    
    // Get current game state for UI
    function getGameState() {
        return {
            score: score,
            length: snake.length,
            speed: Math.floor(gameSpeed - config.initialSpeed + 1),
            isRunning: gameRunning,
            isPaused: gamePaused,
            gridSize: { width: gridWidth, height: gridHeight },
            canvasSize: { width: canvas.width, height: canvas.height },
            snakeHead: snake[0],
            food: food,
            // Return food image info
            currentFoodImageIndex: currentFoodImageIndex,
            totalFoodImages: foodImages.length,
            hasFoodImage: currentFoodImageIndex >= 0 && currentFoodImageIndex < foodImages.length
        };
    }
    
    // Set game configuration
    function updateConfig(newConfig) {
        Object.assign(config, newConfig);
        return config;
    }
    
    // =============================================
    // PRIVATE FUNCTIONS - Do not call directly
    // =============================================
    
    function generateFood() {
        let newFood;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        food = newFood;

        // Select food image if available
        if (foodImages.length && (config.repeatFoodImages || snake.length <= foodImages.length)) {
            currentFoodImageIndex = (currentFoodImageIndex + 1) % foodImages.length;
        } else {
            currentFoodImageIndex = -1;
        }
    }
    
    function gameLoop(currentTime) {
        // Store animation frame ID
        animationFrameId = requestAnimationFrame(gameLoop);
        
        if (!gameRunning && !blinkAnimationActive) return;
        
        if (gamePaused) {
            return;
        }
        
        // Use performance.now() if currentTime not provided
        const now = currentTime || performance.now();
        const secondsSinceLastRender = (now - lastRenderTime) / 1000;
        
        if (secondsSinceLastRender < 1 / gameSpeed) {
            return;
        }
        
        lastRenderTime = now;
        
        // Only update game if not in blink animation
        if (!blinkAnimationActive) {
            update();
        }
        draw();
    }
    
    function update() {
        direction = { ...nextDirection };
        
        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;
        
        // Wrap around edges or check boundaries
        if (config.wrapEdges) {
            if (head.x < 0) head.x = gridWidth - 1;
            if (head.x >= gridWidth) head.x = 0;
            if (head.y < 0) head.y = gridHeight - 1;
            if (head.y >= gridHeight) head.y = 0;
        } else {
            if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
                handleGameOver();
                return;
            }
        }
        
        // Check self-collision
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                handleGameOver();
                return;
            }
        }
        
        snake.unshift(head);

        // Check if food was eaten
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            if (score % 50 === 0) {
                gameSpeed += config.speedIncrement;
            }

            onEatCallback?.();
            
            generateFood();
        } else {
            snake.pop();
        }
    }
    
    // Function to handle game over with blinking animation
    function handleGameOver() {
        gameRunning = false;
        blinkAnimationActive = true;
        blinkCounter = 0;

        const blinkEndedPromise = new Promise((resolve) => {
            resolveBlinkEndedPromise = () => {
                clearInterval(blinkIntervalId);
                blinkIntervalId = null;
                resolveBlinkEndedPromise = null;
                blinkAnimationActive = false;
                blinkCounter = 0;
                resolve();
            };

            // Start blinking animation
            blinkIntervalId = setInterval(() => {
                blinkCounter++;
                
                // After max blinks, clear both snake and food
                if (blinkCounter >= MAX_BLINKS) {
                    // Clear both snake and food
                    snake = [];
                    food = { x: -1, y: -1 }; // Move food off-screen
                    
                    // Redraw to show empty screen
                    draw();

                    resolveBlinkEndedPromise?.();
                }
                
                // Force a redraw on each blink
                draw();
            }, BLINK_INTERVAL);
        });
        
        onGameOverCallback?.(blinkEndedPromise);
    }
    
    function draw() {
        // Clear canvas
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Check if we should draw snake (for blinking effect)
        const shouldDrawSnake = !blinkAnimationActive || (blinkCounter % 2 === 0);
        
        if (shouldDrawSnake && snake.length > 0) {
            // Draw snake (starting from body, then head on top)
            for (let i = snake.length - 1; i >= 0; i--) {
                const segment = snake[i];
                
                // Check if this segment has an image
                const hasImage = i > 0 && (config.repeatFoodImages || i <= foodImagesLoaded.length);

                if (hasImage) { // Only body segments (not head) get images
                    // Draw food image for this segment
                    const img = foodImagesLoaded[(i - 1) % foodImagesLoaded.length];
                    if (img && img.complete && img.naturalHeight !== 0) {
                        ctx.drawImage(
                            img,
                            segment.x * config.gridSize + 1,
                            segment.y * config.gridSize + 1,
                            config.gridSize - 2,
                            config.gridSize - 2
                        );
                    } else {
                        // Fallback to solid color if image not loaded
                        drawSolidSnakeSegment(segment, i);
                    }
                } else {
                    // Draw regular snake segment
                    drawSolidSnakeSegment(segment, i);
                }
            }
        }
        
        // Draw food (always show unless cleared with snake)
        if (food.x >= 0 && food.y >= 0) {
            const foodHasImage = currentFoodImageIndex >= 0 && 
                               currentFoodImageIndex < foodImagesLoaded.length &&
                               foodImagesLoaded[currentFoodImageIndex];
            
            if (foodHasImage) {
                const img = foodImagesLoaded[currentFoodImageIndex];
                if (img && img.complete && img.naturalHeight !== 0) {
                    ctx.drawImage(
                        img,
                        food.x * config.gridSize + 1,
                        food.y * config.gridSize + 1,
                        config.gridSize - 2,
                        config.gridSize - 2
                    );
                } else {
                    // Fallback to solid color if image not loaded
                    drawSolidFood();
                }
            } else {
                drawSolidFood();
            }
        }
    }
    
    // Helper function to draw solid color snake segment
    function drawSolidSnakeSegment(segment, index) {
        if (index === 0) {
            // Draw head
            ctx.fillStyle = config.snakeHeadColor;
            ctx.fillRect(
                segment.x * config.gridSize + 1,
                segment.y * config.gridSize + 1,
                config.gridSize - 2,
                config.gridSize - 2
            );
            
            // Draw eyes
            ctx.fillStyle = '#ffffff';
            const eyeSize = 3;
            let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
            
            if (direction.x === 1) {
                leftEyeX = segment.x * config.gridSize + config.gridSize - 6;
                leftEyeY = segment.y * config.gridSize + 5;
                rightEyeX = segment.x * config.gridSize + config.gridSize - 6;
                rightEyeY = segment.y * config.gridSize + config.gridSize - 8;
            } else if (direction.x === -1) {
                leftEyeX = segment.x * config.gridSize + 4;
                leftEyeY = segment.y * config.gridSize + 5;
                rightEyeX = segment.x * config.gridSize + 4;
                rightEyeY = segment.y * config.gridSize + config.gridSize - 8;
            } else if (direction.y === 1) {
                leftEyeX = segment.x * config.gridSize + 5;
                leftEyeY = segment.y * config.gridSize + config.gridSize - 6;
                rightEyeX = segment.x * config.gridSize + config.gridSize - 8;
                rightEyeY = segment.y * config.gridSize + config.gridSize - 6;
            } else if (direction.y === -1) {
                leftEyeX = segment.x * config.gridSize + 5;
                leftEyeY = segment.y * config.gridSize + 4;
                rightEyeX = segment.x * config.gridSize + config.gridSize - 8;
                rightEyeY = segment.y * config.gridSize + 4;
            }
            
            ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
            ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
        } else {
            // Draw body
            ctx.fillStyle = config.snakeColor;
            ctx.fillRect(
                segment.x * config.gridSize + 1,
                segment.y * config.gridSize + 1,
                config.gridSize - 2,
                config.gridSize - 2
            );
        }
    }
    
    // Helper function to draw solid color food
    function drawSolidFood() {
        ctx.fillStyle = config.foodColor;
        ctx.fillRect(
            food.x * config.gridSize + 3,
            food.y * config.gridSize + 3,
            config.gridSize - 6,
            config.gridSize - 6
        );
    }
    
    // =============================================
    // KEYBOARD CONTROLS
    // =============================================
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.keyCode === 32) {
            togglePause();
            return;
        }
        
        if (gamePaused || !gameRunning) return;
        
        switch(e.key) {
            case 'w': case 'W':
                setDirection(0, -1);
                break;
            case 's': case 'S':
                setDirection(0, 1);
                break;
            case 'a': case 'A':
                setDirection(-1, 0);
                break;
            case 'd': case 'D':
                setDirection(1, 0);
                break;
        }
    });
    
    // =============================================
    // PUBLIC API EXPOSED TO WINDOW OBJECT
    // =============================================
    window.SnakeGame = {
        config: config,
        canvas: canvas,
        init: initGame,
        resize: resizeCanvas,
        setDirection: setDirection,
        togglePause: togglePause,
        restart: restartGame,
        getState: getGameState,
        updateConfig: updateConfig,
        setCanvas: setCanvas,
        setFoodImages: setFoodImages,
        setOnEatCallback: setOnEatCallback,
        setOnGameOverCallback: setOnGameOverCallback,
    };
})();