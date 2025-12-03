<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>縺翫＆縺後＠縺ｮ縺輔＞縺ｨ縺ｯ縺ｿ縺､縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆</title>
        <style>
            html,body{
                background-color: black;
                padding: 0;
                margin: 0;
                border: 0;
                display: flex;
                justify-content: center;
                overflow: hidden;
            }
            img {
                width: 100vw;
                margin: auto;
                display: block;
            }
            #warningOverlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: black;
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            #warningOverlay img {
                width: 100vw;
                height: 100vh;
                object-fit: cover;
            }
        </style>
    </head>
    <body>
        <audio id="bgAudio" loop src="../image/666.wav" preload="auto"></audio>
        <img id="mainImg" src="../image/carseEYE.gif">
        
        <div id="warningOverlay">
            <img src="../image/fun.png" alt="警告">
        </div>
        
        <audio id="warningAudio" src="../image/fun.mp3" preload="auto"></audio>
        
        <script>
            let pressTimer;
            let devToolsOpen = false;
            let bodyPressTimer; // ページ全体の長押し用
            let audioStarted = false;
            
            // 音楽再生を開始する関数
            function startAudio() {
                if (!audioStarted) {
                    const bgAudio = document.getElementById('bgAudio');
                    bgAudio.play().catch(e => {
                        console.log('音楽再生失敗:', e);
                        // 再試行
                        setTimeout(() => bgAudio.play().catch(() => {}), 100);
                    });
                    audioStarted = true;
                }
            }
            
            // ページ読み込み時とユーザー操作時に音楽を開始
            window.addEventListener('load', startAudio);
            document.addEventListener('click', startAudio, { once: true });
            document.addEventListener('touchstart', startAudio, { once: true });
            
            // ページが表示されたとき(bfcache対策)
            window.addEventListener('pageshow', function(event) {
                const bgAudio = document.getElementById('bgAudio');
                if (bgAudio.paused && audioStarted) {
                    bgAudio.play().catch(() => {});
                }
            });
            
            function triggerWarning() {
                const overlay = document.getElementById('warningOverlay');
                const audio = document.getElementById('warningAudio');
                
                overlay.style.display = 'flex';
                audio.volume = 1.0; // 音量を最大に設定
                audio.play().catch(e => console.log(e));
                
                setTimeout(() => {
                    window.location.href = '../menu.html';
                }, 1000);
            }
            
            // 30秒経過で自動トリガー
            setTimeout(triggerWarning, 30000);
            
            // 右クリック防止
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                triggerWarning();
            });
            
            // F12キー防止
            document.addEventListener('keydown', function(e) {
                if (e.key === 'F12' || e.keyCode === 123) {
                    e.preventDefault();
                    triggerWarning();
                }
                // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U なども防止
                if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    triggerWarning();
                }
                // ページ再読み込み検知 (F5, Ctrl+R)
                if (e.key === 'F5' || e.keyCode === 116 || 
                    (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
                    e.preventDefault();
                    triggerWarning();
                }
            });
            
            // 画像長押し検知
            const mainImg = document.getElementById('mainImg');
            
            mainImg.addEventListener('mousedown', function() {
                pressTimer = setTimeout(triggerWarning, 500);
            });
            
            mainImg.addEventListener('mouseup', function() {
                clearTimeout(pressTimer);
            });
            
            mainImg.addEventListener('mouseleave', function() {
                clearTimeout(pressTimer);
            });
            
            // タッチデバイス対応
            mainImg.addEventListener('touchstart', function() {
                pressTimer = setTimeout(triggerWarning, 500);
            });
            
            mainImg.addEventListener('touchend', function() {
                clearTimeout(pressTimer);
            });
            
            mainImg.addEventListener('touchcancel', function() {
                clearTimeout(pressTimer);
            });
            
            // ドラッグ防止
            mainImg.addEventListener('dragstart', function(e) {
                e.preventDefault();
                triggerWarning();
            });
            
            // ページ全体での長押し検知
            document.body.addEventListener('mousedown', function(e) {
                bodyPressTimer = setTimeout(triggerWarning, 500);
            });
            
            document.body.addEventListener('mouseup', function() {
                clearTimeout(bodyPressTimer);
            });
            
            document.body.addEventListener('mouseleave', function() {
                clearTimeout(bodyPressTimer);
            });
            
            // タッチデバイス対応（ページ全体）
            document.body.addEventListener('touchstart', function() {
                bodyPressTimer = setTimeout(triggerWarning, 500);
            });
            
            document.body.addEventListener('touchend', function() {
                clearTimeout(bodyPressTimer);
            });
            
            document.body.addEventListener('touchcancel', function() {
                clearTimeout(bodyPressTimer);
            });
            
            // DevTools検知
            const detectDevTools = () => {
                const threshold = 160;
                if (window.outerWidth - window.innerWidth > threshold || 
                    window.outerHeight - window.innerHeight > threshold) {
                    if (!devToolsOpen) {
                        devToolsOpen = true;
                        triggerWarning();
                    }
                }
            };
            
            setInterval(detectDevTools, 1000);
        </script>
    </body>
</html>