# 技術仕様

キャラ図鑑システムの技術的な詳細について説明します。

## システム構成

### フロントエンド

#### 使用技術
- **HTML5**: セマンティックマークアップ
- **CSS3**: レスポンシブデザイン、アニメーション
- **JavaScript (ES6+)**: メインロジック
- **PHP**: サーバーサイド処理（最小限）

#### ライブラリ
- **外部ライブラリ不使用**: Vanilla JavaScript
- **ネイティブAPIのみ**: 軽量・高速

### データストレージ

#### IndexedDB
- **CharactersDB**: キャラクターデータ
- **CustomTagsDB**: カスタムタグデータ

#### localStorage
- **設定データ**: テーマ、言語など
- **並び順データ**: カスタム並び順など

### ファイル構成

```
character/
├── index.php          # メインHTML
├── main.js            # メインJavaScript (6500+ lines)
├── style.css          # メインCSS (4300+ lines)
├── cha.json           # キャラクターデータ
├── cha-status.json    # キャラクターステータス設定
├── cards.html         # カードビュー
├── cards-script.js    # カードビュースクリプト
├── cards-style.css    # カードビュースタイル
├── memo-styles.css    # メモスタイル
├── img/               # 画像ファイル
│   └── weapons/       # 武器アイコン
└── docs/              # ドキュメント
    ├── README.md
    ├── basic-features.md
    ├── edit-mode.md
    ├── custom-tags.md
    ├── sorting.md
    ├── data-management.md
    ├── settings.md
    └── technical-specs.md
```

## データ構造

### キャラクターデータ (cha.json)

```javascript
{
  "id": 1,
  "name": {
    "ja": "キャラクター名（日本語）",
    "en": "Character Name (English)"
  },
  "world": {
    "ja": "世界名（日本語）",
    "en": "World Name (English)"
  },
  "race": ["種族1", "種族2"],
  "fightingStyle": ["戦闘スタイル1"],
  "attribute": ["属性1", "属性2"],
  "group": ["グループ1"],
  "weapon": {
    "ja": "武器名（日本語）",
    "en": "Weapon Name (English)"
  },
  "weaponType": {
    "ja": "武器種別（日本語）",
    "en": "Weapon Type (English)"
  },
  "image": "image_url.png",
  "relatedCharacters": [2, 3, 4],
  "relationships": [
    {
      "charId": 2,
      "relation": "関係性",
      "description": "説明文"
    }
  ],
  "customTags": [1, 2, 3]
}
```

### カスタムタグデータ

```javascript
{
  "id": 1,
  "name": "タグ名",
  "color": "#ff6b6b",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "order": 0
}
```

### 設定データ (cha-status.json)

```javascript
{
  "race": {
    "ja": ["人間", "エルフ", "獣人", ...],
    "en": ["Human", "Elf", "Beast", ...]
  },
  "fightingStyle": {
    "ja": ["近接", "遠距離", "魔法", "支援"],
    "en": ["Melee", "Ranged", "Magic", "Support"]
  },
  "attribute": {
    "ja": ["火", "水", "風", "土", "光", "闇"],
    "en": ["Fire", "Water", "Wind", "Earth", "Light", "Dark"]
  },
  "group": {
    "ja": ["グループ1", "グループ2", ...],
    "en": ["Group 1", "Group 2", ...]
  }
}
```

## 主要機能の実装

### IndexedDB管理

#### データベース初期化
```javascript
function initDB(dbName, storeName, keyPath) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath });
      }
    };
  });
}
```

#### データ読み込み
```javascript
async function loadCharactersFromDB() {
  const db = await initDB('CharactersDB', 'characters', 'id');
  const transaction = db.transaction(['characters'], 'readonly');
  const store = transaction.objectStore('characters');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

#### データ保存
```javascript
async function saveCharacterToDB(character) {
  const db = await initDB('CharactersDB', 'characters', 'id');
  const transaction = db.transaction(['characters'], 'readwrite');
  const store = transaction.objectStore('characters');
  store.put(character);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
```

### フィルタリング

#### フィルター適用
```javascript
function filterCharacters() {
  const searchTerm = document.getElementById('searchName').value.toLowerCase();
  
  let filtered = characters.filter(char => {
    // 名前検索
    const nameMatch = char.name.ja.toLowerCase().includes(searchTerm) ||
                      char.name.en.toLowerCase().includes(searchTerm);
    
    // 武器検索（有効時）
    const weaponMatch = weaponSearchEnabled &&
                        (char.weapon.ja.toLowerCase().includes(searchTerm) ||
                         char.weapon.en.toLowerCase().includes(searchTerm));
    
    // フィルター条件
    const worldMatch = activeFilters.worlds.length === 0 ||
                       activeFilters.worlds.includes(char.world[currentLang]);
    const raceMatch = activeFilters.races.length === 0 ||
                      char.race.some(r => activeFilters.races.includes(r));
    // ... 他のフィルター条件
    
    return (nameMatch || weaponMatch) && worldMatch && raceMatch && ...;
  });
  
  // 並び替え適用
  filtered = applySortOrder(filtered, currentSortOrder);
  
  // 表示
  renderCharacters(filtered);
}
```

### 並び替え

#### ソート適用
```javascript
function applySortOrder(characters, sortOrder) {
  switch (sortOrder) {
    case 'id':
      return characters.sort((a, b) => a.id - b.id);
    
    case 'name':
      return characters.sort((a, b) => {
        const nameA = a.name[currentLang];
        const nameB = b.name[currentLang];
        return nameA.localeCompare(nameB, currentLang);
      });
    
    case 'random':
      return characters.sort(() => Math.random() - 0.5);
    
    case 'custom':
      const order = getCurrentCustomOrder();
      const orderMap = new Map(order.map((id, index) => [id, index]));
      return characters.sort((a, b) => {
        const indexA = orderMap.get(a.id) ?? Infinity;
        const indexB = orderMap.get(b.id) ?? Infinity;
        return indexA - indexB;
      });
    
    default:
      return characters;
  }
}
```

### ドラッグ&ドロップ

#### イベントハンドラ
```javascript
function enableCardDragging() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    card.draggable = true;
    card.dataset.index = index;
    card.classList.add('sortable-card');
    
    card.addEventListener('dragstart', handleCardDragStart);
    card.addEventListener('dragend', handleCardDragEnd);
  });
  
  const container = document.getElementById('characterList');
  container.addEventListener('dragover', handleContainerDragOver);
  container.addEventListener('drop', handleContainerDrop);
}
```

#### ドラッグ処理
```javascript
function handleCardDragStart(e) {
  cardDragState.draggedCard = e.currentTarget;
  cardDragState.draggedIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleContainerDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const draggingCard = cardDragState.draggedCard;
  const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
  
  if (afterElement == null) {
    container.appendChild(draggingCard);
  } else {
    container.insertBefore(draggingCard, afterElement);
  }
}
```

## パフォーマンス最適化

### 遅延読み込み（Lazy Loading）

```javascript
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
}
```

### デバウンス処理

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 検索入力のデバウンス
const debouncedFilter = debounce(filterCharacters, 300);
searchInput.addEventListener('input', debouncedFilter);
```

