const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

// 音声管理システム
const audioManager = {
    bgm: {
        title: new Audio('src/bgm/title.mp3'),
        game: new Audio('src/bgm/game.mp3'),
        gameover: new Audio('src/bgm/gameover.mp3')
    },
    se: {
        circle: new Audio('src/se/circle.mp3'),
        triangle: new Audio('src/se/triangle.mp3'),
        hit: new Audio('src/se/hit.mp3'),
        fall: new Audio('src/se/fall.mp3'),
        clone: new Audio('src/se/clone.mp3'),
        warning: new Audio('src/se/warning.mp3'),
        fastfall: new Audio('src/se/fastfall.mp3')
    },
    currentBgm: null,
    gameoverPlayed: false, // ゲームオーバーBGMが再生されたかのフラグ
    
    // 音量設定
    volumes: {
        bgm: 0.6,
        se: 0.7
    },
    
    // ミュート設定
    muted: {
        bgm: false,
        se: false
    },
    
    // BGMの初期設定
    init() {
        // ローカルストレージから音量設定を読み込み
        this.loadVolumeSettings();
        
        // BGMをループ設定（ゲームオーバーBGMは除く）
        this.bgm.title.loop = true;
        this.bgm.game.loop = true;
        this.bgm.gameover.loop = false; // ゲームオーバーBGMは一回のみ
        
        // 音量設定を適用
        this.updateBgmVolumes();
        this.updateSeVolumes();
    },
    
    // 音量設定をローカルストレージから読み込み
    loadVolumeSettings() {
        const savedBgmVolume = localStorage.getItem('game_bgm_volume');
        const savedSeVolume = localStorage.getItem('game_se_volume');
        const savedBgmMuted = localStorage.getItem('game_bgm_muted');
        const savedSeMuted = localStorage.getItem('game_se_muted');
        
        if (savedBgmVolume !== null) this.volumes.bgm = parseFloat(savedBgmVolume);
        if (savedSeVolume !== null) this.volumes.se = parseFloat(savedSeVolume);
        if (savedBgmMuted !== null) this.muted.bgm = savedBgmMuted === 'true';
        if (savedSeMuted !== null) this.muted.se = savedSeMuted === 'true';
    },
    
    // 音量設定をローカルストレージに保存
    saveVolumeSettings() {
        localStorage.setItem('game_bgm_volume', this.volumes.bgm.toString());
        localStorage.setItem('game_se_volume', this.volumes.se.toString());
        localStorage.setItem('game_bgm_muted', this.muted.bgm.toString());
        localStorage.setItem('game_se_muted', this.muted.se.toString());
    },
    
    // BGM音量を設定
    setBgmVolume(volume) {
        this.volumes.bgm = Math.max(0, Math.min(1, volume));
        this.updateBgmVolumes();
        this.saveVolumeSettings();
    },
    
    // SE音量を設定
    setSeVolume(volume) {
        this.volumes.se = Math.max(0, Math.min(1, volume));
        this.updateSeVolumes();
        this.saveVolumeSettings();
    },
    
    // BGMミュート切り替え
    toggleBgmMute() {
        this.muted.bgm = !this.muted.bgm;
        this.updateBgmVolumes();
        this.saveVolumeSettings();
    },
    
    // SEミュート切り替え
    toggleSeMute() {
        this.muted.se = !this.muted.se;
        this.updateSeVolumes();
        this.saveVolumeSettings();
    },
    
    // BGM音量を更新
    updateBgmVolumes() {
        const volume = this.muted.bgm ? 0 : this.volumes.bgm;
        this.bgm.title.volume = volume;
        this.bgm.game.volume = volume;
        this.bgm.gameover.volume = volume;
    },
    
    // SE音量を更新
    updateSeVolumes() {
        const volume = this.muted.se ? 0 : this.volumes.se;
        this.se.circle.volume = volume;
        this.se.triangle.volume = volume;
        this.se.hit.volume = volume;
        this.se.fall.volume = volume;
        this.se.clone.volume = volume;
        this.se.warning.volume = volume;
        this.se.fastfall.volume = volume;
    },
    
    // BGM再生
    playBgm(bgmName) {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
        }
        
        if (this.bgm[bgmName]) {
            this.currentBgm = this.bgm[bgmName];
            this.currentBgm.play().catch(e => console.log('BGM再生エラー:', e));
        }
    },
    
    // ゲームオーバーBGM専用再生（一回のみ）
    playGameoverBgm() {
        if (!this.gameoverPlayed) {
            this.playBgm('gameover');
            this.gameoverPlayed = true;
        }
    },
    
    // 効果音再生
    playSe(seName) {
        if (this.se[seName]) {
            this.se[seName].currentTime = 0;
            this.se[seName].play().catch(e => console.log('SE再生エラー:', e));
        }
    },
    
    // 全音声停止
    stopAll() {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm.currentTime = 0;
        }
    },
    
    // ゲーム開始時にフラグをリセット
    resetGameoverFlag() {
        this.gameoverPlayed = false;
    }
};

// 音声管理システムを初期化
audioManager.init();

let speedMultiplier = 1; // 固定値

let offsetSky = 0;
let offsetMount = 250;
let offsetMountFar = 200; // 追加: 奥の山用
let offsetGround = 0;

let groundLayers = [
    { baseY: 650, height: 100, color: '#00e60b', offset: 0, speed: 0.1 },
    { baseY: 700, height: 100, color: '#00b509', offset: 0, speed: 0.07 },
    { baseY: 750, height: 100, color: '#008a06', offset: 0, speed: 0.04 }
];

// 雲の設定
let clouds = [
    { x: 100, y: 80, size: 40, speedX: 1, speedY: 0.05 },
    { x: 400, y: 120, size: 60, speedX: 0.2, speedY: 0.03 },
    { x: 650, y: 60, size: 30, speedX: 0.4, speedY: 0.07 }
];
let extraClouds = []; // 追加雲用
const maxExtraClouds = 10; // 最大追加雲数（20から10に削減）
let frameCount = 0; // フレームカウンタ
const cloudAddInterval = 300; // 何フレームごとに追加するか（200から300に変更でより間隔を空ける）

function drawCloud(cloud) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#fff";
    // 影効果を削除して軽量化
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.size * 0.6, cloud.y + 5, cloud.size * 0.7, cloud.size * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.size * 0.6, cloud.y + 8, cloud.size * 1, cloud.size * 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
}

let stars = [];
const STAR_COUNT = 50; // 200から50に削減
for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
        x: Math.random() * 600,
        y: Math.random() * 800,
        r: Math.random() * 1.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.01
    });
}

