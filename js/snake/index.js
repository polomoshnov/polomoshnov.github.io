const gridSize = 20;

async function initGame() {
    const musicPlayer = new AudioPlayer();
    const effectPlayer = new AudioPlayer();
    const gameOverPlayer = new AudioPlayer();

    musicPlayer.setVolume(0.4);

    /*
    // This is a hack to make it possible to open any HTML page of the site 
    // from within a folder named nodeback.com directly in a browser as file:///D:/...
    // and have the player get the correct URLs
    const baseURL = window.location.href.split('nodeback.com/')[0] + 'nodeback.com/audio';
    */
    // Switched to `npx http-server`
    const baseURL = '/audio';

    await Promise.all([
        musicPlayer.preload([baseURL + '/8-bit-music.mp3']), 
        effectPlayer.preload([baseURL + '/effect-on-snake-eat-food.mp3']),
        gameOverPlayer.preload([baseURL + '/effect-game-over.mp3']),
    ]);

    SnakeGame.setOnEatCallback(() => {
        effectPlayer.play();
    });

    SnakeGame.setOnGameOverCallback(async (blinkingEnded) => {
        musicPlayer.stop();
        gameOverPlayer.play();

        await blinkingEnded;

        playMusicOnKeyDown();

        SnakeGame.restart();
    });

    function playMusicOnKeyDown() {
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case ' ': case 'w': case 's': case 'a': case 'd':
                    if (musicPlayer.status !== 'playing') musicPlayer.play(null, true);
                    break;
            }
        }, { once: true });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            if (musicPlayer.status === 'playing') {
                musicPlayer.pause();
            } else if (musicPlayer.status === 'paused') {
                musicPlayer.resume();
            }
        }
    });

    playMusicOnKeyDown();

    const canvas = document.createElement('canvas');

    const footer = document.getElementsByTagName('footer')[0];

    const w = footer.offsetWidth, h = footer.offsetHeight;

    Object.assign(canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 2,
        pointerEvents: 'none',
    });

    footer.style.setProperty('position', 'relative');

    footer.prepend(canvas);

    SnakeGame.setCanvas(canvas);

    SnakeGame.updateConfig({
        gridSize,
        backgroundColor: 'rgba(255, 0, 0, 0)',
        repeatFoodImages: false,
        snakeColor: '#333333', 
        snakeHeadColor: '#2e2e2e',
        foodColor: '#333333',
    });

    // (Decoding this will not give you the satisfaction you seek.)
    const secret = 'bm9kZWJhY2sgaXMgYW4gZXJyb3ItZmlyc3QgY2FsbGJhY2sgZnVuY3Rpb24gd2hlcmUgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIHJlc2VydmVkIGZvciBhIHBvdGVudGlhbCBlcnJvciBhbmQgdGhlIHJlc3QgZm9yIHRoZSBzdWNjZXNzZnVsIGRhdGEgZm9yY2luZyB5b3UgdG8gY2hlY2sgZm9yIGZhaWx1cmUgYmVmb3JlIHN1Y2Nlc3M=';

    // TROUBLESHOOTING GUIDE:
    // Problem: Can't wait to see the secret message
    // Solution 1: Play the Snake game (Recommended)
    // Solution 2: console.log(atob(secret)) (Less fun but faster)
    // Error Code: IMPATIENT_HACKER_DETECTED

    const imgs = await createImagesWithFontLoad(atob(secret), 'Silkscreen', 120, 120, {
        textColor: '#ffffff',
        backgroundColor: '#333333',
        fontWeight: 'bold',
    });

    SnakeGame.setFoodImages(imgs);

    const backgroundCanvas = document.createElement('canvas');

    backgroundCanvas.width = w;
    backgroundCanvas.height = h;

    Object.assign(backgroundCanvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1,
        pointerEvents: 'none',
    });

    footer.prepend(backgroundCanvas);

    const ctx = backgroundCanvas.getContext('2d');
    ctx.fillStyle = window.getComputedStyle(footer).backgroundColor;

    let bubble = document.createElement('div');
    Object.assign(bubble.style, {
        position: 'absolute',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: 0,
        whiteSpace: 'nowrap',
        fontSize: '20px',
        fontFamily: '"Handjet", sans-serif',
        textAlign: 'left',
    });
    const style = document.createElement('style');
        style.textContent = `
            .cbbl.-right::before, .cbbl.-right::after {
                right: 20px;
                
            }

            .cbbl {
                transition: none;
            }
        `;
    document.head.appendChild(style);
    bubble.classList.add('cbbl', '-right');
    footer.prepend(bubble);
    let bubbleTimeout;
    let bubbleTextInd = 0;
    let bubbleX, bubbleY;
    const texts = [
        ["Help me!", 3000],
        ["I'm hungry!", 3000],
        ["Plz direct me <br>to the food.", 3000],
        ["Use the joystick below<br> or the WASD keys <br>on your keyboard.", 7000],
    ];
    function changeBubbleText() {
        const [text, ms] = texts[bubbleTextInd++] || texts[bubbleTextInd = 0];
        bubble.innerHTML = text;
        bubble.style.left = (bubbleX  - bubble.offsetWidth + 58) + 'px';
        bubble.style.top = (bubbleY - gridSize - bubble.offsetHeight - 3) + 'px';
        bubbleTimeout = setTimeout(changeBubbleText, ms)
    }
    
    SnakeGame.setOnHeadMoveCallback((x, y, w, h) => {
        ctx.fillRect(x, y, w, h);

        if (bubble) {
            bubbleX = x;
            bubbleY = y;
            changeBubbleText();
            bubble.style.opacity = 1;
        }
    });

    SnakeGame.setInitialPositionCallback(() => {
        const el = document.getElementsByClassName('joystick-wrapper')[0];
        const y = el.offsetTop;
        const x = el.offsetLeft + Math.floor(el.offsetWidth / 2) + gridSize * 2;

        return { x, y };
    });

   
    document.getElementsByClassName('joystick-wrapper')[0].style.zIndex = 3; // Make it not eatable by the snake
    setupJoystick({
        touchStartArea: document.getElementsByClassName('joystick-touch-area')[0],
        container: document.getElementById('joystick-circle'), 
        handle: document.getElementById('joystick-handle-circle'),
        directionCallback: (direction) => {
            switch(direction) {
                case 'UP':
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }));
                    break;
                case 'DOWN':
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
                    break;
                case 'LEFT':
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                    break;
                case 'RIGHT':
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }));
                    break;
            }
        },
    });

    SnakeGame.init(w, h);
    
    SnakeGame.togglePause();

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        switch(key) {
            case 'w': case 's': case 'a': case 'd':
                clearTimeout(bubbleTimeout);
                bubble.style.opacity = 0;
                bubble = null;
                SnakeGame.togglePause();
        }

        switch(key) {
            case 'w':
                SnakeGame.setDirection(0, -1);
                break;
            case 's':
                SnakeGame.setDirection(0, 1);
                break;
            case 'a':
                SnakeGame.setDirection(-1, 0);
                break;
            case 'd':
                SnakeGame.setDirection(1, 0);
                break;
        }
    }, { once: true });
}

