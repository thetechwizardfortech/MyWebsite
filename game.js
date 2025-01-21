const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const aspectRatio = 320 / 480;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let bird = {
    x: 50,
    y: 150,
    width: 20,
    height: 20,
    gravity: 0.6,
    lift: -10, // Less intense jump
    velocity: 0
};

let pipes = [];
let frame = 0;
let score = 0;
let gameOver = false;
let level = 1;
let nextLevelScore = 10; // Points needed for the next level
let powerUps = [];
let powerUpActive = false;
let powerUpDuration = 300; // Duration of power-up effect in frames

const deathSound = document.getElementById('deathSound');

document.addEventListener('keydown', (event) => {
    if (['Space', 'KeyW', 'ArrowUp'].includes(event.code)) {
        if (!gameOver) {
            bird.velocity = bird.lift;
        } else {
            restartGame();
        }
    }
});

function drawBird() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

function drawPipes() {
    ctx.fillStyle = 'green';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    });
}

function drawPowerUps() {
    ctx.fillStyle = 'blue';
    powerUps.forEach(powerUp => {
        ctx.fillRect(powerUp.x, powerUp.y, bird.width, bird.height); // Same size as the bird
    });
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver = true;
        deathSound.play();
    }
}

function updatePipes() {
    if (frame % 90 === 0) {
        let pipeHeight = Math.floor(Math.random() * (canvas.height / 2));
        pipes.push({
            x: canvas.width,
            width: 40, // Thicker pipes
            top: pipeHeight,
            bottom: canvas.height - pipeHeight - 350 // Larger gap
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= 2;
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

function updatePowerUps() {
    if (score % 5 === 0 && score !== 0 && powerUps.length === 0) { // Add a power-up every 5 points
        let pipe = pipes.find(pipe => pipe.x > canvas.width / 2);
        if (pipe) {
            powerUps.push({
                x: pipe.x + pipe.width / 2 - bird.width / 2, // Middle of the pipe
                y: (canvas.height - pipe.bottom - pipe.top) / 2 + pipe.top - bird.height / 2, // Middle of the gap
                size: bird.width
            });
        }
    }

    powerUps.forEach(powerUp => {
        powerUp.x -= 2;
    });

    powerUps = powerUps.filter(powerUp => powerUp.x + powerUp.size > 0);
}

function checkCollision() {
    pipes.forEach(pipe => {
        if (bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) {
            gameOver = true;
            deathSound.play();
        } else if (pipe.x + pipe.width < bird.x && !pipe.passed) {
            pipe.passed = true;
            score++;
        }
    });

    powerUps.forEach((powerUp, index) => {
        if (bird.x < powerUp.x + bird.width &&
            bird.x + bird.width > powerUp.x &&
            bird.y < powerUp.y + bird.height &&
            bird.y + bird.height > powerUp.y) {
            powerUps.splice(index, 1);
            activatePowerUp();
        }
    });
}

function activatePowerUp() {
    powerUpActive = true;
    let pipesToRemove = pipes.filter(pipe => pipe.x > bird.x).slice(0, 10); // Remove 10 pipes in front of the bird
    pipes = pipes.filter(pipe => !pipesToRemove.includes(pipe));
    setTimeout(() => {
        powerUpActive = false;
    }, powerUpDuration * 16.67); // Convert frames to milliseconds
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Level: ${level}`, 10, 50);
}

function restartGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    powerUps = [];
    score = 0;
    frame = 0;
    level = 1;
    nextLevelScore = 10;
    gameOver = false;
    document.getElementById('restartButton').style.display = 'none';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        frame++;
        updateBird();
        updatePipes();
        updatePowerUps();
        checkCollision();
        drawBird();
        drawPipes();
        drawPowerUps();
        drawScore();

        if (frame % 90 === 0 && pipes.some(pipe => pipe.passed)) {
            score++;
        }

        if (score >= nextLevelScore) {
            level++;
            nextLevelScore += level * 10; // Increase points needed for the next level
        }
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60); // Move up
        document.getElementById('restartButton').style.display = 'block';
    }

    requestAnimationFrame(gameLoop);
}

document.getElementById('restartButton').addEventListener('click', restartGame);

document.addEventListener('keydown', (event) => {
    if (event.code === 'F11') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
});

gameLoop();