function drawStars(alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#fff";
    
    for (let star of stars) {
        // キラキラ点滅の計算を簡略化
        let blink = 0.7 + 0.3 * Math.sin(performance.now() * star.speed + star.phase);
        ctx.shadowBlur = 4 * blink; // shadowBlurを軽減
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * blink, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
}

let planets = [];
const PLANET_COLORS = [
    "#f7c873", "#e3e3e3", "#c7bfff", "#ffb3b3", "#b3ffd1", "#ffe6b3", "#b3e0ff", "#e6b3ff"
];
const PLANET_MIN_RADIUS = 100;
const PLANET_MAX_RADIUS = 500; // でかくする
const PLANET_FALL_SPEED = 0.05; // とても遅い

function drawPlanets(planets) {
    for (let p of planets) {
        ctx.save();

        // --- 惑星の形状 ---
        ctx.beginPath();
        if (p.shape === "diamond") {
            // ひし形
            ctx.moveTo(p.x, p.y - p.radius);
            ctx.lineTo(p.x + p.radius, p.y);
            ctx.lineTo(p.x, p.y + p.radius);
            ctx.lineTo(p.x - p.radius, p.y);
            ctx.closePath();
        } else if (p.shape === "polygon") {
            // 丸みのある多角形
            let sides = p.sides || 6;
            let round = 0.5 + Math.random() * 0.3; // 丸み
            for (let i = 0; i < sides; i++) {
                let angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
                let r = p.radius * (0.95 + Math.sin(i + p.radius) * 0.05);
                let px = p.x + Math.cos(angle) * r;
                let py = p.y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.quadraticCurveTo(
                    p.x + Math.cos(angle - Math.PI / sides) * r * round,
                    p.y + Math.sin(angle - Math.PI / sides) * r * round,
                    px, py
                );
            }
            ctx.closePath();
        } else {
            // 丸
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.95;
        ctx.fill();

        // 輪っか
        if (p.hasRing) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.ringAngle);
            ctx.strokeStyle = p.ringColor;
            ctx.lineWidth = p.radius * 0.18;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.radius * 1.4, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- ここから模様をクリッピング ---
        ctx.save();
        ctx.beginPath();
        if (p.shape === "diamond") {
            ctx.moveTo(p.x, p.y - p.radius);
            ctx.lineTo(p.x + p.radius, p.y);
            ctx.lineTo(p.x, p.y + p.radius);
            ctx.lineTo(p.x - p.radius, p.y);
            ctx.closePath();
        } else if (p.shape === "polygon") {
            let sides = p.sides || 6;
            let round = 0.5 + Math.random() * 0.3;
            for (let i = 0; i < sides; i++) {
                let angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
                let r = p.radius * (0.95 + Math.sin(i + p.radius) * 0.05);
                let px = p.x + Math.cos(angle) * r;
                let py = p.y + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.quadraticCurveTo(
                    p.x + Math.cos(angle - Math.PI / sides) * r * round,
                    p.y + Math.sin(angle - Math.PI / sides) * r * round,
                    px, py
                );
            }
            ctx.closePath();
        } else {
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        ctx.clip();

        // 模様（横線 or 斑点）
        if (p.pattern === "stripe") {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = Math.max(2, p.radius * 0.08);
            for (let i = -2; i <= 2; i++) {
                let y = p.y + i * p.radius * 0.35;
                ctx.beginPath();
                ctx.arc(p.x, y, p.radius * 0.85, Math.PI * 0.1, Math.PI * 0.9, false);
                ctx.stroke();
            }
        } else if (p.pattern === "dot") {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#fff";
            for (let i = 0; i < Math.floor(p.radius / 6); i++) {
                let angle = Math.random() * Math.PI * 2;
                let r = Math.random() * (p.radius * 0.8);
                let dx = Math.cos(angle) * r;
                let dy = Math.sin(angle) * r;
                ctx.beginPath();
                ctx.arc(p.x + dx, p.y + dy, Math.max(3, p.radius * 0.13 * Math.random()), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
        // --- ここまでクリッピング ---

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}

// 惑星色フェード用
let lastPlanetColor = { r: 10, g: 10, b: 24 }; // 宇宙色初期値

// 隕石設定
let meteors = [];
const METEOR_MAX = 3; // 5から3に削減
const METEOR_MIN_RADIUS = 30;
const METEOR_MAX_RADIUS = 80; // 100から80に削減（描画負荷軽減）
const METEOR_FALL_SPEED_MIN = 0.1;
const METEOR_FALL_SPEED_MAX = 0.2;
const METEOR_COLORS = ["#444", "#222", "#5a3a1a", "#2a1a0a", "#333", "#2d2d2d"];

function drawMeteor(m) {
    ctx.save();
    // より簡単な円形に変更（多角形計算を削除）
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 5; // shadowBlurを軽減
    ctx.globalAlpha = 0.92;
    ctx.fill();

    // 模様を簡素化
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.3; // より薄く
    ctx.fillStyle = "#fff";
    // 模様の数を削減
    for (let i = 0; i < Math.max(2, Math.floor(m.radius / 15)); i++) {
        let angle = Math.random() * Math.PI * 2;
        let rr = Math.random() * (m.radius * 0.5);
        let dx = Math.cos(angle) * rr;
        let dy = Math.sin(angle) * rr;
        ctx.beginPath();
        ctx.arc(m.x + dx, m.y + dy, Math.max(2, m.radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.globalAlpha = 1.0;
    ctx.restore();
}

function drawBackground(offsetSky, offsetMount, offsetMountFar, groundLayers, clouds, extraClouds, planets, meteors, showAltitude, showMaxAltitude) {
    // 空（高さで色を変化）
    // 下: #87ceeb, 中: #1a2340, 上: #0a0a18（真っ暗）
    let startDarkenHeight = 5000;
    let maxSky = 30000;
    let fadeCloudStart = 50000;
    let fadeCloudEnd = 60000;
    let t = 0;
    if (offsetSky > startDarkenHeight) {
        t = Math.min((offsetSky - startDarkenHeight) / (maxSky - startDarkenHeight), 1);
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    // 通常の空色
    let r = Math.round(lerp(135, 26, t));
    let g = Math.round(lerp(206, 35, t));
    let b = Math.round(lerp(235, 64, t));
    // 真っ暗への補間
    let t2 = 0;
    if (offsetSky > fadeCloudStart) {
        t2 = Math.min((offsetSky - fadeCloudStart) / (fadeCloudEnd - fadeCloudStart), 1);
        r = Math.round(lerp(r, 10, t2));
        g = Math.round(lerp(g, 10, t2));
        b = Math.round(lerp(b, 24, t2));
    }

    // --- 惑星の色に宇宙色をフェードで寄せる ---
    if (planets.length > 0 && t2 > 0.99) {
        let p = planets[0];
        let planetColor = p.color;
        let m = planetColor.match(/^#([0-9a-f]{6})$/i);
        if (m) {
            let pr = parseInt(m[1].substr(0,2),16);
            let pg = parseInt(m[1].substr(2,2),16);
            let pb = parseInt(m[1].substr(4,2),16);
            // フェード率
            let fadeRate = 0.03; // 0.0〜1.0 小さいほどゆっくり
            lastPlanetColor.r += (pr - lastPlanetColor.r) * fadeRate;
            lastPlanetColor.g += (pg - lastPlanetColor.g) * fadeRate;
            lastPlanetColor.b += (pb - lastPlanetColor.b) * fadeRate;
            // 10%だけ惑星色に寄せる
            let blend = 0.10;
            r = Math.round(r * (1-blend) + lastPlanetColor.r * blend);
            g = Math.round(g * (1-blend) + lastPlanetColor.g * blend);
            b = Math.round(b * (1-blend) + lastPlanetColor.b * blend);
        }
    } else {
        // 惑星がいないときは宇宙色に戻す
        lastPlanetColor.r += (10 - lastPlanetColor.r) * 0.03;
        lastPlanetColor.g += (10 - lastPlanetColor.g) * 0.03;
        lastPlanetColor.b += (24 - lastPlanetColor.b) * 0.03;
    }
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星のフェードイン
    if (offsetSky > fadeCloudStart) {
        drawStars(t2);
    }

    // 隕石
    if (meteors && meteors.length > 0) {
        for (let m of meteors) drawMeteor(m);
    }

    // 惑星
    if (planets.length > 0) {
        drawPlanets(planets);
    }

    // 雲のフェードアウト
    let cloudAlpha = 1;
    if (offsetSky > fadeCloudStart) {
        cloudAlpha = 1 - t2;
    }

    // 雲
    ctx.save();
    ctx.globalAlpha = cloudAlpha;
    for (let cloud of clouds) {
        drawCloud(cloud);
    }
    for (let cloud of extraClouds) {
        drawCloud(cloud);
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // 遠景の山（薄い色・高い位置）
    ctx.fillStyle = '#b0c48c';
    ctx.beginPath();
    ctx.moveTo(0, 180 + offsetMountFar);
    ctx.lineTo(100, 100 + offsetMountFar);
    ctx.lineTo(250, 200 + offsetMountFar);
    ctx.lineTo(400, 120 + offsetMountFar);
    ctx.lineTo(550, 210 + offsetMountFar);
    ctx.lineTo(600, 170 + offsetMountFar);
    ctx.lineTo(800, 200 + offsetMountFar);
    ctx.lineTo(800, 600 + offsetMountFar);
    ctx.lineTo(0, 600 + offsetMountFar);
    ctx.closePath();
    ctx.fill();

    // 近景の山（既存）
    ctx.fillStyle = '#6b8e23';
    ctx.beginPath();
    ctx.moveTo(0, 300 + offsetMount);
    ctx.lineTo(150, 180 + offsetMount);
    ctx.lineTo(300, 320 + offsetMount);
    ctx.lineTo(450, 200 + offsetMount);
    ctx.lineTo(600, 320 + offsetMount);
    ctx.lineTo(800, 250 + offsetMount);
    ctx.lineTo(800, 400 + offsetMount);
    ctx.lineTo(0, 400 + offsetMount);
    ctx.closePath();
    ctx.fill();

    // 地面（複数層）
    for (let layer of groundLayers) {
        ctx.fillStyle = layer.color;
        ctx.fillRect(0, layer.baseY + layer.offset, canvas.width, layer.height);
    }

    // 高度表示（showAltitude=trueのときのみ左上に表示）
    if (showAltitude) {
        ctx.save();
        ctx.font = "bold 24px sans-serif";
        ctx.fillStyle = "#222";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        let altitudeText = `高度: ${Math.floor(offsetSky)} m`;
        ctx.strokeText(altitudeText, 20, 60);
        ctx.fillText(altitudeText, 20, 60);
        ctx.restore();
    }

    // 最高到達点（showMaxAltitude=trueのとき右上に表示）
    if (showMaxAltitude) {
        ctx.save();
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#222";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        const displayMaxAltitude = isNightmareMode ? nightmareMaxAltitude : maxAltitude;
        const modeText = isNightmareMode ? " (ナイトメア)" : "";
        let maxText = `最高到達点: ${Math.floor(displayMaxAltitude)} m${modeText}`;
        ctx.textAlign = "right";
        ctx.strokeText(maxText, ctx.canvas.width - 20, 40);
        ctx.fillText(maxText, ctx.canvas.width - 20, 40);
        ctx.restore();
    }
}

// プレイヤー設定
const player = {
    x: canvas.width / 2,
    y: canvas.height - 120,
    radius: 24,
    color: "#fffa3a",
    vx: 0,
    isMoving: false,
    facingLeft: false,
    // 落下アニメーション用
    isDying: false,
    deathVy: 0,
    deathGravity: 0.5,
    deathInitialVy: -8
};
let isGameOver = false;

// プレイヤー画像の管理システム
const playerSkins = {
    normal: { name: "シロ", folder: "normal" },
    mike: { name: "ミケ", folder: "mike" },
    black: { name: "クロ", folder: "black" },
    brown: { name: "チャチャ", folder: "brown" },
    mint: { name: "ミント", folder: "mint" },
    shadow: { name: "シャドウ", folder: "shadow" }
};

// 現在の見た目設定
let currentPlayerSkin = "normal";

// ガチャ・コイン管理
let playerCoins = 10000;
let unlockedSkins = ["normal"]; // デフォルトでnormalはアンロック済み
let currentGameCoins = 0; // 今回のゲームで獲得したコイン数

// ガチャの排出率設定
const gachaRates = {
    mike: 0.15,    // 15%
    black: 0.15,   // 15%
    brown: 0.15,   // 15%
    mint: 0.15,    // 15%
    shadow: 0.10,  // 10%
    miss: 0.30     // 30% (ハズレ)
};

// コイン数をローカルストレージから読み込み
function loadPlayerCoins() {
    const savedCoins = localStorage.getItem('jump_player_coins');
    if (savedCoins) {
        playerCoins = parseInt(savedCoins);
    }
}

// コイン数をローカルストレージに保存
function savePlayerCoins() {
    localStorage.setItem('jump_player_coins', playerCoins.toString());

    saveUserData(userId,null,null,null,null,null,playerCoins);
}

// アンロック済みスキンをローカルストレージから読み込み
function loadUnlockedSkins() {
    const savedSkins = localStorage.getItem('jump_unlocked_skins');
    if (savedSkins) {
        try {
            // 文字列形式とJSON形式の両方をサポート（互換性のため）
            if (savedSkins.startsWith('[')) {
                // JSON形式（旧形式）
                unlockedSkins = JSON.parse(savedSkins);
            } else {
                // カンマ区切り文字列形式（新形式）
                unlockedSkins = savedSkins.split(',').filter(skin => skin.trim() !== '');
                if (unlockedSkins.length === 0) {
                    unlockedSkins = ["normal"];
                }
            }
        } catch (e) {
            console.error("Failed to parse unlocked skins from localStorage:", e);
            unlockedSkins = ["normal"];
        }
    }
}

// アンロック済みスキンをローカルストレージに保存
function saveUnlockedSkins() {
    localStorage.setItem('jump_unlocked_skins', unlockedSkins.join(','));
}

// 見た目設定をローカルストレージから読み込み
function loadPlayerSkin() {
    const savedSkin = localStorage.getItem('jump_player_skin');
    if (savedSkin && playerSkins[savedSkin]) {
        currentPlayerSkin = savedSkin;
    }
}

// 見た目設定をローカルストレージに保存
function savePlayerSkin() {
    localStorage.setItem('jump_player_skin', currentPlayerSkin);
}

// FPS表示設定をローカルストレージから読み込み
function loadFpsSettings() {
    const savedFpsSettings = localStorage.getItem('game_show_fps');
    if (savedFpsSettings !== null) {
        showFps = savedFpsSettings === 'true';
    }
}

// FPS表示設定をローカルストレージに保存
function saveFpsSettings() {
    localStorage.setItem('game_show_fps', showFps.toString());
}

// プレイヤー画像の読み込み
const playerImages = {
    normal: new Image(),
    normalHit: new Image(),
    move: new Image(),
    moveHit: new Image()
};

// 現在の見た目に応じて画像を更新
function updatePlayerImages() {
    const folder = playerSkins[currentPlayerSkin].folder;
    playerImages.normal.src = `img/${folder}/cat_normal.PNG`;
    playerImages.normalHit.src = `img/${folder}/cat_normal_hit.PNG`;
    playerImages.move.src = `img/${folder}/cat_move.PNG`;
    playerImages.moveHit.src = `img/${folder}/cat_move_hit.PNG`;
}

// 見た目を変更する関数
function changePlayerSkin(skinName) {
    if (playerSkins[skinName]) {
        currentPlayerSkin = skinName;
        updatePlayerImages();
        savePlayerSkin();
        console.log(`プレイヤーの見た目を${playerSkins[skinName].name}に変更しました`);
    }
}

// 初期化時に見た目を読み込み
loadPlayerSkin();
// 初期化時にFPS設定を読み込み
loadFpsSettings();
loadPlayerCoins();
loadUnlockedSkins();
updatePlayerImages();

// 障害物設定
let obstacles = [];
const OBSTACLE_RADIUS = 32;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 24;
const OBSTACLE_INTERVAL = 90; // フレームごと（80から90に変更で生成頻度を下げる）
const NIGHTMARE_OBSTACLE_INTERVAL = 60; // ナイトメアモード専用の出現間隔（より高頻度）
const OBSTACLE_SPEED = 2; // 障害物の落下速度

// 赤玉が飛ばす小玉
let redBullets = [];
const RED_BULLET_RADIUS = 10;
const RED_BULLET_SPEED = 5;

// 水色ひし形が放つミニひし形
let diamondMinis = [];

// 紫六角形が放つ紫玉
let purpleBullets = [];

// 新しい障害物タイプ: 緑の三角（衝撃波を放つ）
const TRIANGLE_OBSTACLE_SIZE = 40;
const TRIANGLE_OBSTACLE_COLOR = "#00a000";
const SHOCKWAVE_INITIAL_RADIUS = 40;
const SHOCKWAVE_SPEED = 5; // 衝撃波の拡大速度
const SHOCKWAVE_FADE_SPEED = 0.01; // 衝撃波の透明度減少速度（調整）
const SHOCKWAVE_ARC_ANGLE = Math.PI / 6; // 衝撃波の扇の角度 (60度)
const TRIANGLE_SHOOT_INTERVAL = 150; // 三角が衝撃波を放つ間隔（フレーム）（120から150に変更）
const SHOCKWAVE_MIN_ALPHA_FOR_COLLISION = 0.3; // 衝撃波が当たり判定を持つ最低不透明度

// 新しい障害物タイプ: オレンジ五角形（クローン能力）
const PENTAGON_OBSTACLE_SIZE = 35;
const PENTAGON_OBSTACLE_COLOR = "#ff8c00";
const PENTAGON_CLONE_INTERVAL = 180; // クローンを作るまでの間隔（フレーム）

// 新しい障害物タイプ: 水色ひし形（突進能力）
const DIAMOND_OBSTACLE_SIZE = 32;
const DIAMOND_OBSTACLE_COLOR = "#00bfff";
const DIAMOND_DETECT_RANGE = 60; // プレイヤー検知範囲（横方向）
const DIAMOND_WAIT_TIME = 60; // 検知後の待機時間（フレーム）
const DIAMOND_RUSH_SPEED = 8; // 突進速度
const DIAMOND_MINI_SIZE = 12; // ミニひし形のサイズ
const DIAMOND_MINI_SPEED = 3; // ミニひし形の速度
const DIAMOND_MINI_RANGE = 150; // ミニひし形の射程

// 新しい障害物タイプ: 紫六角形（6方向弾幕）
const HEXAGON_OBSTACLE_SIZE = 30;
const HEXAGON_OBSTACLE_COLOR = "#8a2be2";
const HEXAGON_SHOOT_INTERVAL = 120; // 弾を発射するまでの間隔（フレーム）
const HEXAGON_BULLET_SPEED = 4; // 紫玉の速度
const HEXAGON_BULLET_RADIUS = 8; // 紫玉の半径


// キー操作
let keyLeft = false, keyRight = false;
window.addEventListener("keydown", e => {
    
    if (e.key === "ArrowLeft") keyLeft = true;
    if (e.key === "ArrowRight") keyRight = true;
    if (gameState === "title" && (e.key === " " || e.key === "Enter")) {
        startGame();
    }
    if (gameState === "gameover" && (e.key === " " || e.key === "Enter")) {
        startGame();
    }
    // Ctrl+8キーで当たり判定デバッグの切り替え
    if (e.ctrlKey && e.key === "8") {
        showHitbox = !showHitbox;
        console.log(`当たり判定デバッグ: ${showHitbox ? 'ON' : 'OFF'}`);
    }
    // Ctrl+9キーでFPS表示の切り替え
    if (e.ctrlKey && e.key === "9") {
        showFps = !showFps;
        console.log(`FPS表示: ${showFps ? 'ON' : 'OFF'}`);
    }
});
window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") keyLeft = false;
    if (e.key === "ArrowRight") keyRight = false;
});

// タッチ操作対応 (既存のcanvasタッチイベントは残しつつ、ボタン操作を優先)
canvas.addEventListener("touchstart", handleCanvasTouch, { passive: false });
canvas.addEventListener("touchmove", handleCanvasTouch, { passive: false });
canvas.addEventListener("touchend", handleCanvasTouchEnd, { passive: false });

function handleCanvasTouch(e) {
    e.preventDefault();
    if (gameState === "title" || gameState === "gameover") {
        startGame();
        return;
    }
    // ボタンが押されていない場合のみキャンバスタッチを処理
    if (!isButtonActive) {
        if (e.touches.length > 0) {
            let touch = e.touches[0];
            let rect = canvas.getBoundingClientRect();
            let x = touch.clientX - rect.left;
            // 画面の左半分なら左、右半分なら右
            if (x < canvas.width / 2) {
                keyLeft = true;
                keyRight = false;
            } else {
                keyLeft = false;
                keyRight = true;
            }
        }
    }
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    // 指が離れたら両方false
    if (!isButtonActive) { // ボタンがアクティブでない場合のみリセット
        keyLeft = false;
        keyRight = false;
    }
}

// ボタン操作の追加
let isButtonActive = false; // ボタンがアクティブかどうかを追跡

const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');

if (leftButton) {
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keyLeft = true;
        keyRight = false;
        isButtonActive = true;
        if (gameState === "title" || gameState === "gameover") {
            startGame();
        }
    }, { passive: false });
    leftButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        keyLeft = false;
        isButtonActive = false;
    }, { passive: false });
    // マウスイベントも追加（PCでのデバッグ用）
    leftButton.addEventListener('mousedown', () => {
        keyLeft = true;
        keyRight = false;
        isButtonActive = true;
        if (gameState === "title" || gameState === "gameover") {
            startGame();
        }
    });
    leftButton.addEventListener('mouseup', () => {
        keyLeft = false;
        isButtonActive = false;
    });
    leftButton.addEventListener('mouseleave', () => { // ボタンからマウスが離れた時
        keyLeft = false;
        isButtonActive = false;
    });
}

if (rightButton) {
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keyRight = true;
        keyLeft = false;
        isButtonActive = true;
        if (gameState === "title" || gameState === "gameover") {
            startGame();
        }
    }, { passive: false });
    rightButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        keyRight = false;
        isButtonActive = false;
    }, { passive: false });
    // マウスイベントも追加（PCでのデバッグ用）
    rightButton.addEventListener('mousedown', () => {
        keyRight = true;
        keyLeft = false;
        isButtonActive = true;
        if (gameState === "title" || gameState === "gameover") {
            startGame();
        }
    });
    rightButton.addEventListener('mouseup', () => {
        keyRight = false;
        isButtonActive = false;
    });
    rightButton.addEventListener('mouseleave', () => { // ボタンからマウスが離れた時
        keyRight = false;
        isButtonActive = false;
    });
}


let gameState = "title"; // "title", "playing", "gameover"
let isNightmareMode = false; // ナイトメアモード状態
let nightmareUnlocked = false; // ナイトメアモード開放フラグ
let initialMaxAltitude = 0; // ゲーム開始時の最高到達点を保存する変数
let initialNightmareMaxAltitude = 0; // ゲーム開始時のナイトメアモード最高到達点を保存する変数
let currentReachedAltitude = 0; // ゲームオーバー時に到達した高度を保存する変数
let userId; // ユーザーIDはinitGameで初期化
let userName = "匿名さん"; // ユーザー名を保存する変数
let newuser = false

let maxAltitude = 0; // スプレッドシートから読み込むため、初期値は0
let nightmareMaxAltitude = 0; // ナイトメアモード最高到達点

// デバッグ用：当たり判定表示フラグ
let showHitbox = false; // trueにすると当たり判定が表示される

// デバッグ用：FPS表示フラグ
let showFps = false; // trueにするとFPSが表示される
let fps = 0;
let fpsFrameCount = 0;
let lastTime = performance.now();
let fpsUpdateInterval = 1000; // 1秒ごとにFPSを更新

// ユーザーIDの取得または生成
function getOrCreateUserId() {
    let id = localStorage.getItem('game_user_id');

    if (!id) {
        id = crypto.randomUUID(); // ユニークなIDを生成
        localStorage.setItem('game_user_id', id);
        newuser = true

        saveUserData(id, "匿名さん", 0, 0, 0, false, 0, ""); // 初期データを保存
    }
    return id;
}

// ユーザー名の取得または初期化
function getOrCreateUserName() {
    let name = localStorage.getItem('game_user_name');
    if (!name) {
        name = "匿名さん"; // 初期値
        localStorage.setItem('game_user_name', name);
    }
    return name;
}

// 最高到達点の読込
async function loadAltitudeFromSheet(userId) {
    try {
        const data = await fetchUData(userId);
        if (data && data.altitude !== undefined) {
            maxAltitude = parseFloat(data.altitude); 
        }
        if (data && data['n-altitude'] !== undefined) {
            nightmareMaxAltitude = parseFloat(data['n-altitude']);
        }
    } catch (error) {
        console.error("Failed to load altitude from sheet:", error);
    }
}

// ナイトメアモードの開放状態をチェック
async function checkNightmareUnlocked(userId) {
    try {
        const data = await fetchUData(userId);
        if (data && data.nightmare !== undefined) {
            return data.nightmare === true; // 文字列として保存されているため比較
        }
        return false; // データがない場合は未開放
    } catch (error) {
        console.error("Failed to check nightmare unlock status:", error);
        return false; // エラー時は未開放
    }
}

// コインと解放済みスキン情報を読み込み
async function loadCoinsAndSkins(userId) {
    try {
        const data = await fetchUData(userId);
        if (data) {
            // コイン数の読み込み（複数のフィールド名に対応）
            if (data.coins !== undefined) {
                playerCoins = parseInt(data.coins) || 0;
                updateCoinDisplay();
            } else if (data.coins !== undefined) {
                playerCoins = parseInt(data.coin) || 0;
                updateCoinDisplay();
            }
            
            // 解放済みスキンの読み込み（カンマ区切り文字列形式）
            if (data.unlockedSkins) {
                try {
                    // 文字列をカンマで分割して配列に変換
                    if (typeof data.unlockedSkins === 'string') {
                        unlockedSkins = data.unlockedSkins.split(',').filter(skin => skin.trim() !== '');
                        if (unlockedSkins.length === 0) {
                            unlockedSkins = ["normal"];
                        }
                    } else {
                        // 旧形式（JSON）との互換性のため
                        unlockedSkins = JSON.parse(data.unlockedSkins) || ["normal"];
                    }
                } catch (e) {
                    console.error("Failed to parse unlocked skins:", e);
                    unlockedSkins = ["normal"];
                }
            }
        }
    } catch (error) {
        console.error("Failed to load coins and skins:", error);
    }
}

// ナイトメアモードを開放する
async function unlockNightmareMode(userId) {
    nightmareUnlocked = true;
    
    // モード切り替えボタンの状態を更新
    updateModeToggleButton();
    
    // アンロック通知表示
    console.log('ナイトメアモードが開放されました！');
    alert('おめでとうございます！\n高度50,000mに到達し、ナイトメアモードが開放されました！');
}

function startGame() {
    // 初期化
    offsetSky = 0;
    offsetMount = 250;
    offsetMountFar = 200;
    for (let layer of groundLayers) layer.offset = 0;
    clouds = [
        { x: 100, y: 80, size: 40, speedX: 1, speedY: 0.05 },
        { x: 400, y: 120, size: 60, speedX: 0.2, speedY: 0.03 },
        { x: 650, y: 60, size: 30, speedX: 0.4, speedY: 0.07 }
    ];
    extraClouds = [];
    planets = [];
    meteors = [];
    obstacles = [];
    redBullets = []; // 赤玉の小玉もリセット
    diamondMinis = []; // ひし形ミニもリセット
    purpleBullets = []; // 紫玉もリセット
    player.x = canvas.width / 2;
    player.vx = 0;
    player.isMoving = false;
    player.facingLeft = false;
    // プレイヤーの落下状態をリセット
    player.isDying = false;
    player.deathVy = 0;
    // プレイヤーのY座標もリセット
    player.y = canvas.height - 120;
    isGameOver = false;
    frameCount = 0;
    gameState = "playing";
    // audioManagerのゲームオーバーフラグもリセット
    audioManager.gameoverPlayed = false;
    initialMaxAltitude = maxAltitude; // ゲーム開始時に現在の最高到達点を記録（スプレッドシートからロードされた値）
    initialNightmareMaxAltitude = nightmareMaxAltitude; // ゲーム開始時のナイトメアモード最高到達点を記録
    currentGameCoins = 0; // 今回のゲームで獲得したコイン数をリセット
}

// プレイヤー描画
function drawPlayer() {
    ctx.save();
    
    // 使用する画像を決定
    let currentImage;
    if (player.isDying || isGameOver) {
        // 落下中またはゲームオーバー時はhit画像を選択
        if (player.isMoving) {
            currentImage = playerImages.moveHit;
        } else {
            currentImage = playerImages.normalHit;
        }
    } else {
        // 通常時は移動状態に応じて画像を選択
        if (player.isMoving) {
            currentImage = playerImages.move;
        } else {
            currentImage = playerImages.normal;
        }
    }
    
    // 画像が読み込まれている場合は画像を描画、そうでなければ従来の円を描画
    if (currentImage && currentImage.complete) {
        // 画像サイズを原寸大で取得（ここで画像サイズを変更可能）
        // const imageWidth = currentImage.naturalWidth;   // 原寸幅（変更したい場合はここを編集）
        // const imageHeight = currentImage.naturalHeight; // 原寸高さ（変更したい場合はここを編集）
        const imageWidth = 150  // 原寸幅（変更したい場合はここを編集）
        const imageHeight = 230
        
        
        // 当たり判定用の半径を画像サイズに基づいて設定
        player.radius = 20 //Math.min(imageWidth, imageHeight) / 2;
        
        // 左向きの場合は画像を反転
        if (player.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                currentImage, 
                -player.x - imageWidth/2, 
                player.y - imageHeight/2 + 18, 
                imageWidth, 
                imageHeight
            );
        } else {
            ctx.drawImage(
                currentImage, 
                player.x - imageWidth/2, 
                player.y - imageHeight/2 + 18, 
                imageWidth, 
                imageHeight
            );
        }
    } else {
        // 画像が読み込まれていない場合は従来の円を描画
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        // 影効果を軽減してパフォーマンス向上
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 8; // 16から8に軽減
        ctx.fill();
    }
    
    // デバッグ用：当たり判定の表示
    if (showHitbox) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

// 障害物描画
function drawObstacles() {
    for (let obs of obstacles) {
        ctx.save();
        
        // フラッシュエフェクトのスケールと色を計算
        let scale = 1;
        let flashColor = null;
        if (obs.flashTimer !== undefined && obs.flashTimer > 0) {
            let flashProgress = obs.flashTimer / obs.flashDuration;
            scale = 0.8 + 0.2 * flashProgress; // 0.8倍まで縮んで元に戻る
            if (flashProgress > 0.5) {
                flashColor = "#ffffff"; // 白くする
            }
        }
        
        if (obs.type === "circle") {
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius * scale, 0, Math.PI * 2);
            ctx.fillStyle = flashColor || "#d33";
            ctx.shadowColor = flashColor || "#a00";
            ctx.shadowBlur = 4; // 8から4に軽減
            ctx.fill();
        } else if (obs.type === "rect") {
            // 左右に伸び縮みする青棒
            ctx.beginPath();
            ctx.rect(
                obs.x - (obs.width * scale)/2,
                obs.y - (obs.height * scale)/2,
                obs.width * scale,
                obs.height * scale
            );
            ctx.fillStyle = flashColor || "#39f";
            ctx.shadowColor = flashColor || "#06f";
            ctx.shadowBlur = 4; // 8から4に軽減
            ctx.fill();
        } else if (obs.type === "triangle") {
            // 緑の三角
            ctx.beginPath();
            let size = obs.size * scale;
            ctx.moveTo(obs.x, obs.y - size); // Top point
            ctx.lineTo(obs.x + size * Math.sqrt(3) / 2, obs.y + size / 2); // Bottom right
            ctx.lineTo(obs.x - size * Math.sqrt(3) / 2, obs.y + size / 2); // Bottom left
            ctx.closePath();
            ctx.fillStyle = flashColor || TRIANGLE_OBSTACLE_COLOR;
            ctx.shadowColor = flashColor || TRIANGLE_OBSTACLE_COLOR;
            ctx.shadowBlur = 4; // 8から4に軽減
            ctx.fill();

            // 衝撃波を描画
            for (let sw of obs.shockwaves) {
                ctx.save();
                ctx.globalAlpha = sw.alpha;
                ctx.strokeStyle = "#fff"; // 白い衝撃波
                ctx.lineWidth = 5; // 衝撃波の太さ
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.currentRadius, sw.startAngle, sw.endAngle);
                ctx.stroke();
                ctx.restore();
                
                // デバッグ用：衝撃波の当たり判定表示（不透明度が判定値より高い場合のみ）
                if (showHitbox && sw.alpha > SHOCKWAVE_MIN_ALPHA_FOR_COLLISION) {
                    ctx.save();
                    ctx.strokeStyle = "#ff00ff"; // マゼンタ色で衝撃波の当たり判定を表示
                    ctx.lineWidth = 3;
                    ctx.setLineDash([3, 3]); // 点線
                    ctx.beginPath();
                    // 衝撃波の当たり判定帯域を表示
                    const SHOCKWAVE_COLLISION_BAND = 10;
                    ctx.arc(sw.x, sw.y, sw.currentRadius - SHOCKWAVE_COLLISION_BAND / 2, sw.startAngle, sw.endAngle);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(sw.x, sw.y, sw.currentRadius + SHOCKWAVE_COLLISION_BAND / 2, sw.startAngle, sw.endAngle);
                    ctx.stroke();
                    ctx.setLineDash([]); // 点線を解除
                    ctx.restore();
                }
            }
        } else if (obs.type === "pentagon") {
            // オレンジの五角形
            ctx.beginPath();
            let size = obs.size * scale;
            
            // 五角形の頂点を計算
            for (let i = 0; i < 5; i++) {
                let angle = (Math.PI * 2 / 5) * i - Math.PI / 2; // -90度から開始で上向き
                let x = obs.x + Math.cos(angle) * size;
                let y = obs.y + Math.sin(angle) * size;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fillStyle = flashColor || PENTAGON_OBSTACLE_COLOR;
            ctx.shadowColor = flashColor || PENTAGON_OBSTACLE_COLOR;
            ctx.shadowBlur = 4;
            ctx.fill();
        } else if (obs.type === "diamond") {
            // 水色のひし形
            ctx.beginPath();
            let size = obs.size * scale;
            
            // フラッシュエフェクトの処理
            let shouldFlash = false;
            if (obs.state === "detected" && obs.flashTimer > 0) {
                shouldFlash = true;
            } else if (obs.state === "rushing" && obs.flashTimer > 0) {
                shouldFlash = true;
            }
            
            // ひし形の頂点を計算（上、右、下、左）
            ctx.moveTo(obs.x, obs.y - size); // 上
            ctx.lineTo(obs.x + size, obs.y); // 右
            ctx.lineTo(obs.x, obs.y + size); // 下
            ctx.lineTo(obs.x - size, obs.y); // 左
            ctx.closePath();
            
            if (shouldFlash) {
                ctx.fillStyle = "#ffffff"; // フラッシュ時は白
                ctx.shadowColor = "#ffffff";
            } else {
                ctx.fillStyle = flashColor || DIAMOND_OBSTACLE_COLOR;
                ctx.shadowColor = flashColor || DIAMOND_OBSTACLE_COLOR;
            }
            ctx.shadowBlur = 4;
            ctx.fill();
        } else if (obs.type === "hexagon") {
            // 紫の六角形
            ctx.beginPath();
            let size = obs.size * scale;
            
            // 六角形の頂点を計算
            for (let i = 0; i < 6; i++) {
                let angle = (Math.PI * 2 / 6) * i - Math.PI / 2; // -90度から開始で上向き
                let x = obs.x + Math.cos(angle) * size;
                let y = obs.y + Math.sin(angle) * size;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fillStyle = flashColor || HEXAGON_OBSTACLE_COLOR;
            ctx.shadowColor = flashColor || HEXAGON_OBSTACLE_COLOR;
            ctx.shadowBlur = 4;
            ctx.fill();
        }
        
        // デバッグ用：当たり判定の表示
        if (showHitbox) {
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // 点線
            ctx.beginPath();
            
            if (obs.type === "circle") {
                ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            } else if (obs.type === "rect") {
                ctx.rect(
                    obs.x - obs.width/2,
                    obs.y - obs.height/2,
                    obs.width,
                    obs.height
                );
            } else if (obs.type === "triangle") {
                // 三角形の頂点を描画
                ctx.moveTo(obs.x, obs.y - obs.size);
                ctx.lineTo(obs.x + obs.size * Math.sqrt(3) / 2, obs.y + obs.size / 2);
                ctx.lineTo(obs.x - obs.size * Math.sqrt(3) / 2, obs.y + obs.size / 2);
                ctx.closePath();
            } else if (obs.type === "pentagon") {
                // 五角形の頂点を描画
                for (let i = 0; i < 5; i++) {
                    let angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    let x = obs.x + Math.cos(angle) * obs.size;
                    let y = obs.y + Math.sin(angle) * obs.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
            } else if (obs.type === "diamond") {
                // ひし形の頂点を描画
                ctx.moveTo(obs.x, obs.y - obs.size); // 上
                ctx.lineTo(obs.x + obs.size, obs.y); // 右
                ctx.lineTo(obs.x, obs.y + obs.size); // 下
                ctx.lineTo(obs.x - obs.size, obs.y); // 左
                ctx.closePath();
            } else if (obs.type === "hexagon") {
                // 六角形の頂点を描画
                for (let i = 0; i < 6; i++) {
                    let angle = (Math.PI * 2 / 6) * i - Math.PI / 2; // -90度から開始で上向き
                    let x = obs.x + Math.cos(angle) * obs.size;
                    let y = obs.y + Math.sin(angle) * obs.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
            }
            
            ctx.stroke();
            ctx.setLineDash([]); // 点線を解除
        }
        
        ctx.restore();
    }
    // 赤玉の小玉も描画
    for (let b of redBullets) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, RED_BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#f66";
        ctx.shadowColor = "#a00";
        ctx.shadowBlur = 3; // 6から3に軽減
        ctx.fill();
        
        // デバッグ用：当たり判定の表示
        if (showHitbox) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]); // 細かい点線
            ctx.beginPath();
            ctx.arc(b.x, b.y, RED_BULLET_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // 点線を解除
        }
        
        ctx.restore();
    }

    // ミニひし形も描画
    for (let mini of diamondMinis) {
        ctx.save();
        ctx.globalAlpha = mini.alpha; // 透明度を適用
        ctx.beginPath();
        let size = DIAMOND_MINI_SIZE / 2;
        
        // ミニひし形の頂点を計算
        ctx.moveTo(mini.x, mini.y - size); // 上
        ctx.lineTo(mini.x + size, mini.y); // 右
        ctx.lineTo(mini.x, mini.y + size); // 下
        ctx.lineTo(mini.x - size, mini.y); // 左
        ctx.closePath();
        
        ctx.fillStyle = "#87ceeb"; // やや薄い水色
        ctx.shadowColor = "#00bfff";
        ctx.shadowBlur = 2;
        ctx.fill();
        
        // デバッグ用：当たり判定の表示（透明度0.3以上の場合のみ）
        if (showHitbox && mini.alpha >= 0.3) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]); // 細かい点線
            ctx.beginPath();
            ctx.arc(mini.x, mini.y, DIAMOND_MINI_SIZE/2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // 点線を解除
        }
        
        ctx.restore();
    }

    // 紫玉も描画
    for (let b of purpleBullets) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, HEXAGON_BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#9932cc"; // 濃い紫色
        ctx.shadowColor = "#8a2be2";
        ctx.shadowBlur = 3;
        ctx.fill();
        
        // デバッグ用：当たり判定の表示
        if (showHitbox) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]); // 細かい点線
            ctx.beginPath();
            ctx.arc(b.x, b.y, HEXAGON_BULLET_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]); // 点線を解除
        }
        
        ctx.restore();
    }
}

