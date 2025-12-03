<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>relax</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #050505; }
        canvas { display: block; }
        #instructions {
            position: absolute;
            top: 20px;
            left: 20px;
            color: rgba(255, 255, 255, 0.7);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            pointer-events: none;
            text-shadow: 1px 1px 2px black;
        }
    </style>
</head>
<body>
    <div id="instructions">
    </div>
    
    <!-- Three.js Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

    <script>
        // --- 設定 ---
        const SETTINGS = {
            fireColor: 0xff4500,
            fireOuterColor: 0xffa500,
            logColor: 0x5c4033,
            groundColor: 0x1a1a1a,
            fogColor: 0x050505,
            treeCount: 60
        };

        let scene, camera, renderer;
        let fireParticles, fireLight;
        let clock = new THREE.Clock();
        
        // マウス視点操作用
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        init();
        animate();

        function init() {
            // 1. シーンとフォグ（霧）の設定
            scene = new THREE.Scene();
            scene.background = new THREE.Color(SETTINGS.fogColor);
            // 遠くを暗くして雰囲気と境界を隠す
            scene.fog = new THREE.FogExp2(SETTINGS.fogColor, 0.035);

            // 2. カメラ設定 (座っている視点)
            camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, 1.2, 4.5); // 焚き火から少し離れて座っている位置

            // 3. レンダラー設定
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(renderer.domElement);

            // 4. 照明
            // 環境光 (月明かりのような微弱な青)
            const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
            scene.add(ambientLight);

            // 焚き火の光 (オレンジ、影を落とす、揺らぎ用)
            fireLight = new THREE.PointLight(0xff6600, 1, 20);
            fireLight.position.set(0, 1.5, 0);
            fireLight.castShadow = true;
            fireLight.shadow.mapSize.width = 1024;
            fireLight.shadow.mapSize.height = 1024;
            scene.add(fireLight);

            // 5. 地面
            const planeGeometry = new THREE.PlaneGeometry(100, 100);
            const planeMaterial = new THREE.MeshStandardMaterial({ 
                color: SETTINGS.groundColor,
                roughness: 0.8,
                metalness: 0.1
            });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            scene.add(plane);

            // 6. オブジェクト生成
            createCampfireLogs();
            createSeatingLogs();
            createForest();
            createFireParticles();

            // イベントリスナー
            document.addEventListener('mousemove', onDocumentMouseMove, false);
            window.addEventListener('resize', onWindowResize, false);
        }

        // --- 焚き火の薪 (中心) ---
        function createCampfireLogs() {
            const group = new THREE.Group();
            const material = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
            const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);

            // ランダムに組まれた薪
            for (let i = 0; i < 5; i++) {
                const log = new THREE.Mesh(geometry, material);
                log.position.y = 0.2;
                log.rotation.z = Math.PI / 2; // 横倒し
                log.rotation.y = (Math.PI * 2 / 5) * i; // 星型に配置
                log.rotation.x = Math.random() * 0.5 - 0.25; // 少し傾ける
                log.castShadow = true;
                log.receiveShadow = true;
                group.add(log);
            }
            scene.add(group);
            
            // 下に石を並べる
            const stoneGeo = new THREE.DodecahedronGeometry(0.15);
            const stoneMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
            for(let i=0; i<8; i++) {
                const stone = new THREE.Mesh(stoneGeo, stoneMat);
                const angle = (Math.PI * 2 / 8) * i;
                stone.position.set(Math.cos(angle)*0.8, 0.1, Math.sin(angle)*0.8);
                stone.castShadow = true;
                stone.receiveShadow = true;
                scene.add(stone);
            }
        }

        // --- 座るための丸太 (3本) ---
        function createSeatingLogs() {
            const logGeo = new THREE.CylinderGeometry(0.25, 0.25, 2.5, 8);
            const logMat = new THREE.MeshStandardMaterial({ 
                color: SETTINGS.logColor,
                roughness: 0.9 
            });

            // プレイヤーの周りに配置 (U字型あるいは囲む形)
            // 1本目: 左側
            const log1 = new THREE.Mesh(logGeo, logMat);
            log1.rotation.z = Math.PI / 2;
            log1.rotation.y = Math.PI / 4;
            log1.position.set(-2.5, 0.25, 2);
            log1.castShadow = true;
            log1.receiveShadow = true;
            scene.add(log1);

            // 2本目: 右側
            const log2 = new THREE.Mesh(logGeo, logMat);
            log2.rotation.z = Math.PI / 2;
            log2.rotation.y = -Math.PI / 4;
            log2.position.set(2.5, 0.25, 2);
            log2.castShadow = true;
            log2.receiveShadow = true;
            scene.add(log2);

            // 3本目: 奥側（あるいは手前）
            // リクエストは「周りに座る用」なので、少し離れた奥に配置してみる
            const log3 = new THREE.Mesh(logGeo, logMat);
            log3.rotation.z = Math.PI / 2;
            log3.rotation.y = Math.PI / 2;
            log3.position.set(3, 0.25, -1.5);
            log3.castShadow = true;
            log3.receiveShadow = true;
            scene.add(log3);
        }

        // --- 森 (背景) ---
        function createForest() {
            const treeMat = new THREE.MeshStandardMaterial({ color: 0x112211, roughness: 1.0 });
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x221111, roughness: 1.0 });
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 3, 5);
            const leavesGeo = new THREE.ConeGeometry(1.5, 4, 6);

            for (let i = 0; i < SETTINGS.treeCount; i++) {
                // 半径5m〜30mの間にランダム配置
                const angle = Math.random() * Math.PI * 2;
                const radius = 5 + Math.random() * 25;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                // 幹
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(x, 1.5, z);
                trunk.castShadow = true;
                scene.add(trunk);

                // 葉
                const leaves = new THREE.Mesh(leavesGeo, treeMat);
                leaves.position.set(x, 4, z);
                leaves.castShadow = true;
                scene.add(leaves);
            }
        }

        // --- 炎のパーティクル生成 ---
        function createFireParticles() {
            // テクスチャをCanvasで動的に生成 (外部画像を使わないため)
            const particleCount = 400;
            const geom = new THREE.BufferGeometry();
            const positions = [];
            const sizes = [];
            const speeds = []; // 上昇速度
            const life = []; //寿命管理 (0〜1)
            const offset = []; // 横揺れ用

            for (let i = 0; i < particleCount; i++) {
                resetParticle(positions, i, true);
                sizes.push(Math.random() * 0.5 + 0.1);
                speeds.push(Math.random() * 0.03 + 0.01);
                life.push(Math.random());
                offset.push(Math.random() * 100);
            }

            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
            geom.userData = { speeds: speeds, life: life, offset: offset };

            // シェーダーを使わず、Canvasで作ったテクスチャを利用
            const texture = generateFireTexture();

            const material = new THREE.PointsMaterial({
                size: 1,
                color: 0xffaa33,
                map: texture,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: false // 単色ベースで色を変化させるのは難しいのでマテリアル色を使用
            });
            // 実際は頂点ごとに色を変えたいが、シンプルにするためY座標で色が変わるような見た目を動きで表現

            fireParticles = new THREE.Points(geom, material);
            scene.add(fireParticles);
        }

        // パーティクル初期化/リセット関数
        function resetParticle(positions, i, initial = false) {
            // 中心付近から発生
            const r = Math.random() * 0.3;
            const theta = Math.random() * Math.PI * 2;
            
            // 配列のインデックス計算
            const idx = i * 3;
            
            positions[idx] = r * Math.cos(theta); // x
            positions[idx + 1] = initial ? Math.random() * 1.5 : 0.1; // y (最初はランダムな高さ)
            positions[idx + 2] = r * Math.sin(theta); // z
        }

        // 炎のテクスチャ生成 (Canvas)
        function generateFireTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const context = canvas.getContext('2d');
            
            // 放射状グラデーション
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 200, 0, 1)');
            gradient.addColorStop(0.4, 'rgba(255, 60, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            context.fillStyle = gradient;
            context.fillRect(0, 0, 32, 32);
            
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        // --- マウス操作 ---
        function onDocumentMouseMove(event) {
            mouseX = (event.clientX - windowHalfX) / 2;
            mouseY = (event.clientY - windowHalfY) / 2;
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // --- アニメーションループ ---
        function animate() {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            // 1. 炎の動き
            const positions = fireParticles.geometry.attributes.position.array;
            const userData = fireParticles.geometry.userData;
            
            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                
                // 上昇
                positions[idx + 1] += userData.speeds[i];
                
                // ゆらぎ (正弦波で横揺れ)
                const wobble = Math.sin(time * 2 + userData.offset[i]) * 0.005;
                positions[idx] += wobble;
                
                // 中心に少し戻ろうとする力 (炎の形状維持)
                positions[idx] *= 0.99;
                positions[idx + 2] *= 0.99;

                // 寿命が尽きるか、高さ制限を超えたらリセット
                if (positions[idx + 1] > 2.0 + Math.random()) {
                    resetParticle(positions, i);
                }
            }
            fireParticles.geometry.attributes.position.needsUpdate = true;

            // 2. 光のゆらぎ (Flicker Effect)
            // ノイズ関数がないのでMath.randomとsinで擬似的に作成
            const flicker = Math.sin(time * 10) * 0.1 + Math.cos(time * 23) * 0.1 + (Math.random() - 0.5) * 0.2;
            fireLight.intensity = 2.0 + flicker;
            fireLight.distance = 20 + flicker * 5;

            // 3. カメラの微動 (マウスインタラクション)
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            // 現在の視点角度に少し加算する形
            // 中心(0, 1.0, 0)を見つつ、マウスで少しずらす
            camera.lookAt(0, 1.0, 0);
            camera.rotation.y -= targetX;
            camera.rotation.x -= targetY;

            renderer.render(scene, camera);
        }
    </script>
</body>
</html>