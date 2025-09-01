// MOTHER2風戦闘背景管理システム
class BattleBackgroundManager {
    constructor() {
        this.backgroundTypes = {
            'none': '背景なし',
            'psychedelic': 'サイケデリック',
            'geometric': '幾何学模様',
            'energy': 'エネルギー波動',
            'starfield': '星空ワープ',
            'liquid': '液体金属',
            'glitch': 'デジタルグリッチ',
            'crystal': 'クリスタル',
            'wave': '対称波動',
            'ripple': '波紋'
        };
        
        this.defaultBackgrounds = {
            'fire': 'energy',
            'water': 'liquid',
            'earth': 'crystal',
            'air': 'starfield',
            'electric': 'glitch',
            'psychic': 'psychedelic',
            'normal': 'geometric',
            'dark': 'glitch',
            'light': 'crystal',
            'wave': 'wave'
        };
    }

    // キャラクターに背景を適用
    applyBackground(cardElement, character) {
        // 画像エリアを取得
        const imageArea = cardElement.querySelector('.character-image');
        if (!imageArea) {
            console.log('❌ 画像エリアが見つかりません:', cardElement);
            return;
        }
        
        // 既存の背景を削除
        this.removeBackground(imageArea);
        
        // 背景タイプを決定
        const backgroundType = this.getBackgroundType(character);
        
        if (backgroundType && backgroundType !== 'none') {
            // 画像エリアの位置設定
            if (imageArea.style.position !== 'relative') {
                imageArea.style.position = 'relative';
            }
            
            // 背景コンテナを作成
            const backgroundDiv = document.createElement('div');
            backgroundDiv.className = `battle-background bg-${backgroundType}`;
            backgroundDiv.style.zIndex = '0';
            backgroundDiv.style.position = 'absolute';
            
            // 画像エリアの最初の子要素として挿入
            imageArea.insertBefore(backgroundDiv, imageArea.firstChild);
            
            // デバッグ情報
            console.log(`✅ 背景適用成功: ${character.name?.[0] || character.id} -> ${backgroundType}`);
            console.log('📍 画像エリア:', imageArea);
            console.log('🎨 背景要素:', backgroundDiv);
            console.log('🔍 背景クラス:', backgroundDiv.className);
        } else {
            console.log(`⚪ 背景なし: ${character.name?.[0] || character.id} (タイプ: ${backgroundType})`);
        }
    }

    // 背景を削除
    removeBackground(targetElement) {
        const existingBackground = targetElement.querySelector('.battle-background');
        if (existingBackground) {
            existingBackground.remove();
        }
    }

    // キャラクターの背景タイプを取得
    getBackgroundType(character) {
        // JSONで明示的に指定されている場合
        if (character.battleBackground) {
            return character.battleBackground;
        }

        const types = Object.keys(this.backgroundTypes).filter(t => t !== 'none');
        return types[Math.floor(Math.random() * types.length)];
    }

    // 背景タイプ一覧を取得
    getBackgroundTypes() {
        return this.backgroundTypes;
    }

    // 背景プレビューを作成
    createPreview(backgroundType, size = '100px') {
        const preview = document.createElement('div');
        preview.style.width = size;
        preview.style.height = size;
        preview.style.position = 'relative';
        preview.style.overflow = 'hidden';
        preview.style.border = '2px solid #333';
        preview.style.borderRadius = '8px';
        preview.style.display = 'inline-block';
        preview.style.margin = '5px';
        
        if (backgroundType && backgroundType !== 'none') {
            const background = document.createElement('div');
            background.className = `battle-background bg-${backgroundType}`;
            background.style.opacity = '0.8';
            preview.appendChild(background);
        }
        
        const label = document.createElement('div');
        label.textContent = this.backgroundTypes[backgroundType] || backgroundType;
        label.style.position = 'absolute';
        label.style.bottom = '2px';
        label.style.left = '2px';
        label.style.right = '2px';
        label.style.fontSize = '8px';
        label.style.color = 'white';
        label.style.textShadow = '1px 1px 1px black';
        label.style.textAlign = 'center';
        preview.appendChild(label);
        
        return preview;
    }

    // 全カードに背景を適用（リアルタイム）
    applyToAllCards() {
        console.log('🎨 全カードに背景適用開始');
        const cards = document.querySelectorAll('.character-card');
        const enableBg = document.getElementById('enableBackgrounds');
        
        console.log(`🔢 カード数: ${cards.length}`);
        console.log(`🎛️ 背景有効: ${enableBg ? enableBg.checked : 'コントロールなし'}`);
        
        // 背景が無効の場合、全ての背景を削除
        if (!enableBg || !enableBg.checked) {
            console.log('🚫 背景無効のため全背景削除');
            document.querySelectorAll('.battle-background').forEach(bg => bg.remove());
            return;
        }
        
        cards.forEach((card, index) => {
            // カードに対応するキャラクターデータを取得
            const characterData = this.getCharacterFromCard(card, index);
            if (characterData) {
                console.log(`🎯 カード${index + 1}処理中: ${characterData.name?.[0] || characterData.id}`);
                this.applyBackground(card, characterData);
            } else {
                console.log(`❌ カード${index + 1}のキャラクターデータが見つかりません`);
            }
        });
        
        console.log(`✅ ${cards.length}枚のカードの背景処理完了`);
    }

