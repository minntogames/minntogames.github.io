// ピクセルアート風キャラクターカードのJavaScript
let characters = [];
let characterStatus = [];
let filteredCharacters = [];
let autoScrollInterval = null;
let isAutoScrolling = false;

// グローバルアクセス用
window.allCharacters = characters;
window.filteredCharacters = filteredCharacters;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // デフォルト設定を適用
    applyDefaultSettings();
    
    loadCharacterData();
    setupEventListeners();
    checkURLParameters();
});

// デフォルト設定を適用する関数
function applyDefaultSettings() {
    // HP順、昇順に設定
    const sortSelect = document.getElementById('sortSelect');
    const orderSelect = document.getElementById('orderSelect');
    if (sortSelect) sortSelect.value = 'hp';
    if (orderSelect) orderSelect.value = 'asc';
    
    // 横並び(1行)に設定
    const layoutSelect = document.getElementById('layoutSelect');
    if (layoutSelect) {
        layoutSelect.value = 'horizontal';
        changeLayout(); // レイアウトを即座に適用
    }
    
    // オリジナルスタイルに設定
    const styleSelect = document.getElementById('styleSelect');
    if (styleSelect) {
        styleSelect.value = 'original';
        changeStyle(); // スタイルを即座に適用
    }
    
    // 戦闘背景を有効に設定（HTMLでは既にchecked）
    const enableBackgrounds = document.getElementById('enableBackgrounds');
    if (enableBackgrounds) enableBackgrounds.checked = true;
    
    // 別スタイル表示を有効に設定（HTMLでは既にchecked）
    const showAltStyles = document.getElementById('showAltStyles');
    if (showAltStyles) showAltStyles.checked = true;
}

// テキスト抽出関数
function getRaceText(raceData, styleIndex = 0) {
    if (!raceData) return 'Unknown';
    
    // 文字列の場合はそのまま返す
    if (typeof raceData === 'string') {
        return raceData;
    }
    
    // 配列の場合
    if (Array.isArray(raceData)) {
        if (raceData.length === 0) return 'Unknown';
        
        // 2重配列でスタイル別データがある場合
        if (Array.isArray(raceData[0]) && raceData.length > styleIndex) {
            const styleRaceData = raceData[styleIndex];
            if (Array.isArray(styleRaceData)) {
                const races = styleRaceData;
                return races.length > 0 ? races.join(', ') : 'Unknown';
            }
            return styleRaceData || 'Unknown';
        }
        // 3重配列の場合: [[[value]], []] -> value
        else if (Array.isArray(raceData[0]) && Array.isArray(raceData[0][0])) {
            const race = raceData[0][0][0];
            return race || 'Unknown';
        }
        // 2重配列の場合: [[value1, value2, ...]] -> "value1, value2, ..."
        else if (Array.isArray(raceData[0])) {
            const races = raceData[0];
            return races.length > 0 ? races.join(', ') : 'Unknown';
        }
        // 単純配列の場合: [value1, value2, ...] -> "value1, value2, ..."
        else {
            return raceData.join(', ') || 'Unknown';
        }
    }
    
    return 'Unknown';
}

function getFightingStyleText(styleData, styleIndex = 0) {
    if (!styleData) return 'Unknown';
    
    // 文字列の場合はそのまま返す
    if (typeof styleData === 'string') {
        return styleData;
    }
    
    // 配列の場合
    if (Array.isArray(styleData)) {
        if (styleData.length === 0) return 'Unknown';
        
        // 2重配列でスタイル別データがある場合
        if (Array.isArray(styleData[0]) && styleData.length > styleIndex) {
            const styleStyleData = styleData[styleIndex];
            if (Array.isArray(styleStyleData)) {
                const styles = styleStyleData;
                return styles.length > 0 ? styles.join(', ') : 'Unknown';
            }
            return styleStyleData || 'Unknown';
        }
        // 3重配列の場合: [[[value]], []] -> value
        else if (Array.isArray(styleData[0]) && Array.isArray(styleData[0][0])) {
            const style = styleData[0][0][0];
            return style || 'Unknown';
        }
        // 2重配列の場合: [[value1, value2, ...]] -> "value1, value2, ..."
        else if (Array.isArray(styleData[0])) {
            const styles = styleData[0];
            return styles.length > 0 ? styles.join(', ') : 'Unknown';
        }
        // 単純配列の場合: [value1, value2, ...] -> "value1, value2, ..."
        else {
            return styleData.join(', ') || 'Unknown';
        }
    }
    
    return 'Unknown';
}

