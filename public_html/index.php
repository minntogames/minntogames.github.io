<!DOCTYPE html>
<html lang="en">
<head>
  <?php
    header("Cache-Control: public, max-age=31536000");
  ?>
  <meta charset="UTF-8">
  <meta name="theme-color" content="#00ffbb">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Minntelia chのサイトです。ここでは主にチャンネルの紹介や、キャラクターの紹介、各サイトへのリンクを置いてます。">
  <meta property="og:title" content="みんてりあの部屋">
  <meta property="og:url" content="https://youtube.minntelia.com">
  <link rel="canonical" href="https://youtube.minntelia.com" />
  <meta property="og:image" content="https://youtube.minntelia.com/image/icon.ico">
  <meta property="og:description" content="Minntelia chのサイトです。ここでは主にチャンネルの紹介や、キャラクターの紹介、各サイトへのリンクを置いてます。">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="みんてりあの部屋">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="https://youtube.minntelia.com/image/icon.ico">
  <title>トップページ</title>

  <!-- サブセットフォント(最優先)を最初に読み込み -->
  <link rel="preload" href="./fonts/miniMochiyPopOne-Regular.ttf" as="font" type="font/ttf" crossorigin fetchpriority="high">
  
  <!-- Google Fonts(完全版)は後から非同期で読み込み -->
  <!-- <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" fetchpriority="low" href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap&subset=japanese" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap&subset=japanese" media="print" onload='this.media="all"' /> -->
    
  <!-- CSSを非同期で読み込み -->
  <style>
    /* サブセットフォントを最優先で定義 */
    @font-face {
      font-family: 'Mochiy Pop One';
      src: url('./fonts/miniMochiyPopOne-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: block;
      unicode-range: U+0020-007E, U+3000-303F, U+3040-309F, U+30A0-30FF, U+4E00-9FFF;
    }
    
    body{margin:0;padding:0;font-family:'Mochiy Pop One',sans-serif;font-display:optional;background-color:aquamarine;-ms-overflow-style:none;scrollbar-width:none}body::-webkit-scrollbar{display:none}.container{min-height:100vh;display:flex;flex-direction:column;overflow:hidden}main{flex:1;padding:20px}.header{background-color:rgb(102,205,170);color:#fff;text-align:center;border-bottom-left-radius:20px;border-bottom-right-radius:20px}.header-content{display:flex;flex-direction:column;align-items:center;position:relative}.gradient{background:linear-gradient(rgba(102,205,171,.455),rgb(102,205,171));width:100%;height:100%;border-bottom-left-radius:20px;border-bottom-right-radius:20px;z-index:1}.logo img{padding-top:10px;}.header-text{margin-top:20px;font-size:30px}.fixed-header{position:fixed;top:-150px;left:0;width:100%;background-color:#66cdaa;color:#fff;padding:20px 0;text-align:center;transition:top .3s;border-bottom-left-radius:20px;border-bottom-right-radius:20px;will-change:top}nav ul{list-style-type:none;margin:0;padding:0;display:flex;justify-content:space-around}nav a{text-decoration:none;color:#000;font-weight:bold;padding:10px 20px}footer{background-color:#66cdaa;color:#fff;padding:20px;position:relative}.footer-content{display:flex;flex-wrap:wrap;justify-content:center;align-items:center}.logo{flex:1 1 100%;text-align:center}.footer-links{list-style:none;display:flex;padding:0;margin:0;flex:1 1 100%;justify-content:center}.footer-links li{margin-right:20px}.footer-links li:last-child{margin-right:0}.footer-links a{color:#000;text-decoration:none}.footer-links a:hover{text-decoration:underline}.footer-copy{flex:1 1 100%;text-align:center;color:#fff}.social-icons{flex:1 1 100%;list-style:none;display:flex;padding:0;margin:0}.social-icons li{margin-right:10px}.social-icons img{width:30px;height:auto;border-radius:50%}footer::before,footer::after{content:"";position:absolute;left:0;width:100%;height:20px;background-color:#66cdaa;transform-origin:50%;z-index:-1}footer::before{top:-10px;border-radius:50% 50% 0 0}footer::after{bottom:-10px;border-radius:0 0 50% 50%}.fancy-border{border:1px solid #ccc;padding:20px;border-radius:12px;box-shadow:0 2px 4px rgba(0,0,0,.2);overflow:hidden}.floating-button{background-color:aquamarine;color:#000;font-size:16px;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;transition:transform .2s,box-shadow .2s}.floating-button:hover{transform:translateY(-5px);box-shadow:0 5px 15px rgba(0,0,0,.3)}.box5{padding:.5em 1em;margin:30px;border:double 5px #4ec4d3}.box5 p{margin:0;padding:0}.box-flex{display:flex;flex-wrap:wrap;justify-content:space-around}.box-flex.box5{margin:0 auto;box-sizing:border-box;overflow:hidden}@media(max-width:750px){.box-flex{display:block}}h1{text-align:center}.buruburu-hover:hover{animation:hurueru .1s infinite}@keyframes hurueru{0%{transform:translate(0,0)rotateZ(0)}25%{transform:translate(2px,2px)rotateZ(1deg)}50%{transform:translate(0,2px)rotateZ(0)}75%{transform:translate(2px,0)rotateZ(-1deg)}100%{transform:translate(0,0)rotateZ(0)}}.counter {display: inline-flex;gap: 2px;align-items: center;}.counter-digit-wrapper {display: inline-block;overflow: hidden;width: 20px;height: 30px;position: relative;}.counter-digit {image-rendering: pixelated;display: block;}
  </style>

  <script type="text/javascript">
    // スクロールイベントの最適化: requestAnimationFrameとスロットリングで強制リフローを防止
    let ticking = false;
    let lastScrollY = 0;
    
    function updateHeader() {
        const header = document.querySelector(".fixed-header");
        if (!header) return;
        
        // CSSクラスで制御することでリフローを最小化
        if (lastScrollY > 150) {
            header.style.top = "0";
        } else {
            header.style.top = "-150px";
        }
        ticking = false;
    }
    
    document.addEventListener("scroll", function() {
        lastScrollY = window.scrollY; // スクロール値を保存
        
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true }); // passive: trueでスクロールパフォーマンス向上
  </script>
  <script type="text/javascript" async>
    document.addEventListener("DOMContentLoaded", function() {
            var contentDiv = document.getElementById("ShowNowYear");
            var fragment = document.createDocumentFragment();

            var now = new Date();
            var year = now.getFullYear();

            var newElement = document.createElement("p");
            newElement.textContent = `© 2007 - ${year} Minnteliaのお部屋 All rights`;
            fragment.appendChild(newElement);

            contentDiv.appendChild(fragment);
        });
  </script>
  <script type="text/javascript" async>
    // リアルタイムカウンター更新(Number rolling animation付き)
    let currentCount = 0;
    let targetCount = 0;
    let isAnimating = false;

    function formatCounterImages(count) {
        const digits = String(count).padStart(9, '0').split('');
        return digits.map((digit, index) => 
            `<span class="counter-digit-wrapper" data-index="${index}">
                <img src="./images/counter/${digit}.png" alt="${digit}" class="counter-digit" width="20" height="30">
            </span>`
        ).join('');
    }

    function animateDigitChange(wrapperElement, oldDigit, newDigit) {
        const oldNum = parseInt(oldDigit);
        const newNum = parseInt(newDigit);
        
        // 差分が1より大きい場合は中間の数字を表示
        const steps = [];
        if (oldNum < newNum) {
            // 上昇の場合: 1→2→3
            for (let i = oldNum; i <= newNum; i++) {
                steps.push(i);
            }
        } else if (oldNum > newNum) {
            // 下降の場合: 9→0 の場合は直接遷移
            if (oldNum === 9 && newNum === 0) {
                steps.push(9, 0);
            } else {
                // それ以外は普通に減少
                for (let i = oldNum; i >= newNum; i--) {
                    steps.push(i);
                }
            }
        } else {
            // 同じ数字の場合は何もしない
            return;
        }
        
        // 最初の数字は既に表示されているのでスキップ
        steps.shift();
        
        let currentStep = 0;
        const totalSteps = steps.length;
        
        // 減速を実現するための動的な遅延時間を計算
        function getStepDuration(stepIndex) {
            const baseSpeed = 80; // 基本速度(ミリ秒)
            const slowdownFactor = 4; // 減速の強さ
            
            // 最後の3ステップで減速
            if (stepIndex >= totalSteps - 3) {
                const slowdownIndex = stepIndex - (totalSteps - 3);
                return baseSpeed + (slowdownIndex * baseSpeed * slowdownFactor);
            }
            return baseSpeed;
        }
        
        function animateStep() {
            if (currentStep >= steps.length) return;
            
            const currentImg = wrapperElement.querySelector('img');
            const digit = steps[currentStep];
            
            // 新しい画像を作成
            const newImg = document.createElement('img');
            newImg.src = `./images/counter/${digit}.png`;
            newImg.alt = digit;
            newImg.className = 'counter-digit';
            newImg.width = 20;
            newImg.height = 30;
            
            // 新しい画像を下に配置
            newImg.style.position = 'absolute';
            newImg.style.top = '30px';
            newImg.style.left = '0';
            newImg.style.opacity = '0';
            
            wrapperElement.appendChild(newImg);
            
            // アニメーション開始
            setTimeout(() => {
                // 古い画像を上にスライドアウト
                currentImg.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
                currentImg.style.transform = 'translateY(-30px)';
                currentImg.style.opacity = '0';
                
                // 新しい画像を上にスライドイン
                newImg.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
                newImg.style.transform = 'translateY(-30px)';
                newImg.style.opacity = '1';
            }, 10);
            
            // 次のステップの遅延時間を取得
            const nextDelay = getStepDuration(currentStep);
            
            // 古い画像を削除
            setTimeout(() => {
                currentImg.remove();
                newImg.style.position = 'static';
                newImg.style.transition = 'none';
                newImg.style.transform = 'translateY(0)';
                newImg.style.opacity = '1';
                
                // 次のステップへ
                currentStep++;
                if (currentStep < steps.length) {
                    animateStep();
                }
            }, nextDelay);
        }
        
        // アニメーション開始
        animateStep();
    }

    function updateCounterDisplay(count, animate = false) {
        const counterDiv = document.querySelector('.counter');
        if (!counterDiv) return;

        const oldDigits = String(currentCount).padStart(9, '0').split('');
        const newDigits = String(count).padStart(9, '0').split('');
        
        if (animate && currentCount !== count) {
            // 既存の要素がある場合はアニメーション
            const wrappers = counterDiv.querySelectorAll('.counter-digit-wrapper');
            if (wrappers.length === 9) {
                newDigits.forEach((newDigit, index) => {
                    if (oldDigits[index] !== newDigit) {
                        setTimeout(() => {
                            animateDigitChange(wrappers[index], oldDigits[index], newDigit);
                        }, index * 50); // 左から順番にアニメーション
                    }
                });
            } else {
                // 要素がない場合は新規作成
                counterDiv.innerHTML = '訪問者数: ' + formatCounterImages(count);
            }
        } else {
            // アニメーションなしで更新
            counterDiv.innerHTML = '訪問者数: ' + formatCounterImages(count);
        }
        
        currentCount = count;
    }

    function updateCounter() {
        fetch('./php/get_count.php')
            .then(response => response.json())
            .then(data => {
                if (data.count !== currentCount) {
                    updateCounterDisplay(data.count, true);
                }
            })
            .catch(error => console.error('カウンター更新エラー:', error));
    }

    // ページ読み込み後、初期表示と2秒ごとに更新
    document.addEventListener("DOMContentLoaded", function() {
        // requestIdleCallbackで遅延読み込み(ブラウザのアイドル時に実行)
        if ('requestIdleCallback' in window) {
            requestIdleCallback(initCounter);
        } else {
            // フォールバック: 少し遅延させて実行
            setTimeout(initCounter, 100);
        }
    });
    
    function initCounter() {
        // 初期値を取得して表示
        fetch('./php/get_count.php')
            .then(response => response.json())
            .then(data => {
                currentCount = data.count;
                updateCounterDisplay(data.count, false);
                // 10秒後に最初の更新、その後5秒ごとに更新
                setTimeout(() => {
                    updateCounter();
                    setInterval(updateCounter, 5000);
                }, 10000);
            })
            .catch(error => {
                console.error('カウンター初期化エラー:', error);
                // エラー時はデフォルト表示を維持
            });
    }
  </script>
  <meta name="google-site-verification" content="iSqpkRYbSkVQ0YOxbV7FlruEYq5Rd45Qqx0sm-QOM5g" />
</head>
<body style="background-color: aquamarine;">
  <div class="container">
  
    <header class="header">

      <div class="header-content">

        <div class="gradient">
          
          <div class="logo">
            <picture>
              <source media="(max-width: 768px)" srcset="image/kaba.webp" width="100" height="100">
              <source media="(max-width: 1024px)" srcset="image/kaba.webp" width="100" height="100">
              <img src="image/kaba.webp" alt="logo" width="100" height="100" style="max-width: 100%; height: auto;" class="buruburu-hover">
            </picture>

          </div>
          <div class="tracking-in-expand-fwd">
            <h1 class="header-text">Minnteliaのお部屋</h1>
          </div>

        </div>
        
      </div>
      <div class="fixed-header" id="header">
        <nav>
          <ul>
              <li><a href="#">home</a></li>
              <li><a href="chara.html">chara</a></li>
              <li><a href="./UPD/index.html">update</a></li>
              <li><a href="menu.html">menu</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main>
      <!-- ここにコンテンツを追加 -->
      <div class="fancy-border">
        <p>
          どうも！Minnteliaのお部屋こと、みんとです。このサイトはチャンネル開設三周年を機に作ったサイトです。<br>
          まだサイトを作るのは慣れてませんが許してください（笑）<br>
          そしていろいろなことに挑戦しております。<br>
          何卒宜しくお願い致します！！
        </p>
      </div>
      <br>
      <div class="fancy-border">
        <h2>【力を入れているページ】</h2>
        <p>
          今まで作ってきた多彩なキャラを収録！！！<br/>
          <h3><a href="./character">キャラ図鑑</a></h3><br/>
          ねこの旅を手助けして伝説の星「に星」へとめざせ！！！<br/>
          <h3><a href="./games/bouncebounce/">ばうんすばうんす</a></h3><br/>
        </p>
      </div>
      <br>
      <div class="fancy-border">
        <h2>【おためし】</h2>
        <p>
          <div class="counter">
              訪問者数: <?php include './php/counter.php'; ?>
          </div>
        </p>
      </div>
      <br>
      <div class="fancy-border">
        <h2>【関連サイト】</h2>
        <p>
          今はないです。
        </p>
      </div>
      
    </main>
    <footer>
      <div class="footer-content">
        <div class="logo">
            <picture>
              <source media="(max-width: 768px)" srcset="./image/footer-rogo.webp" width="150" height="50">
              <source media="(max-width: 1024px)" srcset="./image/footer-rogo.webp" width="200" height="66">
              <img src="./image/footer-rogo.webp" alt="logo" width="500" height="166" style="max-width: 100%; height: auto;">
            </picture>
        </div>
        <ul class="footer-links">
          <li><a href="#"><button class="floating-button">home</button></a></li>
          <li><a href="chara.html"><button class="floating-button">chara</button></a></li>
          <li><a href="#"><button class="floating-button">空き家</button></a></li>
          <li><a href="menu.html"><button class="floating-button">menu</button></a></li>
        </ul>
        <ul class="social-icons">
          <li><a href="https://twitter.com/Minntelia_ch" target="_blank" rel="noopener noreferrer"><img src="./image/twi-ico.png" alt="twitter" width="30" height="30"></a></li>
          <li><a href="https://bsky.app/profile/minntelia.bsky.social" target="_blank" rel="noopener noreferrer"><img src="./image/fry.png" alt="bluesky" width="30" height="30"></a></li>
          <li><a href="https://misskey.io/@Minntelia_ch" target="_blank" rel="noopener noreferrer"><img src="./image/misskey.png" alt="misskey" width="30" height="30"></a></li>
          <li><a href="https://www.youtube.com/@Minntelia" target="_blank" rel="noopener noreferrer"><img src="./image/you-ico.png" alt="youtube" width="30" height="30"></a></li>
          <li><a href="https://discord.gg/ve5TSbkHse" target="_blank" rel="noopener noreferrer"><img src="./image/dis-ico.png" alt="discord server" width="30" height="30"></a></li>
          <li><a href="https://steamcommunity.com/id/MinnteliaCh" target="_blank" rel="noopener noreferrer"><img src="./image/Steam_icon_logo.svg" alt="steam" width="30" height="30"></a></li>
          <li><a href="https://scratch.mit.edu/users/MinnteliaGames" target="_blank" rel="noopener noreferrer"><img src="./image/Scratch.logo.S.png" alt="Scratch" width="30" height="30"></a></li>
          <li><a href="https://www.pixiv.net/users/76731635" target="_blank" rel="noopener noreferrer"><img src="./image/pixiv.png" alt="pixiv" width="30" height="30"></a></li>
          <li><a href="https://www.twitch.tv/minntelia_ch" target="_blank" rel="noopener noreferrer"><img src="./image/glitch_flat_black-ops.png" alt="twitch" width="30" height="30"></a></li>
          <li><a href="https://www.tiktok.com/@minntelia" target="_blank" rel="noopener noreferrer"><img src="./image/notimage.png" alt="tictok" width="30" height="30"></a></li>
        </ul>
        <p class="copyright" id="ShowNowYear"></p>
      </div>
    </footer>
  </div>
</body>
