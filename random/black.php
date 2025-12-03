<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blackhole</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; }
        canvas { display: block; }
        #info {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            pointer-events: none;
            z-index: 10;
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        h1 { margin: 0 0 5px 0; font-size: 1.2rem; font-weight: 300; letter-spacing: 2px; }
        p { margin: 0; font-size: 0.9rem; color: #aaa; }
    </style>
</head>
<body>

    <!-- Three.js Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

    <script>
        // シーン、カメラ、レンダラーのセットアップ
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 3, 12);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // 高解像度対応
        document.body.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 3;
        controls.maxDistance = 50;

        // -------------------------------------------------------------
        // シェーダー定義 (GLSL)
        // -------------------------------------------------------------

        // 降着円盤（ディスク）用のシェーダー
        // ノイズと回転を使ってガスが渦巻く様子を表現
        const diskVertexShader = `
            varying vec2 vUv;
            varying vec3 vPos;
            void main() {
                vUv = uv;
                vPos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const diskFragmentShader = `
            uniform float iTime;
            varying vec2 vUv;
            varying vec3 vPos;

            // 簡易ノイズ関数
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                // 中心からの距離
                float dist = length(vPos.xy);
                
                // 円盤の穴（事象の地平線付近）と外側の減衰
                float innerRadius = 1.8;
                float outerRadius = 7.0;
                
                if (dist < innerRadius || dist > outerRadius) {
                    discard; // 描画しない
                }

                // 角度
                float angle = atan(vPos.y, vPos.x);
                
                // スパイラル効果：距離に応じて角度をずらす
                float spiral = angle + 5.0 / dist; 
                
                // 回転アニメーション
                float speed = 2.0 / (dist * 0.5); // 内側ほど速く回る
                float rotationalOffset = iTime * speed;

                // ノイズ生成（ガスのムラ）
                float n = noise(vec2(dist * 4.0, (spiral + rotationalOffset) * 3.0));
                float n2 = noise(vec2(dist * 8.0 + 10.0, (spiral + rotationalOffset * 1.2) * 6.0));
                
                float intensity = n * 0.6 + n2 * 0.4;

                // 基本色（高温のオレンジ〜赤）
                vec3 colorHot = vec3(1.5, 0.9, 0.5); // 白っぽい黄色
                vec3 colorCool = vec3(0.8, 0.1, 0.05); // 暗い赤
                vec3 finalColor = mix(colorCool, colorHot, intensity * (3.0 / dist));

                // エッジのフェード
                float alpha = 1.0;
                // 内側の切れ味を良く、外側をふんわりさせる
                float edgeFade = smoothstep(outerRadius, outerRadius - 2.0, dist) * smoothstep(innerRadius, innerRadius + 0.2, dist);
                
                gl_FragColor = vec4(finalColor, edgeFade * 0.9);
            }
        `;

        // 事象の地平線の周りの「光子球（Photon Sphere）」または重力レンズの輝き用シェーダー
        const glowVertexShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const glowFragmentShader = `
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                // フレネル効果：視線と法線の角度に基づいてエッジを光らせる
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                float dotProduct = dot(normal, viewDir);
                
                // エッジのみ光らせる（中心は黒）
                float rim = 1.0 - max(dotProduct, 0.0);
                rim = pow(rim, 4.0); // 指数関数でシャープに

                vec3 glowColor = vec3(0.6, 0.8, 1.0); // 青白い光
                gl_FragColor = vec4(glowColor, rim * 0.8);
            }
        `;


        // -------------------------------------------------------------
        // オブジェクト生成
        // -------------------------------------------------------------

        // 1. 星空（背景）
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 3000;
        const posArray = new Float32Array(starCount * 3);
        for(let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 200; // 広範囲に配置
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);


        // 2. 事象の地平線（中心の黒い球体）
        // 本来は見えないが、背景の光を遮断する「黒」として表現
        const bhGeometry = new THREE.SphereGeometry(1.5, 64, 64);
        const bhMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const blackHole = new THREE.Mesh(bhGeometry, bhMaterial);
        scene.add(blackHole);


        // 3. 降着円盤（Accretion Disk）
        // 平面ジオメトリにシェーダーを適用
        const diskGeometry = new THREE.PlaneGeometry(14, 14, 128, 128);
        const diskUniforms = {
            iTime: { value: 0 }
        };
        const diskMaterial = new THREE.ShaderMaterial({
            vertexShader: diskVertexShader,
            fragmentShader: diskFragmentShader,
            uniforms: diskUniforms,
            transparent: true,
            side: THREE.DoubleSide, // 両面描画
            depthWrite: false, // 重なり順をきれいにするため
            blending: THREE.AdditiveBlending // 光加算合成
        });
        const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
        // ブラックホールの向きに合わせて少し傾ける
        accretionDisk.rotation.x = Math.PI / 2; 
        // 視覚的な面白さのために少しZ軸も傾ける
        accretionDisk.rotation.y = 0.2;
        scene.add(accretionDisk);


        // 4. 光子リング / 重力レンズグロー（球体の周りの薄い光）
        // ブラックホールの後ろ側の円盤が重力で持ち上がって見える効果を簡易的なグローで補完
        const glowGeometry = new THREE.SphereGeometry(1.55, 64, 64);
        const glowMaterial = new THREE.ShaderMaterial({
            vertexShader: glowVertexShader,
            fragmentShader: glowFragmentShader,
            transparent: true,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glowMesh);


        // -------------------------------------------------------------
        // アニメーションループ
        // -------------------------------------------------------------
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // シェーダーに時間を渡す（アニメーション用）
            diskUniforms.iTime.value = elapsedTime;

            // ディスク自体もゆっくり回転させる（オプション）
            // accretionDisk.rotation.z -= 0.001;

            // カメラコントロールの更新
            controls.update();

            // 視点に応じてグローメッシュの向きをカメラに向ける（ビルボード効果の代替）
            // 今回は球体なので不要だが、複雑なレンズ効果をする場合は必要になる

            renderer.render(scene, camera);
        }

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 開始
        animate();

    </script>
</body>
</html>