<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>静寂な雪夜</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #050505; /* ほぼ真っ黒な背景 */
        }

        canvas {
            display: block;
        }

        /* 雰囲気を高めるためのオーバーレイ（ビネット効果） */
        .vignette {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%);
            z-index: 10;
        }
        
        .controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 20;
            color: rgba(255, 255, 255, 0.3);
            font-family: sans-serif;
            font-size: 0.8rem;
            cursor: pointer;
            transition: color 0.3s;
        }
        .controls:hover {
            color: rgba(255, 255, 255, 0.8);
        }
    </style>
</head>
<body>

    <div class="vignette"></div>
    <div class="controls" onclick="toggleWind()">風の強さを切り替え</div>
    <canvas id="snowCanvas"></canvas>

    <script>
        const canvas = document.getElementById('snowCanvas');
        const ctx = canvas.getContext('2d');

        let width, height;
        let particles = [];
        let windSpeed = 0;
        let targetWindSpeed = 0.5; // 初期の風の強さ

        // 視差効果（パララックス）用の変数
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        // 雪の粒の数（画面サイズに応じて調整）
        const PARTICLE_COUNT = window.innerWidth < 768 ? 150 : 350;

        // リサイズ処理
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        // マウス・タッチイベントのリスナー追加
        function handleMove(x, y) {
            // 画面中心を原点(0,0)とし、-1.0 〜 1.0 の範囲に正規化
            targetMouseX = (x / width) * 2 - 1;
            targetMouseY = (y / height) * 2 - 1;
        }

        window.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });

        window.addEventListener('touchmove', (e) => {
            // タッチ操作でのスクロール防止が必要な場合は e.preventDefault() を検討
            if(e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });


        // 雪のクラス定義
        class Snowflake {
            constructor() {
                this.init(true);
            }

            init(initial = false) {
                this.x = Math.random() * width;
                // 最初は画面全体に配置、リセット時は画面上部から
                this.y = initial ? Math.random() * height : -10;
                
                // 深さをシミュレートするためのランダム係数 (0.1 〜 1.0)
                // 値が大きいほど手前（大きく、速く、明るい）
                this.depth = Math.random(); 

                // サイズ: 遠くは小さく、近くは大きく
                this.radius = (this.depth * 3) + 1; 

                // 落下速度: 遠くは遅く、近くは速く
                this.speed = (this.depth * 1.5) + 0.5; 

                // 横揺れの周波数
                this.swayFreq = Math.random() * 0.02 + 0.005;
                this.swayAmp = Math.random() * 20 + 10; // 揺れ幅
                this.swayOffset = Math.random() * Math.PI * 2; // 初期位相

                // 透明度: 遠くは薄く、近くは少しはっきりさせる（でも完全な白ではない）
                this.opacity = (this.depth * 0.5) + 0.1;
            }

            update(time) {
                // 落下
                this.y += this.speed;

                // 横揺れ (サイン波 + 現在の風の影響)
                this.x += Math.sin(time * this.swayFreq + this.swayOffset) * 0.5 + windSpeed * this.depth;

                // 画面外に出た場合のループ処理
                // 下端を超えたら（視差移動分も考慮してマージンを大きめに）
                if (this.y > height + 50) {
                    this.init(false);
                }
                // 横方向のループ（風が強い時用）
                if (this.x > width + 50) {
                    this.x = -50;
                } else if (this.x < -50) {
                    this.x = width + 50;
                }
            }

            draw() {
                // 視差効果の計算
                // depthが大きい（手前にある）ほど、マウスの逆方向に大きくずれる
                const parallaxX = mouseX * width * 0.05 * this.depth;
                const parallaxY = mouseY * height * 0.05 * this.depth;

                const drawX = this.x - parallaxX;
                const drawY = this.y - parallaxY;

                ctx.beginPath();
                ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
                
                // 柔らかな光彩を持たせるためのグラデーション
                // これにより雪が単なる白い点ではなく、少しボヤけた柔らかい雪に見える
                const gradient = ctx.createRadialGradient(
                    drawX, drawY, 0,
                    drawX, drawY, this.radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity + 0.2})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }

        // パーティクルの生成
        function createParticles() {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Snowflake());
            }
        }

        createParticles();

        // アニメーションループ
        let time = 0;
        function animate() {
            ctx.clearRect(0, 0, width, height);

            // 背景の微調整（真っ黒ではなく、ごくわずかに青みを入れると夜空っぽくなる）
            // CSSで設定していますが、Canvas上でトレイル効果を出したい場合はここでfillRectを使う
            
            // 風の速度を徐々に目標値に近づける（イージング）
            windSpeed += (targetWindSpeed - windSpeed) * 0.05;

            // マウス視差位置を滑らかに追従させる（イージング）
            mouseX += (targetMouseX - mouseX) * 0.05;
            mouseY += (targetMouseY - mouseY) * 0.05;

            time++;
            
            particles.forEach(p => {
                p.update(time);
                p.draw();
            });

            requestAnimationFrame(animate);
        }

        animate();

        // インタラクション: 風の強さを切り替える
        let isWindy = false;
        window.toggleWind = function() {
            isWindy = !isWindy;
            // 風向きと強さをランダムに少し変えつつターゲットを設定
            if (isWindy) {
                targetWindSpeed = 3 + Math.random(); // 強い風
            } else {
                targetWindSpeed = 0.5; // 穏やかな微風
            }
        };

    </script>
</body>
</html>