onScrollPercent(50, () => {
    initGame().then(() => {}).catch((err) => console.error(err));
});

// Triggers a callback once when a certain scroll percentage is reached,
// then automatically removes the scroll event listener.
function onScrollPercent(percent, callback) {
  const handler = () => {
    const scroll = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max && (scroll / max) * 100 >= percent) {
      window.removeEventListener('scroll', handler)
      callback()
    }
  }
  window.addEventListener('scroll', handler)
}

function createImagesWithFontLoad(str, fontName, imgWidth, imgHeight, options = {}) {
    return document.fonts.load(`${options.fontWeight || 'normal'} ${gridSize}px "${fontName}"`)
        .then(() => {
            return createCharacterImages(str, fontName, imgWidth, imgHeight, options);
        });
}

function createCharacterImages(str, fontName, imgWidth, imgHeight, options = {}) {
    const defaults = {
        fontSize: imgHeight * 0.8,
        fontStyle: 'normal',
        fontWeight: 'normal',
        textColor: '#000000',
        backgroundColor: 'transparent',
        padding: 0
    };
    
    const config = { ...defaults, ...options };
    const characters = Array.from(str);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    
    const imagePromises = characters.map((char, index) => {
        return new Promise((resolve, reject) => {
            ctx.clearRect(0, 0, imgWidth, imgHeight);
            
            // Draw background if specified
            if (config.backgroundColor !== 'transparent') {
                ctx.fillStyle = config.backgroundColor;
                ctx.fillRect(0, 0, imgWidth, imgHeight);
            }
            
            // Set text style
            ctx.fillStyle = config.textColor;
            ctx.font = `${config.fontStyle} ${config.fontWeight} ${config.fontSize}px ${fontName}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate position with padding
            const x = imgWidth / 2;
            const y = imgHeight / 2;
            
            ctx.fillText(char, x, y);
            
            const img = new Image(imgWidth, imgHeight);
            img.crossOrigin = 'anonymous';
            img.dataset.char = char;
            img.dataset.index = index;
            
            img.onload = () => resolve({ index, char, image: img });
            img.onerror = () => reject(new Error(`Failed for character: ${char}`));
            
            img.src = canvas.toDataURL('image/png');
        });
    });
    
    return Promise.all(imagePromises)
        .then(results => {
            results.sort((a, b) => a.index - b.index);
            return results.map(result => result.image);
        });
}