function getAttributeText(attrData, styleIndex = 0) {
    if (!attrData) return 'Unknown';
    
    // 文字列の場合はそのまま返す
    if (typeof attrData === 'string') {
        return attrData;
    }
    
    // 配列の場合
    if (Array.isArray(attrData)) {
        if (attrData.length === 0) return 'Unknown';
        
        // 2重配列でスタイル別データがある場合
        if (Array.isArray(attrData[0]) && attrData.length > styleIndex) {
            const styleAttrData = attrData[styleIndex];
            if (Array.isArray(styleAttrData)) {
                const attrs = styleAttrData;
                return attrs.length > 0 ? attrs.join(', ') : 'Unknown';
            }
            return styleAttrData || 'Unknown';
        }
        // 3重配列の場合: [[[value]], []] -> value
        else if (Array.isArray(attrData[0]) && Array.isArray(attrData[0][0])) {
            const attr = attrData[0][0][0];
            return attr || 'Unknown';
        }
        // 2重配列の場合: [[value1, value2, ...]] -> "value1, value2, ..."
        else if (Array.isArray(attrData[0])) {
            const attrs = attrData[0];
            return attrs.length > 0 ? attrs.join(', ') : 'Unknown';
        }
        // 単純配列の場合: [value1, value2, ...] -> "value1, value2, ..."
        else {
            return attrData.join(', ') || 'Unknown';
        }
    }
    
    return 'Unknown';
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const charId = urlParams.get('char');
    
    if (charId) {
        // 特定のキャラクターが指定されている場合、そのキャラクターにスクロール
        setTimeout(() => {
            scrollToCharacter(parseInt(charId));
        }, 1000);
    }
}

// 指定されたキャラクターにスクロール
function scrollToCharacter(charId) {
    const targetCard = document.querySelector(`[data-char-id="${charId}"]`);
    if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.style.animation = 'cardGlow 2s infinite';
        setTimeout(() => {
            targetCard.style.animation = '';
        }, 4000);
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    const backBtn = document.getElementById('backToMain');
    const sortSelect = document.getElementById('sortSelect');
    const filterSelect = document.getElementById('filterWorld');
    const layoutSelect = document.getElementById('layoutSelect');
    const styleSelect = document.getElementById('styleSelect');
    const autoScrollToggle = document.getElementById('autoScrollToggle');

    backBtn.addEventListener('click', () => {
        window.location.href = 'index.php';
    });

    sortSelect.addEventListener('change', () => {
        sortAndDisplayCards();
    });

    // 昇順・降順選択のイベントリスナーを追加
    const orderSelect = document.getElementById('orderSelect');
    orderSelect.addEventListener('change', () => {
        sortAndDisplayCards();
    });

    filterSelect.addEventListener('change', () => {
        filterAndDisplayCards();
    });

    layoutSelect.addEventListener('change', () => {
        changeLayout();
    });

    styleSelect.addEventListener('change', () => {
        changeStyle();
    });
    
    // 別スタイル表示切り替え
    const showAltStyles = document.getElementById('showAltStyles');
    if (showAltStyles) {
        showAltStyles.addEventListener('change', () => {
            loadCharacterData(); // データを再読み込みして展開し直す
        });
    }

    autoScrollToggle.addEventListener('click', () => {
        toggleAutoScroll();
    });
}

