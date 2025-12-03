<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sync</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #0d0221; /* 深い紫色の背景 */
            font-family: sans-serif;
        }
        canvas {
            display: block;
        }
        #controls {
            position: absolute;
            top: 20px;
            left: 20px;
            color: rgba(255, 255, 255, 0.7);
            pointer-events: none;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 12px;
            text-shadow: 0 0 5px #0ff;
        }
    </style>
</head>
<body>
    <div id="controls"></div>
    <canvas id="canvas"></canvas>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        let width, height;
        let cx, cy;

        // 設定パラメータ
        const config = {
            speed: 2, // 前進する速度
            gridColor: '#ff00ff', // ネオンピンク
            gridThickness: 2,
            horizonY: 0.45, // 地平線の位置 (画面の高さに対する割合)
            sunColorTop: '#ffe600', // 太陽の上部
            sunColorBottom: '#ff0055', // 太陽の下部
            skyColorTop: '#0d0221',
            skyColorBottom: '#260f47',
            starCount: 100
        };

        let frame = 0;
        let terrainOffset = 0;

        // 星クラス
        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * (height * config.horizonY);
                this.size = Math.random() * 2;
                this.alpha = Math.random();
                this.twinkleSpeed = Math.random() * 0.05;
            }

            draw() {
                this.alpha += this.twinkleSpeed;
                if (this.alpha > 1 || this.alpha < 0) this.twinkleSpeed *= -1;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(this.alpha)})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let stars = [];

        // 山脈の生成（プロシージャル）
        let mountains = [];
        const mountainPoints = 120; // 山の頂点の数

        function initMountains() {
            mountains = [];
            let y = 0;
            // ノイズのようなランダムな高さを生成
            for (let i = 0; i <= mountainPoints; i++) {
                // 中央が高い山、端は低い
                const normalizedX = (i / mountainPoints) * 2 - 1; // -1 to 1
                const distFromCenter = Math.abs(normalizedX);
                
                // ノイズ関数的な乱数
                const noise = Math.random() * 0.3 + Math.random() * 0.2;
                const heightFactor = Math.max(0, 1 - distFromCenter * 0.8); // 中央を高く
                
                mountains.push({
                    x: (width / mountainPoints) * i,
                    y: noise * heightFactor * (height * 0.25)
                });
            }
        }

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            cx = width / 2;
            cy = height * config.horizonY;
            
            stars = [];
            for(let i=0; i<config.starCount; i++) {
                stars.push(new Star());
            }
            initMountains();
        }

        window.addEventListener('resize', resize);
        resize();

        // 描画ループ
        function animate() {
            // 背景（空）
            const skyGradient = ctx.createLinearGradient(0, 0, 0, cy);
            skyGradient.addColorStop(0, config.skyColorTop);
            skyGradient.addColorStop(1, config.skyColorBottom);
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, cy);

            // 星の描画
            stars.forEach(star => star.draw());

            // 太陽の描画
            const sunRadius = Math.min(width, height) * 0.15;
            const sunX = cx;
            const sunY = cy - sunRadius * 0.4;

            // 太陽の輝き
            ctx.shadowBlur = 40;
            ctx.shadowColor = config.sunColorBottom;

            const sunGradient = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
            sunGradient.addColorStop(0, config.sunColorTop);
            sunGradient.addColorStop(1, config.sunColorBottom);

            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // リセット

            // 太陽のブラインド（縞模様）効果
            ctx.fillStyle = config.skyColorBottom; // 空の下部の色で縞を作る
            const barCount = 10;
            const barHeightBase = sunRadius / 15;
            
            for (let i = 0; i < barCount; i++) {
                // 下に行くほど太くなる
                const yPos = sunY + (i / barCount) * sunRadius;
                if (yPos > sunY - sunRadius * 0.2) { // 上の方は縞を入れない
                    const h = barHeightBase * (i * 0.2 + 0.5); 
                    ctx.fillRect(sunX - sunRadius, yPos, sunRadius * 2, h);
                }
            }

            // 山脈の描画
            ctx.fillStyle = '#05010a'; // 山の基本色（黒に近い紫）
            ctx.strokeStyle = '#00ffff'; // 山の輪郭（シアン）
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(0, cy);
            for (let i = 0; i < mountains.length; i++) {
                // 少しだけ左右に揺らすパララックス効果
                const parallaxX = mountains[i].x + Math.sin(frame * 0.005) * 20; 
                ctx.lineTo(parallaxX, cy - mountains[i].y);
            }
            ctx.lineTo(width, cy);
            ctx.closePath();
            ctx.fill();
            
            // 山の輪郭を発光させる
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.stroke();
            ctx.shadowBlur = 0;


            // 地面（グリッド）の背景
            ctx.fillStyle = '#1a0b2e'; // 地面のベース色
            ctx.fillRect(0, cy, width, height - cy);

            // グリッドの描画設定
            ctx.strokeStyle = config.gridColor;
            ctx.lineWidth = config.gridThickness;
            // 遠くに行くほどぼやける効果
            ctx.shadowBlur = 5;
            ctx.shadowColor = config.gridColor;

            // 3D遠近法グリッドの描画
            ctx.beginPath();

            // 垂直線（放射状）
            const fov = 300; // 視野角のような係数
            const numVerticalLines = 40;
            const spacing = width * 1.5; // グリッドの幅

            for (let i = -numVerticalLines/2; i <= numVerticalLines/2; i++) {
                // 画面中央からのオフセット
                const xOffset = i * (width / 10);
                
                // 地平線(cy)から画面下端(height)へ線を引く
                // x = cx + (xOffset / z) という概念だが、
                // ここでは単純に消失点(cx, cy)から放射状に広がる線を描く
                
                // 地平線上の点（消失点）
                ctx.moveTo(cx, cy);
                
                // 画面下端の点
                // 簡易的なパースペクティブ：中央から外側に広がる
                const bottomX = cx + (i * (width / 5)); 
                ctx.lineTo(bottomX, height);
            }

            // 水平線（前進アニメーションの核心）
            // Z深度に基づいてY座標を計算する
            // zは奥(∞)から手前(0)へ移動するイメージ
            
            // 速度に基づいてオフセットを更新
            terrainOffset = (terrainOffset + config.speed) % 100;

            // 手前から奥へ線を描く
            for (let i = 0; i < 30; i++) {
                // Z位置の計算（指数関数的に奥へ詰まるようにする）
                const z = 100 + (i * 100) - terrainOffset;
                
                // 透視投影の簡易式: y = cy + (scale / z)
                // zが大きい（遠い）ほどyはcy（地平線）に近づく
                const perspectiveY = 10000 / z;
                
                const lineY = cy + perspectiveY;

                // 画面外なら描かない
                if (lineY > height) continue;
                if (lineY < cy) continue;

                ctx.moveTo(0, lineY);
                ctx.lineTo(width, lineY);
            }

            ctx.stroke();
            
            // 地平線の発光（グロー）効果
            const horizonGradient = ctx.createLinearGradient(0, cy - 20, 0, cy + 50);
            horizonGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
            horizonGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)'); // シアンの輝き
            horizonGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = horizonGradient;
            ctx.fillRect(0, cy - 10, width, 60);

            frame++;
            requestAnimationFrame(animate);
        }

        animate();

    </script>
</body>
</html>