async function main() {
    console.log("main function called") // log debugging
    let canvas = document.getElementById("gameCanvas");
    let ctx = canvas.getContext("2d");
    
    // Load images
    const birdImg = new Image();
    const skyscraperImg = new Image();
    const backgroundImg = new Image();
    
    birdImg.src = 'angrybird.jpg';
    skyscraperImg.src = 'skyscraper.png';
    backgroundImg.src = 'background.jpeg';
    
    // Wait for images to load (with error handling)
    await Promise.all([
        new Promise(resolve => {
            birdImg.onload = resolve;
            birdImg.onerror = () => {
                console.log("Bird image failed to load, using fallback");
                resolve();
            };
        }),
        new Promise(resolve => {
            skyscraperImg.onload = resolve;
            skyscraperImg.onerror = () => {
                console.log("Skyscraper image failed to load, using fallback");
                resolve();
            };
        }),
        new Promise(resolve => {
            backgroundImg.onload = resolve;
            backgroundImg.onerror = () => {
                console.log("Background image failed to load, using fallback");
                resolve();
            };
        })
    ]);
    
    // Game state
    let gameRunning = true;
    let score = 0;
    
    // Bird variables
    let y = 0;
    let yVelocity = 0;
    let yAcc = 9.8;

    // Tower variables
    let towers = [
        { x: 800, passed: false, height: 250 }
    ];
    const TOWER_WIDTH = 50;
    const TOWER_SPACING = 300; // Distance between towers
    const GAP_SIZE = 400; // Fixed gap between top and bottom towers
    const BIRD_WIDTH = 100;
    const BIRD_HEIGHT = 100;
    const BIRD_X = 10;

    function checkCollision() {
        // Bird boundaries
        const birdLeft = BIRD_X;
        const birdRight = BIRD_X + BIRD_WIDTH;
        const birdTop = y;
        const birdBottom = y + BIRD_HEIGHT;

        // Check collision with all towers
        for (let tower of towers) {
            // Top tower boundaries
            const topTowerLeft = tower.x;
            const topTowerRight = tower.x + TOWER_WIDTH;
            const topTowerTop = 0;
            const topTowerBottom = tower.height;

            // Bottom tower boundaries
            const bottomTowerLeft = tower.x;
            const bottomTowerRight = tower.x + TOWER_WIDTH;
            const bottomTowerTop = 900 - tower.height;
            const bottomTowerBottom = 900;

            // Check collision with top tower
            if (birdRight > topTowerLeft && birdLeft < topTowerRight &&
                birdBottom > topTowerTop && birdTop < topTowerBottom) {
                return true;
            }

            // Check collision with bottom tower
            if (birdRight > bottomTowerLeft && birdLeft < bottomTowerRight &&
                birdBottom > bottomTowerTop && birdTop < bottomTowerBottom) {
                return true;
            }
        }

        // Check collision with canvas boundaries
        if (birdTop < 0 || birdBottom > 900) {
            return true;
        }

        return false;
    }

    function restartGame() {
        console.log("Restarting game...");
        y = 0;
        yVelocity = 0;
        towers = [{ x: 800, passed: false, height: 250 }];
        score = 0;
        gameRunning = true;
        console.log("Game restarted! Bird Y: " + y + ", Towers: " + towers.length + ", Game Running: " + gameRunning);
    }

    document.onkeydown = function(event) {
        if (gameRunning) {
            yVelocity = -50;
        } else if (event.code === 'Space') {
            restartGame();
        }
    }

    // Game loop
    while (true) {
        if (gameRunning) {
            // Update bird physics
            yVelocity = yVelocity + 0.33 * yAcc;
            y = y + yVelocity * 0.33;
            
            // Check for collision
            if (checkCollision()) {
                gameRunning = false;
                console.log("Game Over! Press Space to restart.");
            }
            
            // Move all towers
            for (let tower of towers) {
                tower.x -= 10;
            }
            
            // Remove towers that are off screen
            towers = towers.filter(tower => tower.x > -TOWER_WIDTH);
            
            // Add new tower if needed
            if (towers.length === 0 || towers[towers.length - 1].x < 1600 - TOWER_SPACING) {
                // Generate random tower height with ±50px variation
                const lastHeight = towers.length > 0 ? towers[towers.length - 1].height : 250;
                const variation = Math.floor(Math.random() * 101) - 50; // -50 to +50
                const newHeight = Math.max(200, Math.min(300, lastHeight + variation)); // Keep between 200-300px
                
                towers.push({ x: 1600, passed: false, height: newHeight });
            }
            
            // Check for score increase when bird passes a tower
            for (let tower of towers) {
                if (!tower.passed && BIRD_X + BIRD_WIDTH > tower.x + TOWER_WIDTH) {
                    tower.passed = true;
                    score++;
                    console.log("Score: " + score);
                }
            }
        }
        
        // Draw background
        if (backgroundImg.complete && backgroundImg.naturalWidth !== 0) {
            ctx.drawImage(backgroundImg, 0, 0, 1600, 900);
        } else {
            // Fallback background
            const gradient = ctx.createLinearGradient(0, 0, 0, 900);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1600, 900);
            
            // Draw some clouds
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(200, 150, 40, 0, Math.PI * 2);
            ctx.arc(240, 150, 30, 0, Math.PI * 2);
            ctx.arc(280, 150, 35, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw bird if game is running
        if (gameRunning) {
            if (birdImg.complete && birdImg.naturalWidth !== 0) {
                ctx.drawImage(birdImg, BIRD_X, y, BIRD_WIDTH, BIRD_HEIGHT);
            } else {
                // Fallback bird
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(BIRD_X, y, BIRD_WIDTH, BIRD_HEIGHT);
                ctx.fillStyle = '#FF6347';
                ctx.fillRect(BIRD_X + 70, y + 20, 20, 20);
            }
        }
        
        // Draw all towers
        for (let tower of towers) {
            // Tower boundaries are now invisible (removed white rectangles and red borders)
            
            if (skyscraperImg.complete && skyscraperImg.naturalWidth !== 0) {
                // Keep the width calculation that was working, but stretch height to fill tower
                const imgAspectRatio = skyscraperImg.naturalWidth / skyscraperImg.naturalHeight;
                
                // Calculate width the way it was working before (centered)
                const drawWidth = 250 * imgAspectRatio; // Use base height for width calculation
                const drawX = tower.x + (TOWER_WIDTH - drawWidth) / 2;
                
                // Calculate skyscraper height based on tower height variation
                const heightVariation = tower.height - 250; // Difference from base 250px
                const skyscraperHeight = 300 + heightVariation; // Base 300px + variation
                
                // Draw top skyscraper (flipped vertically)
                ctx.save();
                ctx.translate(drawX + drawWidth/2, skyscraperHeight/2);
                ctx.scale(1, -1);
                ctx.drawImage(skyscraperImg, -drawWidth/2, -skyscraperHeight/2, drawWidth, skyscraperHeight);
                ctx.restore();
                
                // Draw bottom skyscraper (normal orientation)
                ctx.drawImage(skyscraperImg, drawX, 900 - skyscraperHeight, drawWidth, skyscraperHeight);
            }
        }
        
        // Draw score during gameplay
        if (gameRunning) {
            ctx.fillStyle = "white";
            ctx.font = "48px Arial";
            ctx.fillText("My Score: " + score, 50, 100);
        }
        
        // Draw watermark
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "18px Arial";
        ctx.fillText("A clone of Flappy bird made using JS", 1100, 870);
        
        // Draw game over screen if not running
        if (!gameRunning) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, 1600, 900);
            
            ctx.fillStyle = "white";
            ctx.font = "72px Arial";
            ctx.fillText("GAME OVER", 600, 400);
            ctx.font = "36px Arial";
            ctx.fillText("Final Score: " + score, 600, 450);
            ctx.fillText("Press Space to Restart", 600, 500);
        }

        // Wait for next frame
        await new Promise(resolve => setTimeout(resolve, 33)); // ~30 FPS
    }
}

main();
