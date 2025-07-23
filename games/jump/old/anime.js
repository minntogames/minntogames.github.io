const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

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
const maxExtraClouds = 20; // 最大追加雲数
let frameCount = 0; // フレームカウンタ
const cloudAddInterval = 200; // 何フレームごとに追加するか

function drawCloud(cloud) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + cloud.size * 0.6, cloud.y + 5, cloud.size * 0.7, cloud.size * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - cloud.size * 0.6, cloud.y + 8, cloud.size * 1, cloud.size * 1, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
}

let stars = [];
const STAR_COUNT = 200;
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
    for (let star of stars) {
        // キラキラ点滅
        let blink = 0.7 + 0.3 * Math.sin(performance.now() * star.speed + star.phase);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * blink, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 8 * blink;
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
                ctx.arc(p.x + dx, p.y + dy, Math.max(2, p.radius * 0.08 * Math.random()), 0, Math.PI * 2);
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
const METEOR_MAX = 5;
const METEOR_MIN_RADIUS = 30;
const METEOR_MAX_RADIUS = 100;
const METEOR_FALL_SPEED_MIN = 0.1;
const METEOR_FALL_SPEED_MAX = 0.2;
const METEOR_COLORS = ["#444", "#222", "#5a3a1a", "#2a1a0a", "#333", "#2d2d2d"];

function drawMeteor(m) {
    ctx.save();
    // 歪な形状（ノイズ付き多角形）
    ctx.beginPath();
    let sides = Math.floor(Math.random() * 3) + 7; // 7〜9角形
    let angleOffset = Math.random() * Math.PI * 2;
    for (let i = 0; i < sides; i++) {
        let angle = angleOffset + (Math.PI * 2 / sides) * i;
        let noise = 0.7 + Math.random() * 0.5;
        let r = m.radius * noise;
        let px = m.x + Math.cos(angle) * r;
        let py = m.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.92;
    ctx.fill();

    // 〇模様
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < Math.floor(m.radius / 7); i++) {
        let angle = Math.random() * Math.PI * 2;
        let rr = Math.random() * (m.radius * 0.7);
        let dx = Math.cos(angle) * rr;
        let dy = Math.sin(angle) * rr;
        ctx.beginPath();
        ctx.arc(m.x + dx, m.y + dy, Math.max(3, m.radius * 0.13 * Math.random()), 0, Math.PI * 2);
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
        let maxText = `最高到達点: ${Math.floor(maxAltitude)} m`;
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
    vx: 0
};
let isGameOver = false;

// 障害物設定
let obstacles = [];
const OBSTACLE_RADIUS = 32;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_HEIGHT = 24;
const OBSTACLE_INTERVAL = 80; // フレームごと
const OBSTACLE_SPEED = 2; // 障害物の落下速度

// 赤玉が飛ばす小玉
let redBullets = [];
const RED_BULLET_RADIUS = 10;
const RED_BULLET_SPEED = 5;

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
});
window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") keyLeft = false;
    if (e.key === "ArrowRight") keyRight = false;
});

// タッチ操作対応
canvas.addEventListener("touchstart", handleTouch, { passive: false });
canvas.addEventListener("touchmove", handleTouch, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

function handleTouch(e) {
    e.preventDefault();
    if (gameState === "title" || gameState === "gameover") {
        startGame();
        return;
    }
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

function handleTouchEnd(e) {
    e.preventDefault();
    // 指が離れたら両方false
    keyLeft = false;
    keyRight = false;
}

let gameState = "title"; // "title", "playing", "gameover"

// 最高到達点の保存・読込（localStorage使用）
function loadMaxAltitude() {
    let v = localStorage.getItem("jump_max_altitude");
    return v ? parseFloat(v) : 0;
}
function saveMaxAltitude(val) {
    localStorage.setItem("jump_max_altitude", String(val));
}

let maxAltitude = loadMaxAltitude();

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
    player.x = canvas.width / 2;
    player.vx = 0;
    isGameOver = false;
    frameCount = 0;
    gameState = "playing";
}

// プレイヤー描画
function drawPlayer() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
}

