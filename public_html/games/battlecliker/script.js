const enemyManager = new EnemyManager();
const enemy = document.getElementById("enemy");
const hpBar = document.getElementById("hpBar");
const hpText = document.getElementById("hpText");
const dpsValue = document.getElementById("dpsValue");
let maxHp, currentHp;

// DPS計測用の変数
let damageHistory = []; // ダメージの履歴を保存
let dpsUpdateInterval;

(async () => {
    await enemyManager.init();
    enemyManager.getEnemy(4); // ID0の敵を取得
    const { name, hp, coin, img } = enemyManager.catchdata;
    enemy.src = img;
    enemy.alt = name;
    maxHp = hp;
    currentHp = maxHp;
    updateHpBar();
    initDpsCounter();ii
})();

// DPS計測機能の初期化
function initDpsCounter() {
    // 1秒ごとにDPSを更新
    dpsUpdateInterval = setInterval(updateDps, 100); // 100msごとに更新でよりスムーズに
}

// DPSを計算・更新する関数
function updateDps() {
    const currentTime = Date.now();
    const timeWindow = 3000; // 3秒間のウィンドウで計算
    
    // 3秒以上古いデータを削除
    damageHistory = damageHistory.filter(record => currentTime - record.time <= timeWindow);
    
    // DPSを計算
    if (damageHistory.length === 0) {
        dpsValue.textContent = "0.0";
        return;
    }
    
    const totalDamage = damageHistory.reduce((sum, record) => sum + record.damage, 0);
    const timeSpan = damageHistory.length > 1 
        ? (currentTime - damageHistory[0].time) / 1000 
        : timeWindow / 1000;
    
    const dps = timeSpan > 0 ? totalDamage / timeSpan : 0;
    dpsValue.textContent = dps.toFixed(1);
}

// ダメージを記録する関数
function recordDamage(damage) {
    damageHistory.push({
        damage: damage,
        time: Date.now()
    });
}

// HPバーとテキストを更新する関数
function updateHpBar() {
    const hpPercentage = (currentHp / maxHp) * 100;
    hpBar.style.width = hpPercentage + "%";
    hpText.textContent = currentHp + " / " + maxHp;
    
    // HPが0になったら敵をリセット
    if (currentHp <= 0) {
        enemy.classList.add("defeated");
        // フェードアウトが完了してからリセット（ゆっくりとしたエフェクト）
        setTimeout(() => {
            currentHp = maxHp;
            enemy.classList.remove("damaged");
            enemy.classList.remove("defeated");
            updateHpBar();
        }, 1200); // ゆっくりとしたフェードアウトに合わせて時間を延長
    }
}

// ダメージ数値を表示する関数
function showDamageNumber(damage, clickX, clickY) {
    const damageElement = document.createElement('div');
    damageElement.textContent = `-${damage}`;
    damageElement.className = 'damage-number';
    
    // 敵の位置を取得
    const enemyRect = enemy.getBoundingClientRect();
    
    // ランダムな位置を計算（敵の画像の上部範囲）
    const randomX = enemyRect.left + Math.random() * enemyRect.width;
    const randomY = enemyRect.top - 10 + Math.random() * 30; // 画像の少し上からランダム
    
    // 位置を設定
    damageElement.style.left = randomX + 'px';
    damageElement.style.top = randomY + 'px';
    
    // bodyに追加
    document.body.appendChild(damageElement);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        if (damageElement.parentNode) {
            damageElement.parentNode.removeChild(damageElement);
        }
    }, 1500);
}

// 画像の右クリック、ドラッグ、保存を無効化
enemy.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    return false;
});

enemy.addEventListener('dragstart', (event) => {
    event.preventDefault();
    return false;
});

enemy.addEventListener('selectstart', (event) => {
    event.preventDefault();
    return false;
});

// iPhone/iPad用の長押しメニュー無効化
enemy.addEventListener('touchstart', (event) => {
    // 長押しを検出するためのタイマー
    enemy.touchTimer = setTimeout(() => {
        // 長押し時の処理を無効化
    }, 500);
});

enemy.addEventListener('touchend', (event) => {
    if (enemy.touchTimer) {
        clearTimeout(enemy.touchTimer);
    }
});

enemy.addEventListener('touchmove', (event) => {
    if (enemy.touchTimer) {
        clearTimeout(enemy.touchTimer);
    }
});

// 敵をクリックした時の処理
enemy.addEventListener("click", (event) => {
    if (currentHp > 0) {
        const damage = 10; // 1回のクリックで10ダメージ
        currentHp -= damage;
        updateHpBar();
        
        // DPS計測のためダメージを記録
        recordDamage(damage);
        
        // ダメージ数値を表示
        showDamageNumber(damage, event.clientX, event.clientY);
        
        // ダメージエフェクト（瞬間的に赤くして徐々に戻す）
        enemy.classList.add("damaged");
        setTimeout(() => {
            if (currentHp > 0) { // HPが残っている場合のみダメージエフェクトを解除
                enemy.classList.remove("damaged");
            }
        }, 50); //瞬間的に赤くしてすぐに解除開始
    }
});


