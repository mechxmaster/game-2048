class Game2048 {
    constructor() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
        this.gameContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameMessage = document.getElementById('game-message');
        this.messageText = document.getElementById('message-text');
        this.isGameOver = false;

        this.init();
    }

    init() {
        this.updateScore(0);
        this.bestScoreElement.textContent = this.bestScore;
        this.setupEventListeners();
        this.newGame();
    }

    newGame() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.updateScore(0);
        this.isGameOver = false;
        this.gameMessage.classList.remove('active', 'win');
        this.gameContainer.innerHTML = '';
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return true;
        }
        return false;
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            
            let moved = false;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    moved = this.moveUp();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    moved = this.moveDown();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    moved = this.moveLeft();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    moved = this.moveRight();
                    break;
            }

            if (moved) {
                this.afterMove();
            }
        });

        // Touch controls (Swipe)
        let touchStartX, touchStartY;
        window.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (this.isGameOver) return;
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 30) { // Threshold for swipe
                let moved = false;
                if (absDx > absDy) {
                    if (dx > 0) moved = this.moveRight();
                    else moved = this.moveLeft();
                } else {
                    if (dy > 0) moved = this.moveDown();
                    else moved = this.moveUp();
                }

                if (moved) {
                    this.afterMove();
                }
            }
            touchStartX = touchStartY = null;
        }, { passive: true });

        // Buttons
        document.getElementById('restart-btn').addEventListener('click', () => this.newGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.newGame());
    }

    afterMove() {
        this.addRandomTile();
        this.render();
        if (this.checkWin()) {
            this.showGameMessage('You Win!', true);
        } else if (this.checkGameOver()) {
            this.showGameMessage('Game Over!', false);
        }
    }

    moveLeft() {
        return this.move((row) => {
            const newRow = row.filter(val => val !== 0);
            for (let i = 0; i < newRow.length - 1; i++) {
                if (newRow[i] === newRow[i + 1]) {
                    newRow[i] *= 2;
                    this.updateScore(newRow[i]);
                    newRow.splice(i + 1, 1);
                }
            }
            while (newRow.length < 4) newRow.push(0);
            return newRow;
        });
    }

    moveRight() {
        return this.move((row) => {
            const newRow = row.filter(val => val !== 0);
            for (let i = newRow.length - 1; i > 0; i--) {
                if (newRow[i] === newRow[i - 1]) {
                    newRow[i] *= 2;
                    this.updateScore(newRow[i]);
                    newRow.splice(i - 1, 1);
                    i--;
                }
            }
            while (newRow.length < 4) newRow.unshift(0);
            return newRow;
        });
    }

    moveUp() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
            const newCol = this.compress(col);
            if (JSON.stringify(col) !== JSON.stringify(newCol)) moved = true;
            for (let r = 0; r < 4; r++) this.grid[r][c] = newCol[r];
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let c = 0; c < 4; c++) {
            const col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
            const newCol = this.compressReverse(col);
            if (JSON.stringify(col) !== JSON.stringify(newCol)) moved = true;
            for (let r = 0; r < 4; r++) this.grid[r][c] = newCol[r];
        }
        return moved;
    }

    move(callback) {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const oldRow = [...this.grid[r]];
            this.grid[r] = callback(this.grid[r]);
            if (JSON.stringify(oldRow) !== JSON.stringify(this.grid[r])) moved = true;
        }
        return moved;
    }

    compress(line) {
        const newLine = line.filter(val => val !== 0);
        for (let i = 0; i < newLine.length - 1; i++) {
            if (newLine[i] === newLine[i + 1]) {
                newLine[i] *= 2;
                this.updateScore(newLine[i]);
                newLine.splice(i + 1, 1);
            }
        }
        while (newLine.length < 4) newLine.push(0);
        return newLine;
    }

    compressReverse(line) {
        const newLine = line.filter(val => val !== 0);
        for (let i = newLine.length - 1; i > 0; i--) {
            if (newLine[i] === newLine[i - 1]) {
                newLine[i] *= 2;
                this.updateScore(newLine[i]);
                newLine.splice(i - 1, 1);
                i--;
            }
        }
        while (newLine.length < 4) newLine.unshift(0);
        return newLine;
    }

    updateScore(points) {
        this.score += points;
        this.scoreElement.textContent = this.score;
        if (points > 0) {
            const addition = document.getElementById('score-addition');
            addition.textContent = `+${points}`;
            addition.style.animation = 'none';
            void addition.offsetWidth; // trigger reflow
            addition.style.animation = 'moveUp 0.6s ease-in';
        }
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreElement.textContent = this.bestScore;
            localStorage.setItem('2048-best-score', this.bestScore);
        }
    }

    checkWin() {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 2048) return true;
            }
        }
        return false;
    }

    checkGameOver() {
        // Check for empty cells
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        // Check for possible merges
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.grid[r][c];
                if (r < 3 && val === this.grid[r + 1][c]) return false;
                if (c < 3 && val === this.grid[r][c + 1]) return false;
            }
        }
        return true;
    }

    showGameMessage(text, isWin) {
        this.isGameOver = true;
        this.messageText.textContent = text;
        this.gameMessage.classList.add('active');
        if (isWin) this.gameMessage.classList.add('win');
    }

    render() {
        this.gameContainer.innerHTML = '';
        const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap'));

        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const val = this.grid[r][c];
                if (val !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${val}`;
                    if (val > 2048) tile.classList.add('tile-super');
                    tile.textContent = val;
                    
                    const x = c * (cellSize + gap) + gap;
                    const y = r * (cellSize + gap) + gap;
                    
                    tile.style.transform = `translate(${x}px, ${y}px)`;
                    this.gameContainer.appendChild(tile);
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