// 線分(p1, p2)から点(px, py)への最も近い点を求めるヘルパー関数
function closestPointOnSegment(px, py, p1x, p1y, p2x, p2y) {
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) { // p1 と p2 が同じ点の場合
        return { x: p1x, y: p1y };
    }

    // 距離を最小化する t を計算
    const t = ((px - p1x) * dx + (py - p1y) * dy) / lengthSq;

    // 線分の端点、または線分内の点を表すかを確認
    if (t < 0) {
        return { x: p1x, y: p1y }; // 最も近い点は p1
    }
    if (t > 1) {
        return { x: p2x, y: p2y }; // 最も近い点は p2
    }

    // 最も近い点は線分上にある
    return { x: p1x + t * dx, y: p1y + t * dy };
}

// 点 p3 が線分 (p1, p2) のどちら側にあるかを判断する関数
// 点が凸多角形の内側にあるかを判定するために使用
function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
    return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
}

// 衝突判定
function checkCollision(player, obs) {
    if (obs.type === "circle") {
        let dx = player.x - obs.x;
        let dy = player.y - obs.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        return dist < player.radius + obs.radius;
    } else if (obs.type === "rect") {
        // 四角形との衝突判定
        let closestX = Math.max(obs.x - obs.width/2, Math.min(player.x, obs.x + obs.width/2));
        let closestY = Math.max(obs.y - obs.height/2, Math.min(player.y, obs.y + obs.height/2));
        let dx = player.x - closestX;
        let dy = player.y - closestY;
        return (dx*dx + dy*dy) < (player.radius * player.radius);
    } else if (obs.type === "triangle") {
        const pX = player.x;
        const pY = player.y;
        const pR = player.radius;

        // 三角形の頂点 (描画ロジックに基づく)
        // 上の頂点: (obs.x, obs.y - obs.size)
        // 右下の頂点: (obs.x + obs.size * Math.sqrt(3) / 2, obs.y + obs.size / 2)
        // 左下の頂点: (obs.x - obs.size * Math.sqrt(3) / 2, obs.y + obs.size / 2)
        const v1x = obs.x;
        const v1y = obs.y - obs.size;

        const v2x = obs.x + obs.size * Math.sqrt(3) / 2;
        const v2y = obs.y + obs.size / 2;

        const v3x = obs.x - obs.size * Math.sqrt(3) / 2;
        const v3y = obs.y + obs.size / 2;

        // 1. プレイヤーの中心が三角形の内側にあるかチェック
        // 全てのクロス積の符号が同じ（またはゼロ）であれば、点が凸多角形の内側にある
        const s1 = sign(v1x, v1y, v2x, v2y, pX, pY);
        const s2 = sign(v2x, v2y, v3x, v3y, pX, pY);
        const s3 = sign(v3x, v3y, v1x, v1y, pX, pY);

        const hasNeg = (s1 < 0) || (s2 < 0) || (s3 < 0);
        const hasPos = (s1 > 0) || (s2 > 0) || (s3 > 0);

        // プレイヤーの中心が三角形の内側または辺上にあれば衝突
        if (!(hasNeg && hasPos)) {
            return true;
        }

        // 2. プレイヤーの中心が外側にある場合、各辺との衝突をチェック
        const edges = [
            { p1x: v1x, p1y: v1y, p2x: v2x, p2y: v2y }, // 右上の辺
            { p1x: v2x, p1y: v2y, p2x: v3x, p2y: v3y }, // 下の辺
            { p1x: v3x, p1y: v3y, p2x: v1x, p1y: v1y }  // 左下の辺
        ];

        for (const edge of edges) {
            const closest = closestPointOnSegment(pX, pY, edge.p1x, edge.p1y, edge.p2x, edge.p2y);
            const distSq = (pX - closest.x) * (pX - closest.x) + (pY - closest.y) * (pY - closest.y);
            if (distSq < pR * pR) {
                return true; // 辺との衝突を検出
            }
        }
        return false; // 衝突なし
    } else if (obs.type === "pentagon") {
        // 五角形との衝突判定（円形近似）
        let dx = player.x - obs.x;
        let dy = player.y - obs.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        return dist < player.radius + obs.size;
    }
    return false; // その他の障害物タイプ（全て処理済みだが念のため）
}