### メモ化

```javascript
const memoizedFilter = (() => {
  const cache = new Map();
  
  return (characters, filters) => {
    const key = JSON.stringify(filters);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = performFilter(characters, filters);
    cache.set(key, result);
    return result;
  };
})();
```

## レスポンシブデザイン

### ブレークポイント

```css
/* モバイル: 〜1023px */
@media (max-width: 1023px) {
  .card {
    width: calc(50% - 10px); /* 2列 */
  }
}

/* PC: 1024px〜 */
@media (min-width: 1024px) {
  .card {
    width: calc(25% - 15px); /* 4列 */
  }
}
```

### タッチ対応

```javascript
function setupTouchEvents() {
  let touchStartX, touchStartY;
  
  card.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  card.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // スワイプ処理
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 横スワイプ
    } else {
      // 縦スワイプ（スクロール）
    }
  });
}
```

## セキュリティ

### XSS対策

```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// 使用例
const safeName = escapeHtml(character.name.ja);
```

### データ検証

```javascript
function validateCharacterData(data) {
  if (!data.id || typeof data.id !== 'number') {
    throw new Error('Invalid character ID');
  }
  
  if (!data.name || !data.name.ja || !data.name.en) {
    throw new Error('Invalid character name');
  }
  
  // その他の検証...
  
  return true;
}
```

## ブラウザ互換性

### 対応ブラウザ

#### デスクトップ
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

#### モバイル
- iOS Safari 14+
- Chrome for Android 90+
- Samsung Internet 14+

### Polyfill不使用

ネイティブAPI使用により、Polyfill不要:
- IndexedDB
- localStorage
- Intersection Observer
- CSS Grid
- Flexbox

## デプロイ

### 必要なファイル
```
character/
├── index.php
├── main.js
├── style.css
├── cha.json
├── cha-status.json
└── img/
```

### サーバー要件
- PHP 7.4+（最小限の使用）
- HTTPS推奨（セキュリティ）
- CORS設定（画像読み込み）

### 設定ファイル (.htaccess)
```apache
# キャッシュ設定
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg)$">
  Header set Cache-Control "max-age=2592000, public"
</FilesMatch>

# GZIP圧縮
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

## デバッグ

### ログ出力

```javascript
function debugLog(message, data) {
  if (window.DEBUG_MODE) {
    console.log(`[Debug] ${message}`, data);
  }
}

// 使用例
debugLog('Filtering characters', { 
  totalCharacters: characters.length,
  filters: activeFilters 
});
```

### パフォーマンス測定

```javascript
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// 使用例
const filtered = measurePerformance('filterCharacters', () => {
  return filterCharacters();
});
```

## テスト

### 手動テスト項目

#### 基本機能
- [ ] キャラクター表示
- [ ] 検索機能
- [ ] フィルター機能
- [ ] 詳細表示

#### 編集機能
- [ ] 選択モード
- [ ] 並び替えモード
- [ ] 一括タグ追加
- [ ] カスタム並び順保存

#### データ管理
- [ ] エクスポート
- [ ] インポート
- [ ] データ削除

#### レスポンシブ
- [ ] PC表示
- [ ] タブレット表示
- [ ] モバイル表示

## 既知の制限事項

### ブラウザ制限
- IndexedDB容量: ブラウザごとに異なる（通常50MB〜数GB）
- localStorage容量: 5〜10MB
- 同時オープンDB数: 制限あり

### パフォーマンス
- 大量データ（1000件以上）でソート処理が遅くなる可能性
- 画像読み込みに時間がかかる場合がある

### 機能制限
- サーバー同期なし（ローカルのみ）
- オフライン動作は部分的
- ブラウザ間でのデータ同期なし

## 今後の改善予定

### パフォーマンス
- 仮想スクロール実装
- Web Workers活用
- サービスワーカー導入

### 機能追加
- データ同期機能
- クラウドバックアップ
- 詳細な統計情報

### UI/UX
- アニメーション改善
- アクセシビリティ向上
- ダークモード強化