    // 即座に背景を更新（設定変更時用）
    updateBackgroundsInstantly() {
        console.log('⚡ 即座に背景更新開始');
        // 少し遅延させて DOM の更新を待つ
        setTimeout(() => {
            this.applyToAllCards();
        }, 50);
    }

    // カード要素からキャラクターデータを取得
    getCharacterFromCard(cardElement, index) {
        console.log(`🔍 カード${index + 1}のキャラクターデータ取得開始`);
        
        // 1. グローバルなfilteredCharactersからデータを取得
        console.log('📊 filteredCharacters確認:', {
            exists: !!window.filteredCharacters,
            length: window.filteredCharacters?.length || 0,
            index: index,
            hasIndexData: !!(window.filteredCharacters && window.filteredCharacters[index])
        });
        
        if (window.filteredCharacters && window.filteredCharacters[index]) {
            const character = window.filteredCharacters[index];
            console.log(`✅ filteredCharactersから取得成功:`, character.name?.[0] || character.id);
            return character;
        }
        
        // 2. カードのdata属性から取得を試行
        const characterId = cardElement.getAttribute('data-character-id');
        console.log('🏷️ data-character-id:', characterId);
        console.log('📊 allCharacters確認:', {
            exists: !!window.allCharacters,
            length: window.allCharacters?.length || 0
        });
        
        if (characterId && window.allCharacters) {
            const character = window.allCharacters.find(c => c.id == characterId);
            if (character) {
                console.log(`✅ allCharactersから取得成功:`, character.name?.[0] || character.id);
                return character;
            } else {
                console.log(`❌ ID ${characterId} のキャラクターが見つかりません`);
            }
        }
        
        // 3. カードから直接データを取得を試行
        const dataCharId = cardElement.getAttribute('data-char-id');
        console.log('🏷️ data-char-id:', dataCharId);
        
        if (dataCharId && window.allCharacters) {
            const character = window.allCharacters.find(c => c.id == dataCharId);
            if (character) {
                console.log(`✅ data-char-idから取得成功:`, character.name?.[0] || character.id);
                return character;
            }
        }
        
        console.log(`❌ カード${index + 1}のキャラクターデータが見つかりません`);
        return null;
    }

    // 背景設定を保存
    saveBackgroundSettings() {
        const settings = {
            globalBackground: document.getElementById('globalBackground')?.value || 'auto',
            enableBackgrounds: document.getElementById('enableBackgrounds')?.checked !== false
        };
        localStorage.setItem('battleBackgroundSettings', JSON.stringify(settings));
    }

    // 背景設定を読み込み
    loadBackgroundSettings() {
        const saved = localStorage.getItem('battleBackgroundSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            const globalBg = document.getElementById('globalBackground');
            if (globalBg) globalBg.value = settings.globalBackground || 'auto';
            
            const enableBg = document.getElementById('enableBackgrounds');
            if (enableBg) enableBg.checked = settings.enableBackgrounds !== false;
        }
    }
}

// グローバルインスタンス
window.battleBackgroundManager = new BattleBackgroundManager();
console.log('🎨 戦闘背景マネージャー初期化完了:', window.battleBackgroundManager);

// DOM読み込み完了後の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 背景システム初期化開始');
    
    // 設定を読み込み
    window.battleBackgroundManager.loadBackgroundSettings();
    
    // 背景コントロールが存在する場合のイベントリスナー
    const globalBgSelect = document.getElementById('globalBackground');
    if (globalBgSelect) {
        console.log('🎛️ 背景選択コントロール検出');
        globalBgSelect.addEventListener('change', function() {
            console.log('🔄 背景タイプ変更:', this.value);
            window.battleBackgroundManager.saveBackgroundSettings();
            window.battleBackgroundManager.updateBackgroundsInstantly();
        });
    } else {
        console.log('❌ 背景選択コントロールが見つかりません');
    }
    
    const enableBgCheckbox = document.getElementById('enableBackgrounds');
    if (enableBgCheckbox) {
        console.log('✅ 背景ON/OFFコントロール検出');
        enableBgCheckbox.addEventListener('change', function() {
            console.log('🔄 背景ON/OFF切り替え:', this.checked);
            window.battleBackgroundManager.saveBackgroundSettings();
            window.battleBackgroundManager.updateBackgroundsInstantly();
        });
    } else {
        console.log('❌ 背景ON/OFFコントロールが見つかりません');
    }
    
    console.log('🎨 背景システム初期化完了');
});

// カード表示関数に背景適用を統合するためのヘルパー
function applyBackgroundToCard(cardElement, character) {
    const enableBg = document.getElementById('enableBackgrounds');
    if (enableBg && !enableBg.checked) return;
    
    const globalBg = document.getElementById('globalBackground')?.value;
    
    if (globalBg && globalBg !== 'auto') {
        // グローバル設定で固定背景を使用
        const modifiedCharacter = { ...character, battleBackground: globalBg };
        window.battleBackgroundManager.applyBackground(cardElement, modifiedCharacter);
    } else {
        // 自動判定
        window.battleBackgroundManager.applyBackground(cardElement, character);
    }
}
