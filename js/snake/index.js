const gridSize = 20;

async function initGame() {
    const musicPlayer = new AudioPlayer();
    const effectPlayer = new AudioPlayer();
    const gameOverPlayer = new AudioPlayer();

    musicPlayer.setVolume(0.4);

    // This is a hack to make it possible to open any HTML page of the site 
    // from within a folder named nodeback.com directly in a browser as file:///D:/...
    // and have the player get the correct URLs
    const baseURL = window.location.href.split('nodeback.com/')[0] + 'nodeback.com/audio';

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
            if (e.key === ' ' || e.keyCode === 32) return;

            switch(e.key.toLowerCase()) {
                case 'w': case 's': case 'a': case 'd':
                    musicPlayer.play(null, true);
                    break;
            }
        }, { once: true });
    }

    playMusicOnKeyDown();

    const canvas = document.createElement('canvas');

    const footer = document.getElementsByTagName('footer')[0];
    const footerContainer = footer.children[0];

    const w = footer.offsetWidth, h = footer.offsetHeight;

    Object.assign(canvas.style, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: w + 'px',
        height: h + 'px',
    });

    footer.style.setProperty('position', 'relative');
    footerContainer.style.setProperty('position', 'absolute');
    footerContainer.style.setProperty('left', '50%');
    footerContainer.style.setProperty('transform', 'translateX(-50%)');

    footer.prepend(canvas);

    SnakeGame.setCanvas(canvas);

    SnakeGame.updateConfig({
        gridSize,
        backgroundColor: window.getComputedStyle(footer).backgroundColor,
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

    SnakeGame.init(w, h);
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