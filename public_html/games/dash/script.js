// ============================================
// ゲーム設定
// ============================================
const CONFIG = {
    // キャンバス設定
    canvas: {
        width: 1200,
        height: 600
    },
    
    // プレイヤー設定
    player: {
        x: 100,
        y: 0,
        width: 40,
        height: 60,
        color: '#FF6B6B',
        jumpPower: 15,
        gravity: 0.6
    },
    
    // ゲーム設定
    game: {
        initialSpeed: 5,
        speedIncrement: 0.001,
        maxSpeed: 12,
        groundHeight: 100
    },
    
    // 障害物設定
    obstacle: {
        minGap: 1000,
        maxGap: 1500,
        minWidth: 30,
        maxWidth: 50,
        height: 50,
        color: '#4ECDC4'
    },
    
    // 地形設定
    terrain: {
        segmentWidth: 200,
        minHeight: 60,
        maxHeight: 150,
        pitWidth: 80, // 落とし穴の幅（ジャンプで飛び越えられるサイズ）
        pitProbability: 0.15, // 落とし穴の出現確率
        heightChangeProbability: 0.3 // 地面の高さ変化確率
    },
    
    // スコア設定
    score: {
        pointsPerFrame: 1,
        distanceMultiplier: 0.1
    }
};

// ============================================
// ゲーム状態管理
// ============================================
class GameState {
    constructor() {
        this.screen = 'title'; // 'title', 'game', 'gameover'
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.distance = 0;
        this.bestScore = this.loadBestScore();
        this.gameSpeed = CONFIG.game.initialSpeed;
    }
    
    loadBestScore() {
        return parseInt(localStorage.getItem('dashRunnerBestScore')) || 0;
    }
    
    saveBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('dashRunnerBestScore', this.bestScore);
        }
    }
    
    reset() {
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = CONFIG.game.initialSpeed;
        this.isPaused = false;
    }
}

