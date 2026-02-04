        const canvas = document.createElement('canvas');
        
        Object.assign(canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: '-1',
            display: 'block',
            opacity: '0.07',
            filter: 'grayscale(100%)',
            pointerEvents: 'none'
        });

        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match window
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            generateAndDrawEmojis();
        }
        
        // Programming emojis
        const emojis = [
            '💻', '🖥️', '⌨️', '🖱️', '📱', '📲', '💾', '💿',
            '📀', '🧮', '🔢', '🔣', '🔤', '🔄', '🛠️', '⚙️',
            '🔧', '🔨', '⛏️', '🔩', '🧲', '🔋', '🔌', '💡',
            '🔦', '🕯️', '🗑️', '🧪', '🧫', '🧬', '🔬', '🔭',
            '📡', '💉', '💊', '🧠', '🦾', '🦿', '👁️', '👂',
            '👃', '👄', '👅', '🤖', '🎮', '🎲', '🧩', '🪀',
            '🪁', '🧸', '📎', '📌', '✂️', '📏', '📐', '📒',
            '📕', '📗', '📘', '📙', '📚', '📓', '📔', '📖',
            '🗂️', '📁', '📂', '📅', '📆', '🗒️', '🗓️', '📊',
            '📈', '📉', '📇', '🗃️', '🗄️', '🗑️', '🔒', '🔓',
            '🔏', '🔐', '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️',
            '🗡️', '⚔️', '🔫', '🏹', '🛡️', '🔧', '🔩', '⚙️'
        ];
        
        // Light colors for contrast with dark background
        const colorPalettes = [
            ['#e6f2ff', '#e6ffe6', '#fff0e6', '#ffe6e6', '#f0e6ff', '#e6ffff', '#ffffe6', '#ffe6ff'],
            ['#d4edff', '#d4ffd4', '#ffedd4', '#ffd4d4', '#edd4ff', '#d4ffff', '#ffffd4', '#ffd4ff'],
            ['#b3e0ff', '#b3ffb3', '#ffe0b3', '#ffb3b3', '#e0b3ff', '#b3ffff', '#ffffb3', '#ffb3ff'],
            ['#99d6ff', '#99ff99', '#ffd699', '#ff9999', '#d699ff', '#99ffff', '#ffff99', '#ff99ff']
        ];
        
        let currentPalette = 0;
        let emojiCount = 150; // Number of emojis to place
        let emojiSize = 40; // Base size in pixels
        let padding = 15; // Minimum padding between emojis
        let placedEmojis = []; // Store placed emojis for collision detection
        
        // Class to represent an emoji
        class Emoji {
            constructor(x, y, size, emoji, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.emoji = emoji;
                this.color = color;
                this.radius = size * 0.6; // Collision radius
                this.rotation = Math.random() * 0.3 - 0.15; // Slight random rotation
                this.scale = 0.8 + Math.random() * 0.4; // Random scale variation
                this.opacity = 0.7 + Math.random() * 0.3; // Random opacity
            }
            
            // Check if this emoji overlaps with another
            collidesWith(other) {
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < (this.radius + other.radius + padding);
            }
            
            // Draw the emoji on canvas
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.scale(this.scale, this.scale);
                
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.font = `${this.size}px Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Add subtle shadow for depth
                ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                ctx.fillText(this.emoji, 0, 0);
                
                ctx.restore();
            }
        }
        
        // Generate random position that doesn't collide with existing emojis
        function findValidPosition(size) {
            const maxAttempts = 500; // Limit attempts to prevent infinite loop
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                // Random position with margin from edges
                const x = size + padding + Math.random() * (canvas.width - 2 * (size + padding));
                const y = size + padding + Math.random() * (canvas.height - 2 * (size + padding));
                
                const testEmoji = new Emoji(x, y, size, '💻', '#ffffff');
                
                // Check collision with all placed emojis
                let collision = false;
                for (const placed of placedEmojis) {
                    if (testEmoji.collidesWith(placed)) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    return { x, y };
                }
                
                attempts++;
            }
            
            // If we can't find a valid position, return a position anyway
            // (this only happens when canvas is extremely crowded)
            return {
                x: padding + Math.random() * (canvas.width - 2 * padding),
                y: padding + Math.random() * (canvas.height - 2 * padding)
            };
        }
        
        // Generate and draw all emojis
        function generateAndDrawEmojis() {
            // Clear previous emojis
            placedEmojis = [];
            
            // Fill canvas with dark background
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const currentColors = colorPalettes[currentPalette];
            
            // Try to place each emoji
            for (let i = 0; i < emojiCount; i++) {
                // Random size variation
                const size = emojiSize * (0.7 + Math.random() * 0.6);
                
                // Find valid position
                const pos = findValidPosition(size);
                
                // Random emoji
                const emojiIndex = Math.floor(Math.random() * emojis.length);
                const emoji = emojis[emojiIndex];
                
                // Random color from palette
                const colorIndex = Math.floor(Math.random() * currentColors.length);
                const color = currentColors[colorIndex];
                
                // Create and store emoji
                const emojiObj = new Emoji(pos.x, pos.y, size, emoji, color);
                placedEmojis.push(emojiObj);
                
                // Draw it
                emojiObj.draw(ctx);
            }
            
            // Draw emoji count
            drawInfoText();
        }
        
        // Draw info text on canvas
        function drawInfoText() {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '14px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'transparent';
            ctx.fillText(`Emojis: ${placedEmojis.length}`, canvas.width - 10, canvas.height - 10);
            ctx.restore();
        }
        
        // Initialize
        resizeCanvas();
        
        // Event listeners
        window.addEventListener('resize', resizeCanvas);
        
        document.getElementById('regenerate')?.addEventListener('click', generateAndDrawEmojis);
        
        document.getElementById('increaseCount')?.addEventListener('click', () => {
            if (emojiCount < 400) {
                emojiCount += 50;
                generateAndDrawEmojis();
            }
        });
        
        document.getElementById('decreaseCount')?.addEventListener('click', () => {
            if (emojiCount > 50) {
                emojiCount -= 50;
                generateAndDrawEmojis();
            }
        });
        
        document.getElementById('toggleColors')?.addEventListener('click', () => {
            currentPalette = (currentPalette + 1) % colorPalettes.length;
            generateAndDrawEmojis();
        });
        
        // Add subtle animation on mouse move
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            requestAnimationFrame(updateEmojiInteraction);
        });
        
        // Interactive effect when mouse moves
        function updateEmojiInteraction() {
            // Create a subtle interactive effect
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0d1117';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Redraw all emojis with slight interaction effect
            for (const emoji of placedEmojis) {
                // Calculate distance to mouse
                const dx = emoji.x - mouseX;
                const dy = emoji.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Save original values
                const originalScale = emoji.scale;
                const originalOpacity = emoji.opacity;
                
                // Add subtle "push away" effect when mouse is near
                if (distance < 150) {
                    const pushStrength = 1 - (distance / 150);
                    emoji.scale = originalScale * (1 - pushStrength * 0.1);
                    emoji.opacity = originalOpacity * (1 - pushStrength * 0.2);
                }
                
                emoji.draw(ctx);
                
                // Restore original values
                emoji.scale = originalScale;
                emoji.opacity = originalOpacity;
            }
            
            drawInfoText();
        }