// 落下アニメーション開始
function startDeathAnimation() {
    player.isDying = true;
    player.deathVy = player.deathInitialVy; // 上向きの初期速度を設定
    // 落下効果音を再生
    audioManager.playSe('fall');
}


function animate() {
    // FPS計算
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    fpsFrameCount++;
    
    if (deltaTime >= fpsUpdateInterval) {
        fps = Math.round((fpsFrameCount * 1000) / deltaTime);
        fpsFrameCount = 0;
        lastTime = currentTime;
    }
    
    // BGM制御
    if (gameState === "title" && audioManager.currentBgm !== audioManager.bgm.title) {
        audioManager.playBgm('title');
    } else if (gameState === "playing" && audioManager.currentBgm !== audioManager.bgm.game) {
        audioManager.playBgm('game');
    } else if (gameState === "gameover") {
        audioManager.playGameoverBgm(); // 一回のみ再生
    }
    
    // ゲーム状態による分岐
    if (gameState === "title") {
        // タイトル画面（高度・背景・障害物は動かさない）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(offsetSky, offsetMount, offsetMountFar, groundLayers, clouds, extraClouds, planets, meteors, false, false);
        drawObstacles();
        ctx.save();
        ctx.font = "bold 54px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 8;
        ctx.textAlign = "center";
        ctx.strokeText("ばうんすばうんす", canvas.width/2, 260);
        ctx.fillText("ばうんすばうんす", canvas.width/2, 260);
        ctx.font = "bold 32px sans-serif";
        ctx.strokeText("スペースキーまたは画面をタップでスタート", canvas.width/2, 400);
        ctx.fillText("スペースキーまたは画面をタップでスタート", canvas.width/2, 400);
        // 最高到達点
        ctx.font = "bold 24px sans-serif";
        const titleDisplayMaxAltitude = isNightmareMode ? nightmareMaxAltitude : maxAltitude;
        const titleModeText = isNightmareMode ? " (ナイトメア)" : "";
        ctx.strokeText(`最高到達点: ${Math.floor(titleDisplayMaxAltitude)} m${titleModeText}`, canvas.width/2, 460);
        ctx.fillText(`最高到達点: ${Math.floor(titleDisplayMaxAltitude)} m${titleModeText}`, canvas.width/2, 460);
        
        // 現在のモード表示
        ctx.font = "bold 20px sans-serif";
        const modeText = isNightmareMode ? 'ナイトメアモード' : 'ノーマルモード';
        const modeColor = isNightmareMode ? '#ff6b6b' : '#00b894';
        ctx.fillStyle = modeColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(`現在: ${modeText}`, canvas.width/2, 500);
        ctx.fillText(`現在: ${modeText}`, canvas.width/2, 500);
        
        ctx.restore();
        if (gearIconHtml) gearIconHtml.style.display = 'block'; // 歯車アイコンを表示
        if (rankingIconHtml) rankingIconHtml.style.display = 'block'; // ランキングアイコンを表示
        if (gachaIconHtml) gachaIconHtml.style.display = 'block'; // ガチャアイコンを表示
        updateModeToggleButton(); // モード切り替えボタンを更新
        requestAnimationFrame(animate);
        return;
    }

    if (gameState === "gameover") {
        // ゲームオーバー画面（高度・背景・障害物は動かさない）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(offsetSky, offsetMount, offsetMountFar, groundLayers, clouds, extraClouds, planets, meteors, false, false);
        drawObstacles();
        drawPlayer();
        ctx.save();
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 8;
        ctx.textAlign = "center";
        ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2 - 40); // Y位置調整
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 40);
        ctx.font = "bold 28px sans-serif";
        ctx.strokeText("スペースキーまたは画面をタップでリトライ", canvas.width/2, canvas.height/2 + 20); // Y位置調整
        ctx.fillText("スペースキーまたは画面をタップでリトライ", canvas.width/2, canvas.height/2 + 20);

        // 到達高度表示
        ctx.font = "bold 24px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.strokeText(`到達高度: ${Math.floor(currentReachedAltitude)} m`, canvas.width/2, canvas.height/2 + 80); // Y位置調整
        ctx.fillText(`到達高度: ${Math.floor(currentReachedAltitude)} m`, canvas.width/2, canvas.height/2 + 80);

        // 最高到達点表示
        ctx.font = "bold 24px sans-serif"; // フォントサイズを統一
        const displayMaxAltitude = isNightmareMode ? nightmareMaxAltitude : maxAltitude;
        const maxModeText = isNightmareMode ? "(ナイトメア)" : "";
        ctx.strokeText(`最高到達点: ${Math.floor(displayMaxAltitude)} m ${maxModeText}`, canvas.width/2, canvas.height/2 + 120); // Y位置調整
        ctx.fillText(`最高到達点: ${Math.floor(displayMaxAltitude)} m ${maxModeText}`, canvas.width/2, canvas.height/2 + 120);

        // 新記録表示: ゲーム開始時の最高到達点より今回の到達高度が高ければ新記録
        const initialMax = isNightmareMode ? initialNightmareMaxAltitude : initialMaxAltitude;
        if (Math.floor(currentReachedAltitude) > Math.floor(initialMax)) {
            ctx.font = "bold 32px sans-serif";
            ctx.fillStyle = "#ff0";
            ctx.strokeStyle = "#c90";
            ctx.lineWidth = 6;
            ctx.strokeText("新記録！", canvas.width/2, canvas.height/2 + 180); // Y位置調整
            ctx.fillText("新記録！", canvas.width/2, canvas.height/2 + 180);
        }
        
        // ナイトメア開放通知
        if (!isNightmareMode && currentReachedAltitude >= 50000 && !nightmareUnlocked) {
            ctx.font = "bold 24px sans-serif";
            ctx.fillStyle = "#ff6b6b";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeText("ナイトメアモード開放！", canvas.width/2, canvas.height/2 + 200);
            ctx.fillText("ナイトメアモード開放！", canvas.width/2, canvas.height/2 + 200);
        }
        
        // 現在のモード表示
        ctx.font = "bold 20px sans-serif";
        const modeText = isNightmareMode ? 'ナイトメアモード' : 'ノーマルモード';
        const modeColor = isNightmareMode ? '#ff6b6b' : '#00b894';
        ctx.fillStyle = modeColor;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(`プレイモード: ${modeText}`, canvas.width/2, canvas.height/2 + 240);
        ctx.fillText(`プレイモード: ${modeText}`, canvas.width/2, canvas.height/2 + 240);
        
        // コイン獲得数表示
        if (currentGameCoins > 0) {
            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#FFD700"; // ゴールド色
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeText(`コイン獲得: ${currentGameCoins}枚`, canvas.width/2, canvas.height/2 + 280);
            ctx.fillText(`コイン獲得: ${currentGameCoins}枚`, canvas.width/2, canvas.height/2 + 280);
        } else {
            // コインを獲得しなかった場合
            ctx.font = "bold 18px sans-serif";
            ctx.fillStyle = "#ccc";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.strokeText("コイン獲得: 0枚 (高度1000m毎に1コイン)", canvas.width/2, canvas.height/2 + 280);
            ctx.fillText("コイン獲得: 0枚 (高度1000m毎に1コイン)", canvas.width/2, canvas.height/2 + 280);
        }
        
        ctx.restore();
        if (gearIconHtml) gearIconHtml.style.display = 'block'; // 歯車アイコンを表示
        if (rankingIconHtml) rankingIconHtml.style.display = 'block'; // ランキングアイコンを表示
        if (gachaIconHtml) gachaIconHtml.style.display = 'block'; // ガチャアイコンを表示
        updateModeToggleButton(); // モード切り替えボタンを更新
        requestAnimationFrame(animate);
        return;
    }

    // プレイ中のみ高度・背景・障害物を動かす
    if (gameState === "playing") {
        if (gearIconHtml) gearIconHtml.style.display = 'none'; // 歯車アイコンを非表示
        if (rankingIconHtml) rankingIconHtml.style.display = 'none'; // ランキングアイコンを非表示
        if (gachaIconHtml) gachaIconHtml.style.display = 'none'; // ガチャアイコンを非表示
        updateModeToggleButton(); // モード切り替えボタンを非表示にする

        offsetSky += 1 * speedMultiplier;
        offsetMountFar += 0.03 * speedMultiplier;
        offsetMount += 0.1 * speedMultiplier;
        for (let layer of groundLayers) {
            layer.offset += layer.speed * speedMultiplier;
        }

        frameCount++;

        // 雲の移動
        for (let cloud of clouds) {
            cloud.x += cloud.speedX * speedMultiplier;
            cloud.y += cloud.speedY * speedMultiplier;
            if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size;
            if (cloud.y < 30) cloud.y = 200 + Math.random() * 100;
            if (cloud.y > 250) cloud.y = 50 + Math.random() * 50;
        }

        // 高度が一定以上なら雲を徐々に増やす（何百フレームに1回）
        let cloudThreshold = 10000;
        if (
            offsetSky > cloudThreshold &&
            extraClouds.length < maxExtraClouds &&
            frameCount % cloudAddInterval === 0
        ) {
            extraClouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * 300 + 30,
                size: Math.random() * 40 + 20,
                speedX: Math.random() * 0.7 + 0.1,
                speedY: 0 // 初期値は0
            });
        }

        // 追加雲の移動
        for (let cloud of extraClouds) {
            cloud.x += cloud.speedX * speedMultiplier;
            if (offsetSky > cloudThreshold) {
                cloud.speedY = Math.max(Math.abs(cloud.speedY), 0.02);
            }
            cloud.y += cloud.speedY * speedMultiplier;
            if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size;
            if (cloud.y > 800) cloud.y = 30 + Math.random() * 100;
        }

        // 雲のフェードアウトが完了したらclouds/extraCloudsを消す
        let fadeCloudStart = 50000;
        let fadeCloudEnd = 60000;
        let t2 = 0;
        if (offsetSky > fadeCloudStart) {
            t2 = Math.min((offsetSky - fadeCloudStart) / (fadeCloudEnd - fadeCloudStart), 1);
            if (t2 >= 1) {
                clouds = [];
                extraClouds = [];
            }
        }

        // 惑星の追加（10万m以上で1個だけ。画面外に出たら次を追加）
        if (offsetSky > 100000) {
            if (planets.length === 0) {
                const hasRing = Math.random() < 0.4;
                const ringColor = ["#fff", "#ffe6b3", "#b3e0ff", "#e6b3ff"][Math.floor(Math.random() * 4)];
                const ringAngle = Math.random() * Math.PI;
                const pattern = Math.random() < 0.5 ? "stripe" : "dot";
                const radius = Math.random() * (PLANET_MAX_RADIUS - PLANET_MIN_RADIUS) + PLANET_MIN_RADIUS;
                const shapeRand = Math.random();
                let shape = "circle";
                let sides = 6;
                if (shapeRand < 0.33) shape = "diamond";
                else if (shapeRand < 0.66) {
                    shape = "polygon";
                    sides = Math.floor(Math.random() * 3) + 5;
                }
                planets.push({
                    x: Math.random() * canvas.width,
                    y: -radius - Math.random() * 100,
                    radius: radius,
                    color: PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)],
                    vy: PLANET_FALL_SPEED * (0.7 + Math.random() * 0.6),
                    hasRing,
                    ringColor,
                    ringAngle,
                    pattern,
                    shape,
                    sides
                });
            }
        }

        // 惑星の移動
        for (let p of planets) {
            p.y += p.vy * speedMultiplier;
        }
        if (planets.length > 0 && planets[0].y - planets[0].radius >= canvas.height + 50) {
            planets.shift();
        }

        // 隕石の追加（10万m以上で最大3個まで）
        if (offsetSky > 100000 && meteors.length < METEOR_MAX && frameCount % 120 === 0) { // 80から120に変更
            let radius = Math.random() * (METEOR_MAX_RADIUS - METEOR_MIN_RADIUS) + METEOR_MIN_RADIUS;
            meteors.push({
                x: Math.random() * canvas.width,
                y: -radius - Math.random() * 100,
                radius: radius,
                color: METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)],
                vy: Math.random() * (METEOR_FALL_SPEED_MAX - METEOR_FALL_SPEED_MIN) + METEOR_FALL_SPEED_MIN
            });
        }

        // 隕石の移動
        for (let m of meteors) {
            m.y += m.vy * speedMultiplier;
        }
        meteors = meteors.filter(m => m.y - m.radius < canvas.height + 50);

        // プレイヤー操作
        if (!player.isDying) {
            if (keyLeft) {
                player.vx = -6;
                player.isMoving = true;
                player.facingLeft = true;
            } else if (keyRight) {
                player.vx = 6;
                player.isMoving = true;
                player.facingLeft = false;
            } else {
                player.vx *= 0.7;
                player.isMoving = false;
            }
            player.x += player.vx;
            if (player.x - player.radius < 0) player.x = player.radius;
            if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
        } else {
            // 落下アニメーション中
            player.deathVy += player.deathGravity;
            player.y += player.deathVy;
            
            // 画面下に落ちたらゲームオーバー状態にする
            if (player.y > canvas.height + 100) {
                isGameOver = true;
                gameState = "gameover";
                currentReachedAltitude = offsetSky; // ゲームオーバー時の高度を記録
                
                // コイン獲得（高度1000につき1コイン）
                addCoins(Math.floor(currentReachedAltitude));
                
                // ナイトメアモード開放判定（高度50000以上到達かつ通常モード）
                let shouldUnlockNightmare = !isNightmareMode && currentReachedAltitude >= 50000 && !nightmareUnlocked;
                
                // データ送信（ナイトメアモードの場合はn-altitudeに記録）
                if (isNightmareMode) {
                    saveUserData(userId, null, Math.floor(currentReachedAltitude), null, Math.floor(maxAltitude), null, null, null)


                } else {
                    // ナイトメアモード開放フラグを含めてデータ送信
                    saveUserData(userId, null, Math.floor(currentReachedAltitude), Math.floor(maxAltitude), null, shouldUnlockNightmare, null, null)
                }
                
                // ナイトメアモード開放処理（UI更新のみ）
                if (shouldUnlockNightmare) {
                    unlockNightmareMode(userId);
                }
            }
        }

        // 障害物生成
        let currentInterval = isNightmareMode ? NIGHTMARE_OBSTACLE_INTERVAL : OBSTACLE_INTERVAL;
        if (frameCount % currentInterval === 0) {
            let obstacleCount = 1; // 常に1体ずつ生成
            
            for (let i = 0; i < obstacleCount; i++) {
                let rand = Math.random();
                let type;
                
                if (isNightmareMode) {
                    // ナイトメアモードでは最初から全種類の障害物が出現
                    let typeRand = Math.random();
                    if (typeRand < 0.16) { // 16.67%
                        type = "circle";
                    } else if (typeRand < 0.33) { // 16.67%
                        type = "rect";
                    } else if (typeRand < 0.5) { // 16.67%
                        type = "triangle";
                    } else if (typeRand < 0.66) { // 16.67%
                        type = "pentagon";
                    } else if (typeRand < 0.83) { // 16.67%
                        type = "diamond";
                    } else { // 16.67%
                        type = "hexagon";
                    }
                } else {
                    // 通常モードの障害物生成ロジック
                    if (offsetSky >= 50000) {
                        if (rand < 0.4) { // Hexagon (purple) - 赤円の代わり
                            type = "hexagon";
                        } else if (rand < 0.7) { // Pentagon (orange) - 青棒の代わり
                            type = "pentagon";
                        } else { // Diamond (light blue) - 三角の代わり
                            type = "diamond";
                        }
                    } else {
                        // 通常の障害物生成
                        if (rand < 0.4) { // Circle (red)
                            type = "circle";
                        } else if (rand < 0.8) { // Rect (blue)
                            type = "rect";
                        } else { // Triangle (green)
                            type = "triangle";
                        }
                    }
                }
            
                // 障害物を生成（既存のコードはそのまま使用）
                if (type === "circle") {
                obstacles.push({
                    type: "circle",
                    x: Math.random() * (canvas.width - OBSTACLE_RADIUS*2) + OBSTACLE_RADIUS,
                    y: -OBSTACLE_RADIUS,
                    radius: OBSTACLE_RADIUS,
                    vy: OBSTACLE_SPEED + Math.random() * 2
                });
            } else if (type === "rect") {
                obstacles.push({
                    type: "rect",
                    x: Math.random() * (canvas.width - OBSTACLE_WIDTH) + OBSTACLE_WIDTH/2,
                    y: -OBSTACLE_HEIGHT,
                    width: OBSTACLE_WIDTH,
                    height: OBSTACLE_HEIGHT,
                    vy: OBSTACLE_SPEED + Math.random() * 2
                });
            } else if (type === "pentagon") {
                obstacles.push({
                    type: "pentagon",
                    x: Math.random() * (canvas.width - PENTAGON_OBSTACLE_SIZE * 2) + PENTAGON_OBSTACLE_SIZE,
                    y: -PENTAGON_OBSTACLE_SIZE,
                    size: PENTAGON_OBSTACLE_SIZE,
                    vy: OBSTACLE_SPEED + Math.random() * 2,
                    cloneTimer: 0,
                    hasCloned: false, // クローンを一度だけ作るためのフラグ
                    isClone: false // クローン体かどうかのフラグ
                });
            } else if (type === "diamond") {
                obstacles.push({
                    type: "diamond",
                    x: Math.random() * (canvas.width - DIAMOND_OBSTACLE_SIZE * 2) + DIAMOND_OBSTACLE_SIZE,
                    y: -DIAMOND_OBSTACLE_SIZE,
                    originalY: -DIAMOND_OBSTACLE_SIZE, // 元の位置を保存
                    size: DIAMOND_OBSTACLE_SIZE,
                    vy: OBSTACLE_SPEED + Math.random() * 2,
                    originalVy: OBSTACLE_SPEED + Math.random() * 2, // 元の速度を保存
                    detectionTimer: 0,
                    state: "normal", // "normal", "detected", "waiting", "rushing"
                    waitTimer: 0,
                    flashTimer: 0,
                    flashCount: 0,
                    miniShotCount: 0, // ミニひし形の発射回数
                    rushDistance: 0 // 突進距離を記録
                });
            } else if (type === "triangle") {
                obstacles.push({
                    type: "triangle",
                    x: Math.random() * (canvas.width - TRIANGLE_OBSTACLE_SIZE * 2) + TRIANGLE_OBSTACLE_SIZE,
                    y: -TRIANGLE_OBSTACLE_SIZE,
                    size: TRIANGLE_OBSTACLE_SIZE,
                    vy: OBSTACLE_SPEED + Math.random() * 2,
                    shootTimer: 0,
                    hasShotShockwave: false, // 衝撃波を一度だけ放つためのフラグ
                    shockwaves: [] // 各三角は自身の衝撃波を持つ
                });
            } else if (type === "hexagon") {
                obstacles.push({
                    type: "hexagon",
                    x: Math.random() * (canvas.width - HEXAGON_OBSTACLE_SIZE * 2) + HEXAGON_OBSTACLE_SIZE,
                    y: -HEXAGON_OBSTACLE_SIZE,
                    size: HEXAGON_OBSTACLE_SIZE,
                    vy: OBSTACLE_SPEED + Math.random() * 2,
                    shootTimer: 0,
                    hasShotBullets: false, // 弾を一度だけ放つためのフラグ
                    flashTimer: 0,
                    flashDuration: 12
                });
            }
            } // forループの終了
        }

        // 障害物移動
        for (let obs of obstacles) {
            obs.y += obs.vy * speedMultiplier;
        }
        // 障害物の画面外削除フィルターを更新 (三角のサイズも考慮)
        obstacles = obstacles.filter(obs => obs.y - (obs.radius || obs.height/2 || obs.size) < canvas.height + 50);

        // --- 障害物の特性処理 ---
        // 赤玉: 一定時間後に4方向に小玉を1回だけ発射
        for (let obs of obstacles) {
            if (obs.type === "circle") {
                if (obs.shootTimer === undefined) {
                    obs.shootTimer = 0;
                    obs.hasShot = false;
                }
                obs.shootTimer++;
                if (!obs.hasShot && obs.shootTimer > 40) { // 40フレーム後に1回だけ
                    obs.hasShot = true;
                    // フラッシュエフェクトを開始
                    obs.flashTimer = 10; // 10フレーム持続
                    obs.flashDuration = 10;
                    
                    // 効果音再生
                    audioManager.playSe('circle');
                    
                    for (let i = 0; i < 4; i++) {
                        let angle = Math.random() * Math.PI * 2 + i * Math.PI / 2;
                        redBullets.push({
                            x: obs.x,
                            y: obs.y,
                            vx: Math.cos(angle) * RED_BULLET_SPEED,
                            vy: Math.sin(angle) * RED_BULLET_SPEED
                        });
                    }
                }
                
                // フラッシュエフェクトタイマーを更新
                if (obs.flashTimer !== undefined && obs.flashTimer > 0) {
                    obs.flashTimer--;
                }
            }
            // 青棒: 一定間隔で左右に伸び縮み
            else if (obs.type === "rect") {
                if (obs.stretchTimer === undefined) {
                    obs.stretchTimer = Math.random() * 60;
                    obs.stretchDir = 1;
                }
                obs.stretchTimer++;
                if (obs.stretchTimer > 30) {
                    obs.stretchDir *= -1;
                    obs.stretchTimer = 0;
                }
                let stretch = Math.sin(obs.stretchTimer / 30 * Math.PI) * 0.5 + 1;
                obs.width = OBSTACLE_WIDTH * stretch;
                obs.height = OBSTACLE_HEIGHT; // 高さは固定

            }
            // オレンジの五角形: 一定時間後にクローンを1体作成
            else if (obs.type === "pentagon") {
                obs.cloneTimer++;
                // hasCloned フラグを追加し、一度だけクローンするように変更
                if (!obs.hasCloned && !obs.isClone && obs.cloneTimer >= PENTAGON_CLONE_INTERVAL) {
                    obs.cloneTimer = 0; // タイマーをリセット
                    obs.hasCloned = true; // クローンを作ったことを記録

                    // フラッシュエフェクトを開始
                    obs.flashTimer = 12; // 12フレーム持続
                    obs.flashDuration = 12;

                    // クローン効果音を再生
                    audioManager.playSe('clone');

                    // クローンを作成（本体の周りにランダムな位置）
                    let cloneAngle = Math.random() * Math.PI * 2;
                    let cloneDistance = PENTAGON_OBSTACLE_SIZE * 3; // 本体から3倍の距離
                    let cloneX = obs.x + Math.cos(cloneAngle) * cloneDistance;
                    let cloneY = obs.y + Math.sin(cloneAngle) * cloneDistance;
                    
                    // 画面内に収まるように調整
                    cloneX = Math.max(PENTAGON_OBSTACLE_SIZE, Math.min(canvas.width - PENTAGON_OBSTACLE_SIZE, cloneX));
                    cloneY = Math.max(-PENTAGON_OBSTACLE_SIZE, cloneY);

                    obstacles.push({
                        type: "pentagon",
                        x: cloneX,
                        y: cloneY,
                        size: PENTAGON_OBSTACLE_SIZE,
                        vy: obs.vy, // 本体と同じ速度
                        cloneTimer: 0,
                        hasCloned: true, // クローンはクローンを作らない
                        isClone: true // クローン体フラグ
                    });
                }
                
                // フラッシュエフェクトタイマーを更新
                if (obs.flashTimer !== undefined && obs.flashTimer > 0) {
                    obs.flashTimer--;
                }
            }
            // 水色ひし形: プレイヤーが直下にいると突進してくる
            else if (obs.type === "diamond") {
                // プレイヤーが下にいるかをチェック（横方向の範囲内）
                let playerInRange = Math.abs(player.x - obs.x) < DIAMOND_DETECT_RANGE && 
                                  player.y > obs.y; // プレイヤーが下にいる
                
                if (obs.state === "normal") {
                    if (playerInRange) {
                        obs.state = "detected";
                        obs.vy = 0; // 停止
                        obs.flashTimer = 8; // フラッシュ開始
                        obs.flashCount = 0;
                        obs.waitTimer = 0;
                        // 警告音を再生
                        audioManager.playSe('warning');
                    }
                } else if (obs.state === "detected") {
                    obs.waitTimer++;
                    
                    // フラッシュ処理（2回）
                    if (obs.flashTimer > 0) {
                        obs.flashTimer--;
                        if (obs.flashTimer === 0) {
                            obs.flashCount++;
                            if (obs.flashCount < 2) {
                                obs.flashTimer = 8; // 次のフラッシュ
                            }
                        }
                    }
                    
                    // 待機時間が終了したら突進開始
                    if (obs.waitTimer >= DIAMOND_WAIT_TIME) {
                        obs.state = "rushing";
                        obs.vy = DIAMOND_RUSH_SPEED; // 突進速度
                        obs.flashTimer = 6; // 突進時のフラッシュ
                        obs.miniShotCount = 0;
                        obs.rushDistance = 0; // 突進距離をリセット
                        obs.originalY = obs.y; // 突進開始位置を記録
                        // 突進効果音を再生
                        audioManager.playSe('fastfall');
                    }
                } else if (obs.state === "rushing") {
                    // 突進中の加速度（どんどん早くなる）
                    obs.vy += 0.2; // 毎フレーム0.2ずつ加速
                    obs.rushDistance += obs.vy; // 突進距離を加算
                    
                    // 突進中のフラッシュ
                    if (obs.flashTimer > 0) {
                        obs.flashTimer--;
                    }
                    
                    // ミニひし形を30ピクセル毎に発射（画面下まで継続）
                    if (Math.floor(obs.rushDistance / 30) > obs.miniShotCount) {
                        obs.miniShotCount++;
                        
                        // 左右にミニひし形を発射
                        for (let direction of [-1, 1]) {
                            diamondMinis.push({
                                x: obs.x,
                                y: obs.y,
                                vx: direction * DIAMOND_MINI_SPEED,
                                vy: DIAMOND_MINI_SPEED * 0.5,
                                maxDistance: DIAMOND_MINI_RANGE,
                                traveledDistance: 0,
                                alpha: 1.0, // 初期透明度
                                fadeSpeed: 0.015 // フェードアウト速度
                            });
                        }
                    }
                }
            }
            // 紫の六角形: 6方向にランダムな方向で紫玉を発射
            else if (obs.type === "hexagon") {
                obs.shootTimer++;
                // hasShotBullets フラグを追加し、一度だけ発射するように変更
                if (!obs.hasShotBullets && obs.shootTimer >= HEXAGON_SHOOT_INTERVAL) {
                    obs.shootTimer = 0; // タイマーをリセット
                    obs.hasShotBullets = true; // 弾を放ったことを記録

                    // フラッシュエフェクトを開始
                    obs.flashTimer = 12; // 12フレーム持続
                    obs.flashDuration = 12;

                    // 効果音再生
                    audioManager.playSe('circle');

                    // 6方向にランダムな角度で紫玉を発射
                    for (let i = 0; i < 6; i++) {
                        // ランダムな基準角度 + 60度ずつずらした6方向
                        let baseAngle = Math.random() * Math.PI * 2; // 0-360度のランダム
                        let angle = baseAngle + (i * Math.PI / 3); // 60度ずつ
                        
                        purpleBullets.push({
                            x: obs.x,
                            y: obs.y,
                            vx: Math.cos(angle) * HEXAGON_BULLET_SPEED,
                            vy: Math.sin(angle) * HEXAGON_BULLET_SPEED
                        });
                    }
                }
                
                // フラッシュエフェクトタイマーを更新
                if (obs.flashTimer !== undefined && obs.flashTimer > 0) {
                    obs.flashTimer--;
                }
            }
            // 緑の三角: 自機に向かって衝撃波を放つ
            else if (obs.type === "triangle") {
                obs.shootTimer++;
                // hasShotShockwave フラグを追加し、一度だけ発射するように変更
                if (!obs.hasShotShockwave && obs.shootTimer >= TRIANGLE_SHOOT_INTERVAL) {
                    obs.shootTimer = 0; // タイマーをリセット
                    obs.hasShotShockwave = true; // 衝撃波を放ったことを記録

                    // フラッシュエフェクトを開始
                    obs.flashTimer = 12; // 12フレーム持続
                    obs.flashDuration = 12;

                    // 効果音再生
                    audioManager.playSe('triangle');

                    // プレイヤーへの角度を計算
                    let angleToPlayer = Math.atan2(player.y - obs.y, player.x - obs.x);
                    let startAngle = angleToPlayer - SHOCKWAVE_ARC_ANGLE / 2;
                    let endAngle = angleToPlayer + SHOCKWAVE_ARC_ANGLE / 2;

                    obs.shockwaves.push({
                        x: obs.x,
                        y: obs.y,
                        currentRadius: SHOCKWAVE_INITIAL_RADIUS,
                        startAngle: startAngle,
                        endAngle: endAngle,
                        alpha: 1.0,
                        speed: SHOCKWAVE_SPEED,
                        fadeSpeed: SHOCKWAVE_FADE_SPEED
                    });
                }

                // 衝撃波の更新とフィルタリング
                for (let i = obs.shockwaves.length - 1; i >= 0; i--) {
                    let sw = obs.shockwaves[i];
                    sw.currentRadius += sw.speed * speedMultiplier;
                    
                    // 当たり判定がある間は通常の透明化速度、なくなったら高速化
                    if (sw.alpha > SHOCKWAVE_MIN_ALPHA_FOR_COLLISION) {
                        sw.alpha -= sw.fadeSpeed * speedMultiplier;
                    } else {
                        // 当たり判定がなくなったら透明化を3倍速にする
                        sw.alpha -= sw.fadeSpeed * speedMultiplier * 3;
                    }

                    // 最大半径のチェックを削除し、アルファ値のみで消滅を判断
                    if (sw.alpha <= 0) {
                        obs.shockwaves.splice(i, 1); // 透明になった衝撃波を削除
                    }
                }
                
                // フラッシュエフェクトタイマーを更新
                if (obs.flashTimer !== undefined && obs.flashTimer > 0) {
                    obs.flashTimer--;
                }
            }
        }

        // 赤玉小玉の移動
        for (let b of redBullets) {
            b.x += b.vx;
            b.y += b.vy;
        }
        // 画面外の小玉を削除
        redBullets = redBullets.filter(b =>
            b.x > -RED_BULLET_RADIUS && b.x < canvas.width + RED_BULLET_RADIUS &&
            b.y > -RED_BULLET_RADIUS && b.y < canvas.height + RED_BULLET_RADIUS
        );

        // ミニひし形の移動とライフ管理
        for (let j = diamondMinis.length - 1; j >= 0; j--) {
            let mini = diamondMinis[j];
            mini.x += mini.vx;
            mini.y += mini.vy;
            mini.traveledDistance += Math.sqrt(mini.vx * mini.vx + mini.vy * mini.vy);
            
            // フェードアウト処理
            mini.alpha -= mini.fadeSpeed;
            if (mini.alpha < 0) mini.alpha = 0;
            
            // 射程距離を超えるか画面外に出たら削除
            if (mini.traveledDistance > mini.maxDistance || 
                mini.y > canvas.height + 50 || 
                mini.x < -50 || 
                mini.x > canvas.width + 50 ||
                mini.alpha <= 0) {
                diamondMinis.splice(j, 1);
            }
        }

        // 紫玉の移動
        for (let b of purpleBullets) {
            b.x += b.vx;
            b.y += b.vy;
        }
        // 画面外の紫玉を削除
        purpleBullets = purpleBullets.filter(b =>
            b.x > -HEXAGON_BULLET_RADIUS && b.x < canvas.width + HEXAGON_BULLET_RADIUS &&
            b.y > -HEXAGON_BULLET_RADIUS && b.y < canvas.height + HEXAGON_BULLET_RADIUS
        );

        // 衝突判定（落下中でない場合のみ）
        if (!player.isDying) {
            for (let obs of obstacles) {
                if (checkCollision(player, obs)) {
                    // 効果音再生
                    audioManager.playSe('hit');
                    // 落下アニメーション開始
                    startDeathAnimation();
                    break; // 衝突時は障害物ループを抜ける
                }
                // 三角の衝撃波との衝突判定
                if (obs.type === "triangle") {
                    for (let sw of obs.shockwaves) {
                        // 衝撃波の不透明度が一定値より高い場合のみ当たり判定を行う
                        if (sw.alpha > SHOCKWAVE_MIN_ALPHA_FOR_COLLISION) {
                            let dx = player.x - sw.x;
                            let dy = player.y - sw.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);

                        // プレイヤーが衝撃波の「厚み」の範囲内にいるかチェック
                        const SHOCKWAVE_COLLISION_BAND = 10; // 衝撃波の線周りの衝突判定帯域
                        const minEffectiveRadius = sw.currentRadius - SHOCKWAVE_COLLISION_BAND / 2;
                        const maxEffectiveRadius = sw.currentRadius + SHOCKWAVE_COLLISION_BAND / 2;

                        if (dist >= minEffectiveRadius && dist <= maxEffectiveRadius) {
                            // プレイヤーの角度が衝撃波の扇の範囲内にあるかチェック
                            let angleToPlayerFromShockwaveOrigin = Math.atan2(player.y - sw.y, player.x - sw.x);
                            // 角度を0から2*PIの範囲に正規化
                            let normalizedPlayerAngle = (angleToPlayerFromShockwaveOrigin + Math.PI * 2) % (Math.PI * 2);
                            let normalizedStartAngle = (sw.startAngle + Math.PI * 2) % (Math.PI * 2);
                            let normalizedEndAngle = (sw.endAngle + Math.PI * 2) % (Math.PI * 2);

                            let isInArc = false;
                            if (normalizedStartAngle <= normalizedEndAngle) {
                                isInArc = (normalizedPlayerAngle >= normalizedStartAngle && normalizedPlayerAngle <= normalizedEndAngle);
                            } else { // 扇が0/2*PI境界をまたぐ場合 (例: 3PI/2 から PI/2)
                                isInArc = (normalizedPlayerAngle >= normalizedStartAngle || normalizedPlayerAngle <= normalizedEndAngle);
                            }

                            if (isInArc) {
                                // 効果音再生
                                audioManager.playSe('hit');
                                // 落下アニメーション開始
                                startDeathAnimation();
                                break; // 衝撃波ループを抜ける
                            }
                        }
                    }
                }
            }
        }
        // 赤玉小玉との衝突判定（落下中でない場合のみ）
        if (!player.isDying) {
            for (let b of redBullets) {
                let dx = player.x - b.x;
                let dy = player.y - b.y;
                if (dx*dx + dy*dy < (player.radius + RED_BULLET_RADIUS) * (player.radius + RED_BULLET_RADIUS)) {
                    // 効果音再生
                    audioManager.playSe('hit');
                    // 落下アニメーション開始
                    startDeathAnimation();
                    break; // 衝突時は赤玉ループを抜ける
                }
            }
        }

        // ミニひし形との衝突判定（落下中でない場合のみ）
        if (!player.isDying) {
            for (let j = diamondMinis.length - 1; j >= 0; j--) {
                let mini = diamondMinis[j];
                // 透明度が0.3以上の場合のみ当たり判定
                if (mini.alpha >= 0.3) {
                    let dx = player.x - mini.x;
                    let dy = player.y - mini.y;
                    if (dx*dx + dy*dy < (player.radius + DIAMOND_MINI_SIZE/2) * (player.radius + DIAMOND_MINI_SIZE/2)) {
                        // 効果音再生
                        audioManager.playSe('hit');
                        // 落下アニメーション開始
                        startDeathAnimation();
                        break; // 衝突時はループを抜ける
                    }
                }
            }
        }

        // 紫玉との衝突判定（落下中でない場合のみ）
        if (!player.isDying) {
            for (let b of purpleBullets) {
                let dx = player.x - b.x;
                let dy = player.y - b.y;
                if (dx*dx + dy*dy < (player.radius + HEXAGON_BULLET_RADIUS) * (player.radius + HEXAGON_BULLET_RADIUS)) {
                    // 効果音再生
                    audioManager.playSe('hit');
                    // 落下アニメーション開始
                    startDeathAnimation();
                    break; // 衝突時は紫玉ループを抜ける
                }
            }
        }

    } // gameState === "playing" の終了

        if (offsetSky > maxAltitude) {
            maxAltitude = offsetSky;
            // ナイトメアモードの場合はナイトメア最高到達点も更新
            if (isNightmareMode && offsetSky > nightmareMaxAltitude) {
                nightmareMaxAltitude = offsetSky;
            }
            // ここでは直接スプレッドシートに保存せず、ゲームオーバー時にまとめて送信
        } else if (isNightmareMode && offsetSky > nightmareMaxAltitude) {
            // ナイトメアモードで、通常の最高到達点は超えないがナイトメア最高到達点は超える場合
            nightmareMaxAltitude = offsetSky;
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ゲーム中のみ高度・最高到達点表示
    drawBackground(
        offsetSky, offsetMount, offsetMountFar, groundLayers, clouds, extraClouds, planets, meteors,
        gameState === "playing", // showAltitude
        gameState === "playing"  // showMaxAltitude
    );
    drawObstacles();
    if (gameState === "playing" || gameState === "gameover") {
        drawPlayer();
    }
    
    // FPS表示（デバッグ用）
    if (showFps) {
        ctx.save();
        ctx.font = "16px monospace";
        ctx.fillStyle = "#ff0000";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.textAlign = "left";
        const fpsText = `FPS: ${fps}`;
        ctx.strokeText(fpsText, 10, 30);
        ctx.fillText(fpsText, 10, 30);
        ctx.restore();
    }
    
    // 歯車アイコンはHTMLで描画されるため、ここでは描画しない
    // オプションポップアップもHTMLで描画されるため、ここでは描画しない
    requestAnimationFrame(animate);
}