// ============================================
// プレイヤークラス
// ============================================
class Player {
    constructor() {
        this.x = CONFIG.player.x;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.color = CONFIG.player.color;
        this.velocityY = 0;
        this.isJumping = false;
        this.groundY = CONFIG.canvas.height - CONFIG.game.groundHeight - this.height;
        this.y = this.groundY;
        this.currentGroundY = this.groundY;
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = -CONFIG.player.jumpPower;
            this.isJumping = true;
        }
    }
    
    update(currentGroundY) {
        // 重力を適用
        this.velocityY += CONFIG.player.gravity;
        this.y += this.velocityY;
        
        // 地面との衝突判定
        this.currentGroundY = currentGroundY;
        if (this.y >= this.currentGroundY) {
            this.y = this.currentGroundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }
    
    draw(ctx) {
        // プレイヤーを描画（シンプルな四角形）
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 目を描画
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 10, this.y + 15, 5, 5);
        ctx.fillRect(this.x + 25, this.y + 15, 5, 5);
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================
// 地形セグメントクラス
// ============================================
class TerrainSegment {
    constructor(x, height, isPit = false) {
        this.x = x;
        this.width = isPit ? CONFIG.terrain.pitWidth : CONFIG.terrain.segmentWidth;
        this.height = height;
        this.isPit = isPit;
        this.y = CONFIG.canvas.height - this.height;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    draw(ctx) {
        if (this.isPit) {
            // 落とし穴の描画（暗い穴）
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x, this.y + this.height, this.width, CONFIG.canvas.height - (this.y + this.height));
            
            // 穴の縁を強調
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x, CONFIG.canvas.height);
            ctx.moveTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + this.width, CONFIG.canvas.height);
            ctx.stroke();
        } else {
            // 通常の地面
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // 草
            ctx.fillStyle = '#228B22';
            ctx.fillRect(this.x, this.y, this.width, 10);
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    getTopY() {
        return this.isPit ? CONFIG.canvas.height : this.y;
    }
}

// ============================================
// 障害物クラス
// ============================================
class Obstacle {
    constructor(x, groundHeight = CONFIG.game.groundHeight) {
        this.x = x;
        this.width = Math.random() * (CONFIG.obstacle.maxWidth - CONFIG.obstacle.minWidth) + CONFIG.obstacle.minWidth;
        this.height = CONFIG.obstacle.height;
        this.groundHeight = groundHeight;
        this.y = CONFIG.canvas.height - groundHeight - this.height;
        this.color = CONFIG.obstacle.color;
        this.passed = false;
    }
    
    updatePosition(groundHeight) {
        // 地形の高さが変わった場合に障害物の位置を更新
        this.groundHeight = groundHeight;
        this.y = CONFIG.canvas.height - groundHeight - this.height;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 影を追加
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ============================================
// ゲームマネージャー
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.player = null;
        this.obstacles = [];
        this.terrainSegments = [];
        this.lastObstacleX = 0;
        this.lastTerrainX = 0;
        this.animationId = null;
        
        this.setupCanvas();
        this.setupEventListeners();
        this.showScreen('title');
    }
    
    setupCanvas() {
        this.canvas.width = CONFIG.canvas.width;
        this.canvas.height = CONFIG.canvas.height;
    }
    
    setupEventListeners() {
        // スタートボタン
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // リトライボタン
        document.getElementById('retry-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // タイトルへボタン
        document.getElementById('title-button').addEventListener('click', () => {
            this.showScreen('title');
        });
        
        document.getElementById('quit-button').addEventListener('click', () => {
            this.showScreen('title');
        });
        
        // 再開ボタン
        document.getElementById('resume-button').addEventListener('click', () => {
            this.togglePause();
        });
        
        // リスタートボタン
        document.getElementById('restart-button').addEventListener('click', () => {
            this.togglePause();
            this.startGame();
        });
        
        // ジャンプ操作（スペースキー）
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state.isPlaying && !this.state.isPaused) {
                e.preventDefault();
                this.player.jump();
            }
            
            // ESCで一時停止
            if (e.code === 'Escape' && this.state.isPlaying) {
                this.togglePause();
            }
        });
        
        // ジャンプ操作（クリック）
        this.canvas.addEventListener('click', () => {
            if (this.state.isPlaying && !this.state.isPaused) {
                this.player.jump();
            }
        });
    }
    
    showScreen(screen) {
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('gameover-screen').style.display = 'none';
        
        if (screen === 'title') {
            document.getElementById('title-screen').style.display = 'flex';
        } else if (screen === 'game') {
            document.getElementById('game-screen').style.display = 'block';
        } else if (screen === 'gameover') {
            document.getElementById('gameover-screen').style.display = 'flex';
            this.updateGameOverScreen();
        }
        
        this.state.screen = screen;
    }
    
    startGame() {
        this.state.reset();
        this.state.isPlaying = true;
        this.player = new Player();
        this.obstacles = [];
        this.terrainSegments = [];
        this.lastObstacleX = CONFIG.canvas.width;
        this.lastTerrainX = 0;
        
        // 初期地形を生成
        this.initializeTerrain();
        
        this.showScreen('game');
        this.gameLoop();
    }
    
    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        document.getElementById('pause-menu').style.display = this.state.isPaused ? 'flex' : 'none';
        
        if (!this.state.isPaused) {
            this.gameLoop();
        }
    }
    
    initializeTerrain() {
        // 画面を埋める初期地形を生成
        let x = 0;
        while (x < CONFIG.canvas.width + CONFIG.terrain.segmentWidth) {
            const segment = new TerrainSegment(x, CONFIG.game.groundHeight, false);
            this.terrainSegments.push(segment);
            x += CONFIG.terrain.segmentWidth;
        }
        this.lastTerrainX = x - CONFIG.terrain.segmentWidth;
    }
    
    spawnTerrain() {
        // 新しい地形セグメントを生成
        if (this.terrainSegments.length === 0 || 
            this.lastTerrainX < CONFIG.canvas.width + CONFIG.terrain.segmentWidth) {
            
            const lastSegment = this.terrainSegments[this.terrainSegments.length - 1];
            const newX = this.lastTerrainX + CONFIG.terrain.segmentWidth;
            
            // lastSegmentが存在しない場合は通常の地形を作成
            if (!lastSegment) {
                const segment = new TerrainSegment(newX, CONFIG.game.groundHeight, false);
                this.terrainSegments.push(segment);
                this.lastTerrainX = newX;
                return;
            }
            
            // 落とし穴を生成するか判定
            const shouldCreatePit = Math.random() < CONFIG.terrain.pitProbability;
            
            if (shouldCreatePit && !lastSegment.isPit) {
                // 落とし穴セグメント
                const pitSegment = new TerrainSegment(newX, 0, true);
                this.terrainSegments.push(pitSegment);
            } else {
                // 通常の地形（高さ変化の可能性あり）
                let newHeight = lastSegment.height;
                
                if (!lastSegment.isPit && Math.random() < CONFIG.terrain.heightChangeProbability) {
                    newHeight = Math.random() * (CONFIG.terrain.maxHeight - CONFIG.terrain.minHeight) + CONFIG.terrain.minHeight;
                }
                
                const segment = new TerrainSegment(newX, newHeight, false);
                this.terrainSegments.push(segment);
            }
            
            this.lastTerrainX = newX;
        }
    }
    
    getGroundYAtX(x) {
        // 指定されたX座標での地面のY座標を取得
        const playerHeight = this.player ? this.player.height : CONFIG.player.height;
        for (let segment of this.terrainSegments) {
            if (x >= segment.x && x < segment.x + segment.width) {
                return segment.getTopY() - playerHeight;
            }
        }
        return CONFIG.canvas.height - CONFIG.game.groundHeight - playerHeight;
    }
    
    isPlayerInPit() {
        // プレイヤーが落とし穴にいるか判定
        if (!this.player) return false;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        for (let segment of this.terrainSegments) {
            if (segment.isPit && 
                playerCenterX >= segment.x && 
                playerCenterX < segment.x + segment.width) {
                return true;
            }
        }
        return false;
    }
    
    spawnObstacle() {
        const gap = Math.random() * (CONFIG.obstacle.maxGap - CONFIG.obstacle.minGap) + CONFIG.obstacle.minGap;
        
        if (this.obstacles.length === 0 || this.lastObstacleX + gap < CONFIG.canvas.width) {
            // 障害物が生成される位置の地形の高さを取得
            let groundHeight = CONFIG.game.groundHeight;
            for (let segment of this.terrainSegments) {
                if (CONFIG.canvas.width >= segment.x && 
                    CONFIG.canvas.width < segment.x + segment.width && 
                    !segment.isPit) {
                    groundHeight = segment.height;
                    break;
                }
            }
            
            // 落とし穴の上には障害物を生成しない
            let shouldSpawn = true;
            for (let segment of this.terrainSegments) {
                if (segment.isPit && 
                    CONFIG.canvas.width >= segment.x - 100 && 
                    CONFIG.canvas.width < segment.x + segment.width + 100) {
                    shouldSpawn = false;
                    break;
                }
            }
            
            if (shouldSpawn) {
                const obstacle = new Obstacle(CONFIG.canvas.width, groundHeight);
                this.obstacles.push(obstacle);
                this.lastObstacleX = CONFIG.canvas.width;
            } else {
                // 落とし穴付近なので次の機会に
                this.lastObstacleX = CONFIG.canvas.width - gap / 2;
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    update() {
        if (!this.state.isPlaying || this.state.isPaused) return;
        if (!this.player) return;
        
        // 地形生成
        this.spawnTerrain();
        
        // 地形更新
        this.terrainSegments.forEach(segment => {
            segment.update(this.state.gameSpeed);
        });
        
        // 画面外の地形を削除
        this.terrainSegments = this.terrainSegments.filter(segment => !segment.isOffScreen());
        
        // プレイヤーの現在地の地面の高さを取得
        const groundY = this.getGroundYAtX(this.player.x + this.player.width / 2);
        
        // プレイヤー更新
        this.player.update(groundY);
        
        // 落とし穴に落ちたかチェック
        if (this.isPlayerInPit()) {
            // プレイヤーが穴の下端まで落ちたらゲームオーバー
            if (this.player.y + this.player.height > CONFIG.canvas.height - 50) {
                this.gameOver();
                return;
            }
        }
        
        // ゲームスピード増加
        if (this.state.gameSpeed < CONFIG.game.maxSpeed) {
            this.state.gameSpeed += CONFIG.game.speedIncrement;
        }
        
        // 障害物生成
        this.spawnObstacle();
        
        // 障害物更新
        this.obstacles.forEach(obstacle => {
            obstacle.update(this.state.gameSpeed);
            
            // 衝突判定
            if (this.checkCollision(this.player.getBounds(), obstacle.getBounds())) {
                this.gameOver();
            }
            
            // スコア加算（障害物を通過したとき）
            if (!obstacle.passed && obstacle.x + obstacle.width < this.player.x) {
                obstacle.passed = true;
                this.state.score += 10;
            }
        });
        
        // 画面外の障害物を削除
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffScreen());
        
        // 距離更新
        this.state.distance += this.state.gameSpeed * CONFIG.score.distanceMultiplier;
        this.state.score += CONFIG.score.pointsPerFrame;
        
        // UI更新
        this.updateUI();
    }
    
    draw() {
        // 背景をクリア
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 雲を描画
        this.drawClouds();
        
        // 地形を描画
        this.terrainSegments.forEach(segment => segment.draw(this.ctx));
        
        // 障害物を描画
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        
        // プレイヤーを描画
        if (this.player) {
            this.player.draw(this.ctx);
        }
    }
    

    
    drawClouds() {
        // 簡易的な雲の描画（装飾）
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const cloudOffset = (Date.now() * 0.01) % (this.canvas.width + 200);
        
        this.drawCloud(cloudOffset - 200, 50);
        this.drawCloud(cloudOffset + 200, 100);
        this.drawCloud(cloudOffset + 600, 80);
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.state.score);
        document.getElementById('distance').textContent = Math.floor(this.state.distance);
    }
    
    updateGameOverScreen() {
        document.getElementById('final-score').textContent = Math.floor(this.state.score);
        document.getElementById('final-distance').textContent = Math.floor(this.state.distance);
        document.getElementById('best-score').textContent = this.state.bestScore;
    }
    
    gameOver() {
        this.state.isPlaying = false;
        this.state.saveBestScore();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        setTimeout(() => {
            this.showScreen('gameover');
        }, 500);
    }
    
    gameLoop() {
        if (!this.state.isPlaying || this.state.isPaused) return;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================
// ゲーム初期化
// ============================================
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