// 障害物描画
function drawObstacles() {
    for (let obs of obstacles) {
        ctx.save();
        if (obs.type === "circle") {
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#d33";
            ctx.shadowColor = "#a00";
            ctx.shadowBlur = 8;
            ctx.fill();
        } else {
            // 左右に伸び縮みする青棒
            ctx.beginPath();
            ctx.rect(
                obs.x - obs.width/2,
                obs.y - obs.height/2,
                obs.width,
                obs.height
            );
            ctx.fillStyle = "#39f";
            ctx.shadowColor = "#06f";
            ctx.shadowBlur = 8;
            ctx.fill();
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
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    }
}

// 衝突判定
function checkCollision(player, obs) {
    if (obs.type === "circle") {
        let dx = player.x - obs.x;
        let dy = player.y - obs.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        return dist < player.radius + obs.radius;
    } else {
        // 四角
        let closestX = Math.max(obs.x - obs.width/2, Math.min(player.x, obs.x + obs.width/2));
        let closestY = Math.max(obs.y - obs.height/2, Math.min(player.y, obs.y + obs.height/2));
        let dx = player.x - closestX;
        let dy = player.y - closestY;
        return (dx*dx + dy*dy) < (player.radius * player.radius);
    }
}

function animate() {
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
        ctx.strokeText("スペースキーでスタート", canvas.width/2, 400);
        ctx.fillText("スペースキーでスタート", canvas.width/2, 400);
        // 最高到達点
        ctx.font = "bold 24px sans-serif";
        ctx.strokeText(`最高到達点: ${Math.floor(maxAltitude)} m`, canvas.width/2, 460);
        ctx.fillText(`最高到達点: ${Math.floor(maxAltitude)} m`, canvas.width/2, 460);
        ctx.restore();
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
        ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.font = "bold 28px sans-serif";
        ctx.strokeText("スペースキーでリトライ", canvas.width/2, canvas.height/2 + 60);
        ctx.fillText("スペースキーでリトライ", canvas.width/2, canvas.height/2 + 60);
        // 最高到達点
        ctx.font = "bold 24px sans-serif";
        ctx.strokeText(`最高到達点: ${Math.floor(maxAltitude)} m`, canvas.width/2, canvas.height/2 + 120);
        ctx.fillText(`最高到達点: ${Math.floor(maxAltitude)} m`, canvas.width/2, canvas.height/2 + 120);
        // 新記録表示
        if (Math.floor(offsetSky) >= Math.floor(maxAltitude)) {
            ctx.font = "bold 32px sans-serif";
            ctx.fillStyle = "#ff0";
            ctx.strokeStyle = "#c90";
            ctx.lineWidth = 6;
            ctx.strokeText("新記録！", canvas.width/2, canvas.height/2 + 170);
            ctx.fillText("新記録！", canvas.width/2, canvas.height/2 + 170);
        }
        ctx.restore();
        requestAnimationFrame(animate);
        return;
    }

    // プレイ中のみ高度・背景・障害物を動かす
    if (gameState === "playing") {
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
            if (cloud.y < 10) cloud.y = 300 + Math.random() * 100;
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

        // 隕石の追加（10万m以上で最大5個まで）
        if (offsetSky > 100000 && meteors.length < METEOR_MAX && frameCount % 80 === 0) {
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
        if (keyLeft) player.vx = -6;
        else if (keyRight) player.vx = 6;
        else player.vx *= 0.7;
        player.x += player.vx;
        if (player.x - player.radius < 0) player.x = player.radius;
        if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;

        // 障害物生成
        if (frameCount % OBSTACLE_INTERVAL === 0) {
            let type = Math.random() < 0.5 ? "circle" : "rect";
            if (type === "circle") {
                obstacles.push({
                    type: "circle",
                    x: Math.random() * (canvas.width - OBSTACLE_RADIUS*2) + OBSTACLE_RADIUS,
                    y: -OBSTACLE_RADIUS,
                    radius: OBSTACLE_RADIUS,
                    vy: OBSTACLE_SPEED + Math.random() * 2
                });
            } else {
                obstacles.push({
                    type: "rect",
                    x: Math.random() * (canvas.width - OBSTACLE_WIDTH) + OBSTACLE_WIDTH/2,
                    y: -OBSTACLE_HEIGHT,
                    width: OBSTACLE_WIDTH,
                    height: OBSTACLE_HEIGHT,
                    vy: OBSTACLE_SPEED + Math.random() * 2
                });
            }
        }

        // 障害物移動
        for (let obs of obstacles) {
            obs.y += obs.vy * speedMultiplier;
        }
        obstacles = obstacles.filter(obs => obs.y - (obs.radius || obs.height/2) < canvas.height + 50);

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
            }
            // 青棒: 一定間隔で左右に伸び縮み
            if (obs.type === "rect") {
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

        // 衝突判定
        for (let obs of obstacles) {
            if (checkCollision(player, obs)) {
                isGameOver = true;
                gameState = "gameover";
            }
        }
        // 赤玉小玉との衝突判定
        for (let b of redBullets) {
            let dx = player.x - b.x;
            let dy = player.y - b.y;
            if (dx*dx + dy*dy < (player.radius + RED_BULLET_RADIUS) * (player.radius + RED_BULLET_RADIUS)) {
                isGameOver = true;
                gameState = "gameover";
            }
        }

        if (offsetSky > maxAltitude) {
            maxAltitude = offsetSky;
            saveMaxAltitude(maxAltitude);
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
    if (gameState === "playing") {
        drawPlayer();
    }
    requestAnimationFrame(animate);
}

animate();