// ゲーム初期化時に見た目選択機能を設定
document.addEventListener('DOMContentLoaded', function() {
    // DOM要素が読み込まれてから見た目選択イベントリスナーを設定
    setTimeout(() => {
        initializeSkinSelection();
    }, 100);
});

const gasWebAppUrl = 'https://script.google.com/macros/s/AKfycbzNCJdLk_39Q7H8VnIFelFfJmUuWD1ywIhqvCtYXdOvX-MKUZVYb3wEowVmeOMrzm7L/exec'; 
//v22
// Google Sheetにスコアを送信する関数
function sendScoreToGoogleSheet(currentScore, maxReachedAltitude, userId, userName, unlockNightmare = false, nightmareAltitude = null, isNightmare) { // パラメータ追加

    if (gasWebAppUrl === 'YOUR_DEPLOYED_GAS_WEB_APP_URL_HERE') {
        console.warn("Google Apps ScriptのウェブアプリURLが設定されていません。データを送信できません。");
        return;
    }

    console.log(currentScore, maxReachedAltitude, userId, userName)

    const formData = new URLSearchParams();
    formData.append("score", currentScore); // 現在の到達高度
    formData.append("altitude", maxReachedAltitude); // 最高到達点
    formData.append("userId", userId);
    formData.append("userName", userName); // ユーザー名を追加
    formData.append("coins", playerCoins); // コイン数を追加
    formData.append("unlockedSkins", unlockedSkins.join(',')); // 解放済みスキンをカンマ区切り文字列で追加
    if (isNightmare == false) {
        formData.append("nightmare", unlockNightmare ? 'true' : 'false'); // ナイトメアモード開放フラグ
    }
    
    // ナイトメアモードの最高到達点（通常モードまたはナイトメアモード用）
    if (isNightmareMode && nightmareAltitude !== null) {
        formData.append("n-altitude", nightmareAltitude); // ナイトメアモードの最高到達点
    } else {
        formData.append("altitude", maxReachedAltitude); // 通常は最高到達点と同じ
    }

    fetch(gasWebAppUrl, {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
    })
    .then(res => res.json())
    .then(data => console.log("成功:", data))
    .catch(err => console.error("エラー:", err));
}