// キャラクターデータの読み込み
async function loadCharacterData() {
    try {
        showLoading(true);
        console.log('データ読み込み開始...');
        
        // キャラクターデータとステータスデータを並行して読み込み
        const [chaResponse, statusResponse] = await Promise.all([
            fetch('cha.json'),
            fetch('cha-status.json')
        ]);
        
        if (!chaResponse.ok) {
            throw new Error(`HTTP ${chaResponse.status}: ${chaResponse.statusText}`);
        }
        if (!statusResponse.ok) {
            throw new Error(`Status HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
        }
        
        const characterData = await chaResponse.json();
        const statusData = await statusResponse.json();
        
        console.log('読み込まれたキャラクターデータ:', characterData);
        console.log('読み込まれたステータスデータ:', statusData);
        
        // 設定データを除外してキャラクターデータのみを取得
        characters = characterData.filter(item => item.id !== undefined && typeof item.id === 'number');
        characterStatus = statusData;
        
        // ステータス情報をキャラクターデータにマージ
        characters.forEach(char => {
            const status = characterStatus.find(s => s.id === char.id);
            if (status) {
                char.currentHp = status.hp;
                char.imageSettings = status.imageSettings; // 画像設定
                char.altImageSettings = status.altImageSettings; // 別スタイル画像設定
                char.boss = status.boss; // ボス設定
                char.altBoss = status.altBoss; // 別スタイル用ボス設定
                char.altStylesHp = status.altStyles; // 別スタイルHP
            } else {
                char.currentHp = 100; // デフォルト値
            }
        });
        
        console.log('フィルタリング後のキャラクター数:', characters.length);
        console.log('最初の3キャラクターのHP情報:', characters.slice(0, 3).map(c => ({
            id: c.id,
            name: c.name?.[0] || 'Unknown',
            currentHp: c.currentHp,
            calculatedHp: calculateHP(c)
        })));
        
        console.log('最後の3キャラクターのHP情報:', characters.slice(-3).map(c => ({
            id: c.id,
            name: c.name?.[0] || 'Unknown',
            currentHp: c.currentHp,
            calculatedHp: calculateHP(c)
        })));
        
        filteredCharacters = [...characters];
        
        // 複数スタイルのキャラクターを展開
        expandCharactersWithStyles();
        
        // グローバル変数を更新
        window.allCharacters = characters;
        window.filteredCharacters = filteredCharacters;
        
        console.log('📊 グローバル変数更新完了:', {
            allCharacters: window.allCharacters.length,
            filteredCharacters: window.filteredCharacters.length
        });
        
        if (characters.length === 0) {
            console.error('キャラクターデータが見つかりません');
            showError();
            return;
        }
        
        // デフォルトソート（HP順、昇順）を適用
        sortAndDisplayCards();
        
        showLoading(false);
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        showError();
    }
}

// 複数スタイルのキャラクターを展開する関数
function expandCharactersWithStyles() {
    const showAltStyles = document.getElementById('showAltStyles')?.checked !== false;
    if (!showAltStyles) return;
    
    const expandedCharacters = [];
    
    characters.forEach(char => {
        // 基本スタイル（インデックス0）を追加
        expandedCharacters.push({
            ...char,
            styleIndex: 0,
            isAltStyle: false
        });
        
        // 複数のnameがある場合は別スタイルとして追加
        if (Array.isArray(char.name) && char.name.length > 1) {
            for (let i = 1; i < char.name.length; i++) {
                if (char.name[i] && char.name[i].trim()) { // 空でない場合のみ
                    expandedCharacters.push({
                        ...char,
                        styleIndex: i,
                        isAltStyle: true,
                        id: `${char.id}-${i}` // 重複を避けるためにIDを変更
                    });
                }
            }
        }
    });
    
    characters = expandedCharacters;
    filteredCharacters = [...characters];
}

// ローディング表示の制御
function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    const container = document.getElementById('cardsContainer');
    
    if (show) {
        loading.style.display = 'block';
        container.style.display = 'none';
    } else {
        loading.style.display = 'none';
        // インライン display スタイルを削除して CSS クラスに任せる
        container.style.display = '';
    }
}

// エラー表示
function showError() {
    const loading = document.getElementById('loadingIndicator');
    const error = document.getElementById('errorMessage');
    const container = document.getElementById('cardsContainer');
    
    loading.style.display = 'none';
    container.style.display = 'none';
    error.style.display = 'block';
}

// フィルタリング
function filterAndDisplayCards() {
    const worldFilter = document.getElementById('filterWorld').value;
    
    if (worldFilter) {
        filteredCharacters = characters.filter(char => char.world === worldFilter);
    } else {
        filteredCharacters = [...characters];
    }
    
    // グローバル変数を更新
    window.filteredCharacters = filteredCharacters;
    
    sortAndDisplayCards();
}

// ソートと表示
function sortAndDisplayCards() {
    const sortBy = document.getElementById('sortSelect').value;
    const order = document.getElementById('orderSelect').value; // 昇順(asc) or 降順(desc)
    console.log('ソート開始:', sortBy, '順序:', order);
    
    filteredCharacters.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
            case 'name':
                const nameA = a.name ? a.name[0] : '';
                const nameB = b.name ? b.name[0] : '';
                comparison = nameA.localeCompare(nameB);
                break;
            case 'hp':
                const hpA = calculateHP(a);
                const hpB = calculateHP(b);
                console.log(`HP比較: ${a.name?.[0] || a.id}(${hpA}) vs ${b.name?.[0] || b.id}(${hpB})`);
                comparison = hpA - hpB;
                // 同値の場合はID昇順
                if (comparison === 0) {
                    comparison = a.id - b.id;
                }
                break;
            case 'world':
                comparison = (a.world || '1').localeCompare(b.world || '1');
                break;
            default: // id
                comparison = a.id - b.id;
                break;
        }
        
        // 降順の場合は比較結果を反転
        return order === 'desc' ? -comparison : comparison;
    });
    
    console.log('ソート後の最初の3キャラクター:', filteredCharacters.slice(0, 3).map(c => ({
        name: c.name?.[0] || 'Unknown',
        id: c.id,
        hp: calculateHP(c),
        currentHp: c.currentHp
    })));
    
    // グローバル変数を更新
    window.filteredCharacters = filteredCharacters;
    
    displayCards();
}

// HP計算（ステータス優先）
function calculateHP(character) {
    // 別スタイルの場合の処理
    if (character.isAltStyle && character.styleIndex > 0) {
        const originalId = typeof character.id === 'string' 
            ? parseInt(character.id.split('-')[0]) 
            : character.id;
        const status = characterStatus.find(s => s.id === originalId);
        
        if (status && status.altStyles && status.altStyles[character.styleIndex - 1] !== undefined) {
            return status.altStyles[character.styleIndex - 1];
        }
    }
    
    // ステータスファイルのHPが存在する場合はそれを使用
    if (character.currentHp !== undefined) {
        return character.currentHp;
    }
    
    // 基本HP：レベル × 10 + 年齢ボーナス（フォールバック）
    const baseHP = (character.id || 1) * 3;
    const ageBonus = character.age && !isNaN(character.age) ? Math.floor(character.age / 10) : 5;
    const heightBonus = character.height ? Math.floor(character.height / 10) : 15;
    
    const finalHP = Math.max(baseHP + ageBonus + heightBonus, 15);
    
    // デバッグ用（最初の数キャラクターのみ）
    if (character.id <= 3) {
        console.log(`HP計算 ID${character.id}:`, {
            currentHp: character.currentHp,
            baseHP,
            ageBonus,
            heightBonus,
            finalHP
        });
    }
    
    return finalHP;
}

// カード表示
function displayCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) {
        console.error('カードコンテナが見つかりません');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('カード表示開始、キャラクター数:', filteredCharacters.length);
    
    if (filteredCharacters.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #00ff88; padding: 50px;">表示するキャラクターがありません</div>';
        return;
    }
    
    filteredCharacters.forEach((character, index) => {
        console.log(`カード作成中 ${index + 1}/${filteredCharacters.length}:`, character.name ? character.name[0] : 'Unknown');
        const card = createCharacterCard(character);
        container.appendChild(card);
        
        // Intersection Observer に登録
        if (typeof cardObserver !== 'undefined') {
            cardObserver.observe(card);
        }
    });
    
    // 全カード表示後に背景を動的適用
    setTimeout(() => {
        console.log('🎨 背景適用タイミング開始');
        if (window.battleBackgroundManager) {
            console.log('✅ 背景マネージャー検出');
            window.battleBackgroundManager.applyToAllCards();
        } else {
            console.log('❌ 背景マネージャーが見つかりません');
        }
    }, 100);
    
    console.log('カード表示完了');
}

// キャラクターカードの作成
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = `character-card world-${character.world || '1'}`;
    if (character.isAltStyle) {
        card.classList.add('alt-style');
    }
    
    // ボス設定を判定
    let isBoss = false;
    if (character.isAltStyle && character.styleIndex > 0) {
        // 別スタイルの場合：altBoss配列をチェック
        const altIndex = character.styleIndex - 1;
        if (character.altBoss && character.altBoss[altIndex] !== undefined) {
            isBoss = character.altBoss[altIndex];
        }
    } else {
        // 基本スタイルの場合：boss設定をチェック
        isBoss = character.boss;
    }
    
    // ボスクラスを追加
    if (isBoss) {
        card.classList.add('boss-card');
    }
    
    card.setAttribute('data-char-id', character.id);
    card.setAttribute('data-character-id', character.id);
    
    const hp = calculateHP(character);
    const styleIndex = character.styleIndex || 0;
    const name = character.name && Array.isArray(character.name) ? character.name[styleIndex] : (character.name || 'Unknown');
    const race = getRaceText(character.race, styleIndex);
    const fightingStyle = getFightingStyleText(character.fightingStyle, styleIndex);
    const attribute = getAttributeText(character.attribute, styleIndex);
    const group = getGroupText(character.group);
    const imageUrl = getImageUrl(character.img, styleIndex);
    
    // 別スタイルの場合は名前に印を付ける
    const displayName = character.isAltStyle ? `${name} ` : name;
    
    // スタイルモードをチェック
    const styleSelect = document.getElementById('styleSelect');
    const isOriginalStyle = styleSelect && styleSelect.value === 'original';
    
    // HP値の桁数を計算してクラスを決定
    function getHPSizeClass(hpValue) {
        const digits = hpValue.toString().length;
        if (digits <= 3) return 'hp-short';
        if (digits <= 5) return 'hp-medium';
        if (digits <= 6) return 'hp-long';
        return 'hp-extra-long';
    }
    
    const hpSizeClass = getHPSizeClass(hp);
    
    if (isOriginalStyle) {
        // オリジナルスタイル
        card.innerHTML = `
            <div class="hp-badge ${hpSizeClass}">
                <div class="hp-value">${hp}</div>
                <div class="hp-label">HP</div>
            </div>
            <div class="character-name">${displayName}</div>
            <div class="character-image">
                <canvas class="mother2-background" width="240" height="180" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
                <img src="${imageUrl}" alt="${name}" class="pixelated" onerror="this.src='img/placeholder.png'" style="position: relative; z-index: 2;">
            </div>
        `;
    } else {
        // デフォルト（ピクセルアート）スタイル
        card.innerHTML = `
            <div class="hp-badge">${hp} HP</div>
            <div class="character-name">${displayName}</div>
            <div class="character-image">
                <canvas class="mother2-background" width="240" height="180" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas>
                <img src="${imageUrl}" alt="${name}" class="pixelated" onerror="this.src='img/placeholder.png'" style="position: relative; z-index: 2;">
            </div>
            <div class="character-info">
                <div class="info-row">
                    <span class="info-label">種族:</span>
                    <span class="info-value">${race}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">戦闘:</span>
                    <span class="info-value">${fightingStyle}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">属性:</span>
                    <span class="info-value">
                        ${attribute}
                        ${getAttributeIcon(character.attribute)}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">所属:</span>
                    <span class="info-value">${group}</span>
                </div>
            </div>
        `;
    }
    
    // 画像設定を適用
    const img = card.querySelector('.character-image img');
    if (img) {
        let imageSettings = null;
        
        // 別スタイルの場合は別スタイル用の画像設定を使用
        if (character.isAltStyle && character.styleIndex > 0 && character.altImageSettings) {
            const altIndex = character.styleIndex - 1;
            if (character.altImageSettings[altIndex]) {
                imageSettings = character.altImageSettings[altIndex];
            }
        }
        // 基本スタイルまたは別スタイル設定がない場合は通常設定を使用
        if (!imageSettings && character.imageSettings) {
            imageSettings = character.imageSettings;
        }
        
        // 設定を適用
        if (imageSettings) {
            if (imageSettings.size) {
                img.style.width = imageSettings.size;
                img.style.height = imageSettings.size;
            }
            if (imageSettings.position) {
                img.style.objectPosition = imageSettings.position;
            }
        }
    }
    
    // クリックイベント
    card.addEventListener('click', () => {
        showCharacterDetails(character);
    });
    
    // ホバーエフェクト
    card.addEventListener('mouseenter', () => {
        playHoverSound();
    });
    
    return card;
}

// 画像URLの取得
function getImageUrl(imgData, styleIndex = 0) {
    if (!imgData) {
        return 'img/placeholder.png';
    }
    
    // 配列の場合、スタイルインデックスに対応した画像を取得
    if (Array.isArray(imgData)) {
        if (imgData.length === 0) return 'img/placeholder.png';
        
        // スタイルインデックスに対応する画像があるかチェック
        const img = (styleIndex < imgData.length && imgData[styleIndex]) 
            ? imgData[styleIndex] 
            : imgData[0]; // フォールバック
        return `img/${img}`;
    }
    
    // 文字列の場合
    return `img/${imgData}`;
}

// 種族テキストの取得
function getRaceText(raceData) {
    if (!raceData) return 'Unknown';
    
    // 文字列の場合はそのまま返す
    if (typeof raceData === 'string') {
        return raceData;
    }
    
    // 配列の場合
    if (Array.isArray(raceData)) {
        if (raceData.length === 0) return 'Unknown';
        
        // 3重配列の場合: [[[value]], []] -> value
        if (Array.isArray(raceData[0]) && Array.isArray(raceData[0][0])) {
            const race = raceData[0][0][0];
            return race || 'Unknown';
        }
        // 2重配列の場合: [[value]] -> value
        else if (Array.isArray(raceData[0])) {
            const race = raceData[0][0];
            return race || 'Unknown';
        }
        // 単純配列の場合: [value] -> value
        else {
            return raceData[0] || 'Unknown';
        }
    }
    
    return 'Unknown';
}

// 戦闘スタイルテキストの取得
function getFightingStyleText(styleArray) {
    if (!styleArray || styleArray.length === 0) return 'None';
    
    // 3重配列の場合: [[[value]], []] -> value
    if (Array.isArray(styleArray[0]) && Array.isArray(styleArray[0][0])) {
        const style = styleArray[0][0][0];
        return style || 'None';
    }
    // 2重配列の場合: [[value]] -> value
    else if (Array.isArray(styleArray[0])) {
        const style = styleArray[0][0];
        return style || 'None';
    }
    // 単純配列の場合: [value] -> value
    else {
        return styleArray[0] || 'None';
    }
}

// 属性テキストの取得
function getAttributeText(attrArray) {
    if (!attrArray || attrArray.length === 0) return 'None';
    
    // 3重配列の場合: [[[value]], []] -> value
    if (Array.isArray(attrArray[0]) && Array.isArray(attrArray[0][0])) {
        const attr = attrArray[0][0][0];
        return attr || 'None';
    }
    // 2重配列の場合: [[value]] -> value
    else if (Array.isArray(attrArray[0])) {
        const attr = attrArray[0][0];
        return attr || 'None';
    }
    // 単純配列の場合: [value] -> value
    else {
        return attrArray[0] || 'None';
    }
}

// グループテキストの取得
function getGroupText(groupArray) {
    if (!groupArray || groupArray.length === 0) return 'Other';
    
    const group = Array.isArray(groupArray) ? groupArray[0] : groupArray;
    return group || 'Other';
}

// 属性アイコンの取得
function getAttributeIcon(attrArray) {
    if (!attrArray || attrArray.length === 0) return '';
    
    const attr = Array.isArray(attrArray[0]) ? attrArray[0][0] : attrArray[0];
    const attrMap = {
        'Fire': 'fire',
        'Water': 'water',
        'Earth': 'earth',
        'Wind': 'wind',
        'Light': 'light',
        'Darkness': 'darkness',
        'Holy': 'holy',
        'Poison': 'poison',
        'Electricity': 'electricity',
        'Ice': 'ice',
        'Psychic': 'psychic',
        'None': 'none',
        'Spiral': 'spiral',
        '火属性': 'fire',
        '水属性': 'water',
        '土属性': 'earth',
        '風属性': 'wind',
        '光属性': 'light',
        '闇属性': 'darkness',
        '聖属性': 'holy',
        '毒属性': 'poison',
        '電気属性': 'electricity',
        '氷属性': 'ice',
        'サイコ属性': 'psychic',
        '無属性': 'none',
        '螺旋属性': 'spiral'
    };
    
    const iconClass = attrMap[attr] || 'none';
    return `<span class="attribute-icon attribute-${iconClass}"></span>`;
}

// キャラクター詳細表示
function showCharacterDetails(character) {
    // 既存の詳細ページに遷移（PHPページ）
    window.location.href = `index.php?id=${character.id}`;
}

// ホバーサウンド（Web Audio API使用）
function playHoverSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // オーディオが無効な場合は無視
    }
}

// ユーティリティ関数：キーボードショートカット
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'Escape':
            // メイン画面に戻る
            window.location.href = 'index.php';
            break;
        case '1':
            document.getElementById('filterWorld').value = '1';
            filterAndDisplayCards();
            break;
        case '2':
            document.getElementById('filterWorld').value = '2';
            filterAndDisplayCards();
            break;
        case '3':
            document.getElementById('filterWorld').value = '3';
            filterAndDisplayCards();
            break;
        case '0':
            document.getElementById('filterWorld').value = '';
            filterAndDisplayCards();
            break;
    }
});

// パフォーマンス最適化：Intersection Observer
const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = Math.random() * 0.5 + 's';
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// アニメーション用CSS追加
const style = document.createElement('style');
style.textContent = `
    .character-card {
        opacity: 0;
        transform: translateY(50px);
        transition: all 0.6s ease;
    }
    
    .character-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    @keyframes cardGlow {
        0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
        50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.8); }
    }
    
    .character-card:hover {
        animation: cardGlow 2s infinite;
    }
`;
document.head.appendChild(style);

// レイアウト変更機能
function changeLayout() {
    const layoutSelect = document.getElementById('layoutSelect');
    const container = document.getElementById('cardsContainer');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    
    if (layoutSelect && container) {
        // 自動スクロールを停止
        stopAutoScroll();
        
        // 既存のレイアウトクラスを削除
        container.classList.remove('horizontal-layout', 'horizontal-scroll');
        
        // レイアウトに応じてクラスを設定
        if (layoutSelect.value === 'horizontal') {
            container.classList.remove('cards-grid');
            container.classList.add('horizontal-layout');
            autoScrollToggle.style.display = 'inline-block';
        } else if (layoutSelect.value === 'horizontal-scroll') {
            container.classList.remove('cards-grid');
            container.classList.add('horizontal-scroll');
            autoScrollToggle.style.display = 'inline-block';
        } else {
            // gridレイアウトの場合
            container.classList.add('cards-grid');
            autoScrollToggle.style.display = 'none';
        }
        
        // レイアウト変更後に背景を再適用
        setTimeout(() => {
            if (window.battleBackgroundManager) {
                window.battleBackgroundManager.updateBackgroundsInstantly();
            }
        }, 100);
    }
}

// 自動スクロール切り替え機能
function toggleAutoScroll() {
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    
    if (isAutoScrolling) {
        stopAutoScroll();
        autoScrollToggle.textContent = '🔄 自動スクロール: OFF';
        autoScrollToggle.style.background = 'rgba(0, 0, 0, 0.8)';
    } else {
        startAutoScroll();
        autoScrollToggle.textContent = '⏸️ 自動スクロール: ON';
        autoScrollToggle.style.background = 'rgba(0, 255, 136, 0.3)';
    }
}

// 自動スクロール開始
function startAutoScroll() {
    const container = document.getElementById('cardsContainer');
    const layoutSelect = document.getElementById('layoutSelect');
    
    if (!container || !layoutSelect) return;
    
    const isHorizontalMode = layoutSelect.value === 'horizontal' || layoutSelect.value === 'horizontal-scroll';
    if (!isHorizontalMode) return;
    
    isAutoScrolling = true;
    // 現在のスクロール位置を取得
    let scrollPosition = container.scrollLeft;
    const scrollSpeed = 0.5; // 速度を遅くして滑らかに
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    console.log(`自動スクロール開始: 現在位置 ${scrollPosition}px, 最大 ${maxScroll}px`);
    
    function animateScroll() {
        if (!isAutoScrolling) return;
        
        if (scrollPosition >= maxScroll) {
            // 最後まで到達したら最初に戻る
            scrollPosition = 0;
        } else {
            scrollPosition += scrollSpeed;
        }
        
        container.scrollTo({
            left: scrollPosition,
            behavior: 'auto'
        });
        
        autoScrollInterval = requestAnimationFrame(animateScroll);
    }
    
    animateScroll();
}

// 自動スクロール停止
function stopAutoScroll() {
    if (autoScrollInterval) {
        cancelAnimationFrame(autoScrollInterval);
        autoScrollInterval = null;
    }
    isAutoScrolling = false;
}

// スタイル変更機能
function changeStyle() {
    const styleSelect = document.getElementById('styleSelect');
    const container = document.getElementById('cardsContainer');
    
    if (styleSelect && container) {
        // 既存のスタイルクラスを削除
        container.classList.remove('original-style');
        
        // 新しいスタイルクラスを追加
        if (styleSelect.value === 'original') {
            container.classList.add('original-style');
        }
        
        // カードを再表示
        displayCards();
    }
}
