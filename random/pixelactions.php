<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Pixel Adventure</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');

        body {
            margin: 0;
            padding: 0;
            background-color: #222;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: 'DotGothic16', sans-serif;
            color: white;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
        }

        #game-container {
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }

        canvas {
            background-color: #87CEEB; /* Sky Blue */
            display: block;
            image-rendering: pixelated; /* ドット絵をくっきり表示 */
        }

        /* UI Overlay */
        #ui-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .hud {
            padding: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            text-shadow: 2px 2px 0 #000;
        }

        .heart { color: #e74c3c; }
        .life-icon { color: #3498db; }

        #message-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            text-align: center;
        }

        h1 { font-size: 40px; margin: 0 0 20px 0; color: #f1c40f; text-shadow: 4px 4px 0 #000; }
        p { font-size: 24px; margin: 10px 0; text-shadow: 2px 2px 0 #000; }
        .blink { animation: blinker 1s linear infinite; }

        @keyframes blinker {
            50% { opacity: 0; }
        }

        /* Touch Controls */
        #controls {
            display: none; /* JSでモバイルの場合のみ表示 */
            width: 100%;
            max-width: 640px;
            margin-top: 10px;
            justify-content: space-between;
            padding: 0 20px;
            box-sizing: border-box;
        }

        .btn {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            touch-action: manipulation;
        }
        .btn:active { background: rgba(255, 255, 255, 0.5); }

        .d-pad { display: flex; gap: 10px; }
        .action-btn { margin-left: auto; }

        @media (hover: none) and (pointer: coarse) {
            #controls { display: flex; }
        }
    </style>
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="640" height="352"></canvas>
        
        <div id="ui-layer">
            <div class="hud">
                <div id="hud-lives">PLAYER: 3</div>
                <div id="hud-hp">LIFE: ♥♥♥</div>
                <div id="hud-stage">STAGE 1</div>
            </div>
        </div>

        <div id="message-screen">
            <h1 id="title-text">PIXEL ADVENTURE</h1>
            <p id="sub-text" class="blink">PRESS SPACE TO START</p>
            <p style="font-size: 14px; margin-top: 30px; color: #ccc;">操作: 矢印キー移動 / スペース ジャンプ</p>
        </div>
    </div>

    <div id="controls">
        <div class="d-pad">
            <div class="btn" id="btn-left">←</div>
            <div class="btn" id="btn-right">→</div>
        </div>
        <div class="action-btn">
            <div class="btn" id="btn-jump">JUMP</div>
        </div>
    </div>

<script>
/* IIFEを使用してスコープを分離し、再宣言エラーを防ぐ */
(() => {

/**
 * ゲーム定数と設定
 * 画面サイズを拡大 (320x240 -> 640x352)
 * ステージ幅を拡大 (20マス -> 40マス)
 */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 352; // 16 * 22 tiles
const TILE_SIZE = 16;
const GRAVITY = 0.5;
const JUMP_FORCE = -8.5;
const SPEED = 2.0;
const ENEMY_SPEED = 1.0;
const INVINCIBLE_TIME = 60; // フレーム数 (約1秒)

// タイルID定義
const T = {
    EMPTY: 0,
    WALL: 1,
    START: 2,
    GOAL: 3,
    SPIKE: 4,
    ENEMY_WALK: 5 // 配置用マーカー
};

/**
 * オーディオ管理 (Web Audio API)
 * グローバル変数を汚染しないようにここで定義
 * 再ロード時のコンテキスト制限対策としてwindowプロパティを使用する場合もあるが、
 * 今回は単純化のためクロージャ内で管理
 */
const getAudioCtx = () => {
    // 既存のコンテキストがあれば再利用（ブラウザの制限回避）
    if (!window.sharedGameAudioCtx) {
        window.sharedGameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window.sharedGameAudioCtx;
};

const playSound = (type) => {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    switch (type) {
        case 'jump':
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'coin': // Goal
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.setValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'hit':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'die':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
    }
};

/**
 * マップデータ (3ステージ)
 * サイズ変更: 40 tiles (width) x 22 tiles (height)
 */
const levels = [
    // Level 1: Wide Basic
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1],
        [1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    // Level 2: Wide Adventure
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
        [1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
        [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,0,0,0,0,5,0,0,0,1,1,1,0,0,0,0,5,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1],
        [1,1,4,4,4,4,4,1,1,1,1,1,1,1,4,4,4,4,4,4,4,1,1,1,1,1,1,4,4,4,4,4,4,4,1,1,4,4,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    // Level 3: Wide Hard
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,2,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,1,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    ],
];

/**
 * ゲームクラス
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'TITLE'; // TITLE, PLAYING, LEVEL_DONE, GAME_OVER, ALL_CLEAR
        this.levelIndex = 0;
        this.map = []; // 最初は空配列
        this.tiles = [];
        
        this.player = {
            x: 0, y: 0, width: 12, height: 12,
            vx: 0, vy: 0,
            color: '#3498db',
            hp: 3,
            lives: 3,
            isGrounded: false,
            invincibleTimer: 0,
            facingRight: true
        };
        
        this.enemies = [];
        this.particles = [];

        this.keys = { left: false, right: false, up: false };
        this.animationFrameId = null;
        
        this.initInput();
        this.loop = this.loop.bind(this);
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    initInput() {
        // PC Controls
        const onKeyDown = (e) => {
            if(e.code === 'Space' || e.code === 'ArrowUp') this.keys.up = true;
            if(e.code === 'ArrowLeft') this.keys.left = true;
            if(e.code === 'ArrowRight') this.keys.right = true;
            
            // Start Game
            if (this.state !== 'PLAYING' && e.code === 'Space') {
                this.handleScreenClick();
            }
        };
        
        const onKeyUp = (e) => {
            if(e.code === 'Space' || e.code === 'ArrowUp') this.keys.up = false;
            if(e.code === 'ArrowLeft') this.keys.left = false;
            if(e.code === 'ArrowRight') this.keys.right = false;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        // Touch Controls
        const bindTouch = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            // クローンしてイベントリスナーをリセット（簡易的な多重登録防止）
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            
            newEl.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            newEl.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
        };
        bindTouch('btn-left', 'left');
        bindTouch('btn-right', 'right');
        bindTouch('btn-jump', 'up');

        // Screen tap to start
        const msgScreen = document.getElementById('message-screen');
        if (msgScreen) {
            const newMsgScreen = msgScreen.cloneNode(true);
            msgScreen.parentNode.replaceChild(newMsgScreen, msgScreen);
            newMsgScreen.addEventListener('touchstart', () => this.handleScreenClick());
            newMsgScreen.addEventListener('click', () => this.handleScreenClick());
        }
    }

    handleScreenClick() {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        
        if (this.state === 'TITLE') {
            this.startLevel(0);
            this.player.lives = 3;
            this.updateHud();
        } else if (this.state === 'GAME_OVER' || this.state === 'ALL_CLEAR') {
            this.state = 'TITLE';
            this.showMessage('PIXEL ADVENTURE', 'PRESS START');
        }
    }

    startLevel(index) {
        this.levelIndex = index;
        this.loadMap(levels[index]);
        this.player.hp = 3;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.invincibleTimer = 0;
        this.state = 'PLAYING';
        this.hideMessage();
        this.updateHud();
    }

    loadMap(data) {
        this.map = [];
        this.enemies = [];
        // Deep copy and parse
        for (let y = 0; y < data.length; y++) {
            const row = [];
            for (let x = 0; x < data[y].length; x++) {
                let tile = data[y][x];
                if (tile === T.START) {
                    this.player.x = x * TILE_SIZE + (TILE_SIZE - this.player.width)/2;
                    this.player.y = y * TILE_SIZE;
                    tile = T.EMPTY;
                } else if (tile === T.ENEMY_WALK) {
                    this.enemies.push({
                        x: x * TILE_SIZE, y: y * TILE_SIZE,
                        width: 14, height: 14,
                        vx: ENEMY_SPEED, vy: 0,
                        type: 'walker'
                    });
                    tile = T.EMPTY;
                }
                row.push(tile);
            }
            this.map.push(row);
        }
    }

    resetPlayerPos() {
        // Reload current level config to find start pos
        const data = levels[this.levelIndex];
        for (let y = 0; y < data.length; y++) {
            for (let x = 0; x < data[y].length; x++) {
                if (data[y][x] === T.START) {
                    this.player.x = x * TILE_SIZE + (TILE_SIZE - this.player.width)/2;
                    this.player.y = y * TILE_SIZE;
                    this.player.vx = 0;
                    this.player.vy = 0;
                }
            }
        }
        this.player.hp = 3;
        this.player.invincibleTimer = INVINCIBLE_TIME;
        this.updateHud();
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // --- Player Logic ---
        
        // Horizontal Move
        if (this.keys.left) {
            this.player.vx = -SPEED;
            this.player.facingRight = false;
        } else if (this.keys.right) {
            this.player.vx = SPEED;
            this.player.facingRight = true;
        } else {
            this.player.vx = 0;
        }

        // Jump
        if (this.keys.up && this.player.isGrounded) {
            this.player.vy = JUMP_FORCE;
            this.player.isGrounded = false;
            playSound('jump');
        }

        // Apply Gravity
        this.player.vy += GRAVITY;

        // Apply Velocity X & Collision
        this.player.x += this.player.vx;
        this.checkCollision('x');

        // Apply Velocity Y & Collision
        this.player.y += this.player.vy;
        this.player.isGrounded = false; // Assume air until collision
        this.checkCollision('y');

        // Screen Bounds
        if (this.player.y > CANVAS_HEIGHT) {
            this.takeLife();
        }

        // Invincibility
        if (this.player.invincibleTimer > 0) this.player.invincibleTimer--;

        // --- Enemy Logic ---
        this.enemies.forEach(enemy => {
            enemy.vy += GRAVITY;
            enemy.x += enemy.vx;
            
            // Enemy Map Collision X
            if (this.isSolid(enemy.x, enemy.y) || this.isSolid(enemy.x + enemy.width, enemy.y)) {
                enemy.vx *= -1;
            }
            // Enemy Floor Detection (turn around at ledges)
            // Check tile below ahead
            const checkX = enemy.vx > 0 ? enemy.x + enemy.width : enemy.x;
            if (!this.isSolid(checkX, enemy.y + enemy.height + 1)) {
                enemy.vx *= -1;
            }

            enemy.y += enemy.vy;
            // Enemy Map Collision Y
            if (this.isSolid(enemy.x, enemy.y + enemy.height)) {
                enemy.y = Math.floor((enemy.y + enemy.height) / TILE_SIZE) * TILE_SIZE - enemy.height;
                enemy.vy = 0;
            }

            // Player vs Enemy
            if (this.checkRectCollide(this.player, enemy)) {
                // Mario style stomp? No, simple collision for now unless jumping
                if (this.player.vy > 0 && this.player.y + this.player.height < enemy.y + enemy.height / 2) {
                    // Stomp
                    enemy.y = 1000; // Kill enemy
                    this.player.vy = JUMP_FORCE * 0.5;
                    playSound('hit');
                } else {
                    this.takeDamage();
                }
            }
        });
    }

    checkCollision(axis) {
        const p = this.player;
        // 4 corners
        const tl = this.getTileAt(p.x, p.y);
        const tr = this.getTileAt(p.x + p.width - 0.1, p.y);
        const bl = this.getTileAt(p.x, p.y + p.height - 0.1);
        const br = this.getTileAt(p.x + p.width - 0.1, p.y + p.height - 0.1);

        const corners = [tl, tr, bl, br];

        // Check Spikes
        if (corners.some(t => t === T.SPIKE)) {
            this.takeDamage();
        }
        
        // Check Goal
        if (corners.some(t => t === T.GOAL)) {
            this.levelComplete();
            return;
        }

        // Solid Collision
        if (axis === 'x') {
            if (p.vx > 0) { // Moving Right
                if (this.isSolidTile(tr) || this.isSolidTile(br)) {
                    p.x = (Math.floor((p.x + p.width) / TILE_SIZE)) * TILE_SIZE - p.width;
                    p.vx = 0;
                }
            } else if (p.vx < 0) { // Moving Left
                if (this.isSolidTile(tl) || this.isSolidTile(bl)) {
                    p.x = (Math.floor(p.x / TILE_SIZE) + 1) * TILE_SIZE;
                    p.vx = 0;
                }
            }
        } else { // axis === 'y'
            if (p.vy > 0) { // Falling
                if (this.isSolidTile(bl) || this.isSolidTile(br)) {
                    p.y = Math.floor((p.y + p.height) / TILE_SIZE) * TILE_SIZE - p.height;
                    p.vy = 0;
                    p.isGrounded = true;
                }
            } else if (p.vy < 0) { // Jumping Up
                if (this.isSolidTile(tl) || this.isSolidTile(tr)) {
                    p.y = (Math.floor(p.y / TILE_SIZE) + 1) * TILE_SIZE;
                    p.vy = 0;
                }
            }
        }
    }

    isSolidTile(t) { return t === T.WALL; }
    isSolid(x, y) {
        const t = this.getTileAt(x, y);
        return t === T.WALL;
    }

    getTileAt(x, y) {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        // マップ範囲チェックを新しいサイズに合わせる (40x22)
        if (ty < 0 || ty >= 22 || tx < 0 || tx >= 40) return T.EMPTY;
        // マップデータがない場合の安全策
        if (!this.map || !this.map[ty]) return T.EMPTY;
        return this.map[ty][tx];
    }

    checkRectCollide(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    takeDamage() {
        if (this.player.invincibleTimer > 0) return;
        
        playSound('hit');
        this.player.hp--;
        this.player.invincibleTimer = INVINCIBLE_TIME;
        this.updateHud();
        
        // Knockback
        this.player.vy = -4;
        this.player.vx = this.player.facingRight ? -4 : 4;

        if (this.player.hp <= 0) {
            this.takeLife();
        }
    }

    takeLife() {
        playSound('die');
        this.player.lives--;
        this.updateHud();
        
        if (this.player.lives < 0) {
            this.gameOver();
        } else {
            this.resetPlayerPos();
        }
    }

    levelComplete() {
        playSound('coin');
        if (this.levelIndex < levels.length - 1) {
            this.startLevel(this.levelIndex + 1);
        } else {
            this.state = 'ALL_CLEAR';
            this.showMessage('CONGRATULATIONS!', 'ALL STAGES CLEARED!');
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.showMessage('GAME OVER', 'TRY AGAIN');
    }

    updateHud() {
        document.getElementById('hud-lives').innerText = `PLAYER: ${Math.max(0, this.player.lives)}`;
        let hearts = '';
        for(let i=0; i<this.player.hp; i++) hearts += '♥';
        document.getElementById('hud-hp').innerHTML = `LIFE: <span class="heart">${hearts}</span>`;
        document.getElementById('hud-stage').innerText = `STAGE ${this.levelIndex + 1}`;
    }

    showMessage(title, sub) {
        const sc = document.getElementById('message-screen');
        document.getElementById('title-text').innerText = title;
        document.getElementById('sub-text').innerText = sub;
        sc.style.display = 'flex';
    }

    hideMessage() {
        document.getElementById('message-screen').style.display = 'none';
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Map
        // マップデータがロードされている場合のみ描画する
        if (this.map && this.map.length > 0) {
            for (let y = 0; y < 22; y++) { // Height 22
                for (let x = 0; x < 40; x++) { // Width 40
                    if (!this.map[y]) continue; // 安全策
                    const t = this.map[y][x];
                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE;

                    if (t === T.WALL) {
                        // Bricks
                        this.ctx.fillStyle = '#A0522D'; // Brown
                        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                        this.ctx.strokeStyle = '#5d4037';
                        this.ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                        // Brick detail
                        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        this.ctx.fillRect(px, py + 6, TILE_SIZE, 2);
                    } else if (t === T.GOAL) {
                        // Flag pole
                        this.ctx.fillStyle = '#fff';
                        this.ctx.fillRect(px + 6, py, 4, TILE_SIZE);
                        // Flag
                        this.ctx.fillStyle = '#2ecc71';
                        this.ctx.beginPath();
                        this.ctx.moveTo(px + 10, py);
                        this.ctx.lineTo(px + 16, py + 4);
                        this.ctx.lineTo(px + 10, py + 8);
                        this.ctx.fill();
                    } else if (t === T.SPIKE) {
                        this.ctx.fillStyle = '#95a5a6';
                        this.ctx.beginPath();
                        this.ctx.moveTo(px, py + TILE_SIZE);
                        this.ctx.lineTo(px + TILE_SIZE/2, py);
                        this.ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
                        this.ctx.fill();
                    }
                }
            }
        }

        // Draw Player
        if (this.state === 'PLAYING') {
            // Blink if invincible
            if (Math.floor(this.player.invincibleTimer / 4) % 2 === 0) {
                const p = this.player;
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(p.x, p.y, p.width, p.height);
                
                // Eyes
                this.ctx.fillStyle = '#fff';
                if (p.facingRight) {
                    this.ctx.fillRect(p.x + 8, p.y + 2, 2, 4);
                } else {
                    this.ctx.fillRect(p.x + 2, p.y + 2, 2, 4);
                }
            }
        }

        // Draw Enemies
        this.enemies.forEach(e => {
            // Simple Red Slime
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            this.ctx.arc(e.x + e.width/2, e.y + e.height/2, e.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(e.x + 4, e.y + 4, 2, 2);
            this.ctx.fillRect(e.x + 8, e.y + 4, 2, 2);
        });
    }

    loop() {
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.loop);
    }
}

// Start logic
const init = () => {
    new Game();
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    window.addEventListener('DOMContentLoaded', init);
}

})();
</script>
</body>
</html>