/**
 * データ保存関数
 * @param {String} userId 必須
 * @param {String} username 
 * @param {Number} score 
 * @param {Number} altitude 
 * @param {Number} nightmareAltitude 
 * @param {Boolean} nightmare 
 * @param {Number} coins 
 * @param {String} unlockedSkins 
 * @returns 
 */
function saveUserData(userId, username=null, score=null, altitude=null, nightmareAltitude=null, nightmare=null, coins=null, unlockedSkins=null) {
    if (!userId) {
        console.warn("ユーザーIDが指定されていません。データを保存できません。");
        return;
    }

    console.log({ userId, username, score, altitude, nightmareAltitude, nightmare, coins, unlockedSkins });
    console.log(score !== null, altitude !== null, nightmareAltitude !== null, nightmare !== null, coins !== null, unlockedSkins !== null);

    const formData = new URLSearchParams();
    formData.append("userId", userId);
    if (username) formData.append("userName", username);
    if (score !== null) formData.append("score", score);
    if (altitude !== null) formData.append("altitude", altitude);
    if (nightmareAltitude !== null) formData.append("n-altitude", nightmareAltitude);
    if (nightmare !== null) formData.append("nightmare", nightmare ? 'true' : 'false');
    if (coins !== null) formData.append("coins", coins);
    if (unlockedSkins !== null) formData.append("unlockedSkins", Array.isArray(unlockedSkins) ? unlockedSkins.join(',') : unlockedSkins);

    fetch(gasWebAppUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log("ユーザーデータ保存成功:", data);
    })
    .catch(err => {
        console.error("ユーザーデータ保存エラー:", err);
    });
}


