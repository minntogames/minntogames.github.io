window.onload = function() {
    let sky = 90000; // 初期高度
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 山レイヤー情報（offsetY追加）
    const mountainLayers = [
        { points: [ {x:0, y:800}, {x:0, y:250}, {x:240, y:100}, {x:700, y:250}, {x:700, y:800} ], color: '#00a370ff', speed: 0.01, offsetY: 100 },
        { points: [ {x:0, y:800},{x:0, y:320}, {x:450, y:150}, {x:700, y:320}, {x:700, y:800} ], color: '#039803ff', speed: 0.04, offsetY: 10 }
        
    ];

    // 地面レイヤー情報
    const groundLayers = [
        { color: '#dccab4ff', y: 450, height: 300, margin: 0, speed: 0.12 }, // 一番奥
        { color: '#DEB887', y: 500, height: 300, margin: 0, speed: 0.14},
        { color: '#CD853F', y: 560, height: 300, margin: 0, speed: 0.16},
        { color: '#A0522D', y: 620, height: 300, margin: 0, speed: 0.18 },
        { color: '#8B4513', y: 700, height: 300, margin: 0, speed: 0.2 }, // 一番手前
    ];

    // 雲レイヤー情報（vx追加）
    const clouds = [
        { x: 100, y: 120, w: 120, h: 40, speed: 0.01, vx: 0.5 },
        { x: 350, y: 80,  w: 180, h: 60, speed: 0.01, vx: 0.3 },
        { x: 500, y: 160, w: 100, h: 35, speed: 0.01, vx: 0.7 },
        { x: 200, y: 60,  w: 80,  h: 25, speed: 0.01, vx: 0.4 }
    ];

    // 星情報（グループごとに生成、色・模様・輪っか追加）
    const STAR_GROUPS = 6;
    const STAR_COUNT = 10;
    const starColors = ["#fff", "#ffe066", "#aeefff", "#ffb3e6", "#ffd700", "#b0ffb3", "#e6e6ff"];
    const starPatterns = ["none", "cross", "dot"];
    const stars = [];
    for (let g = 0; g < STAR_GROUPS; g++) {
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                group: g,
                x: Math.random() * 600,
                y: Math.random() * 800,
                r: 1.5 + Math.random() * 2.5,
                phase: Math.random() * Math.PI * 2,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                pattern: starPatterns[Math.floor(Math.random() * starPatterns.length)],
                ring: Math.random() < 0.2 // 20%で輪っか
            });
        }
    }
    // 追加星（80000～100000で増やす、同様にバリエーション）
    const EXTRA_STAR_COUNT = 60;
    const extraStars = [];
    for (let i = 0; i < EXTRA_STAR_COUNT; i++) {
        extraStars.push({
            x: Math.random() * 600,
            y: Math.random() * 800,
            r: 1.5 + Math.random() * 2.5,
            phase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)],
            pattern: starPatterns[Math.floor(Math.random() * starPatterns.length)],
            ring: Math.random() < 0.2
        });
    }

    // 星描画関数（色・模様・輪っか対応）
    function drawStar(ctx, star, alpha, twinkle) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * (0.2 + twinkle * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        // 輪っか
        if (star.ring) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r * (0.5 + twinkle * 0.5), 0, Math.PI * 2);
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha * 0.7;
            ctx.stroke();
        }

        // 模様
        if (star.pattern === "cross") {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(star.x - star.r, star.y);
            ctx.lineTo(star.x + star.r, star.y);
            ctx.moveTo(star.x, star.y - star.r);
            ctx.lineTo(star.x, star.y + star.r);
            ctx.stroke();
        } else if (star.pattern === "dot") {
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
        }
        ctx.restore();
    }

    // 惑星デザイン用
    const planetColors = ["#e6d97a", "#b0e0ff", "#ffb3e6", "#ffd700", "#b0ffb3", "#e6e6ff", "#ffadad"];
    const planetRingColors = ["#bcae7e", "#aeefff", "#ffb3e6", "#fff", "#ffd700"];
    const planetPatterns = ["none", "dot", "line"];
    let planet = {
        x: 400,
        color: "#e6d97a",
        ring: true,
        ringColor: "#bcae7e",
        pattern: "none",
        radius: 300
    };

    // 惑星ランダム生成関数（サイズ追加）
    function randomPlanet() {
        const radius = 60 + Math.random() * 300; // 半径60～360
        return {
            x: 150 + Math.random() * 500,
            color: planetColors[Math.floor(Math.random() * planetColors.length)],
            ring: Math.random() < 0.7,
            ringColor: planetRingColors[Math.floor(Math.random() * planetRingColors.length)],
            pattern: planetPatterns[Math.floor(Math.random() * planetPatterns.length)],
            radius: radius
        };
    }

    function drawBackground() {
        // 空（グラデーション、skyが10000～30000で紺、60000～100000で黒へ）
        let topColor, midColor, botColor;
        const navy = "#0a1847";
        const black = "#000000";

        if (sky < 10000) {
            topColor = "#87ceeb";
            midColor = "#b0e0ff";
            botColor = "#e6f7ff";
        } else if (sky < 30000) {
            // 青→紺
            let darkRate = (sky - 10000) / 20000;
            function lerpColor(c1, c2, t) {
                let r1 = parseInt(c1.substr(1,2),16), g1 = parseInt(c1.substr(3,2),16), b1 = parseInt(c1.substr(5,2),16);
                let r2 = parseInt(c2.substr(1,2),16), g2 = parseInt(c2.substr(3,2),16), b2 = parseInt(c2.substr(5,2),16);
                let r = Math.round(r1 + (r2 - r1) * t);
                let g = Math.round(g1 + (g2 - g1) * t);
                let b = Math.round(b1 + (b2 - b1) * t);
                return `rgb(${r},${g},${b})`;
            }
            topColor = lerpColor("#87ceeb", navy, darkRate);
            midColor = lerpColor("#b0e0ff", navy, darkRate);
            botColor = lerpColor("#e6f7ff", navy, darkRate);
        } else if (sky < 60000) {
            // 紺色
            topColor = navy;
            midColor = navy;
            botColor = navy;
        } else if (sky < 100000) {
            // 紺→黒
            let blackRate = (sky - 60000) / 40000;
            function lerpColor(c1, c2, t) {
                let r1 = parseInt(c1.substr(1,2),16), g1 = parseInt(c1.substr(3,2),16), b1 = parseInt(c1.substr(5,2),16);
                let r2 = parseInt(c2.substr(1,2),16), g2 = parseInt(c2.substr(3,2),16), b2 = parseInt(c2.substr(5,2),16);
                let r = Math.round(r1 + (r2 - r1) * t);
                let g = Math.round(g1 + (g2 - g1) * t);
                let b = Math.round(b1 + (b2 - b1) * t);
                return `rgb(${r},${g},${b})`;
            }
            topColor = lerpColor(navy, black, blackRate);
            midColor = lerpColor(navy, black, blackRate);
            botColor = lerpColor(navy, black, blackRate);
        } else {
            // 完全な黒
            topColor = black;
            midColor = black;
            botColor = black;
        }

        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, topColor);
        grad.addColorStop(0.5, midColor);
        grad.addColorStop(1, botColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 高度3万以上で星をグループごとにフェードイン
        if (sky >= 30000) {
            const twinkle = Math.sin(Date.now() / 300) * 0.5 + 0.5;
            stars.forEach(star => {
                const groupStart = 30000 + star.group * 2000;
                let fadeAlpha = 0;
                if (sky >= groupStart) {
                    fadeAlpha = Math.min((sky - groupStart) / 500, 1);
                }
                if (fadeAlpha > 0) {
                    const alpha = fadeAlpha * (0.7 + 0.3 * Math.sin(Date.now() / 300 + star.phase));
                    drawStar(ctx, star, alpha, twinkle);
                }
            });
        }

        // 80000～100000で星をさらに増やす
        if (sky >= 80000) {
            const twinkle = Math.sin(Date.now() / 300) * 0.5 + 0.5;
            let fadeAlpha = Math.min((sky - 80000) / 20000, 1);
            extraStars.forEach(star => {
                const alpha = fadeAlpha * (0.7 + 0.3 * Math.sin(Date.now() / 300 + star.phase));
                drawStar(ctx, star, alpha, twinkle);
            });
        }

        // 山（skyに比例してy座標を動かす）
        mountainLayers.forEach(mountain => {
            ctx.fillStyle = mountain.color;
            ctx.beginPath();
            ctx.moveTo(mountain.points[0].x, mountain.points[0].y + mountain.offsetY + sky * mountain.speed);
            for (let i = 1; i < mountain.points.length; i++) {
                ctx.lineTo(mountain.points[i].x, mountain.points[i].y + mountain.offsetY + sky * mountain.speed);
            }
            ctx.closePath();
            ctx.fill();
        });

        // 雲（skyに比例してy座標を動かす＆ループ＆横移動＆フェードアウト）
        clouds.forEach(cloud => {
            // 横移動
            cloud.x += cloud.vx;
            if (cloud.x - cloud.w > canvas.width) {
                cloud.x = -cloud.w;
            }

            let cloudY = cloud.y + sky * cloud.speed;

            // 画面下に到達したら上に戻す
            if (cloudY - cloud.h > canvas.height) {
                cloud.y -= canvas.height + cloud.h * 2;
                cloudY = cloud.y + sky * cloud.speed;
            }

            // フェードアウト（50000～51000でalphaが0.8→0）
            let cloudAlpha = 0.8;
            if (sky >= 50000) {
                cloudAlpha = Math.max(0, 0.8 * (1 - (sky - 50000) / 1000));
            }

            ctx.save();
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = cloudAlpha;
            ctx.beginPath();
            ctx.ellipse(cloud.x, cloudY, cloud.w, cloud.h, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // --- ここまでが背景・星・山・雲などの描画 ---

        // 高度10万以上で惑星を描画
        if (sky >= 100000) {
            let planetAlpha = Math.min((sky - 100000) / 1000, 1);
            // 惑星のY座標を惑星サイズ分上画面外から
            let planetBaseY = -planet.radius;
            let planetY = planetBaseY + (sky - 100000) * 0.005;

            // 画面下に到達したら上に戻す（ループ＆新デザイン）
            if (planetY - planet.radius > canvas.height) {
                sky = 100000;
                planet = randomPlanet();
                planetBaseY = -planet.radius;
                planetY = planetBaseY;
            }

            // 惑星本体
            ctx.save();
            ctx.globalAlpha = planetAlpha;
            ctx.beginPath();
            ctx.arc(planet.x, planetY, planet.radius, 0, Math.PI * 2);
            ctx.fillStyle = planet.color;
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 30;
            ctx.fill();

            // 輪っか
            if (planet.ring) {
                ctx.beginPath();
                ctx.ellipse(
                    planet.x,
                    planetY,
                    planet.radius * 1.4,
                    planet.radius * 0.33,
                    Math.PI / 7,
                    0,
                    Math.PI * 2
                );
                ctx.strokeStyle = planet.ringColor;
                ctx.lineWidth = 8;
                ctx.globalAlpha = planetAlpha * 0.7;
                ctx.stroke();
            }

            // 模様
            if (planet.pattern === "dot") {
                ctx.globalAlpha = planetAlpha;
                ctx.beginPath();
                ctx.arc(planet.x + planet.radius * 0.33, planetY - planet.radius * 0.33, planet.radius * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.globalAlpha = planetAlpha * 0.5;
                ctx.fill();
            } else if (planet.pattern === "line") {
                ctx.globalAlpha = planetAlpha * 0.7;
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(planet.x - planet.radius * 0.66, planetY + planet.radius * 0.44);
                ctx.lineTo(planet.x + planet.radius * 0.66, planetY - planet.radius * 0.44);
                ctx.stroke();
            }
            ctx.restore();
        }

        // sky（高度）値を表示（10000～100000で徐々に白く） ※惑星より前に表示
        let textColor = "#333";
        if (sky >= 10000) {
            let t = Math.min((sky - 10000) / 90000, 1);
            let r = Math.round(51 + (255 - 51) * t);
            let g = Math.round(51 + (255 - 51) * t);
            let b = Math.round(51 + (255 - 51) * t);
            textColor = `rgb(${r},${g},${b})`;
        }
        ctx.save();
        ctx.font = "32px 'Rounded Mplus 1c', 'Arial Rounded MT Bold', 'Hiragino Maru Gothic Pro', 'Yu Gothic', sans-serif";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#000";
        ctx.strokeText("高度: " + sky, 20, 40); // 縁取り
        ctx.fillStyle = textColor;
        ctx.fillText("高度: " + sky, 20, 40);  // 本体
        ctx.restore();
    }

    function drawGroundLayers() {
        groundLayers.forEach(layer => {
            ctx.save();
            ctx.fillStyle = layer.color;
            // skyに比例してy座標を動かす
            ctx.fillRect(layer.margin, layer.y + sky * layer.speed, canvas.width - layer.margin * 2, layer.height);
            ctx.restore();
        });
    }

    function animate() {
        drawBackground();
        sky += 500; // 空の動き(デフォ10)

        // 山・地面のy座標はskyに比例して動くので個別のy更新は不要

        drawGroundLayers();
        requestAnimationFrame(animate);
    }

    animate();
}