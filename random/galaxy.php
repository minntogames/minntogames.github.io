<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galaxy</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #canvas-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        /* スクロールバーのカスタマイズ */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #1f2937; 
        }
        ::-webkit-scrollbar-thumb {
            background: #4b5563; 
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #6b7280; 
        }
    </style>
</head>
<body>

    <!-- 3D Canvas -->
    <div id="canvas-container"></div>

    <!-- UI Control Panel removed -->

    <!-- Three.js Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <!-- OrbitControls -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <script>
        // アプリケーションの設定
        const parameters = {
            count: 50000,
            size: 0.01, // 星の大きさ
            radius: 5, // 銀河の半径
            branches: 3,
            spin: 1,
            randomness: 0.2,
            randomnessPower: 3,
            insideColor: '#ff6030',
            outsideColor: '#1b3984',
            rotationSpeed: 1.0
        };

        // Three.js 変数
        let scene, camera, renderer, controls;
        let geometry = null;
        let material = null;
        let points = null;
        let galaxyGroup;

        function init() {
            // シーンの作成
            scene = new THREE.Scene();
            // 背景色を微かに青みがかった黒に設定
            scene.background = new THREE.Color('#000005'); 

            // フォグ（霧）を追加して遠近感を強調
            scene.fog = new THREE.FogExp2('#000005', 0.03);

            // グループの作成（銀河全体を回転させるため）
            galaxyGroup = new THREE.Group();
            scene.add(galaxyGroup);

            // カメラの作成
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.x = 3;
            camera.position.y = 3;
            camera.position.z = 3;

            // レンダラーの作成
            const canvasContainer = document.getElementById('canvas-container');
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            canvasContainer.appendChild(renderer.domElement);

            // OrbitControls（マウス操作）
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // 初期の銀河生成
            generateGalaxy();

            // リサイズイベント
            window.addEventListener('resize', onWindowResize);

            // UIイベントリスナーの設定削除

            // アニメーション開始
            animate();
        }

        // 銀河を生成する関数
        function generateGalaxy() {
            // 既存の銀河があれば破棄（メモリリーク防止）
            if (points !== null) {
                geometry.dispose();
                material.dispose();
                galaxyGroup.remove(points);
            }

            geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(parameters.count * 3);
            const colors = new Float32Array(parameters.count * 3);
            const scales = new Float32Array(parameters.count * 1); // 星ごとのサイズバリエーション

            const colorInside = new THREE.Color(parameters.insideColor);
            const colorOutside = new THREE.Color(parameters.outsideColor);

            for (let i = 0; i < parameters.count; i++) {
                const i3 = i * 3;

                // 半径（中心から外側へ）
                const radius = Math.random() * parameters.radius;

                // 枝の角度 (0, 1, 2... * 2PI/branches)
                const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

                // スピン角度（外側ほど回転させる）
                const spinAngle = radius * parameters.spin;

                // ランダムな拡散（中心に集まりやすく、外に広がる）
                // x^3 などの累乗を使うことで中心付近に値を集中させる
                const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
                const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
                const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

                positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
                positions[i3 + 1] = randomY; // 銀河の厚み
                positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

                // 色の混合
                const mixedColor = colorInside.clone();
                mixedColor.lerp(colorOutside, radius / parameters.radius);

                colors[i3 + 0] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;

                // スケール（ランダムなきらめき用）
                scales[i] = Math.random();
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            // マテリアル
            material = new THREE.PointsMaterial({
                size: parameters.size,
                sizeAttenuation: true, // 遠くの星を小さく描画
                depthWrite: false, // 重なり合ったときに後ろの星を消さない
                blending: THREE.AdditiveBlending, // 加算合成で光っているように見せる
                vertexColors: true
            });

            points = new THREE.Points(geometry, material);
            galaxyGroup.add(points);
        }

        // ウィンドウリサイズ対応
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // アニメーションループ
        const clock = new THREE.Clock();

        function animate() {
            const elapsedTime = clock.getElapsedTime();

            // 銀河の回転
            // 速度パラメータに基づいて回転
            galaxyGroup.rotation.y = elapsedTime * (parameters.rotationSpeed * 0.1);

            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        // 初期化実行
        init();

    </script>
</body>
</html>