//これはげっと関数
async function fetchUData(userId) {
  try {
    const url = new URL(gasWebAppUrl);
    url.searchParams.append("userId", userId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const json = await response.json();

    if (json.result === "success") {
      console.log("取得データ:", json.data);
      return json.data;
    } else {
      console.warn("取得失敗:", json.message);
      return null;
    }
  } catch (err) {
    console.error("通信エラー:", err);
  }
}

//全データ取得関数
async function AllFetchData() {
    try {
        const response = await fetch(gasWebAppUrl+"?mode=fetchAll", { // response変数が定義されていなかったので追加
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        const json = await response.json();

        if (json.result === "success") {
            console.log("取得データ:", json.data);
            return json.data;
        } else {
            console.warn("取得失敗:", json.message);
            return null;
        }
    } catch (err) {
        console.error("通信エラー:", err);
    }
}

// オプションポップアップ関連の変数
let showOptionsPopup = false;
let tempUserName = ""; // ポップアップ表示中の一時的なユーザー名

// HTML要素の参照
const optionsPopupOverlay = document.getElementById('options-popup-overlay');
const userNameInput = document.getElementById('userNameInput');
const displayUserId = document.getElementById('displayUserId');
const closeOptionsButton = document.getElementById('closeOptionsButton');
const applyOptionsButton = document.getElementById('applyOptionsButton');
const howToPlayButton = document.getElementById('howToPlayButton');
const gearIconHtml = document.getElementById('gear-icon-html');

// 遊び方ポップアップ関連のHTML要素
const howToPlayPopupOverlay = document.getElementById('how-to-play-popup-overlay');
const closeHowToPlayButton = document.getElementById('closeHowToPlayButton');

// ランキング関連のHTML要素
const rankingPopupOverlay = document.getElementById('ranking-popup-overlay');
const rankingList = document.getElementById('rankingList');
const closeRankingButton = document.getElementById('closeRankingButton');
const rankingIconHtml = document.getElementById('ranking-icon-html');
const normalRankingTab = document.getElementById('normal-ranking-tab');
const nightmareRankingTab = document.getElementById('nightmare-ranking-tab');

// ガチャ関連のHTML要素
const gachaPopupOverlay = document.getElementById('gacha-popup-overlay');
const gachaIconHtml = document.getElementById('gacha-icon-html');
const closeGachaButton = document.getElementById('closeGachaButton');
const gachaButton = document.getElementById('gachaButton');
const coinAmount = document.getElementById('coinAmount');
const gachaResultArea = document.getElementById('gachaResultArea');
const gachaAnimation = document.getElementById('gachaAnimation');
const gachaResult = document.getElementById('gachaResult');

// ガチャ要素の存在確認（デバッグ用）
console.log("Gacha elements check:");
console.log("gachaPopupOverlay:", gachaPopupOverlay);
console.log("gachaIconHtml:", gachaIconHtml);
console.log("gachaButton:", gachaButton);
console.log("coinAmount:", coinAmount);

// ランキング表示モード（'normal' または 'nightmare'）
let currentRankingMode = 'normal';


// オプションポップアップの表示/非表示を切り替える関数
function toggleOptionsPopup() {
    showOptionsPopup = !showOptionsPopup;

    if (showOptionsPopup) {
        tempUserName = userName; // 現在のユーザー名を一時変数にコピー
        userNameInput.value = tempUserName; // 入力欄に表示
        displayUserId.textContent = userId; // ユーザーIDを表示
        initializeSkinSelection(); // 見た目選択UIを初期化
        
        // FPSチェックボックスの状態を設定
        const fpsToggle = document.getElementById('fpsToggle');
        if (fpsToggle) {
            fpsToggle.checked = showFps;
        }
        
        optionsPopupOverlay.classList.add('show'); // ポップアップを表示
        // オプションポップアップ表示中は他のポップアップを閉じる
        rankingPopupOverlay.classList.remove('show');
        howToPlayPopupOverlay.classList.remove('show');
    } else {
        optionsPopupOverlay.classList.remove('show'); // ポップアップを非表示

        saveUserData(userId, userName, null, null, null, null, null, null);

        // ゲームを再開するロジック (animate関数内で描画を制御)
    }
}

// ランキングポップアップの表示/非表示を切り替える関数
async function toggleRankingPopup() {
    if (rankingPopupOverlay.classList.contains('show')) {
        rankingPopupOverlay.classList.remove('show'); // ポップアップを非表示
    } else {
        optionsPopupOverlay.classList.remove('show'); // 他のポップアップを閉じる
        howToPlayPopupOverlay.classList.remove('show');
        rankingPopupOverlay.classList.add('show'); // ポップアップを表示
        
        // 初期表示はノーマルモード
        currentRankingMode = 'normal';
        updateRankingTabs();
        await displayRanking(currentRankingMode); // ランキングデータを取得して表示
    }
}

// 遊び方ポップアップの表示/非表示を切り替える関数
function toggleHowToPlayPopup() {
    if (howToPlayPopupOverlay.classList.contains('show')) {
        howToPlayPopupOverlay.classList.remove('show'); // ポップアップを非表示
    } else {
        howToPlayPopupOverlay.classList.add('show'); // ポップアップを表示
    }
}

// ガチャポップアップの表示/非表示を切り替える関数
function toggleGachaPopup() {
    console.log("toggleGachaPopup called"); // デバッグ用
    console.log("gachaPopupOverlay:", gachaPopupOverlay); // デバッグ用
    
    if (gachaPopupOverlay && gachaPopupOverlay.classList.contains('show')) {
        gachaPopupOverlay.classList.remove('show'); // ポップアップを非表示
        console.log("Gacha popup hidden"); // デバッグ用
    } else if (gachaPopupOverlay) {
        // 他のポップアップを閉じる
        if (optionsPopupOverlay) optionsPopupOverlay.classList.remove('show');
        if (howToPlayPopupOverlay) howToPlayPopupOverlay.classList.remove('show');
        if (rankingPopupOverlay) rankingPopupOverlay.classList.remove('show');
        
        updateCoinDisplay();
        updateGachaButton();
        gachaPopupOverlay.classList.add('show'); // ポップアップを表示
        console.log("Gacha popup shown"); // デバッグ用
    } else {
        console.error("gachaPopupOverlay not found"); // デバッグ用
    }
}

// コイン表示を更新
function updateCoinDisplay() {
    if (coinAmount) {
        coinAmount.textContent = playerCoins.toString();
    }
}

// ガチャボタンの状態を更新
function updateGachaButton() {
    if (gachaButton) {
        if (playerCoins >= 1) {
            gachaButton.disabled = false;
            gachaButton.style.opacity = '1';
        } else {
            gachaButton.disabled = true;
            gachaButton.style.opacity = '0.5';
        }
    }
}

// ガチャを実行
function performGacha() {
    if (playerCoins < 10) {
        return;
    }
    
    // コインを消費
    playerCoins -= 10;
    savePlayerCoins();
    updateCoinDisplay();
    updateGachaButton();
    
    // ガチャアニメーション開始
    showGachaAnimation();
    
    // 2秒後に結果表示
    setTimeout(() => {
        const result = drawGacha();
        showGachaResult(result);
    }, 2000);
}

// ガチャアニメーションを表示
function showGachaAnimation() {
    gachaResultArea.style.display = 'block';
    gachaAnimation.style.display = 'block';
    gachaResult.style.display = 'none';
    gachaButton.disabled = true;
}

// ガチャの抽選処理
function drawGacha() {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [skin, rate] of Object.entries(gachaRates)) {
        cumulative += rate;
        if (random <= cumulative) {
            if (skin === 'miss') {
                return { type: 'miss', skin: null };
            } else {
                const isNew = !unlockedSkins.includes(skin);
                if (isNew) {
                    unlockedSkins.push(skin);
                    saveUnlockedSkins(); // ローカルストレージに保存
                    // データベースにも保存
                    console.log(`スキン保存開始`);
                    console.log(unlockedSkins);
                    saveUserData(userId, null, null, null, null, null, null, unlockedSkins);
                }
                return { type: isNew ? 'new' : 'duplicate', skin: skin };
            }
        }
    }
    
    // フォールバック（通常は到達しない）
    return { type: 'miss', skin: null };
}

// ガチャ結果を表示
function showGachaResult(result) {
    gachaAnimation.style.display = 'none';
    gachaResult.style.display = 'block';
    
    let message = '';
    let className = '';
    
    if (result.type === 'miss') {
        message = '😞 ハズレ...';
        className = 'miss';
    } else if (result.type === 'new') {
        const skinName = playerSkins[result.skin].name;
        message = `🎉 新しいスキン獲得！<br>「${skinName}」`;
        className = 'new-skin';
        // 新しいスキンが獲得されたので見た目選択UIを更新
        setTimeout(() => {
            initializeSkinSelection();
        }, 100);
    } else if (result.type === 'duplicate') {
        const skinName = playerSkins[result.skin].name;
        message = `✨ 既に持っているスキン<br>「${skinName}」`;
        className = 'duplicate';
    }
    
    gachaResult.innerHTML = message;
    gachaResult.className = `gacha-result ${className}`;
    
    // 3秒後にアニメーションエリアを非表示
    setTimeout(() => {
        gachaResultArea.style.display = 'none';
        gachaButton.disabled = false;
        updateGachaButton();
    }, 3000);
}

// コインを追加（ゲームオーバー時に呼び出される）
function addCoins(altitude) {
    const newCoins = Math.floor(altitude / 1000);
    if (newCoins > 0) {
        currentGameCoins = newCoins; // 今回獲得したコイン数を記録
        playerCoins += newCoins;
        savePlayerCoins();
        console.log(`${newCoins}コイン獲得！ 総コイン数: ${playerCoins}`);
    } else {
        currentGameCoins = 0; // コインを獲得しなかった場合
    }
}

// ランキングデータを取得して表示する関数
async function displayRanking(mode = currentRankingMode) {
    currentRankingMode = mode;
    updateRankingTabs();
    
    rankingList.innerHTML = '<li>ランキングを読み込み中...</li>'; // ロード中メッセージ

    try {
        const Data = await AllFetchData();
        if (Data && Array.isArray(Data)) {
            let allData;
            
            if (mode === 'nightmare') {
                // ナイトメアモード: n-altitudeでソート
                allData = Data.filter(user => user['n-altitude'] && parseFloat(user['n-altitude']) > 0);
                allData.sort((a, b) => (parseFloat(b['n-altitude']) || 0) - (parseFloat(a['n-altitude']) || 0));
            } else {
                // ノーマルモード: altitudeでソート
                allData = Data.filter(user => user.altitude && parseFloat(user.altitude) > 0);
                allData.sort((a, b) => (parseFloat(b.altitude) || 0) - (parseFloat(a.altitude) || 0));
            }

            console.table(allData); // デバッグ用に全データを表示

            rankingList.innerHTML = ''; // リストをクリア

            if (allData.length === 0) {
                const modeText = mode === 'nightmare' ? 'ナイトメアモード' : 'ノーマルモード';
                rankingList.innerHTML = `<li>まだ${modeText}のランキングデータがありません。</li>`;
                return;
            }

            allData.forEach((data, index) => {
                const listItem = document.createElement('li');
                const rank = index + 1;
                const userName = data.userName || '匿名さん';
                const altitude = mode === 'nightmare' 
                    ? Math.floor(parseFloat(data['n-altitude']) || 0)
                    : Math.floor(parseFloat(data.altitude) || 0);

                if (altitude === 0) return; // 高度が0のデータは表示しない
                if (rank > 100) return; // 上位100件のみ表示

                listItem.innerHTML = `
                    <span>${rank}. ${userName}</span>
                    <span>${altitude} m</span>
                `;
                rankingList.appendChild(listItem);
            });
        } else {
            rankingList.innerHTML = '<li>ランキングデータの取得に失敗しました。</li>';
        }
    } catch (error) {
        console.error("ランキングの表示中にエラーが発生しました:", error);
        rankingList.innerHTML = '<li>ランキングの読み込み中にエラーが発生しました。</li>';
    }
}

// ランキングタブの表示を更新する関数
function updateRankingTabs() {
    if (normalRankingTab && nightmareRankingTab) {
        if (currentRankingMode === 'normal') {
            normalRankingTab.classList.add('active');
            nightmareRankingTab.classList.remove('active');
        } else {
            normalRankingTab.classList.remove('active');
            nightmareRankingTab.classList.add('active');
        }
    }
}


// イベントリスナーのセットアップ
if (gearIconHtml) {
    gearIconHtml.addEventListener('click', toggleOptionsPopup);
}

if (closeOptionsButton) {
    closeOptionsButton.addEventListener('click', toggleOptionsPopup);
}

if (applyOptionsButton) {
    applyOptionsButton.addEventListener('click', () => {
        userName = userNameInput.value; // 名前を反映
        localStorage.setItem('game_user_name', userName); // ローカルストレージに保存
        toggleOptionsPopup(); // ポップアップを閉じる
    });
}

// FPSチェックボックスのイベントリスナー
const fpsToggle = document.getElementById('fpsToggle');
if (fpsToggle) {
    fpsToggle.addEventListener('change', () => {
        showFps = fpsToggle.checked;
        saveFpsSettings();
        console.log(`FPS表示: ${showFps ? 'ON' : 'OFF'}`);
    });
}

// 見た目選択ボタンのイベントリスナー（動的生成されるボタン用に無効化）
// document.querySelectorAll('.skin-button').forEach(button => {
//     button.addEventListener('click', () => {
//         const skinName = button.dataset.skin;
//         
//         // 以前のactiveボタンからクラスを削除
//         document.querySelectorAll('.skin-button').forEach(btn => {
//             btn.classList.remove('active');
//         });
//         
//         // 新しいボタンにactiveクラスを追加
//         button.classList.add('active');
//         
//         // 見た目を変更
//         changePlayerSkin(skinName);
//     });
// });

// 見た目選択UIを初期化
function initializeSkinSelection() {
    const skinGrid = document.querySelector('.skin-grid');
    if (!skinGrid) {
        console.error('skin-grid element not found');
        return;
    }
    
    // 既存のボタンをクリア
    skinGrid.innerHTML = '';
    
    // 解放済みスキンのみボタンを生成
    unlockedSkins.forEach(skinType => {
        if (playerSkins[skinType]) {
            const button = document.createElement('button');
            button.className = 'skin-button';
            button.dataset.skin = skinType;
            
            // 現在のスキンの場合はactiveクラスを追加
            if (skinType === currentPlayerSkin) {
                button.classList.add('active');
            }
            
            button.innerHTML = `
                <img src="img/${skinType}/cat_normal.PNG" alt="${playerSkins[skinType].name}">
                <span>${playerSkins[skinType].name}</span>
            `;
            
            // クリックイベントリスナーを追加
            button.addEventListener('click', function() {
                // 他のボタンからactiveクラスを削除
                document.querySelectorAll('.skin-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // このボタンにactiveクラスを追加
                this.classList.add('active');
                
                // スキンを変更
                currentPlayerSkin = skinType;
                savePlayerSkin();
                changePlayerSkin(skinType); // 見た目変更関数も呼び出し
            });
            
            skinGrid.appendChild(button);
        }
    });
}

// 遊び方ボタンのイベントリスナー
if (howToPlayButton) {
    howToPlayButton.addEventListener('click', toggleHowToPlayPopup);
}

if (closeHowToPlayButton) {
    closeHowToPlayButton.addEventListener('click', toggleHowToPlayPopup);
}

// ランキングアイコンとボタンのイベントリスナー
if (rankingIconHtml) {
    rankingIconHtml.addEventListener('click', toggleRankingPopup);
}

if (closeRankingButton) {
    closeRankingButton.addEventListener('click', toggleRankingPopup);
}

// ランキングタブのイベントリスナー
if (normalRankingTab) {
    normalRankingTab.addEventListener('click', () => {
        displayRanking('normal');
    });
}

if (nightmareRankingTab) {
    nightmareRankingTab.addEventListener('click', () => {
        displayRanking('nightmare');
    });
}

// ガチャアイコンとボタンのイベントリスナー
console.log("Setting up gacha event listeners..."); // デバッグ用
console.log("gachaIconHtml:", gachaIconHtml); // デバッグ用
console.log("gachaButton:", gachaButton); // デバッグ用
console.log("closeGachaButton:", closeGachaButton); // デバッグ用

if (gachaIconHtml) {
    gachaIconHtml.addEventListener('click', toggleGachaPopup);
    console.log("Gacha icon event listener added"); // デバッグ用
} else {
    console.error("gachaIconHtml not found"); // デバッグ用
}

if (closeGachaButton) {
    closeGachaButton.addEventListener('click', toggleGachaPopup);
    console.log("Close gacha button event listener added"); // デバッグ用
} else {
    console.error("closeGachaButton not found"); // デバッグ用
}

if (gachaButton) {
    gachaButton.addEventListener('click', performGacha);
    console.log("Gacha button event listener added"); // デバッグ用
} else {
    console.error("gachaButton not found"); // デバッグ用
}

// 音量調節UIの要素を取得
const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
const seVolumeSlider = document.getElementById('seVolumeSlider');
const bgmMuteButton = document.getElementById('bgmMuteButton');
const seMuteButton = document.getElementById('seMuteButton');
const bgmVolumeValue = document.getElementById('bgmVolumeValue');
const seVolumeValue = document.getElementById('seVolumeValue');

// 音量調節UIの初期化
function initVolumeControls() {
    if (bgmVolumeSlider && seVolumeSlider) {
        // スライダーの初期値を設定
        bgmVolumeSlider.value = Math.round(audioManager.volumes.bgm * 100);
        seVolumeSlider.value = Math.round(audioManager.volumes.se * 100);
        
        // 表示値を更新
        if (bgmVolumeValue) bgmVolumeValue.textContent = `${Math.round(audioManager.volumes.bgm * 100)}%`;
        if (seVolumeValue) seVolumeValue.textContent = `${Math.round(audioManager.volumes.se * 100)}%`;
        
        // ミュートボタンの状態を更新
        updateMuteButtonState();
        
        // イベントリスナーを追加
        bgmVolumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            audioManager.setBgmVolume(volume);
            if (bgmVolumeValue) bgmVolumeValue.textContent = `${e.target.value}%`;
            updateMuteButtonState();
        });
        
        seVolumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            audioManager.setSeVolume(volume);
            if (seVolumeValue) seVolumeValue.textContent = `${e.target.value}%`;
            updateMuteButtonState();
        });
    }
    
    if (bgmMuteButton) {
        bgmMuteButton.addEventListener('click', () => {
            audioManager.toggleBgmMute();
            updateMuteButtonState();
        });
    }
    
    if (seMuteButton) {
        seMuteButton.addEventListener('click', () => {
            audioManager.toggleSeMute();
            updateMuteButtonState();
        });
    }
}

// ミュートボタンの状態を更新
function updateMuteButtonState() {
    if (bgmMuteButton) {
        if (audioManager.muted.bgm) {
            bgmMuteButton.classList.add('muted');
            bgmMuteButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm10-5l-5 5H1v6h7l5 5V4zm5.5 9L21 15.5l2.5-2.5L21 10.5z"/>
                </svg>
            `;
        } else {
            bgmMuteButton.classList.remove('muted');
            bgmMuteButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm10-5l-5 5H1v6h7l5 5V4zm3.5 9c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                </svg>
            `;
        }
    }
    
    if (seMuteButton) {
        if (audioManager.muted.se) {
            seMuteButton.classList.add('muted');
            seMuteButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm10-5l-5 5H1v6h7l5 5V4zm5.5 9L21 15.5l2.5-2.5L21 10.5z"/>
                </svg>
            `;
        } else {
            seMuteButton.classList.remove('muted');
            seMuteButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm10-5l-5 5H1v6h7l5 5V4zm3.5 9c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                </svg>
            `;
        }
    }
}

// モード切り替えボタンの初期化
function initModeToggleButton() {
    const modeToggleButton = document.getElementById('mode-toggle-button');
    
    if (modeToggleButton) {
        // 初期状態の設定
        updateModeToggleButton();
        
        // クリックイベントリスナー
        modeToggleButton.addEventListener('click', () => {
            if (nightmareUnlocked && (gameState === "title" || gameState === "gameover")) {
                isNightmareMode = !isNightmareMode;
                updateModeToggleButton();
            }
        });
    }
}

// モード切り替えボタンの表示更新
function updateModeToggleButton() {
    const modeToggleButton = document.getElementById('mode-toggle-button');
    
    if (modeToggleButton) {
        if (nightmareUnlocked) {
            modeToggleButton.classList.remove('disabled');
            modeToggleButton.textContent = isNightmareMode ? 'ナイトメアモード' : 'ノーマルモード';
            modeToggleButton.style.background = isNightmareMode ? 
                'linear-gradient(to bottom, #6c5ce7, #5f3dc4)' : 
                'linear-gradient(to bottom, #00b894, #00a085)';
        } else {
            modeToggleButton.classList.add('disabled');
            modeToggleButton.textContent = 'ナイトメア未開放';
        }
        
        // タイトル画面またはゲームオーバー画面でのみ表示
        if (gameState === "title" || gameState === "gameover") {
            modeToggleButton.style.display = 'block';
        } else {
            modeToggleButton.style.display = 'none';
        }
    }
}


// アプリ起動時にゲームを初期化
async function initGame() {
    try {
        userId = getOrCreateUserId(); // ユーザーIDを初期化
        userName = getOrCreateUserName(); // ユーザー名を初期化
        await loadAltitudeFromSheet(userId); // 最高到達点をスプレッドシートからロード
        await loadCoinsAndSkins(userId); // コインと解放済みスキンを読み込み
        
        // 音量調節UIを初期化
        initVolumeControls();
        
        // モード切り替えボタンを初期化
        initModeToggleButton();
        
        // ナイトメアモード開放状態に基づいてボタンを更新
        updateModeToggleButton();
        
    } catch (error) {
        console.error("ゲーム初期化中にエラーが発生しました:", error);
        // エラーが発生してもゲームを開始
    } finally {
        // 読み込み完了後に読み込み中表示を非表示
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        
        // ガチャポップアップを初期状態で非表示に設定
        const gachaPopup = document.getElementById('gacha-popup-overlay');
        if (gachaPopup) {
            gachaPopup.classList.remove('show'); // showクラスを削除
            // style.displayは削除してCSSのクラス制御に委ねる
        }
        
        // 見た目選択UIを初期化（解放済みスキンのみ表示）
        setTimeout(() => {
            initializeSkinSelection();
        }, 100);
        
        animate(); // アニメーションループを開始
    }
}

initGame();

// DOMが完全に読み込まれた後にガチャ機能を再初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded, reinitializing gacha functionality...");
    
    // ガチャ要素を再取得
    const gachaIconElement = document.getElementById('gacha-icon-html');
    const gachaPopupElement = document.getElementById('gacha-popup-overlay');
    const gachaButtonElement = document.getElementById('gachaButton');
    const closeGachaButtonElement = document.getElementById('closeGachaButton');
    
    console.log("Reinitialize - gachaIconElement:", gachaIconElement);
    console.log("Reinitialize - gachaPopupElement:", gachaPopupElement);
    
    // イベントリスナーを再設定（重複を避けるため一度削除してから追加）
    if (gachaIconElement) {
        gachaIconElement.removeEventListener('click', toggleGachaPopup);
        gachaIconElement.addEventListener('click', toggleGachaPopup);
        console.log("Gacha icon event listener reattached");
    }
    
    if (closeGachaButtonElement) {
        closeGachaButtonElement.removeEventListener('click', toggleGachaPopup);
        closeGachaButtonElement.addEventListener('click', toggleGachaPopup);
        console.log("Close gacha button event listener reattached");
    }
    
    if (gachaButtonElement) {
        gachaButtonElement.removeEventListener('click', performGacha);
        gachaButtonElement.addEventListener('click', performGacha);
        console.log("Gacha button event listener reattached");
    }
});
