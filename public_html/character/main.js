// ===============================================
// 通知システム
// ===============================================
let notifications = [];
const notificationContainer = document.getElementById('notification-container');

const NOTIFICATION_CONFIG = {
  success: { 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    text: 'text-green-800', 
    icon: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
    style: 'background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;'
  },
  error: { 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    text: 'text-red-800', 
    icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
    style: 'background-color: #fef2f2; border-color: #fecaca; color: #991b1b;'
  },
  info: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-800', 
    icon: `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="12" y1="8" x2="12" y2="12"/>`,
    style: 'background-color: #eff6ff; border-color: #bfdbfe; color: #1e40af;'
  }
};

const NOTIFICATION_HEIGHT = 50;
const NOTIFICATION_GAP = 12;
const NOTIFICATION_BASE_STEP = NOTIFICATION_HEIGHT + NOTIFICATION_GAP;
const MAX_NOTIFICATIONS = 50; // 最大通知数

function addNotification(message, type = 'info') {
  const id = Date.now();
  const notification = {
    id,
    message,
    type,
    isExiting: false,
    element: createNotificationElement(id, message, type)
  };

  // 配列の先頭に追加（新しいものが上）
  notifications.unshift(notification);
  notificationContainer.appendChild(notification.element);

  // 50個を超えた場合、古い通知を削除
  if (notifications.length > MAX_NOTIFICATIONS) {
    const toRemove = notifications.slice(MAX_NOTIFICATIONS);
    toRemove.forEach(notif => {
      if (notif.element && notif.element.parentNode) {
        notif.element.remove();
      }
    });
    notifications = notifications.slice(0, MAX_NOTIFICATIONS);
  }

  // ブラウザの再描画を待ってからアニメーション開始
  requestAnimationFrame(() => {
    updateNotificationPositions();
  });

  // 5秒後に自動消去
  setTimeout(() => {
    removeNotification(id);
  }, 5000);
}

function createNotificationElement(id, message, type) {
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.info;
  const div = document.createElement('div');
  div.id = `notif-${id}`;
  div.className = 'notification-item notification-enter';
  div.style.cssText = 'pointer-events: auto; width: 320px;';
  
  div.innerHTML = `
    <div style="display: flex; align-items: flex-start; padding: 16px; border-radius: 16px; border: 1px solid; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); ${config.style}">
      <div style="flex-shrink: 0; margin-right: 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${config.icon}</svg>
      </div>
      <div style="flex-grow: 1; font-size: 12px; font-weight: bold; padding-top: 2px; line-height: 1.25; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
        ${escapeHtml(message)}
      </div>
      <button onclick="removeNotification(${id})" style="flex-shrink: 0; margin-left: 8px; background: none; border: none; cursor: pointer; color: #9ca3af; transition: color 0.2s; padding: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
  return div;
}

function removeNotification(id) {
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1 || notifications[index].isExiting) return;

  const notif = notifications[index];
  notif.isExiting = true;
  
  // 消去中の見た目
  notif.element.style.opacity = '0';
  notif.element.style.transform += ' translate3d(40px, 0, 0) scale(0.95)';
  notif.element.style.pointerEvents = 'none';

  // 位置計算を即座に更新（下の通知を上に詰める）
  updateNotificationPositions();

  // アニメーション完了後にDOMから削除
  setTimeout(() => {
    const finalIndex = notifications.findIndex(n => n.id === id);
    if (finalIndex !== -1) {
      notif.element.remove();
      notifications.splice(finalIndex, 1);
    }
  }, 500);
}

function updateNotificationPositions() {
  let visualIndex = 0;
  
  notifications.forEach((notif) => {
    if (notif.isExiting) return;

    let translateY = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 100 - visualIndex;
    let blur = '0px';

    if (visualIndex === 0) {
      translateY = 0;
    } else if (visualIndex === 1) {
      translateY = NOTIFICATION_BASE_STEP;
    } else {
      const stackDepth = visualIndex - 2;
      translateY = (NOTIFICATION_BASE_STEP * 2) + (stackDepth * 8);
      scale = Math.max(0.8, 1 - (stackDepth * 0.05));
      opacity = Math.max(0, 1 - (stackDepth * 0.2));
      blur = stackDepth > 0 ? `${stackDepth * 1}px` : '0px';
    }

    notif.element.style.zIndex = zIndex;
    notif.element.style.opacity = opacity;
    notif.element.style.filter = `blur(${blur})`;
    notif.element.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    
    visualIndex++;
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// グローバルに公開
window.addNotification = addNotification;

// ===============================================
// キャラクターデータ管理
// ===============================================
let characters = [];
let settings = {};
let activeFilters = {
  race: [],
  fightingStyle: [],
  attribute: [],
  group: [],
  world: [], // 追加
  favorites: [], // お気に入りフィルター追加
  memo: [], // メモ済みフィルター追加
  customTags: [], // カスタムタグフィルター追加
  uniqueWeapon: [] // ユニーク武器フィルター追加
};

// 編集モード関連の変数
let isEditMode = false;
let selectedCharacters = new Set();

// カスタムタグ関連の変数
let customTags = {}; // カスタムタグのデータ {tagId: {name, color, characterIds: []}}
let characterTags = {}; // キャラクターIDとタグIDの関連付け {characterId: [tagId1, tagId2, ...]}
let customTagsOrder = []; // カスタムタグの表示順序 [tagId1, tagId2, ...]
let currentEditingCharacter = null; // タグ編集中のキャラクターID

// 現在の表示言語 (ja: 日本語, en: 英語)
let currentDisplayLanguage = 'ja'; 

// 言語マッピングを格納するオブジェクト
// `languageMaps`はUIからのフィルター選択（日本語）をキャラクターデータ内の正規の英語名に変換するために使用
// `displayLanguageMaps`はキャラクターデータ内の値（日本語または英語）を現在の表示言語に変換するために使用
let languageMaps = {
  race: {},
  fightingStyle: {},
  attribute: {},
  group: {},
  calendar: {}
};
let displayLanguageMaps = {
  race: { enToJa: {}, enToEn: {} }, // canonical English to Japanese/English for display
  fightingStyle: { enToJa: {}, enToEn: {} },
  attribute: { enToJa: {}, enToEn: {} },
  group: { enToJa: {}, enToEn: {} },
  calendar: { enToJa: {}, enToEn: {} }
};

// 詳細表示で使う固定テキストの翻訳
const labels = {
    'description': { 'ja': '説明', 'en': 'Description' },
    'world': { 'ja': '世界', 'en': 'World' },
    'race': { 'ja': '種族', 'en': 'Race' },
    'fightingStyle': { 'ja': '戦闘スタイル', 'en': 'Fighting Style' },
    'attribute': { 'ja': '属性', 'en': 'Attribute' },
    'height': { 'ja': '身長', 'en': 'Height' },
    'birthday': { 'ja': '誕生日', 'en': 'Birthday' },
    'personality': { 'ja': '性格', 'en': 'Personality' },
    'group': { 'ja': 'グループ', 'en': 'Group' },
    'year': { 'ja': '年', 'en': '' }, // 日付の単位は日本語と英語で異なるため、空文字列で対応
    'month': { 'ja': '月', 'en': '' },
    'day': { 'ja': '日', 'en': '' },
    'age': { 'ja': '歳', 'en': 'Age' }, // 追加
    'memo': { 'ja': 'メモ', 'en': 'Memo' }
};

// cha.json を読み込み、キャラクターデータと設定を初期化
let relationGroups = []; // relationデータ保持用

// お気に入り機能
let favorites = [];

// ユーザーメモ機能
let userNotes = {};

// フィルター状態管理
let favoritesOnly = false;
let memoOnly = false;
let uniqueWeaponOnly = false;

// 武器アイコン表示設定
// 'filterOnly': フィルター時のみ, 'always': 常に表示, 'never': 非表示
let weaponIconDisplayMode = 'filterOnly';

// 検索設定
let weaponSearchEnabled = true;  // 武器名での検索を有効にするか
let customTagSearchEnabled = true;  // カスタムタグでの検索を有効にするか
let highlightEnabled = true;  // 予測変換の強調表示を有効にするか
let currentSortOrder = 'world'; // 'world', 'id', 'name', 'random', 'custom' のいずれか
let tagSortOrders = {}; // カスタムタグごとの並び順設定 {tagId: 'id' | 'name' | 'random' | 'custom'}
let customCharacterOrder = []; // カスタム並び順 [charId1, charId2, ...]
let tagCustomOrders = {}; // カスタムタグごとのカスタム並び順 {tagId: [charId1, charId2, ...]}
let isCustomSortModeActive = false; // カスタム並び替えモードが有効かどうか
let tempSortOrder = []; // 並び替え編集中の一時的な順序
let editSubMode = 'select'; // 編集モードのサブモード: 'select' | 'sort'

// フィルター情報ポップアップの状態
let filterInfoPopupVisible = false;
let filterInfoHoverTimer = null;

// ===============================================
// IndexedDB管理クラス
// ===============================================

class CharacterDB {
  constructor() {
    this.dbName = 'CharacterDatabase';
    this.dbVersion = 3; // カスタムタグ順序機能追加のためバージョンアップ
    this.db = null;
  }

  /**
   * データベースを初期化
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('IndexedDB初期化エラー:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB初期化完了');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // メモストア
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'charId' });
          notesStore.createIndex('charId', 'charId', { unique: true });
        }
        
        // 設定ストア
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
          settingsStore.createIndex('key', 'key', { unique: true });
        }
        
        // お気に入りストア
        if (!db.objectStoreNames.contains('favorites')) {
          const favoritesStore = db.createObjectStore('favorites', { keyPath: 'charId' });
          favoritesStore.createIndex('charId', 'charId', { unique: true });
        }
        
        // ユーザー統計ストア
        if (!db.objectStoreNames.contains('stats')) {
          const statsStore = db.createObjectStore('stats', { keyPath: 'key' });
          statsStore.createIndex('key', 'key', { unique: true });
        }
        
        // カスタムタグストア
        if (!db.objectStoreNames.contains('customTags')) {
          const customTagsStore = db.createObjectStore('customTags', { keyPath: 'tagId' });
          customTagsStore.createIndex('tagId', 'tagId', { unique: true });
        }
        
        // キャラクタータグ関連付けストア
        if (!db.objectStoreNames.contains('characterTags')) {
          const characterTagsStore = db.createObjectStore('characterTags', { keyPath: 'charId' });
          characterTagsStore.createIndex('charId', 'charId', { unique: true });
        }

        // カスタムタグ順序ストア
        if (!db.objectStoreNames.contains('customTagsOrder')) {
          const customTagsOrderStore = db.createObjectStore('customTagsOrder', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * メモを保存
   */
  async saveNote(charId, content) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      
      const noteData = {
        charId: charId,
        content: content.trim(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      const request = store.put(noteData);
      
      request.onsuccess = () => resolve(noteData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * メモを取得
   */
  async getNote(charId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.get(charId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : '');
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * メモを削除
   */
  async deleteNote(charId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(charId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 設定を保存
   */
  async saveSetting(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const settingData = {
        key: key,
        value: value,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(settingData);
      
      request.onsuccess = () => resolve(settingData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 設定を取得
   */
  async getSetting(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * お気に入りを同期（配列形式をIndexedDBに変換）
   */
  async syncFavorites(favoriteIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const transaction = this.db.transaction(['favorites'], 'readwrite');
        const store = transaction.objectStore('favorites');
        
        // 既存のお気に入りをクリア
        await store.clear();
        
        // 新しいお気に入りを追加
        for (const charId of favoriteIds) {
          await store.put({
            charId: charId,
            addedAt: new Date().toISOString()
          });
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * お気に入りを取得
   */
  async getFavorites() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['favorites'], 'readonly');
      const store = transaction.objectStore('favorites');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        const favoriteIds = results.map(item => item.charId);
        resolve(favoriteIds);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 統計データを保存
   */
  async saveStat(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stats'], 'readwrite');
      const store = transaction.objectStore('stats');
      
      const statData = {
        key: key,
        value: value,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(statData);
      
      request.onsuccess = () => resolve(statData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 統計データを取得
   */
  async getStat(key, defaultValue = 0) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stats'], 'readonly');
      const store = transaction.objectStore('stats');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * データベースからデータをエクスポート
   */
  async exportData() {
    const exportData = {
      fileFormat: 'BMCD',
      version: '1.0',
      description: 'Bookmark & Memo Character Data',
      notes: [],
      settings: [],
      favorites: [],
      stats: [],
      customTags: [],
      characterTags: [],
      exportDate: new Date().toISOString()
    };

    // メモをエクスポート
    const notesTransaction = this.db.transaction(['notes'], 'readonly');
    const notesStore = notesTransaction.objectStore('notes');
    const notesRequest = notesStore.getAll();
    
    return new Promise((resolve, reject) => {
      notesRequest.onsuccess = () => {
        exportData.notes = notesRequest.result;
        
        // 設定をエクスポート
        const settingsTransaction = this.db.transaction(['settings'], 'readonly');
        const settingsStore = settingsTransaction.objectStore('settings');
        const settingsRequest = settingsStore.getAll();
        
        settingsRequest.onsuccess = () => {
          exportData.settings = settingsRequest.result;
          
          // お気に入りをエクスポート
          const favoritesTransaction = this.db.transaction(['favorites'], 'readonly');
          const favoritesStore = favoritesTransaction.objectStore('favorites');
          const favoritesRequest = favoritesStore.getAll();
          
          favoritesRequest.onsuccess = () => {
            exportData.favorites = favoritesRequest.result;
            
            // 統計をエクスポート
            const statsTransaction = this.db.transaction(['stats'], 'readonly');
            const statsStore = statsTransaction.objectStore('stats');
            const statsRequest = statsStore.getAll();
            
            statsRequest.onsuccess = () => {
              exportData.stats = statsRequest.result;
              
              // カスタムタグをエクスポート
              const customTagsTransaction = this.db.transaction(['customTags'], 'readonly');
              const customTagsStore = customTagsTransaction.objectStore('customTags');
              const customTagsRequest = customTagsStore.getAll();
              
              customTagsRequest.onsuccess = () => {
                exportData.customTags = customTagsRequest.result;
                
                // キャラクタータグ関連付けをエクスポート
                const characterTagsTransaction = this.db.transaction(['characterTags'], 'readonly');
                const characterTagsStore = characterTagsTransaction.objectStore('characterTags');
                const characterTagsRequest = characterTagsStore.getAll();
                
                characterTagsRequest.onsuccess = () => {
                  exportData.characterTags = characterTagsRequest.result;
                  resolve(exportData);
                };
                characterTagsRequest.onerror = () => reject(characterTagsRequest.error);
              };
              customTagsRequest.onerror = () => reject(customTagsRequest.error);
            };
            statsRequest.onerror = () => reject(statsRequest.error);
          };
          favoritesRequest.onerror = () => reject(favoritesRequest.error);
        };
        settingsRequest.onerror = () => reject(settingsRequest.error);
      };
      notesRequest.onerror = () => reject(notesRequest.error);
    });
  }

  /**
   * データをインポート
   */
  async importData(data) {
    const transaction = this.db.transaction(['notes', 'settings', 'favorites', 'stats', 'customTags', 'characterTags'], 'readwrite');
    
    // メモをインポート
    if (data.notes) {
      const notesStore = transaction.objectStore('notes');
      for (const note of data.notes) {
        await notesStore.put(note);
      }
    }
    
    // 設定をインポート
    if (data.settings) {
      const settingsStore = transaction.objectStore('settings');
      for (const setting of data.settings) {
        await settingsStore.put(setting);
      }
    }
    
    // お気に入りをインポート
    if (data.favorites) {
      const favoritesStore = transaction.objectStore('favorites');
      for (const favorite of data.favorites) {
        await favoritesStore.put(favorite);
      }
    }
    
    // 統計をインポート
    if (data.stats) {
      const statsStore = transaction.objectStore('stats');
      for (const stat of data.stats) {
        await statsStore.put(stat);
      }
    }
    
    // カスタムタグをインポート
    if (data.customTags) {
      const customTagsStore = transaction.objectStore('customTags');
      for (const tag of data.customTags) {
        await customTagsStore.put(tag);
      }
    }
    
    // キャラクタータグ関連付けをインポート
    if (data.characterTags) {
      const characterTagsStore = transaction.objectStore('characterTags');
      for (const characterTag of data.characterTags) {
        await characterTagsStore.put(characterTag);
      }
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ===== カスタムタグ関連メソッド =====

  /**
   * カスタムタグを保存
   */
  async saveCustomTag(tagId, tagData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTags'], 'readwrite');
      const store = transaction.objectStore('customTags');
      
      const tagRecord = {
        tagId: tagId,
        name: tagData.name,
        color: tagData.color,
        createdAt: tagData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(tagRecord);
      
      request.onsuccess = () => resolve(tagRecord);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * カスタムタグを取得
   */
  async getCustomTag(tagId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTags'], 'readonly');
      const store = transaction.objectStore('customTags');
      const request = store.get(tagId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 全カスタムタグを取得
   */
  async getAllCustomTags() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTags'], 'readonly');
      const store = transaction.objectStore('customTags');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const tags = {};
        request.result.forEach(tag => {
          tags[tag.tagId] = {
            name: tag.name,
            color: tag.color,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
          };
        });
        resolve(tags);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * カスタムタグを削除
   */
  async deleteCustomTag(tagId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTags'], 'readwrite');
      const store = transaction.objectStore('customTags');
      const request = store.delete(tagId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * カスタムタグの順序を保存
   */
  async saveCustomTagsOrder(orderArray) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTagsOrder'], 'readwrite');
      const store = transaction.objectStore('customTagsOrder');
      
      const record = {
        id: 'tagOrder',
        order: orderArray,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * カスタムタグの順序を取得
   */
  async getCustomTagsOrder() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customTagsOrder'], 'readonly');
      const store = transaction.objectStore('customTagsOrder');
      const request = store.get('tagOrder');
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.order : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * キャラクターのタグを保存
   */
  async saveCharacterTags(charId, tagIds) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['characterTags'], 'readwrite');
      const store = transaction.objectStore('characterTags');
      
      const record = {
        charId: charId,
        tagIds: tagIds,
        updatedAt: new Date().toISOString()
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * キャラクターのタグを取得
   */
  async getCharacterTags(charId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['characterTags'], 'readonly');
      const store = transaction.objectStore('characterTags');
      const request = store.get(charId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.tagIds : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 全キャラクターのタグ関連付けを取得
   */
  async getAllCharacterTags() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['characterTags'], 'readonly');
      const store = transaction.objectStore('characterTags');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const characterTags = {};
        request.result.forEach(record => {
          characterTags[record.charId] = record.tagIds;
        });
        resolve(characterTags);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * キャラクターからタグを削除
   */
  async removeCharacterTags(charId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['characterTags'], 'readwrite');
      const store = transaction.objectStore('characterTags');
      const request = store.delete(charId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// IndexedDBインスタンス
const characterDB = new CharacterDB();

// ===============================================
// データ管理機能
// ===============================================

/**
 * データをエクスポートする
 */
async function exportAllData() {
  try {
    if (!characterDB.db) {
      throw new Error('IndexedDBが初期化されていません');
    }
    
    const data = await characterDB.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `character-data-${new Date().toISOString().split('T')[0]}.bmcd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('BMCDデータエクスポート完了');
  } catch (error) {
    console.error('データエクスポートエラー:', error);
    alert('データのエクスポートに失敗しました。');
  }
}

/**
 * データをインポートする
 * @param {File} file - インポートするBMCDファイル
 */
async function importAllData(file) {
  try {
    if (!characterDB.db) {
      throw new Error('IndexedDBが初期化されていません');
    }
    
    // ファイル拡張子の検証
    if (!file.name.toLowerCase().endsWith('.bmcd')) {
      throw new Error('BMCDファイル(.bmcd)を選択してください');
    }
    
    const text = await file.text();
    const data = JSON.parse(text);
    
    // BMCDファイル形式の検証
    if (!data.exportDate) {
      throw new Error('無効なBMCDデータファイルです');
    }
    
    // オプション: BMCDフォーマットの追加検証
    if (data.fileFormat && data.fileFormat !== 'BMCD') {
      console.warn('ファイル形式が異なりますが、インポートを続行します:', data.fileFormat);
    }
    
    await characterDB.importData(data);
    
    // データを再読み込み
    await loadDataFromIndexedDB();
    
    // UIを更新
    filterCharacters();
    updateFavoriteUI();
    
    // メモ数も更新
    updateMemoCount();
    
    // 詳細表示中の場合、メモ表示も更新
    const detailModal = document.getElementById('characterModal');
    if (detailModal && detailModal.style.display !== 'none') {
      const charId = parseInt(detailModal.dataset.charId);
      if (charId) {
        await updateNoteDisplay(charId);
      }
    }
    
    console.log('データインポート完了');
    addNotification('設定の読み込みが成功しました', 'success');
  } catch (error) {
    console.error('データインポートエラー:', error);
    if (error.message.includes('BMCDファイル')) {
      addNotification(error.message, 'error');
    } else if (error.message.includes('JSON')) {
      addNotification('BMCDファイルの形式が正しくないか破損しています', 'error');
    } else {
      addNotification('データのインポートに失敗しました', 'error');
    }
  }
}

/**
 * ハンバーガーメニューからデータ管理画面を表示
 */
function showDataManagerFromMenu() {
  // ハンバーガーメニューを閉じる
  toggleHamburgerMenu();
  
  // 少し遅延してからデータ管理画面を表示
  setTimeout(() => {
    showDataManager();
  }, 300);
}

/**
 * データ管理用の簡易UI（開発・テスト用）
 */
function showDataManager() {
  const existingManager = document.getElementById('dataManager');
  if (existingManager) {
    existingManager.remove();
    return;
  }
  
  const manager = document.createElement('div');
  manager.id = 'dataManager';
  manager.className = 'data-manager-popup';
  
  manager.innerHTML = `
    <div class="data-manager-header">
      <h4 class="data-manager-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        データ管理
      </h4>
      <button onclick="showDataManager()" class="data-manager-close" title="閉じる">&times;</button>
    </div>
    <div style="margin-bottom: 12px;">
      <button onclick="exportAllData()" class="data-manager-btn export-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        エクスポート
      </button>
    </div>
    <div style="margin-bottom: 15px;">
      <input type="file" id="importFile" accept=".bmcd" style="display: none;" onchange="handleImportFile(this)">
      <button onclick="document.getElementById('importFile').click()" class="data-manager-btn import-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        インポート
      </button>
    </div>
    <p class="data-manager-description">
      お気に入り、メモ、設定データを<br>BMCD形式(.bmcd)でバックアップ・復元
    </p>
  `;
  
  document.body.appendChild(manager);
}

/**
 * インポートファイル選択の処理
 * @param {HTMLInputElement} input - ファイル入力要素
 */
function handleImportFile(input) {
  const file = input.files[0];
  if (file) {
    importAllData(file);
  }
  input.value = ''; // ファイル選択をリセット
}

// ===============================================
// アプリケーション初期化
// ===============================================

/**
 * アプリケーション初期化
 */
async function initializeApp() {
  try {
    // IndexedDBを初期化
    await characterDB.init();
    
    // データを読み込み
    await loadDataFromIndexedDB();
    
    // コンテキストメニューイベントリスナーを設定
    setupContextMenuEventListeners();
    
    console.log('アプリケーション初期化完了');
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    // IndexedDBが使用できない場合でも継続
    console.log('IndexedDBなしモードで動作します');
    
    // エラー時でもコンテキストメニューイベントリスナーは設定
    setupContextMenuEventListeners();
  }
}

/**
 * IndexedDBからデータを読み込み
 */
async function loadDataFromIndexedDB() {
  try {
    // お気に入りを読み込み
    favorites = await characterDB.getFavorites();
    
    // メモデータをキャッシュに読み込み
    await loadAllMemosToCache();
    
    // カスタムタグデータを読み込み
    await loadCustomTagsFromIndexedDB();
    
    // カスタムタグ順序を読み込み
    customTagsOrder = await characterDB.getCustomTagsOrder();
    
    console.log('IndexedDBからデータを読み込みました');
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    // エラーが発生した場合はデフォルト値で初期化
    favorites = [];
    userNotes = {};
    customTags = {};
    characterTags = {};
  }
}

/**
 * IndexedDBからすべてのメモをキャッシュに読み込み
 */
async function loadAllMemosToCache() {
  try {
    if (!characterDB.db) {
      return;
    }
    
    const transaction = characterDB.db.transaction(['notes'], 'readonly');
    const store = transaction.objectStore('notes');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result;
        userNotes = {}; // キャッシュをクリア
        
        results.forEach(noteData => {
          if (noteData.content && noteData.content.trim()) {
            userNotes[noteData.charId] = noteData.content;
          }
        });
        
        console.log(`${results.length}件のメモをキャッシュに読み込みました`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('メモ読み込みエラー:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('メモキャッシュ読み込みエラー:', error);
    // エラー時はデフォルト値で初期化
    userNotes = {};
  }
}

fetch('cha.json')
  .then(res => res.json())
  .then(async (data) => {
    characters = data.slice(1); // 設定は先頭にある
    settings = data[0].settings;
    // relationデータも保持
    relationGroups = data[0].relation || [];
    
    // worldの値でソート（1, 2, 3...順）
    characters.sort((a, b) => {
      const worldA = Number(a.world) || 0;
      const worldB = Number(b.world) || 0;
      return worldA - worldB;
    });
    
    // 言語マッピングを作成
    createLanguageMaps();

    // フィルターオプションを設定
    setupFilterOptions();
    
    // IndexedDBを初期化
    await initializeApp();
    
    // 初期表示
    filterCharacters();

    // お気に入り数を初期化
    updateFavoriteUI();
    
    // メモ数を初期化
    updateMemoCount();

    // 言語切り替えボタンのテキストを初期設定
    document.getElementById('langToggleBtn').textContent = currentDisplayLanguage === 'ja' ? '言語切替 (現在: 日本語)' : '言語 Toggle (Current: English)';

    // ▼JSONロード後にURLパラメータで詳細表示
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const img = params.get('img');
    
    // PHP側で指定されたキャラクターIDとimgIndexもチェック
    const initialCharacterId = window.initialCharacterId;
    const initialImgIndex = window.initialImgIndex || 0;
    
    // URLパラメータまたはPHP側のIDが指定されている場合
    const targetId = id && !isNaN(Number(id)) ? Number(id) : initialCharacterId;
    const targetImgIndex = img && !isNaN(Number(img)) ? Number(img) : initialImgIndex;
    
    if (targetId) {
      showCharacterDetails(targetId, targetImgIndex);
      // showCharacterDetails内で詳細表示設定済み
    }
});

/**
 * cha.jsonのsettingsから日本語と英語の間のマッピングを作成する
 * これにより、フィルター選択とキャラクターデータの言語の違いを吸収する
 */
function createLanguageMaps() {
  for (const type in settings) {
    if (settings[type].en && settings[type].ja) {
      for (let i = 0; i < settings[type].en.length; i++) {
        const enStr = String(settings[type].en[i] || '');
        const jaStr = String(settings[type].ja[i] || '');
        const enLowerCase = enStr.toLowerCase();
        const jaLowerCase = jaStr.toLowerCase();

        // For filtering: map UI display (ja/en lowercase) to canonical English lowercase
        languageMaps[type][jaLowerCase] = enLowerCase;
        languageMaps[type][enLowerCase] = enLowerCase;

        // For display: map canonical English lowercase to original case Japanese/English for display
        displayLanguageMaps[type].enToJa[enLowerCase] = settings[type].ja[i];
        displayLanguageMaps[type].enToEn[enLowerCase] = settings[type].en[i];
      }
    }
  }
}

/**
 * 年の形式を暦名に変換する
 * 例: "-3 580300389" -> "宇宙暦 580300389年"
 * @param {string} yearString - 年の文字列
 * @returns {string} - 変換された年の文字列
 */
function convertYearToCalendar(yearString) {
  if (!yearString || typeof yearString !== 'string') {
    return yearString || '';
  }
  
  // "-数字 年数" の形式をパース
  const match = yearString.match(/^-(\d+)\s+(.+)$/);
  if (match) {
    const calendarIndex = parseInt(match[1]) - 1; // 0-based index
    let yearNumber = match[2];
    
    // カレンダー設定から対応する暦名を取得
    if (settings.calendar && settings.calendar[currentDisplayLanguage] && 
        calendarIndex >= 0 && calendarIndex < settings.calendar[currentDisplayLanguage].length) {
      const calendarName = settings.calendar[currentDisplayLanguage][calendarIndex];
      
      // 年数に「年」が既に含まれているかチェック
      if (!yearNumber.endsWith('年')) {
        yearNumber += '年';
      }
      
      return `${calendarName} ${yearNumber}`;
    }
  }
  
  // 変換できない場合はそのまま返す
  return yearString;
}

/**
 * 名前を省略表示する（日本語は6文字、英字は9文字以上で...）
 * @param {string} name
 * @returns {string}
 */
function truncateName(name) {
  if (!name) return '';
  // 英字が多い場合は9文字、それ以外は6文字
  // 英字率が半分以上なら英字扱い
  const asciiCount = (name.match(/[A-Za-z0-9]/g) || []).length;
  const isMostlyAscii = asciiCount >= Math.ceil(name.length / 2);
  const limit = isMostlyAscii ? 9 : 6;
  return name.length > limit ? name.slice(0, limit) + '…' : name;
}

/**
 * キャラクターカードをHTML文字列としてレンダリングする
 * @param {object} char - キャラクターデータオブジェクト
 * @returns {string} - キャラクターカードのHTML文字列
 */
function renderCharacter(char) {
  // 画像・名前が配列の場合は最初の要素を使う
  const imgArr = Array.isArray(char.img) ? char.img : [char.img];
  const nameArr = Array.isArray(char.name) ? char.name : [char.name];
  const nameEnArr = Array.isArray(char.name_en) ? char.name_en : [char.name_en];

  const mobile = isMobileWidth();
  const objectPosition = mobile
    ? (char.imageZoomPosition_mobile || char.imageZoomPosition || 'center')
    : (char.imageZoomPosition || 'center');
  const imgWidth = mobile
    ? (char.imgsize_mobile || char.imgsize || '100%')
    : (char.imgsize || '100%');
  const displayName = currentDisplayLanguage === 'en' && nameEnArr[0] ? nameEnArr[0] : nameArr[0];
  // ▼省略表示
  const displayNameShort = truncateName(displayName);

  const world = char.world ? String(char.world) : "1";
  let worldClass = "";
  if (world === "0") worldClass = "card-world-0";
  else if (world === "1") worldClass = "card-world-1";
  else if (world === "2") worldClass = "card-world-2";
  else if (world === "3") worldClass = "card-world-3";

  const isFavorite = favorites.includes(char.id);
  
  // 武器アイコン表示の判定
  const hasWeapon = char.weapon && Array.isArray(char.weapon) && char.weapon.length > 0;
  let showWeaponIcon = false;
  
  switch (weaponIconDisplayMode) {
    case 'always':
      showWeaponIcon = hasWeapon;
      break;
    case 'never':
      showWeaponIcon = false;
      break;
    case 'filterOnly':
    default:
      showWeaponIcon = activeFilters.uniqueWeapon.length > 0 && hasWeapon;
      break;
  }
  
  // 武器画像のパスを取得（最初の武器の画像を使用）
  const weaponImg = hasWeapon && char.weapon[0] && char.weapon[0].img ? char.weapon[0].img : null;

  // 編集モードのクラスと選択状態
  const editModeClass = isEditMode ? 'edit-mode' : '';
  const selectedClass = isEditMode && selectedCharacters.has(char.id) ? 'selected' : '';
  const cardClasses = `card ${worldClass} ${editModeClass} ${selectedClass}`.trim();

  return `
    <div class="${cardClasses}" data-char-id="${char.id}"
      onclick="handleCardClick(${char.id}, event)"
      onmouseenter="onCardHover(this, ${char.id})"
      onmouseleave="onCardLeave()"
      ontouchstart="handleCardTouchStart(event, ${char.id})"
      ontouchend="handleCardTouchEnd(event)"
      ontouchmove="handleCardTouchMove(event)"
      oncontextmenu="showContextMenu(event, ${char.id})">
      
      <!-- 編集モード用チェックボックス -->
      ${isEditMode ? `
      <div class="edit-checkbox">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      </div>
      ` : ''}
      
      <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
              onclick="event.stopPropagation(); toggleFavorite(${char.id})"
              title="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}"
              aria-label="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? '#ff6b00' : 'none'}" stroke="${isFavorite ? '#ff6b00' : '#666'}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      ${showWeaponIcon ? `
      <div class="weapon-icon" onclick="event.stopPropagation(); showCharacterDetailsAndWeapon(${char.id})" title="武器情報を表示">
        ${weaponImg ? `
        <img src="img/${weaponImg}" alt="武器" class="weapon-image">
        <svg class="weapon-fallback" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2" style="display: none;">
          <path d="M6.5 6.5h11L16 8.5v7L14.5 17h-5L8 15.5v-7z"/>
          <path d="M6.5 6.5L4 4"/>
          <path d="M17.5 6.5L20 4"/>
          <path d="M12 8.5V13"/>
        </svg>
        ` : `
        <svg class="weapon-fallback" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2">
          <path d="M6.5 6.5h11L16 8.5v7L14.5 17h-5L8 15.5v-7z"/>
          <path d="M6.5 6.5L4 4"/>
          <path d="M17.5 6.5L20 4"/>
          <path d="M12 8.5V13"/>
        </svg>
        `}
      </div>
      ` : ''}
      <div class="imgframe">
        <img src="img/${imgArr[0]}" alt="${nameArr[0]}の画像" style="width:${imgWidth};object-position:${objectPosition};">
      </div>
      <h2 title="${displayName}">${displayNameShort}</h2>
    </div>
  `;
}

// ミニポップアップ管理用
let miniPopupTimer = null;
let currentMiniPopup = null;

/**
 * ミニポップアップを表示
 * @param {HTMLElement} cardEl - カード要素
 * @param {object} char - キャラクターデータ
 */
function showMiniPopup(cardEl, char) {
  hideMiniPopup(); // 既存を消す

  // ポップアップ要素生成
  const popup = document.createElement('div');
  popup.className = 'mini-popup';

  // 世界線色バー
  let worldBar = '';
  if (char.world === "1") worldBar = '<div style="height:6px;width:100%;margin-bottom:7px;border-radius:6px;background:linear-gradient(90deg,#00c3ff,#ffff1c);"></div>';
  else if (char.world === "2") worldBar = '<div style="height:6px;width:100%;margin-bottom:7px;border-radius:6px;background:linear-gradient(90deg,#ff7e5f,#feb47b);"></div>';
  else if (char.world === "3") worldBar = '<div style="height:6px;width:100%;margin-bottom:7px;border-radius:6px;background:linear-gradient(90deg,#43e97b,#38f9d7);"></div>';

  // 言語対応
  let name = Array.isArray(char.name) ? char.name[0] : char.name;
  let nameEn = Array.isArray(char.name_en) ? char.name_en[0] : char.name_en;
  let displayName = currentDisplayLanguage === 'en' && nameEn ? nameEn : name;
  let worldLabel = currentDisplayLanguage === 'en' ? 'Worldline' : '世界線';

  // 基本情報を先に表示
  popup.innerHTML =
    worldBar +
    `<div style="font-weight:bold;font-size:1.13em;margin-bottom:2px;">${displayName}</div>` +
    `<div style="color:#008080;font-size:0.98em;">${worldLabel}${char.world || 'N/A'}</div>`;

  // メモを非同期で取得・表示
  loadMemoForPopup(popup, char.id);

  // カードの親（.card-container）に追加
  cardEl.parentNode.appendChild(popup);

  // 位置調整
  const cardRect = cardEl.getBoundingClientRect();
  const parentRect = cardEl.parentNode.getBoundingClientRect();
  const popupWidth = 240; // 推定最大幅
  const margin = 18;
  let left, top;

  if (window.innerWidth > 900) {
    // 右側に十分なスペースがある場合は右、なければ左
    const rightSpace = window.innerWidth - (cardRect.right + margin + popupWidth);
    if (rightSpace > 0) {
      left = cardEl.offsetLeft + cardEl.offsetWidth + margin;
    } else {
      left = cardEl.offsetLeft - popupWidth - margin;
      if (left < 0) left = 0;
    }
    top = cardEl.offsetTop;
  } else {
    left = cardEl.offsetLeft;
    top = cardEl.offsetTop + cardEl.offsetHeight + 10;
  }
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';

  // フェードイン
  setTimeout(() => {
    popup.classList.add('visible');
  }, 10);

  currentMiniPopup = popup;
}

/**
 * ミニポップアップ用にメモを非同期で読み込み
 * @param {HTMLElement} popup - ポップアップ要素
 * @param {number} charId - キャラクターID
 */
async function loadMemoForPopup(popup, charId) {
  const shortMemo = (i) => i.length > 50 ? i.substring(0, 47) + '...' : i;
  try {
    let memo = '';
    
    if (characterDB.db) {
      memo = await characterDB.getNote(charId);
      // キャッシュも更新
      if (memo) {
        userNotes[charId] = memo;
      } else {
        delete userNotes[charId];
      }
    } else {
      memo = userNotes[charId] || '';
    }
    
    if (memo) {
      let shorted = shortMemo(memo);
      if (popup && popup.parentNode) {
        popup.innerHTML += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(0,0,0,0.1);font-size:0.85em;color:#555;">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#666;">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="M15 5l4 4"/>
            </svg>
            <span style="font-weight:500;color:#666;">メモ</span>
          </div>
          <div style="line-height:1.3;overflow:hidden;">${shorted}</div>
        </div>`;
      }
    }
  } catch (error) {
    console.error('ミニポップアップメモ取得エラー:', error);
  }
}

/**
 * ミニポップアップを非表示
 */
function hideMiniPopup() {
  if (miniPopupTimer) {
    clearTimeout(miniPopupTimer);
    miniPopupTimer = null;
  }
  if (currentMiniPopup) {
    currentMiniPopup.classList.remove('visible');
    // 完全に消してからDOM削除
    setTimeout(() => {
      if (currentMiniPopup && currentMiniPopup.parentNode) {
        currentMiniPopup.parentNode.removeChild(currentMiniPopup);
      }
      currentMiniPopup = null;
    }, 180);
  }
}

/**
 * キャラクターリストをフィルターし、表示を更新する
 */
function filterCharacters() {
  try {
    const keyword = document.getElementById('searchName').value.trim().toLowerCase();
    const characterListContainer = document.getElementById('characterList');
    const noCharactersMessage = document.getElementById('noCharactersMessage');

  // ▼完全一致・部分一致両方を抽出
  let exactMatches = [];
  let partialMatches = [];
  characters.forEach(c => {
    const nameArr = Array.isArray(c.name) ? c.name : [c.name];
    const nameEnArr = Array.isArray(c.name_en) ? c.name_en : [c.name_en];
    let matchType = null;
    // 完全一致
    if (keyword !== '') {
      let nameMatch = false;
      let weaponMatch = false;
      let customTagMatch = false;
      
      // 名前での一致チェック
      if (nameArr.some(n => (n || '').toLowerCase() === keyword) ||
          nameEnArr.some(n => (n || '').toLowerCase() === keyword)) {
        nameMatch = true;
        matchType = 'exact';
      }
      
      // 武器名での一致チェック (設定が有効な場合)
      if (weaponSearchEnabled && c.weapon && Array.isArray(c.weapon)) {
        const weaponExactMatch = c.weapon.some(weaponObj => {
          if (!weaponObj || !weaponObj.name) return false;
          const weaponNames = Array.isArray(weaponObj.name) ? weaponObj.name : [weaponObj.name];
          return weaponNames.some(name => (name || '').toLowerCase() === keyword);
        });
        if (weaponExactMatch) {
          weaponMatch = true;
          matchType = 'exact';
        }
      }
      
      // カスタムタグでの一致チェック (設定が有効な場合)
      if (customTagSearchEnabled && characterTags[c.id]) {
        const userTagNames = characterTags[c.id].map(tagId => 
          (customTags[tagId] && customTags[tagId].name || '').toLowerCase()
        );
        if (userTagNames.some(tagName => tagName === keyword)) {
          customTagMatch = true;
          matchType = 'exact';
        }
      }
      
      // 完全一致がない場合、部分一致をチェック
      if (!nameMatch && !weaponMatch && !customTagMatch) {
        // 名前での部分一致
        if (nameArr.some(n => (n || '').toLowerCase().includes(keyword)) ||
            nameEnArr.some(n => (n || '').toLowerCase().includes(keyword))) {
          matchType = 'partial';
        }
        
        // 武器名での部分一致 (設定が有効な場合)
        if (!matchType && weaponSearchEnabled && c.weapon && Array.isArray(c.weapon)) {
          const weaponPartialMatch = c.weapon.some(weaponObj => {
            if (!weaponObj || !weaponObj.name) return false;
            const weaponNames = Array.isArray(weaponObj.name) ? weaponObj.name : [weaponObj.name];
            return weaponNames.some(name => (name || '').toLowerCase().includes(keyword));
          });
          if (weaponPartialMatch) {
            matchType = 'partial';
          }
        }
        
        // カスタムタグでの部分一致 (設定が有効な場合)
        if (!matchType && customTagSearchEnabled && characterTags[c.id]) {
          const userTagNames = characterTags[c.id].map(tagId => 
            (customTags[tagId] && customTags[tagId].name || '').toLowerCase()
          );
          if (userTagNames.some(tagName => tagName.includes(keyword))) {
            matchType = 'partial';
          }
        }
      }
    } else {
      matchType = 'partial'; // 空欄時は全件
    }

    // フィルター条件
    // 複数バリエーション対応
    const imgCount =
      Math.max(
        Array.isArray(c.img) ? c.img.length : 1,
        Array.isArray(c.name) ? c.name.length : 1,
        Array.isArray(c.description) ? c.description.length : 1,
        Array.isArray(c.fightingStyle) && Array.isArray(c.fightingStyle[0]) ? c.fightingStyle.length : 1,
        Array.isArray(c.attribute) && Array.isArray(c.attribute[0]) ? c.attribute.length : 1
      );
    let filterMatch = false;
    for (let i = 0; i < imgCount; i++) {
      const fightingStyleArr = Array.isArray(c.fightingStyle) && Array.isArray(c.fightingStyle[0]) ? c.fightingStyle : [c.fightingStyle];
      const attributeArr = Array.isArray(c.attribute) && Array.isArray(c.attribute[0]) ? c.attribute : [c.attribute];
      const raceMatch = activeFilters.race.length === 0 || (() => {
        const raceData = c.race;
        
        // 単一の文字列の場合
        if (typeof raceData === 'string') {
          if (!raceData || !raceData.trim()) return false;
          const rStr = raceData.trim();
          const rLower = rStr.toLowerCase();
          if (activeFilters.race.includes(rLower)) return true;
          const canonicalRace = languageMaps.race[rLower] || rLower;
          return activeFilters.race.includes(canonicalRace);
        }
        
        // 配列の場合
        if (Array.isArray(raceData)) {
          return raceData.some(r => {
            if (!r || typeof r !== 'string') return false;
            const rStr = String(r).trim();
            if (!rStr) return false;
            
            const rLower = rStr.toLowerCase();
            if (activeFilters.race.includes(rLower)) return true;
            
            const canonicalRace = languageMaps.race[rLower] || rLower;
            return activeFilters.race.includes(canonicalRace);
          });
        }
        
        return false;
      })();
      const styleMatch = activeFilters.fightingStyle.length === 0 ||
        (Array.isArray(fightingStyleArr[i] || fightingStyleArr[0])
          ? (fightingStyleArr[i] || fightingStyleArr[0]).some(s => {
              if (!s || typeof s !== 'string') return false; // null, undefined, 非文字列を除外
              const sStr = String(s).trim(); // 文字列に変換してトリム
              if (!sStr) return false; // 空文字列を除外
              
              // 直接一致をチェック
              const sLower = sStr.toLowerCase();
              if (activeFilters.fightingStyle.includes(sLower)) return true;
              
              // 言語マッピングを使用した一致をチェック
              const canonicalStyle = languageMaps.fightingStyle[sLower] || sLower;
              return activeFilters.fightingStyle.includes(canonicalStyle);
            })
          : (() => {
              // 単一の戦闘スタイル値の場合
              const singleStyle = fightingStyleArr[i] || fightingStyleArr[0];
              if (!singleStyle || typeof singleStyle !== 'string') return false;
              const sStr = String(singleStyle).trim();
              if (!sStr) return false;
              
              // 直接一致をチェック
              const sLower = sStr.toLowerCase();
              if (activeFilters.fightingStyle.includes(sLower)) return true;
              
              // 言語マッピングを使用した一致をチェック
              const canonicalStyle = languageMaps.fightingStyle[sLower] || sLower;
              return activeFilters.fightingStyle.includes(canonicalStyle);
            })());
      const attrMatch = activeFilters.attribute.length === 0 ||
        (Array.isArray(attributeArr[i] || attributeArr[0])
          ? (attributeArr[i] || attributeArr[0]).some(a => {
              if (!a || typeof a !== 'string') return false; // null, undefined, 非文字列を除外
              const aStr = String(a).trim(); // 文字列に変換してトリム
              if (!aStr) return false; // 空文字列を除外
              
              // 直接一致をチェック
              const aLower = aStr.toLowerCase();
              if (activeFilters.attribute.includes(aLower)) return true;
              
              // 言語マッピングを使用した一致をチェック
              const canonicalAttr = languageMaps.attribute[aLower] || aLower;
              return activeFilters.attribute.includes(canonicalAttr);
            })
          : (() => {
              // 単一の属性値の場合
              const singleAttr = attributeArr[i] || attributeArr[0];
              if (!singleAttr || typeof singleAttr !== 'string') return false;
              const aStr = String(singleAttr).trim();
              if (!aStr) return false;
              
              // 直接一致をチェック
              const aLower = aStr.toLowerCase();
              if (activeFilters.attribute.includes(aLower)) return true;
              
              // 言語マッピングを使用した一致をチェック
              const canonicalAttr = languageMaps.attribute[aLower] || aLower;
              return activeFilters.attribute.includes(canonicalAttr);
            })());
      const groupMatch = activeFilters.group.length === 0 ||
        (Array.isArray(c.group) && c.group.some(g => {
          if (!g || typeof g !== 'string') return false; // null, undefined, 非文字列を除外
          const gStr = String(g).trim(); // 文字列に変換してトリム
          if (!gStr) return false; // 空文字列を除外
          
          // 直接一致をチェック
          const gLower = gStr.toLowerCase();
          if (activeFilters.group.includes(gLower)) return true;
          
          // 言語マッピングを使用した一致をチェック
          const canonicalGroup = languageMaps.group[gLower] || gLower;
          return activeFilters.group.includes(canonicalGroup);
        }));
      const worldMatch = activeFilters.world.length === 0 ||
        activeFilters.world.includes(String(c.world));
      const favoritesMatch = activeFilters.favorites.length === 0 ||
        favorites.includes(c.id);
      const memoMatch = activeFilters.memo.length === 0 ||
        // メモフィルター（IndexedDBのキャッシュからチェック）
        userNotes[c.id] && userNotes[c.id].trim() !== '';
      
      // カスタムタグフィルター
      const customTagsMatch = activeFilters.customTags.length === 0 ||
        (characterTags[c.id] && activeFilters.customTags.some(tagId => characterTags[c.id].includes(tagId)));
      
      // ユニーク武器フィルター
      const uniqueWeaponMatch = activeFilters.uniqueWeapon.length === 0 ||
        (c.weapon && Array.isArray(c.weapon) && c.weapon.length > 0);
      
      if (raceMatch && styleMatch && attrMatch && groupMatch && worldMatch && favoritesMatch && memoMatch && customTagsMatch && uniqueWeaponMatch) {
        filterMatch = true;
        break;
      }
    }

    if (filterMatch && matchType === 'exact') exactMatches.push(c);
    else if (filterMatch && matchType === 'partial') partialMatches.push(c);
  });

  // 重複除去(完全一致が優先)
  partialMatches = partialMatches.filter(c => !exactMatches.includes(c));
  let filtered = [...exactMatches, ...partialMatches];

  // 並び替えモード中の場合、現在のDOM順序を復元
  if (isCustomSortModeActive && tempSortOrder.length > 0) {
    // tempSortOrderに基づいて並び替え
    const orderMap = new Map(tempSortOrder.map((id, index) => [id, index]));
    filtered.sort((a, b) => {
      const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return indexA - indexB;
    });
  } else {
    // 並び替えを適用
    // カスタムタグフィルターが1つだけ有効な場合は、そのタグ専用の並び順を使用
    let sortOrder = currentSortOrder;
    if (activeFilters.customTags.length === 1) {
      const tagId = activeFilters.customTags[0];
      sortOrder = tagSortOrders[tagId] || currentSortOrder;
    }
    filtered = applySortOrder(filtered, sortOrder);
  }

  if (filtered.length > 0) {
    characterListContainer.innerHTML = filtered.map(renderCharacter).join("");
    noCharactersMessage.style.display = 'none';
    // 動的に生成された画像要素にイベントリスナーを設定
    setupDynamicImageEventListeners();
    
    // 編集モードのUIを復元
    if (isEditMode) {
      if (editSubMode === 'select') {
        // 選択モード: カードにedit-modeクラスを追加
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
          card.classList.add('edit-mode');
          const charId = parseInt(card.dataset.charId);
          if (selectedCharacters.has(charId)) {
            card.classList.add('selected');
          }
        });
      } else if (editSubMode === 'sort' && isCustomSortModeActive) {
        // 並び替えモード: ドラッグ機能を再適用
        reapplyCustomSortMode();
      }
    }
  } else {
    characterListContainer.innerHTML = '';
    noCharactersMessage.style.display = 'block';
    addNotification('該当するキャラクターが見つかりませんでした', 'info');
  }
  } catch (error) {
    console.error('filterCharacters エラー:', error);
    console.log('エラー発生時のactiveFilters:', activeFilters);
    console.log('エラー発生時のcharactersサンプル:', characters.slice(0, 3));
    
    // エラーの詳細な場所を特定するために、各キャラクターのデータ型をチェック
    characters.slice(0, 5).forEach((char, index) => {
      console.log(`Character ${index + 1} (ID: ${char.id}):`, {
        race: char.race,
        raceTypes: Array.isArray(char.race) ? char.race.map((r, i) => `[${i}]: ${JSON.stringify(r)} (${typeof r})`) : 'not an array',
        group: char.group, 
        groupTypes: Array.isArray(char.group) ? char.group.map((g, i) => `[${i}]: ${JSON.stringify(g)} (${typeof g})`) : 'not an array',
        fightingStyle: char.fightingStyle,
        attribute: char.attribute
      });
    });
    
    // 設定データも確認
    console.log('Settings sample:', {
      race: settings.race ? {
        ja: settings.race.ja.slice(0, 3),
        en: settings.race.en.slice(0, 3)
      } : 'undefined',
      group: settings.group ? {
        ja: settings.group.ja.slice(0, 3), 
        en: settings.group.en.slice(0, 3)
      } : 'undefined'
    });
    
    // 言語マッピングの状態も確認
    console.log('Language mappings sample:', {
      race: Object.keys(languageMaps.race || {}).slice(0, 5),
      group: Object.keys(languageMaps.group || {}).slice(0, 5)
    });
  }
}

/**
 * 動的に生成された画像要素にイベントリスナーを設定
 */
function setupDynamicImageEventListeners() {
  // キャラクター画像の onerror イベント
  document.querySelectorAll('#characterList .imgframe img').forEach(img => {
    img.addEventListener('error', function() {
      this.src = 'img/placeholder.png';
    }, { passive: true });
  });
  
  // 武器画像の onerror イベント
  document.querySelectorAll('#characterList .weapon-image').forEach(img => {
    img.addEventListener('error', function() {
      this.style.display = 'none';
      if (this.nextElementSibling) {
        this.nextElementSibling.style.display = 'block';
      }
    }, { passive: true });
  });
}

/**
 * フィルターオプション（種族、戦闘スタイル、属性、グループ）を設定する
 */
function setupFilterOptions() {
  // 種族フィルターの生成
  const raceContainer = document.getElementById('raceFilters');
  settings.race.ja.forEach(race => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.textContent = race;
    option.onclick = () => toggleFilterOption('race', race, option); // UIは日本語
    raceContainer.appendChild(option);
  });
  
  // 戦闘スタイルフィルターの生成
  const styleContainer = document.getElementById('fightingStyleFilters');
  settings.fightingStyle.ja.forEach(style => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.textContent = style;
    option.onclick = () => toggleFilterOption('fightingStyle', style, option); // UIは日本語
    styleContainer.appendChild(option);
  });
  
  // 属性フィルターの生成
  const attrContainer = document.getElementById('attributeFilters');
  settings.attribute.ja.forEach(attr => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.textContent = attr;
    option.onclick = () => toggleFilterOption('attribute', attr, option); // UIは日本語
    attrContainer.appendChild(option);
  });
  
  // グループフィルターの生成
  const groupContainer = document.getElementById('groupFilters');
  settings.group.ja.forEach(group => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.textContent = group;
    option.onclick = () => toggleFilterOption('group', group, option); // UIは日本語
    groupContainer.appendChild(option);
  });
  // ▼追加：世界線フィルター
  const worldContainer = document.getElementById('worldFilters');
  [1, 2, 3].forEach(world => {
    const option = document.createElement('div');
    option.className = 'filter-option';
    option.textContent = `世界線${world}`;
    option.onclick = () => toggleFilterOption('world', String(world), option);
    worldContainer.appendChild(option);
  });
}

/**
 * フィルターオプションの選択状態を切り替える
 * @param {string} type - フィルターの種類 (e.g., 'race', 'fightingStyle')
 * @param {string} value - 選択されたフィルターの表示値 (日本語)
 * @param {HTMLElement} element - クリックされたDOM要素
 */
function toggleFilterOption(type, value, element) {
  element.classList.toggle('selected');
  
  // お気に入りフィルターの特別処理
  if (type === 'favorites') {
    favoritesOnly = !favoritesOnly;
    const index = activeFilters.favorites.indexOf('favorites');
    if (favoritesOnly) {
      if (index === -1) activeFilters.favorites.push('favorites');
    } else {
      if (index !== -1) activeFilters.favorites.splice(index, 1);
    }
    return;
  }
  
  // メモ済みフィルターの特別処理
  if (type === 'memo') {
    memoOnly = !memoOnly;
    const index = activeFilters.memo.indexOf('memo');
    if (memoOnly) {
      if (index === -1) activeFilters.memo.push('memo');
    } else {
      if (index !== -1) activeFilters.memo.splice(index, 1);
    }
    return;
  }
  
  // ユニーク武器フィルターの特別処理
  if (type === 'uniqueWeapon') {
    uniqueWeaponOnly = !uniqueWeaponOnly;
    const index = activeFilters.uniqueWeapon.indexOf('uniqueWeapon');
    if (uniqueWeaponOnly) {
      if (index === -1) activeFilters.uniqueWeapon.push('uniqueWeapon');
    } else {
      if (index !== -1) activeFilters.uniqueWeapon.splice(index, 1);
    }
    return;
  }
  
  // フィルターの表示値(日本語)を正規の英語名に変換してactiveFiltersに格納
  const canonicalValue = type === 'world' ? value : (() => {
    const valueStr = String(value || '');
    return languageMaps[type][valueStr.toLowerCase()] || valueStr.toLowerCase();
  })();
  const index = activeFilters[type].indexOf(canonicalValue);
  if (index === -1) {
    activeFilters[type].push(canonicalValue);
  } else {
    activeFilters[type].splice(index, 1);
  }
}

/**
 * フィルターポップアップの表示/非表示を切り替える
 */
function toggleFilterPopup() {
  const popup = document.getElementById('filterPopup');
  const isVisible = popup.style.display === 'block';
  
  if (isVisible) {
    popup.style.display = 'none';
    document.body.classList.remove('modal-open'); // 背景スクロール防止解除
  } else {
    popup.style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
  }
}

/**
 * フィルターを適用し、ポップアップを閉じる
 */
function applyFilters() {
  filterCharacters();
  toggleFilterPopup();
  updateFilterInfoButtonVisibility(); // フィルター情報アイコンの表示を更新
}

/**
 * フィルターの状態をクリアする
 */
function clearFilters() {
  // フィルター状態をクリア
  activeFilters = {
    race: [],
    fightingStyle: [],
    attribute: [],
    group: [],
    world: [],
    favorites: [],
    memo: [],
    customTags: [],
    uniqueWeapon: []
  };
  
  // お気に入りフィルターもクリア
  favoritesOnly = false;
  
  // メモ済みフィルターもクリア
  memoOnly = false;
  
  // ユニーク武器フィルターもクリア
  uniqueWeaponOnly = false;
  
  // 選択状態をクリア
  document.querySelectorAll('.filter-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // カスタムタグフィルターの折りたたみ状態もリセット
  const customTagsContainer = document.getElementById('customTagsFilters');
  const customTagsToggle = document.getElementById('customTagsToggle');
  if (customTagsContainer && customTagsToggle) {
    customTagsContainer.style.display = 'none';
    customTagsToggle.textContent = '▼';
  }
  
  filterCharacters();
  toggleFilterPopup();
  updateFilterInfoButtonVisibility(); // フィルター情報アイコンの表示を更新
}

/**
 * ポップアップからフィルターをクリアする
 */
function clearFiltersFromPopup() {
  // フィルター状態をクリア
  activeFilters = {
    race: [],
    fightingStyle: [],
    attribute: [],
    group: [],
    world: [],
    favorites: [],
    memo: [],
    customTags: [],
    uniqueWeapon: []
  };
  
  // お気に入りフィルターもクリア
  favoritesOnly = false;
  
  // メモ済みフィルターもクリア
  memoOnly = false;
  
  // ユニーク武器フィルターもクリア
  uniqueWeaponOnly = false;
  
  // 選択状態をクリア
  document.querySelectorAll('.filter-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  // カスタムタグフィルターの折りたたみ状態もリセット
  const customTagsContainer = document.getElementById('customTagsFilters');
  const customTagsToggle = document.getElementById('customTagsToggle');
  if (customTagsContainer && customTagsToggle) {
    customTagsContainer.style.display = 'none';
    customTagsToggle.textContent = '▼';
  }
  
  // ポップアップを閉じる
  hideFilterInfo();
  
  // キャラクターリストを更新
  filterCharacters();
  
  // フィルター情報アイコンの表示を更新
  updateFilterInfoButtonVisibility();
}

/**
 * フィルタータブを切り替える
 * @param {string} tabName - 切り替え先のタブ名 ('main' または 'other')
 */
function switchFilterTab(tabName) {
  // 全てのタブボタンからactiveクラスを削除
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 全てのタブコンテンツを非表示
  document.querySelectorAll('.filter-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // 選択されたタブボタンにactiveクラスを追加
  const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedBtn) {
    selectedBtn.classList.add('active');
  }
  
  // 選択されたタブコンテンツを表示
  const selectedContent = document.getElementById(`filterTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (selectedContent) {
    selectedContent.classList.add('active');
    
    // モバイル版の場合、各タブの最初のカテゴリを表示
    if (window.innerWidth <= 767) {
      const firstCatTab = selectedContent.querySelector('.mobile-cat-tab');
      if (firstCatTab) {
        const firstCategory = firstCatTab.getAttribute('data-cat');
        switchMobileCategoryTab(firstCategory, tabName);
      }
    }
  }
}

/**
 * モバイル版のカテゴリタブを切り替える
 * @param {string} category - カテゴリ名 ('world', 'race', 'fighting', 'attribute', 'group', 'customtags', 'other')
 * @param {string} tabName - 親タブ名 ('main' または 'other'、省略時は自動判定)
 */
function switchMobileCategoryTab(category, tabName) {
  // モバイルでない場合は何もしない
  if (window.innerWidth > 767) return;
  
  // tabNameが指定されていない場合、現在アクティブなタブを取得
  if (!tabName) {
    const activeTabContent = document.querySelector('.filter-tab-content.active');
    if (activeTabContent) {
      tabName = activeTabContent.id.replace('filterTab', '').toLowerCase();
    } else {
      tabName = 'main'; // デフォルト
    }
  }
  
  // 対応するタブ内のカテゴリタブとセクションのセレクタを構築
  const tabId = `filterTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
  
  // 該当タブ内の全てのカテゴリタブからactiveクラスを削除
  document.querySelectorAll(`#${tabId} .mobile-cat-tab`).forEach(tab => {
    tab.classList.remove('active');
  });
  
  // 該当タブ内の全てのfilter-sectionを非表示
  document.querySelectorAll(`#${tabId} .filter-section`).forEach(section => {
    section.classList.remove('active');
  });
  
  // 選択されたタブにactiveクラスを追加
  const selectedTab = document.querySelector(`#${tabId} [data-cat="${category}"]`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // 選択されたカテゴリのセクションを表示
  const selectedSection = document.querySelector(`#${tabId} .filter-section[data-category="${category}"]`);
  if (selectedSection) {
    selectedSection.classList.add('active');
    
    // カスタムタグセクションの場合、フィルターを開いて更新
    if (category === 'customtags') {
      const customTagsFilters = document.getElementById('customTagsFilters');
      const toggle = document.getElementById('customTagsToggle');
      if (customTagsFilters) {
        customTagsFilters.style.display = 'flex';
        if (toggle) toggle.textContent = '▲';
        updateCustomTagsFilterOptions();
      }
    }
  }
}

/**
 * 特定のカテゴリ（種族、戦闘スタイルなど）の用語を現在の表示言語に変換する
 * @param {string} type - カテゴリの種類 (e.g., 'race', 'fightingStyle')
 * @param {string} termInCharacterData - キャラクターデータに含まれる用語 (例: "棒人間" または "None")
 * @param {string} targetLanguage - 'ja' または 'en'
 * @returns {string} 変換された用語
 */
function getDisplayTerm(type, termInCharacterData, targetLanguage) {
  // 配列の場合は最初の要素を取得（二重配列にも対応）
  let actualTerm = termInCharacterData;
  if (Array.isArray(termInCharacterData)) {
    // [["属性"]] または ["属性"] の場合
    if (termInCharacterData.length > 0) {
      actualTerm = Array.isArray(termInCharacterData[0]) ? termInCharacterData[0][0] : termInCharacterData[0];
    } else {
      return ''; // 空配列の場合
    }
  }
  
  // 文字列でない場合は文字列に変換
  if (typeof actualTerm !== 'string') {
    actualTerm = String(actualTerm || '');
  }
  
  const lowerCaseTermInCharacterData = actualTerm.toLowerCase();

  // 1. キャラクターデータ内の用語を正規の英語（小文字）に変換
  let canonicalEnTerm = languageMaps[type] ? languageMaps[type][lowerCaseTermInCharacterData] : undefined;

  // マッピングが見つからない場合、日本語から英語への逆引きを試行
  if (!canonicalEnTerm && displayLanguageMaps[type] && displayLanguageMaps[type].enToJa) {
    // 日本語から英語への逆引き
    for (const [enTerm, jaTerm] of Object.entries(displayLanguageMaps[type].enToJa)) {
      const jaTermStr = String(jaTerm || '');
      if (jaTermStr.toLowerCase() === lowerCaseTermInCharacterData) {
        canonicalEnTerm = enTerm;
        break;
      }
    }
  }

  // それでも見つからない場合、その用語自体が正規の英語であると仮定
  if (!canonicalEnTerm) {
    canonicalEnTerm = lowerCaseTermInCharacterData; // 小文字にして統一
  }

  // 2. 正規の英語用語をターゲット言語の表示名に変換
  if (targetLanguage === 'ja') {
    return displayLanguageMaps[type] && displayLanguageMaps[type].enToJa ? 
           (displayLanguageMaps[type].enToJa[canonicalEnTerm] || actualTerm) : actualTerm;
  } else if (targetLanguage === 'en') {
    return displayLanguageMaps[type] && displayLanguageMaps[type].enToEn ? 
           (displayLanguageMaps[type].enToEn[canonicalEnTerm] || actualTerm) : actualTerm;
  }
  return actualTerm; // Fallback
}

/**
 * 固定ラベル（例: 説明、身長）を現在の表示言語に変換する
 * @param {string} key - ラベルのキー (e.g., 'description', 'height')
 * @returns {string} 変換されたラベル
 */
function getTranslatedLabel(key) {
    return labels[key][currentDisplayLanguage] || key;
}

/**
 * 言語を切り替える
 */
function toggleLanguage() {
  currentDisplayLanguage = currentDisplayLanguage === 'ja' ? 'en' : 'ja';
  console.log('Display language set to:', currentDisplayLanguage);
  
  // 詳細画面が開いている場合は、再レンダリングして言語を反映
  const detailsPopup = document.getElementById('detailsPopup');
  if (detailsPopup.style.display === 'block') {
      const currentCharId = parseInt(document.getElementById('characterDetails').dataset.charId);
      closeDetailsPopup(); // 一度閉じてから開くことで再レンダリングを促す
      showCharacterDetails(currentCharId);
  }

  // 言語切り替えボタンのテキストを更新（ハンバーガーメニュー内）
  document.getElementById('langToggleBtn').textContent = currentDisplayLanguage === 'ja' ? '言語切替 (現在: 日本語)' : '言語 Toggle (Current: English)';
}

// ▼テーマ切替（3テーマ対応・cookie保存）
let currentTheme = 'light';
const themeOrder = ['light', 'dark', 'modern', 'aquamarine'];

function setThemeCookie(theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}
function getThemeCookie() {
  const m = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  return m ? m[1] : null;
}

function applyTheme(theme) {
  const body = document.body;
  body.classList.remove('theme-dark', 'theme-modern', 'theme-aquamarine');
  if (theme === 'dark') body.classList.add('theme-dark');
  if (theme === 'modern') body.classList.add('theme-modern');
  if (theme === 'aquamarine') body.classList.add('theme-aquamarine');
  currentTheme = theme;
  updateThemeButtonText();
  setThemeCookie(theme);
}

// ドロップダウンメニューの開閉
function toggleThemeDropdown() {
  const menu = document.getElementById('themeDropdownMenu');
  menu.classList.toggle('show');
}

// テーマを直接選択
function selectTheme(themeName) {
  applyTheme(themeName);
  // ドロップダウンを閉じる
  const menu = document.getElementById('themeDropdownMenu');
  menu.classList.remove('show');
}

// 旧toggleTheme関数(互換性のため残す)
function toggleTheme() {
  let idx = themeOrder.indexOf(currentTheme);
  idx = (idx + 1) % themeOrder.length;
  applyTheme(themeOrder[idx]);
}

function updateThemeButtonText() {
  const nameSpan = document.getElementById('currentThemeName');
  if (nameSpan) {
    let label = 'ライト';
    if (currentTheme === 'dark') label = 'ダーク';
    if (currentTheme === 'modern') label = 'ネオン';
    if (currentTheme === 'aquamarine') label = 'アクアマリン';
    nameSpan.textContent = label;
  }
}

// ドロップダウンの外側をクリックしたら閉じる
document.addEventListener('click', (e) => {
  const dropdown = document.querySelector('.theme-dropdown-wrapper');
  const menu = document.getElementById('themeDropdownMenu');
  if (menu && dropdown && !dropdown.contains(e.target)) {
    menu.classList.remove('show');
  }
});

// ページロード時にテーマを初期化（cookie対応）
window.addEventListener('DOMContentLoaded', () => {
  const saved = getThemeCookie();
  if (themeOrder.includes(saved)) {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
  
  // 初期表示の画像にもイベントリスナーを設定
  setupDynamicImageEventListeners();
  
  // ハンバーガーメニューのタッチスクロール制御を初期化
  setupHamburgerTouchControl();
  
  // モバイル版の初期カテゴリタブをアクティブ化
  if (window.innerWidth <= 767) {
    const firstCatTab = document.querySelector('.mobile-cat-tab');
    if (firstCatTab) {
      const firstCategory = firstCatTab.getAttribute('data-cat');
      switchMobileCategoryTab(firstCategory);
    }
  }
});

// ウィンドウリサイズ時の処理
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // モバイル版に切り替わった時、アクティブなタブの最初のカテゴリを表示
    if (window.innerWidth <= 767) {
      const activeTabContent = document.querySelector('.filter-tab-content.active');
      if (activeTabContent) {
        const firstCatTab = activeTabContent.querySelector('.mobile-cat-tab');
        if (firstCatTab) {
          const firstCategory = firstCatTab.getAttribute('data-cat');
          const tabName = activeTabContent.id.replace('filterTab', '').toLowerCase();
          switchMobileCategoryTab(firstCategory, tabName);
        }
      }
    } else {
      // PC版に切り替わった時、全セクションのactiveクラスを削除
      document.querySelectorAll('.filter-section').forEach(section => {
        section.classList.remove('active');
      });
    }
  }, 100);
});

// ブラウザの戻る/進むボタンでの詳細画面制御
window.addEventListener('popstate', (event) => {
  const detailsPopup = document.getElementById('detailsPopup');
  const urlParams = new URLSearchParams(window.location.search);
  const charId = urlParams.get('id');
  
  if (charId) {
    // URLにIDがある場合は詳細画面を表示
    const imgIndex = parseInt(urlParams.get('img')) || 0;
    showCharacterDetails(parseInt(charId), imgIndex);
  } else if (detailsPopup && detailsPopup.style.display === 'block') {
    // URLにIDがなく、詳細画面が開いている場合は閉じる
    closeDetailsPopup(true); // trueを渡してpushStateをスキップ
  }
});

// ハンバーガーメニューのタッチスクロール制御
function setupHamburgerTouchControl() {
  const drawer = document.getElementById('hamburgerDrawer');
  if (!drawer) return;

  // タッチイベントで背景スクロールを防ぐ
  drawer.addEventListener('touchstart', function(e) {
    // ドロワーが開いている時のみ制御
    if (drawer.classList.contains('open')) {
      // タッチ開始位置を記録
      this.startY = e.touches[0].clientY;
      this.startX = e.touches[0].clientX;
    }
  }, { passive: false });

  drawer.addEventListener('touchmove', function(e) {
    // ドロワーが開いている時のみ制御
    if (!drawer.classList.contains('open')) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - this.startY;
    const deltaX = currentX - this.startX;

    // 横スワイプの場合は背景スクロールを防ぐ
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      return;
    }

    // ドロワー内のスクロール位置を確認
    const scrollTop = drawer.scrollTop;
    const scrollHeight = drawer.scrollHeight;
    const clientHeight = drawer.clientHeight;

    // 上端での上スワイプまたは下端での下スワイプの場合は背景スクロールを防ぐ
    if ((scrollTop === 0 && deltaY > 0) || 
        (scrollTop + clientHeight >= scrollHeight && deltaY < 0)) {
      e.preventDefault();
    }
  }, { passive: false });

  drawer.addEventListener('touchend', function() {
    // タッチ終了時にスタート位置をリセット
    this.startY = null;
    this.startX = null;
  }, { passive: true });
}

// 画面左端からのスワイプでハンバーガーメニューを開く
let edgeSwipeStartX = null;
let edgeSwipeStartY = null;
let edgeSwipeStartTime = null;
const EDGE_ZONE_WIDTH = 40; // 左端から20pxの領域
const SWIPE_THRESHOLD = 50; // 50px以上スワイプで開く
const SWIPE_MAX_TIME = 300; // 300ms以内のスワイプ

document.addEventListener('touchstart', function(e) {
  const touch = e.touches[0];
  // 左端からのタッチかチェック
  if (touch.clientX <= EDGE_ZONE_WIDTH) {
    edgeSwipeStartX = touch.clientX;
    edgeSwipeStartY = touch.clientY;
    edgeSwipeStartTime = Date.now();
  }
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (edgeSwipeStartX === null) return;
  
  const touch = e.touches[0];
  const deltaX = touch.clientX - edgeSwipeStartX;
  const deltaY = touch.clientY - edgeSwipeStartY;
  const deltaTime = Date.now() - edgeSwipeStartTime;
  
  // 右方向へのスワイプで、横移動が縦移動より大きい場合
  if (deltaX > SWIPE_THRESHOLD && 
      Math.abs(deltaX) > Math.abs(deltaY) && 
      deltaTime < SWIPE_MAX_TIME) {
    
    // ハンバーガーメニューが閉じている場合のみ開く
    const drawer = document.getElementById('hamburgerDrawer');
    if (drawer && !drawer.classList.contains('open')) {
      toggleHamburgerMenu();
    }
    
    // スワイプ検出をリセット
    edgeSwipeStartX = null;
    edgeSwipeStartY = null;
    edgeSwipeStartTime = null;
  }
}, { passive: true });

document.addEventListener('touchend', function() {
  // タッチ終了時にスワイプ検出をリセット
  edgeSwipeStartX = null;
  edgeSwipeStartY = null;
  edgeSwipeStartTime = null;
}, { passive: true });

/**
 * キャラクターの詳細を表示する
 * @param {number} charId - 表示するキャラクターのID
 * @param {number} [imgIndex=0] - 表示する画像・名前・説明のインデックス
 */
function showCharacterDetails(charId, imgIndex = 0) {
  const character = characters.find(c => c.id === charId);
  const detailsContainer = document.getElementById('characterDetails');
  const detailsPopup = document.getElementById('detailsPopup');

  if (character) {
    detailsContainer.dataset.charId = charId;
    detailsContainer.dataset.imgIndex = imgIndex;

    const imgArr = Array.isArray(character.img) ? character.img : [character.img];
    const nameArr = Array.isArray(character.name) ? character.name : [character.name];
    const nameEnArr = Array.isArray(character.name_en) ? character.name_en : [character.name_en];
    const descArr = Array.isArray(character.description) ? character.description : [character.description];

    // fightingStyle/attributeもname/imgと同じように配列の配列対応
    const fightingStyleArr = Array.isArray(character.fightingStyle && character.fightingStyle[0]) && Array.isArray(character.fightingStyle[0])
      ? character.fightingStyle
      : [character.fightingStyle];
    const attributeArr = Array.isArray(character.attribute) && Array.isArray(character.attribute[0])
      ? character.attribute
      : [character.attribute];

    // 画像位置情報も配列対応
    const imageZoomArr = Array.isArray(character.imageThumbPosition) ? character.imageThumbPosition : (character.imageThumbPosition ? [character.imageThumbPosition] : []);
    const imgThumbsizeArr = Array.isArray(character.imgThumbsize) ? character.imgThumbsize : (character.imgThumbsize ? [character.imgThumbsize] : []);

    // サムネイルHTML
    let thumbnailsHtml = '';
    if (imgArr.length > 1) {
      thumbnailsHtml = `
        <div class="thumbnail-list">
          ${imgArr.map((img, idx) => {
            // サムネイル用object-position
            let objectPosition = isMobileWidth()
              ? (imageZoomArr[idx] || imageZoomArr[0] || 'center')
              : (imageZoomArr[idx] || imageZoomArr[0]  || 'center');
            let objectSize = isMobileWidth()
              ? (imgThumbsizeArr[idx] || imgThumbsizeArr[0] || '100%')
              : (imgThumbsizeArr[idx] || imgThumbsizeArr[0]  || '100%');
            return `
              <div class="thumbnail-circle${idx === imgIndex ? ' selected' : ''}" onclick="showCharacterDetails(${charId}, ${idx})">
                <img src="img/${img}" alt="thumb" onerror="this.src='img/placeholder.png';" style="width:${objectSize};object-position:${objectPosition};">
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 選択中の画像・名前・説明・fightingStyle・attribute
    const img = imgArr[imgIndex] || imgArr[0];
    const name = nameArr[imgIndex] || nameArr[0];
    const nameEn = nameEnArr[imgIndex] || nameEnArr[0];
    const desc = descArr[imgIndex] || descArr[0];
    const fightingStyle = fightingStyleArr[imgIndex] || fightingStyleArr[0] || [];
    const attribute = attributeArr[imgIndex] || attributeArr[0] || [];

    // ▼キャラ名＋コピーボタン＋お気に入りボタン横並び
    const displayName = currentDisplayLanguage === 'en' && nameEn ? nameEn : name;
    const isFavorite = favorites.includes(charId);
    const titleRowHtml = `
      <div class="character-title-row">
        <h1 style="margin:0;">${displayName}</h1>
        <div class="title-buttons">
          <button id="detailFavoriteBtn" onclick="toggleFavorite(${charId})" 
                  class="buttonCopyIcon ${isFavorite ? 'favorited' : ''}" 
                  title="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="${isFavorite ? '#ff6b00' : 'none'}" stroke="${isFavorite ? '#ff6b00' : '#4a88a2'}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button onclick="copyCharacterUrl()" class="buttonCopyIcon" title="URLをコピー">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" fill="none"/>
              <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // タブのHTML構築
    const hasWeapons = character.weapon && Array.isArray(character.weapon) && character.weapon.length > 0;
    const tabsHtml = `
      <div class="character-tabs">
        <div class="tab-nav">
          <button class="tab-nav-item active" onclick="switchTab('basic', this)">基本情報</button>
          ${hasWeapons ? '<button class="tab-nav-item" onclick="switchTab(\'weapon\', this)">武器情報</button>' : ''}
        </div>
        <div id="basic-tab" class="tab-content active">
          <p><strong>${getTranslatedLabel('description')}:</strong> ${desc || '概要なし'}</p>
          <p><strong>${getTranslatedLabel('world')}:</strong> ${character.world || '不明'}</p>
          <p><strong>${getTranslatedLabel('race')}:</strong> ${Array.isArray(character.race) ? character.race.map(r => getDisplayTerm('race', r, currentDisplayLanguage)).join(', ') : (character.race ? getDisplayTerm('race', character.race, currentDisplayLanguage) : '不明')}</p>
          <p><strong>${getTranslatedLabel('fightingStyle')}:</strong> ${Array.isArray(fightingStyle) ? fightingStyle.map(s => getDisplayTerm('fightingStyle', s, currentDisplayLanguage)).join(', ') : (fightingStyle ? getDisplayTerm('fightingStyle', fightingStyle, currentDisplayLanguage) : '不明')}</p>
          <p><strong>${getTranslatedLabel('attribute')}:</strong> ${Array.isArray(attribute) ? attribute.map(a => getDisplayTerm('attribute', a, currentDisplayLanguage)).join(', ') : (attribute ? getDisplayTerm('attribute', attribute, currentDisplayLanguage) : '不明')}</p>
          <p><strong>${getTranslatedLabel('height')}:</strong> ${character.height ? character.height + ' cm' : '不明'}</p>
          <p><strong>${getTranslatedLabel('age')}:</strong> ${character.age || '不明'}</p>
          <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${convertYearToCalendar(character.birthday.year)}${character.birthday.month !== null ? character.birthday.month + getTranslatedLabel('month') : '不明'}${character.birthday.day !== null ? character.birthday.day + getTranslatedLabel('day') : (character.birthday.month !== null ? '不明' : '')}` : 'N/A'}</p>
          <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || '不明'}</p>
          <p><strong>${getTranslatedLabel('group')}:</strong> ${Array.isArray(character.group) ? character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') : (character.group ? getDisplayTerm('group', character.group, currentDisplayLanguage) : '無所属')}</p>
        </div>
        ${hasWeapons ? `
        <div id="weapon-tab" class="tab-content">
          ${generateWeaponContent(character.weapon, character.id)}
        </div>
        ` : ''}
      </div>
    `;

    // PC版とモバイル版でレイアウトを分岐
    const isPC = window.innerWidth >= 1024;
    
    if (isPC) {
      // PC版レイアウト
      detailsContainer.innerHTML = `
        <span class="close" onclick="closeDetailsPopup()" title="閉じる">&times;</span>
        <div class="character-detail-content">
          <div class="detail-left-section">
            <img src="img/${img}" alt="${name}の画像" onerror="this.src='img/placeholder.png';" class="detail-image">
            ${thumbnailsHtml}
          </div>
          <div class="detail-right-top">
            ${titleRowHtml}
            ${hasWeapons ? `
            <div class="character-tabs">
              <div class="tab-nav">
                <button class="tab-nav-item active" onclick="switchTab('basic', this)">基本情報</button>
                <button class="tab-nav-item" onclick="switchTab('weapon', this)">武器情報</button>
              </div>
            </div>
            ` : ''}
          </div>
          <div class="detail-right-bottom">
            <div id="basic-tab" class="tab-content active">
              <p><strong>${getTranslatedLabel('description')}:</strong> ${desc || 'N/A'}</p>
              <p><strong>${getTranslatedLabel('world')}:</strong> ${character.world || 'N/A'}</p>
              <p><strong>${getTranslatedLabel('race')}:</strong> ${Array.isArray(character.race) ? character.race.map(r => getDisplayTerm('race', r, currentDisplayLanguage)).join(', ') : (character.race ? getDisplayTerm('race', character.race, currentDisplayLanguage) : 'N/A')}</p>
              <p><strong>${getTranslatedLabel('fightingStyle')}:</strong> ${Array.isArray(fightingStyle) ? fightingStyle.map(s => getDisplayTerm('fightingStyle', s, currentDisplayLanguage)).join(', ') : (fightingStyle ? getDisplayTerm('fightingStyle', fightingStyle, currentDisplayLanguage) : 'N/A')}</p>
              <p><strong>${getTranslatedLabel('attribute')}:</strong> ${Array.isArray(attribute) ? attribute.map(a => getDisplayTerm('attribute', a, currentDisplayLanguage)).join(', ') : (attribute ? getDisplayTerm('attribute', attribute, currentDisplayLanguage) : 'N/A')}</p>
              <p><strong>${getTranslatedLabel('height')}:</strong> ${character.height ? character.height + ' cm' : '不明'}</p>
              <p><strong>${getTranslatedLabel('age')}:</strong> ${character.age || '不明'}</p>
              <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${convertYearToCalendar(character.birthday.year)}${character.birthday.month !== null ? character.birthday.month + getTranslatedLabel('month') : '不明'}${character.birthday.day !== null ? character.birthday.day + getTranslatedLabel('day') : (character.birthday.month !== null ? '不明' : '')}` : 'N/A'}</p>
              <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || '不明'}</p>
              <p><strong>${getTranslatedLabel('group')}:</strong> ${Array.isArray(character.group) ? character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') : (character.group ? getDisplayTerm('group', character.group, currentDisplayLanguage) : 'N/A')}</p>
            </div>
            ${hasWeapons ? `
            <div id="weapon-tab" class="tab-content">
              ${generateWeaponContent(character.weapon, character.id)}
            </div>
            ` : ''}
            <div class="memo-section">
              <p>
                <strong>${getTranslatedLabel('memo')}:</strong>
                <button onclick="showNoteEditor(${charId})" class="memo-edit-btn" title="メモを編集">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </p>
              <div id="noteDisplay" class="note-display"></div>
            </div>
            <div class="character-tags">
              <h4>カスタムタグ</h4>
              <div id="characterTagsDisplay">
                <!-- タグがここに表示されます -->
              </div>
              <div class="character-tag-manage">
                <button onclick="showTagSelectionPopup(${charId})" class="add-tag-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  タグを追加
                </button>
              </div>
            </div>
            <div id="relatedCharactersSection" class="related-characters-section">
              <h3>関連キャラクター</h3>
              <div id="relatedCharacters" class="card-container">
                <!-- 関連キャラクターのカードがここに表示されます -->
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // モバイル版レイアウト（従来通り）
      detailsContainer.innerHTML = `
        <span class="close" onclick="closeDetailsPopup()" title="閉じる">&times;</span>
        <div class="character-detail-content">
          <img src="img/${img}" alt="${name}の画像" onerror="this.src='img/placeholder.png';" class="detail-image">
          ${thumbnailsHtml}
          ${titleRowHtml}
          ${tabsHtml}
          <div class="memo-section">
            <p>
              <strong>${getTranslatedLabel('memo')}:</strong>
              <button onclick="showNoteEditor(${charId})" class="memo-edit-btn" title="メモを編集">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </p>
            <div id="noteDisplay" class="note-display"></div>
          </div>
          <div class="character-tags">
            <h4>カスタムタグ</h4>
            <div id="characterTagsDisplay">
              <!-- タグがここに表示されます -->
            </div>
            <div class="character-tag-manage">
              <button onclick="showTagSelectionPopup(${charId})" class="add-tag-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                タグを追加
              </button>
            </div>
          </div>
        </div>
      `;
    }
    
    // データセット属性を設定
    detailsContainer.dataset.charId = charId;
    detailsContainer.dataset.imgIndex = imgIndex;
    
    // メモ表示を更新
    updateNoteDisplay(charId);
    
    // カスタムタグ表示を更新
    updateCharacterTagDisplay(charId);
    
    // DOM更新完了後に関連キャラクターを表示
    setTimeout(() => {
      renderRelatedCharacters(character.group, character.id, false); // ←showAll=falseで初回5件
      renderRelationCharacters(character.id);
    }, 0);
    
    detailsPopup.style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
    updateHamburgerMenuVisibility();
    
    // URLにキャラクターIDを追加
    const newUrl = `?id=${charId}${imgIndex > 0 ? `&img=${imgIndex}` : ''}`;
    const currentUrl = window.location.search;
    
    // 既に詳細画面が開いている場合はreplaceState、新規の場合はpushState
    if (currentUrl.includes('id=')) {
      window.history.replaceState({characterId: charId, imgIndex, tab: 'basic'}, '', newUrl);
    } else {
      window.history.pushState({characterId: charId, imgIndex, tab: 'basic'}, '', newUrl);
    }
  }
}

/**
 * キャラクターの詳細を表示し、武器タブに切り替える
 * @param {number} charId - 表示するキャラクターのID
 */
function showCharacterDetailsAndWeapon(charId) {
  // まず詳細画面を表示
  showCharacterDetails(charId, 0);
  
  // DOMが更新された後に武器タブに切り替えとURL更新
  setTimeout(() => {
    const weaponTabButton = document.querySelector('.tab-nav-item[onclick*="weapon"]');
    if (weaponTabButton) {
      switchTab('weapon', weaponTabButton);
      // 武器詳細URLに更新
      updateWeaponUrl(charId, 0);
    }
  }, 100);
}

/**
 * キャラクター詳細画面を閉じる
 */
function closeDetailsPopup(skipHistoryUpdate = false) {
  document.getElementById('detailsPopup').style.display = 'none';
  document.body.classList.remove('modal-open'); // 背景スクロール防止解除
  updateHamburgerMenuVisibility(); // ▼詳細閉じたらメニュー再表示
  
  // URLからパラメータを削除（戻るボタンから呼ばれた場合はスキップ）
  if (!skipHistoryUpdate) {
    window.history.pushState({}, '', window.location.pathname);
  }
}

/**
 * 関連キャラクターのカードをレンダリングする
 * @param {string[]} groups - 関連キャラクターを検索するグループの配列
 * @param {number} currentId - 現在表示中のキャラクターのID
 */
function renderRelatedCharacters(groups, currentId, showAll = false) {
  console.log('renderRelatedCharacters 呼び出し:', { groups, currentId, showAll });
  console.log('画面幅:', window.innerWidth);
  console.log('PC版レイアウト:', window.innerWidth > 768);
  
  let relatedContainer = document.getElementById('relatedCharacters');
  console.log('relatedContainer (ID検索):', relatedContainer);
  
  if (!relatedContainer) {
    console.error('relatedCharacters 要素が見つかりません - 代替検索を実行');
    
    // 代替1: relatedCharactersSection内を探してみる
    const section = document.getElementById('relatedCharactersSection');
    console.log('relatedCharactersSection:', section);
    if (section) {
      const altContainer = section.querySelector('.card-container');
      console.log('relatedCharactersSection内の.card-container:', altContainer);
      if (altContainer) {
        altContainer.id = 'relatedCharacters'; // IDを設定
        console.log('relatedCharactersSection内の要素にIDを設定しました');
        relatedContainer = altContainer;
      }
    }
    
    // 代替2: detail-right-bottom内を探してみる
    if (!relatedContainer) {
      const rightBottom = document.querySelector('.detail-right-bottom');
      console.log('detail-right-bottom:', rightBottom);
      if (rightBottom) {
        const altContainer2 = rightBottom.querySelector('#relatedCharacters, .card-container:last-child');
        console.log('detail-right-bottom内の関連要素:', altContainer2);
        if (altContainer2 && !altContainer2.id) {
          altContainer2.id = 'relatedCharacters';
          console.log('detail-right-bottom内の要素にIDを設定しました');
          relatedContainer = altContainer2;
        }
      }
    }
    
    // 代替3: popup-content内の静的な要素を探す
    if (!relatedContainer) {
      const popupContent = document.querySelector('.popup-content');
      if (popupContent) {
        const staticContainer = popupContent.querySelector('#relatedCharacters');
        console.log('静的な#relatedCharacters:', staticContainer);
        if (staticContainer) {
          relatedContainer = staticContainer;
        }
      }
    }
    
    if (!relatedContainer) {
      console.error('全ての代替検索でも relatedCharacters 要素が見つかりませんでした');
      return;
    }
  }
  
  // 現在のキャラクターと同じグループに属するキャラクターをフィルタリング
  let related = characters.filter(c => 
    c.id !== currentId &&
    c.group.some(g => {
      if (typeof g !== 'string') return false; // 文字列でない場合は無視
      const canonicalGroups = groups.map(gName => {
        if (typeof gName !== 'string') return '';
        const gNameStr = String(gName || '');
        return languageMaps.group[gNameStr.toLowerCase()] || gNameStr.toLowerCase();
      });
      const characterGroups = Array.isArray(c.group) ? c.group.map(cName => {
        if (typeof cName !== 'string') return '';
        const cNameStr = String(cName || '');
        return languageMaps.group[cNameStr.toLowerCase()] || cNameStr.toLowerCase();
      }) : [];
      return canonicalGroups.some(cg => characterGroups.includes(cg));
    })
  );

  // 初回は5件、showAll=trueなら全件
  let initialCount = 5;
  let showMore = false;
  if (!showAll && related.length > initialCount) {
    showMore = true;
    related = related.slice(0, initialCount);
  }

  if (related.length > 0) {
    console.log(`関連キャラクター ${related.length} 件を表示します:`, related.map(c => c.name));
    relatedContainer.innerHTML = related.map(renderCharacter).join('');
    console.log('関連キャラクターの表示が完了しました');
    if (showMore) {
      // 「更に表示」ボタン追加
      const btn = document.createElement('button');
      btn.className = 'buttonRound';
      btn.textContent = '更に表示';
      btn.style.display = 'block';
      btn.style.margin = '18px auto 0 auto';
      btn.onclick = function() {
        renderRelatedCharacters(groups, currentId, true);
      };
      relatedContainer.appendChild(btn);
    }
  } else {
    console.log('関連キャラクターが見つかりませんでした。グループ:', groups);
    relatedContainer.innerHTML = '<p>関連キャラクターは見つかりませんでした。</p>';
  }
}

/**
 * 関係関連キャラクターのカードをレンダリングする
 * @param {number} currentId - 現在表示中のキャラクターのID
 */
function renderRelationCharacters(currentId) {
  // relationGroupsは[[2,13],[19,20],[16,17,18]]のような配列
  // 各グループ内にcurrentIdが含まれていれば、そのグループの他のキャラを表示
  const relationContainerId = 'relationCharacters';
  let relationContainer = document.getElementById(relationContainerId);
  
  if (!relationContainer) {
    // PC版では.detail-right-bottom内に、モバイル版ではcharacterDetailsの直後に挿入
    const isPC = window.innerWidth >= 1024;
    const details = document.getElementById('characterDetails');
    relationContainer = document.createElement('div');
    relationContainer.id = relationContainerId;
    relationContainer.style.marginTop = '30px';
    
    if (isPC) {
      // PC版: .detail-right-bottom内の最後に追加
      const rightBottom = details.querySelector('.detail-right-bottom');
      if (rightBottom) {
        rightBottom.appendChild(relationContainer);
      } else {
        // フォールバック: characterDetailsの直後に挿入
        details.parentNode.insertBefore(relationContainer, details.nextSibling);
      }
    } else {
      // モバイル版: characterDetailsの直後に挿入
      details.parentNode.insertBefore(relationContainer, details.nextSibling);
    }
  }
  relationContainer.innerHTML = ''; // クリア

  let found = false;
  relationGroups.forEach((group, idx) => {
    if (group.includes(currentId)) {
      // このグループの他のキャラを取得
      const others = group.filter(id => id !== currentId);
      if (others.length > 0) {
        found = true;
        // グループ見出し
        const groupTitle = document.createElement('h3');
        groupTitle.textContent = `関係関連`;
        relationContainer.appendChild(groupTitle);
        // カードリスト
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-container';
        cardDiv.innerHTML = others.map(id => {
          const char = characters.find(c => c.id === id);
          return char ? renderCharacter(char) : '';
        }).join('');
        relationContainer.appendChild(cardDiv);
      }
    }
  });
  if (!found) {
    relationContainer.innerHTML = '<p style="text-align:center;color:#888;">関係関連キャラクターは見つかりませんでした。</p>';
  }
}

// ▼ハンバーガーメニュー制御
function toggleHamburgerMenu() {
  const drawer = document.getElementById('hamburgerDrawer');
  if (drawer) {
    const isOpen = drawer.classList.toggle('open');
    if (isOpen) {
      // 背景スクロール防止を追加
      document.body.classList.add('hamburger-open');
      // 背景クリックで閉じる
      setTimeout(() => {
        document.addEventListener('click', closeHamburgerOnOutside, { capture: true });
      }, 0);
    } else {
      // 背景スクロール防止を解除
      document.body.classList.remove('hamburger-open');
      document.removeEventListener('click', closeHamburgerOnOutside, true);
    }
  }
}
function closeHamburgerOnOutside(e) {
  const drawer = document.getElementById('hamburgerDrawer');
  const btn = document.getElementById('hamburgerBtn');
  if (!drawer.contains(e.target) && (!btn || !btn.contains(e.target))) {
    drawer.classList.remove('open');
    // 背景スクロール防止を解除
    document.body.classList.remove('hamburger-open');
    document.removeEventListener('click', closeHamburgerOnOutside, true);
  }
}
// キャラ詳細表示時はハンバーガーメニューを非表示
function updateHamburgerMenuVisibility() {
  const detailsPopup = document.getElementById('detailsPopup');
  const menu = document.getElementById('hamburgerMenu');
  if (!detailsPopup || !menu) return;
  if (detailsPopup.style.display === 'block') {
    menu.style.display = 'none';
  } else {
    menu.style.display = '';
  }
}

// 画面幅がモバイル（900px以下）かどうかを判定
function isMobileWidth() {
  return window.innerWidth <= 900;
}

/**
 * 文字列をひらがなに変換する（カタカナ→ひらがな、全角→半角、英数字は小文字化）
 * @param {string} str
 * @returns {string}
 */
function toHiragana(str) {
  if (!str) return '';
  // カタカナ→ひらがな
  str = str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
  // 全角英数字→半角
  str = str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s =>
    String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  );
  // 小文字化
  return str.toLowerCase();
}

/**
 * 統合予測候補を表示する（名前・武器・タグ）
 */
let suggestionActiveIndex = -1;
function showNameSuggestions() {
  const input = document.getElementById('searchName');
  const suggestionsDiv = document.getElementById('nameSuggestions');
  const keywordRaw = input.value.trim();
  const keyword = keywordRaw.toLowerCase();
  const keywordHira = toHiragana(keywordRaw);

  if (!keyword) {
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.innerHTML = '';
    suggestionActiveIndex = -1;
    return;
  }

  // 候補リスト作成
  let candidates = [];
  
  // 1. キャラクター名候補
  characters.forEach(c => {
    // name, name_en, name_Kana対応
    const nameArr = Array.isArray(c.name) ? c.name : [c.name];
    const nameEnArr = Array.isArray(c.name_en) ? c.name_en : [c.name_en];
    const nameKana = c.name_Kana || '';
    // 候補名（日本語・英語・カナ）をすべてひらがな化・小文字化して比較
    let match = false;
    for (const n of nameArr) {
      if ((n || '').toLowerCase().includes(keyword) || toHiragana(n || '').includes(keywordHira)) match = true;
    }
    for (const n of nameEnArr) {
      if ((n || '').toLowerCase().includes(keyword) || toHiragana(n || '').includes(keywordHira)) match = true;
    }
    if (nameKana && (nameKana.includes(keywordHira) || nameKana.includes(keyword))) match = true;
    if (match) {
      // 表示用候補（日本語名＋英語名）
      candidates.push({
        type: 'character',
        id: c.id,
        display: nameArr[0] || '',
        searchValue: nameArr[0] || '',
        subtitle: `${nameEnArr[0] ? ' / ' + nameEnArr[0] : ''}${nameKana ? ' / ' + nameKana : ''}`,
        matchText: keyword,
        fullText: nameArr[0] || ''
      });
    }
  });
  
  // 2. 武器候補（設定が有効な場合）
  if (weaponSearchEnabled) {
    characters.forEach(c => {
      if (c.weapon && Array.isArray(c.weapon)) {
        c.weapon.forEach(weaponObj => {
          if (weaponObj && weaponObj.name) {
            const weaponNames = Array.isArray(weaponObj.name) ? weaponObj.name : [weaponObj.name];
            // 武器名の各要素（日本語名、英語名、ひらがな）をチェック
            const weaponNameJa = weaponNames[0] || '';       // 日本語名
            const weaponNameEn = weaponNames[1] || '';       // 英語名
            const weaponNameHira = weaponNames[2] || '';     // ひらがな
            
            let weaponMatch = false;
            let matchedName = '';
            
            // 日本語名での一致
            if ((weaponNameJa.toLowerCase().includes(keyword) || 
                 toHiragana(weaponNameJa).includes(keywordHira))) {
              weaponMatch = true;
              matchedName = weaponNameJa;
            }
            // 英語名での一致
            else if ((weaponNameEn.toLowerCase().includes(keyword) || 
                      toHiragana(weaponNameEn).includes(keywordHira))) {
              weaponMatch = true;
              matchedName = weaponNameJa; // 表示は日本語名
            }
            // ひらがな名での一致
            else if (weaponNameHira && (weaponNameHira.includes(keywordHira) || 
                                       weaponNameHira.includes(keyword))) {
              weaponMatch = true;
              matchedName = weaponNameJa; // 表示は日本語名
            }
            
            if (weaponMatch) {
              const charNames = Array.isArray(c.name) ? c.name : [c.name];
              candidates.push({
                type: 'weapon',
                id: `weapon_${c.id}_${matchedName}`,
                display: `武器：${matchedName}`,
                searchValue: matchedName,
                subtitle: ` (所有者: ${charNames[0] || ''})`,
                matchText: keyword,
                fullText: matchedName
              });
            }
          }
        });
      }
    });
  }
  
  // 3. カスタムタグ候補（設定が有効な場合）
  if (customTagSearchEnabled && customTags) {
    Object.values(customTags).forEach(tag => {
      if (tag && tag.name && 
          ((tag.name || '').toLowerCase().includes(keyword) || 
           toHiragana(tag.name || '').includes(keywordHira))) {
        candidates.push({
          type: 'tag',
          id: `tag_${tag.id}`,
          display: `カスタムタグ：${tag.name}`,
          searchValue: tag.name,
          subtitle: '',
          matchText: keyword,
          fullText: tag.name
        });
      }
    });
  }

  /**
   * マッチした部分を強調表示する（ひらがな対応）
   */
  function highlightMatch(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    // 通常のマッチング（大文字小文字無視）
    const regex1 = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let result = text.replace(regex1, '<span style="background-color: #ffeb3b; color: #000; font-weight: bold;">$1</span>');
    
    // ひらがな変換でのマッチング
    const searchHira = toHiragana(searchTerm);
    if (searchHira !== searchTerm) {
      // 元のテキストをひらがな化してマッチ位置を特定
      const textHira = toHiragana(text);
      const matchIndex = textHira.indexOf(searchHira);
      if (matchIndex !== -1 && !result.includes('<span')) {
        // ひらがな変換でマッチした場合、元の文字列の対応部分をハイライト
        const matchLength = searchHira.length;
        const before = text.substring(0, matchIndex);
        const matched = text.substring(matchIndex, matchIndex + matchLength);
        const after = text.substring(matchIndex + matchLength);
        result = before + `<span style="background-color: #ffeb3b; color: #000; font-weight: bold;">${matched}</span>` + after;
      }
    }
    
    return result;
  }

  // 重複除去（同じ検索値を持つものを除去）
  const seen = new Set();
  candidates = candidates.filter(c => {
    const key = `${c.type}_${c.searchValue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 最大15件まで（種類別に制限）
  candidates = candidates.slice(0, 15);

  if (candidates.length === 0) {
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.innerHTML = '';
    suggestionActiveIndex = -1;
    return;
  }

  // 候補リスト描画
  suggestionsDiv.innerHTML = candidates.map((c, idx) => {
    // 表示テキストを強調表示処理（設定が有効な場合のみ）
    let displayText = c.display;
    if (highlightEnabled && c.matchText && c.fullText) {
      // 武器やタグの場合、プレフィックス部分と名前部分を分ける
      if (c.type === 'weapon') {
        displayText = `武器：${highlightMatch(c.fullText, c.matchText)}`;
      } else if (c.type === 'tag') {
        displayText = `カスタムタグ：${highlightMatch(c.fullText, c.matchText)}`;
      } else {
        displayText = highlightMatch(c.fullText, c.matchText);
      }
    }
    
    return `<div class="suggestion-item${idx === suggestionActiveIndex ? ' active' : ''}" 
      onclick="selectSuggestion('${c.type}', '${c.searchValue.replace(/'/g, "\\'")}', ${c.type === 'character' ? c.id : 'null'})">${displayText}<span style="color:#888;font-size:0.9em;">${c.subtitle}</span></div>`;
  }).join('');
  suggestionsDiv.style.display = 'block';
}

/**
 * 統合予測候補クリック時の処理
 */
function selectSuggestion(type, searchValue, charId = null) {
  const searchInput = document.getElementById('searchName');
  searchInput.value = searchValue;
  document.getElementById('nameSuggestions').style.display = 'none';
  suggestionActiveIndex = -1;
  filterCharacters();
}

/**
 * 旧関数（互換性のため残す）
 */
function selectNameSuggestion(charId) {
  const char = characters.find(c => c.id === charId);
  if (!char) return;
  // 入力欄に日本語名をセット
  const nameArr = Array.isArray(char.name) ? char.name : [char.name];
  selectSuggestion('character', nameArr[0] || '', charId);
}

/**
 * 予測候補のキーボード操作
 */
function handleSuggestionKey(e) {
  const suggestionsDiv = document.getElementById('nameSuggestions');
  const items = suggestionsDiv.querySelectorAll('.suggestion-item');
  
  if (e.key === 'ArrowDown' && items.length > 0) {
    e.preventDefault();
    suggestionActiveIndex = (suggestionActiveIndex + 1) % items.length;
    updateSuggestionActive();
  } else if (e.key === 'ArrowUp' && items.length > 0) {
    e.preventDefault();
    suggestionActiveIndex = (suggestionActiveIndex - 1 + items.length) % items.length;
    updateSuggestionActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (suggestionActiveIndex >= 0 && suggestionActiveIndex < items.length) {
      // 選択された候補をクリック
      items[suggestionActiveIndex].click();
    } else {
      // 候補が選択されていない場合、直接検索実行
      document.getElementById('nameSuggestions').style.display = 'none';
      suggestionActiveIndex = -1;
      filterCharacters();
    }
  } else if (e.key === 'Escape') {
    // ESCキーで候補を閉じる
    document.getElementById('nameSuggestions').style.display = 'none';
    suggestionActiveIndex = -1;
  }
}

/**
 * 予測候補のアクティブ状態を更新
 */
function updateSuggestionActive() {
  const suggestionsDiv = document.getElementById('nameSuggestions');
  const items = suggestionsDiv.querySelectorAll('.suggestion-item');
  items.forEach((item, idx) => {
    if (idx === suggestionActiveIndex) item.classList.add('active');
    else item.classList.remove('active');
  });
}

// 検索ボックスのクリアボタン表示制御
const searchInput = document.getElementById('searchName');
const clearBtn = document.getElementById('clearSearchBtn');
if (searchInput && clearBtn) {
  // inputイベント: クリアボタン表示制御と予測候補表示
  searchInput.addEventListener('input', function() {
    clearBtn.style.display = this.value ? 'flex' : 'none';
    showNameSuggestions(); // 予測候補表示
  }, { passive: true });
  
  // 初期化時も
  clearBtn.style.display = searchInput.value ? 'flex' : 'none';

  // ▼追加: フォーカス時にキーワードがあれば予測候補を再表示
  searchInput.addEventListener('focus', function() {
    if (this.value && this.value.trim()) {
      showNameSuggestions();
    }
  }, { passive: true });
  
  // キーボード操作のイベントリスナーを追加 (preventDefault使用のためpassive不可)
  searchInput.addEventListener('keydown', handleSuggestionKey);
}

/**
 * 検索ボックスをクリアする
 */
function clearSearchInput() {
  const input = document.getElementById('searchName');
  input.value = '';
  showNameSuggestions();
  filterCharacters();
  // フォーカスを戻す
  input.focus();
  // ボタン非表示
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
}

// 入力欄外クリックで候補を閉じる
document.addEventListener('click', function(e) {
  const input = document.getElementById('searchName');
  const suggestionsDiv = document.getElementById('nameSuggestions');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (!input.contains(e.target) && !suggestionsDiv.contains(e.target) && (!clearBtn || !clearBtn.contains(e.target))) {
    suggestionsDiv.style.display = 'none';
    suggestionActiveIndex = -1;
  }
}, { passive: true });

// ウィンドウリサイズ時にカードを再描画
window.addEventListener('resize', () => {
  filterCharacters();
}, { passive: true });

// 画像の右クリック・長押し禁止
function preventImageContextMenuAndDrag() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart', e => e.preventDefault());
    // Safari長押し防止
    img.addEventListener('touchstart', function(e) {
      if (e.touches && e.touches.length === 1) {
        e.preventDefault();
      }
    }, {passive: false});
  });
}

window.filterCharacters = filterCharacters;
window.toggleFilterPopup = toggleFilterPopup;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.showCharacterDetails = showCharacterDetails;
window.showCharacterDetailsAndWeapon = showCharacterDetailsAndWeapon;
window.closeDetailsPopup = closeDetailsPopup;
window.toggleLanguage = toggleLanguage; // 新しい言語切り替え関数を公開
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.toggleTheme = toggleTheme;
window.selectSuggestion = selectSuggestion; // 統合予測候補選択関数
window.selectNameSuggestion = selectNameSuggestion; // 互換性のため残す

// カスタムタグ関連の関数も公開
window.showTagSelectionPopup = showTagSelectionPopup;
window.closeTagSelectionPopup = closeTagSelectionPopup;
window.showCustomTagsFromMenu = showCustomTagsFromMenu;

// メモ・お気に入り関連の関数も公開
window.toggleFavorite = toggleFavorite;
window.showNoteEditor = showNoteEditor;

// 使い方ガイド関連の関数も公開
window.showUsageGuide = showUsageGuide;
window.closeUsageGuide = closeUsageGuide;

/**
 * キャラ詳細URLをクリップボードにコピーし、ミニポップアップで通知
 */
function copyCharacterUrl() {
  const charId = document.getElementById('characterDetails').dataset.charId;
  const imgIndex = document.getElementById('characterDetails').dataset.imgIndex || 0;
  if (!charId) return;
  let url = `${location.origin}${location.pathname}?id=${charId}`;
  // 画像インデックスが0以外ならパラメータを付与
  if (parseInt(imgIndex) > 0) {
    url += `&img=${imgIndex}`;
  }
  navigator.clipboard.writeText(url).then(() => {
    addNotification('URLをコピーしました！', 'success');
  });
}

/*
 * 旧コピー通知ミニポップアップ関数（現在はaddNotificationを使用）
 * 互換性のため残す
 */
function showCopyPopup(msg) {
  // addNotificationにリダイレクト
  addNotification(msg, 'success');
}

// カードホバー時
window.onCardHover = function(cardEl, charId) {
  if (miniPopupTimer) clearTimeout(miniPopupTimer);
  miniPopupTimer = setTimeout(() => {
    const char = characters.find(c => c.id === charId);
    if (char) showMiniPopup(cardEl, char);
  }, 600); // 600msホバーで表示
};
// カードから外れた時
window.onCardLeave = function() {
  hideMiniPopup();
};

// ===============================================
// お気に入り機能
// ===============================================

/**
 * お気に入りの状態を切り替える
 * @param {number} charId - キャラクターID
 */
async function toggleFavorite(charId) {
  const index = favorites.indexOf(charId);
  if (index === -1) {
    favorites.push(charId);
  } else {
    favorites.splice(index, 1);
  }
  
  try {
    // IndexedDBに保存
    await characterDB.syncFavorites(favorites);
  } catch (error) {
    console.error('お気に入り保存エラー:', error);
  }
  
  updateFavoriteUI(charId);
  
  // もしお気に入りのみ表示中なら再フィルタリング
  const favOnlyBtn = document.getElementById('favoritesOnlyBtn');
  if (favOnlyBtn && favOnlyBtn.classList.contains('active')) {
    showFavoritesOnly();
  }
}

/**
 * お気に入りボタンのUIを更新
 * @param {number} charId - キャラクターID（省略時は全体を更新）
 */
function updateFavoriteUI(charId = null) {
  if (charId !== null) {
    // 特定のキャラクターのお気に入りボタンを更新
    const favBtn = document.querySelector(`[data-char-id="${charId}"] .favorite-btn`);
    if (favBtn) {
      const isFavorite = favorites.includes(charId);
      favBtn.classList.toggle('favorited', isFavorite);
      favBtn.title = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
      
      // SVGの色を更新
      const svg = favBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isFavorite ? '#ff6b00' : 'none');
        svg.setAttribute('stroke', isFavorite ? '#ff6b00' : '#666');
      }
    }
    
    // 詳細画面のお気に入りボタンも更新
    const detailFavBtn = document.getElementById('detailFavoriteBtn');
    if (detailFavBtn) {
      const isFavorite = favorites.includes(charId);
      detailFavBtn.classList.toggle('favorited', isFavorite);
      detailFavBtn.title = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
      
      // SVGの色を更新
      const svg = detailFavBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isFavorite ? '#ff6b00' : 'none');
        svg.setAttribute('stroke', isFavorite ? '#ff6b00' : '#4a88a2');
      }
    }
  } else {
    // 全てのお気に入りボタンを更新
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      const charId = parseInt(btn.closest('[data-char-id]').getAttribute('data-char-id'));
      const isFavorite = favorites.includes(charId);
      btn.classList.toggle('favorited', isFavorite);
      btn.title = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
      
      // SVGの色を更新
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isFavorite ? '#ff6b00' : 'none');
        svg.setAttribute('stroke', isFavorite ? '#ff6b00' : '#666');
      }
    });
  }
  
  // お気に入り数を更新
  const favCount = document.getElementById('favoritesCount');
  if (favCount) {
    favCount.textContent = favorites.length;
  }
  
  // メモ済み数を更新
  updateMemoCount();
}

/**
 * メモ済み数を更新
 */
function updateMemoCount() {
  const memoCount = document.getElementById('memoCount');
  if (memoCount) {
    // メモがあるキャラクター数をカウント
    const memoCharacterCount = Object.keys(userNotes).filter(charId => 
      userNotes[charId] && userNotes[charId].trim() !== ''
    ).length;
    memoCount.textContent = memoCharacterCount;
  }
}

/**
 * お気に入りのみを表示
 */
function showFavoritesOnly() {
  const favOnlyBtn = document.getElementById('favoritesOnlyBtn');
  const isActive = favOnlyBtn.classList.toggle('selected');
  
  if (isActive) {
    favOnlyBtn.innerHTML = 'お気に入り (<span id="favoritesCount">' + favorites.length + '</span>)';
    const favoriteChars = characters.filter(c => favorites.includes(c.id));
    const characterListContainer = document.getElementById('characterList');
    const noCharactersMessage = document.getElementById('noCharactersMessage');
    
    if (favoriteChars.length > 0) {
      characterListContainer.innerHTML = favoriteChars.map(renderCharacter).join('');
      noCharactersMessage.style.display = 'none';
    } else {
      characterListContainer.innerHTML = '';
      noCharactersMessage.style.display = 'block';
      noCharactersMessage.textContent = 'お気に入りに登録されたキャラクターがありません';
    }
    updateFavoriteUI();
    
  } else {
    favOnlyBtn.innerHTML = 'お気に入り (<span id="favoritesCount">' + favorites.length + '</span>)';
    
  }
}

/**
 * ランダムにキャラクターを表示
 */
function showRandomCharacter() {
  if (characters.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * characters.length);
  const randomChar = characters[randomIndex];
  showCharacterDetails(randomChar.id);
  // showCharacterDetails内で詳細表示設定済み
  updateHamburgerMenuVisibility();
}

// ===============================================
// メモ機能
// ===============================================

/**
 * ユーザーメモを保存する
 * @param {number} charId - キャラクターID
 * @param {string} note - メモ内容
 */
async function saveUserNote(charId, note) {
  // HTMLタグやスクリプトをエスケープ
  const sanitizedNote = escapeHtml(note.trim());
  
  try {
    // IndexedDBに保存
    if (sanitizedNote) {
      await characterDB.saveNote(charId, sanitizedNote);
      userNotes[charId] = sanitizedNote; // キャッシュも更新
    } else {
      await characterDB.deleteNote(charId);
      delete userNotes[charId]; // キャッシュからも削除
    }
  } catch (error) {
    console.error('メモ保存エラー:', error);
    // エラー時もキャッシュだけは更新しておく
    if (sanitizedNote) {
      userNotes[charId] = sanitizedNote;
    } else {
      delete userNotes[charId];
    }
  }
  
  // メモ数を更新
  updateMemoCount();
}

/**
 * HTMLエスケープ関数
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープされたテキスト
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * メモ編集モーダルを表示する
 * @param {number} charId - キャラクターID
 */
async function showNoteEditor(charId) {
  let currentNote = '';
  
  try {
    if (characterDB.db) {
      currentNote = await characterDB.getNote(charId);
    } else {
      currentNote = userNotes[charId] || '';
    }
  } catch (error) {
    console.error('メモ取得エラー:', error);
    currentNote = userNotes[charId] || '';
  }
  
  const char = characters.find(c => c.id === charId);
  const charName = char ? (currentDisplayLanguage === 'en' && char.nameEn ? char.nameEn[0] : char.name[0]) : '';
  
  // 既存のモーダルを削除
  const existingModal = document.getElementById('noteEditorModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // モーダル作成
  const modal = document.createElement('div');
  modal.id = 'noteEditorModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content note-editor-modal">
      <div class="modal-header">
        <h3>${charName} のメモ</h3>
        <button class="modal-close" onclick="closeNoteEditor()">&times;</button>
      </div>
      <div class="modal-body">
        <textarea id="noteTextarea" placeholder="メモを入力してください...">${unescapeHtml(currentNote)}</textarea>
      </div>
      <div class="modal-footer">
        <button onclick="saveNote(${charId})" class="btn-save">保存</button>
        <button onclick="closeNoteEditor()" class="btn-cancel">キャンセル</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('noteTextarea').focus();
}

/**
 * HTMLアンエスケープ関数
 * @param {string} html - アンエスケープするHTML
 * @returns {string} アンエスケープされたテキスト
 */
function unescapeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * メモを保存してモーダルを閉じる
 * @param {number} charId - キャラクターID
 */
async function saveNote(charId) {
  const textarea = document.getElementById('noteTextarea');
  const note = textarea.value;
  
  try {
    await saveUserNote(charId, note);
    await updateNoteDisplay(charId);
    addNotification('メモ内容を変更しました', 'success');
    closeNoteEditor();
  } catch (error) {
    console.error('メモ保存処理エラー:', error);
    addNotification('メモの保存に失敗しました', 'error');
    // エラーが発生してもモーダルは閉じる
    closeNoteEditor();
  }
}

/**
 * メモエディターモーダルを閉じる
 */
function closeNoteEditor() {
  const modal = document.getElementById('noteEditorModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * キャラクター詳細のメモ表示を更新する
 * @param {number} charId - キャラクターID
 */
async function updateNoteDisplay(charId) {
  const noteDisplay = document.getElementById('noteDisplay');
  
  try {
    let note = '';
    
    if (characterDB.db) {
      // IndexedDBから取得
      note = await characterDB.getNote(charId);
      // キャッシュも更新
      if (note) {
        userNotes[charId] = note;
      } else {
        delete userNotes[charId];
      }
    } else {
      // フォールバック: キャッシュから取得
      note = userNotes[charId] || '';
    }
    
    if (noteDisplay) {
      if (note) {
        noteDisplay.innerHTML = note;
        noteDisplay.style.display = 'block';
      } else {
        noteDisplay.innerHTML = '<em style="color: #999;">メモがありません</em>';
        noteDisplay.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('メモ表示エラー:', error);
    // エラー時はキャッシュから表示
    const note = userNotes[charId] || '';
    if (noteDisplay) {
      if (note) {
        noteDisplay.innerHTML = note;
        noteDisplay.style.display = 'block';
      } else {
        noteDisplay.innerHTML = '<em style="color: #999;">メモがありません</em>';
        noteDisplay.style.display = 'block';
      }
    }
  }
}

// ===============================================
// キーボードショートカット
// ===============================================

/**
 * キーボードショートカットの初期化
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // ポップアップが開いている時の処理
    const detailsPopup = document.getElementById('detailsPopup');
    const usageGuidePopup = document.getElementById('usageGuidePopup');
    const isDetailsPopupOpen = detailsPopup.style.display === 'block';
    const isUsageGuideOpen = usageGuidePopup.style.display === 'block';
    
    // Escape でポップアップを閉じる（優先順位: 使い方ガイド > キャラ詳細）
    if (e.key === 'Escape') {
      if (isUsageGuideOpen) {
        closeUsageGuide();
        return;
      } else if (isDetailsPopupOpen) {
        closeDetailsPopup();
        return;
      }
    }
    
    // 入力欄にフォーカスがある時はショートカットを無効にする
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }
    
    // Ctrl+F で検索欄にフォーカス
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.getElementById('searchName');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }
    
    // Ctrl+R でランダム表示
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      showRandomCharacter();
      return;
    }
    
    // F でお気に入りのみ表示切り替え
    if (e.key === 'f' || e.key === 'F') {
      toggleFilterPopup()
      return;
    }
    
    // R でランダム表示（Ctrlなし）
    if (e.key === 'r' || e.key === 'R') {
      showRandomCharacter();
      return;
    }
    
    // L で言語切り替え
    if (e.key === 'l' || e.key === 'L') {
      toggleLanguage();
      return;
    }
    
    // T でテーマ切り替え
    if (e.key === 't' || e.key === 'T') {
      toggleTheme();
      return;
    }
    
    // ポップアップが開いている時の追加ショートカット
    if (isPopupOpen) {
      const currentCharId = parseInt(document.getElementById('characterDetails').dataset.charId);
      
      // H で前のキャラクター、J で次のキャラクター
      if (e.key === 'h' || e.key === 'H') {
        const currentIndex = characters.findIndex(c => c.id === currentCharId);
        if (currentIndex > 0) {
          const prevChar = characters[currentIndex - 1];
          showCharacterDetails(prevChar.id);
        }
        return;
      }
      
      if (e.key === 'j' || e.key === 'J') {
        const currentIndex = characters.findIndex(c => c.id === currentCharId);
        if (currentIndex < characters.length - 1) {
          const nextChar = characters[currentIndex + 1];
          showCharacterDetails(nextChar.id);
        }
        return;
      }
      
      // M でメモ編集
      if (e.key === 'm' || e.key === 'M') {
        showNoteEditor(currentCharId);
        return;
      }
    }
    
    // データ管理用ショートカット（Ctrl+Shift+D）
    if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      showDataManager();
      return;
    }
  });
}

// ===============================================
// 初期化時にキーボードショートカットを設定
// ===============================================
document.addEventListener('DOMContentLoaded', function() {
  initKeyboardShortcuts();
});

// ===============================================
// カスタムタグ機能
// ===============================================

/**
 * ハンバーガーメニューからカスタムタグ管理を表示
 */
function showCustomTagsFromMenu() {
  // ハンバーガーメニューを閉じる
  toggleHamburgerMenu();
  
  // 少し遅延してからカスタムタグ管理画面を表示
  setTimeout(() => {
    showCustomTagsPopup();
  }, 300);
}

/**
 * カスタムタグ一覧ポップアップを表示
 */
async function showCustomTagsPopup() {
  try {
    // カスタムタグをIndexedDBから読み込み
    customTags = await characterDB.getAllCustomTags();
    characterTags = await characterDB.getAllCharacterTags();
    
    // ポップアップを表示
    document.getElementById('customTagsPopup').style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
    
    // タグ一覧を更新
    renderCustomTagsList();
    
  } catch (error) {
    console.error('カスタムタグ読み込みエラー:', error);
    // エラー時はデフォルト値で初期化
    customTags = {};
    characterTags = {};
    document.getElementById('customTagsPopup').style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
    renderCustomTagsList();
  }
}

/**
 * カスタムタグ一覧ポップアップを閉じる
 */
function closeCustomTagsPopup() {
  document.getElementById('customTagsPopup').style.display = 'none';
  document.body.classList.remove('modal-open'); // 背景スクロール防止解除
  hideCreateTagForm();
}

/**
 * カスタムタグ一覧を描画
 */
function renderCustomTagsList() {
  const container = document.getElementById('customTagsList');
  
  if (Object.keys(customTags).length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">まだカスタムタグがありません。</p>';
    return;
  }
  
  container.innerHTML = '';
  
  // タグを順序に従ってソート
  const sortedTagIds = getSortedCustomTags();
  
  sortedTagIds.forEach((tagId, index) => {
    const tagData = customTags[tagId];
    if (!tagData) return;
    
    // このタグが使われているキャラクター数を計算
    const usageCount = Object.values(characterTags).filter(tags => tags.includes(tagId)).length;
    
    const tagElement = document.createElement('div');
    tagElement.className = 'custom-tag-item';
    tagElement.draggable = true;
    tagElement.dataset.tagId = tagId;
    tagElement.dataset.index = index;
    
    // このタグの並び順設定を取得
    const tagSortOrder = tagSortOrders[tagId] || 'id';
    const sortLabels = {
      'id': 'ID順',
      'name': '名前順', 
      'random': 'ランダム',
      'custom': 'カスタム'
    };
    
    tagElement.innerHTML = `
      <div class="drag-handle">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
      <div class="tag-info">
        <div class="tag-color-indicator" style="background-color: ${tagData.color}"></div>
        <div class="tag-name">${escapeHtml(tagData.name)}</div>
        <div class="tag-count">${usageCount}キャラ</div>
        <div class="tag-sort-info" style="font-size: 12px; color: #666; margin-top: 4px;">
          並び: ${sortLabels[tagSortOrder]}
        </div>
      </div>
      <div class="tag-actions">
        <button class="tag-edit-btn" onclick="editCustomTag('${tagId}')">編集</button>
        <button class="tag-sort-btn" onclick="cycleTagSortOrder('${tagId}')" title="並び順を変更">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M7 12h14"/>
            <path d="M10 18h11"/>
          </svg>
        </button>
        <button class="tag-delete-btn" onclick="deleteCustomTag('${tagId}')">削除</button>
      </div>
    `;
    
    // ドラッグ&ドロップイベントを追加
    addDragAndDropEvents(tagElement);
    
    container.appendChild(tagElement);
  });
}

/**
 * タグの順序を取得（順序配列に従ってソート）
 */
function getSortedCustomTags() {
  const allTagIds = Object.keys(customTags);
  
  // 順序配列に含まれるタグを先に配置
  const orderedTags = customTagsOrder.filter(tagId => customTags[tagId]);
  
  // 順序配列にないタグを後に追加
  const unorderedTags = allTagIds.filter(tagId => !customTagsOrder.includes(tagId));
  
  return [...orderedTags, ...unorderedTags];
}

// グローバル変数でドラッグ状態を管理（パフォーマンス向上）
let dragState = {
  draggedElement: null,
  placeholder: null,
  container: null,
  isDragging: false,
  startY: 0,
  longPressTimer: null
};

/**
 * ドラッグ&ドロップイベントを追加（軽量版）
 */
function addDragAndDropEvents(element) {
  // ドラッグハンドルのみにイベントを追加
  const dragHandle = element.querySelector('.drag-handle');
  if (!dragHandle) return;
  
  // タッチイベント（モバイル対応）
  dragHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
  dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
  dragHandle.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // マウスイベント（デスクトップ対応）
  element.addEventListener('dragstart', handleDragStart);
  element.addEventListener('dragend', handleDragEnd);
}

function handleTouchStart(e) {
  const element = e.target.closest('.custom-tag-item');
  dragState.startY = e.touches[0].clientY;
  
  // 長押し判定
  dragState.longPressTimer = setTimeout(() => {
    dragState.isDragging = true;
    startDrag(element);
    // ハプティックフィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);
}

function handleTouchMove(e) {
  if (!dragState.isDragging) {
    // 長押し前の移動で長押しをキャンセル
    const moveDistance = Math.abs(e.touches[0].clientY - dragState.startY);
    if (moveDistance > 10) {
      clearTimeout(dragState.longPressTimer);
    }
    return;
  }
  
  e.preventDefault();
  updateDragPosition(e.touches[0].clientY);
}

function handleTouchEnd(e) {
  clearTimeout(dragState.longPressTimer);
  if (dragState.isDragging) {
    endDrag();
  }
}

function handleDragStart(e) {
  dragState.startY = e.clientY;
  startDrag(e.target);
}

function handleDragEnd() {
  endDrag();
}

function startDrag(element) {
  dragState.draggedElement = element;
  dragState.container = document.getElementById('customTagsList');
  
  // ドラッグ中のスタイル
  element.classList.add('dragging');
  
  // プレースホルダーを作成
  dragState.placeholder = document.createElement('div');
  dragState.placeholder.className = 'custom-tag-item placeholder';
  dragState.placeholder.style.height = element.offsetHeight + 'px';
  
  // コンテナにドラッグオーバーイベントを追加（デスクトップのみ）
  if (!dragState.isDragging) { // タッチではない場合
    dragState.container.addEventListener('dragover', handleContainerDragOver);
  }
}

function handleContainerDragOver(e) {
  e.preventDefault();
  updateDragPosition(e.clientY);
}

function updateDragPosition(currentY) {
  if (!dragState.draggedElement || !dragState.container) return;
  
  const items = [...dragState.container.children].filter(
    item => !item.classList.contains('placeholder') && item !== dragState.draggedElement
  );
  
  let insertAfter = null;
  
  // 最適化：バイナリサーチ的なアプローチではなく、シンプルに上から下へ
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect();
    if (currentY > rect.top + rect.height / 2) {
      insertAfter = items[i];
    } else {
      break;
    }
  }
  
  // プレースホルダーの位置を更新（DOM操作を最小限に）
  const currentParent = dragState.placeholder.parentNode;
  const targetParent = dragState.container;
  
  if (insertAfter) {
    const nextSibling = insertAfter.nextSibling;
    if (nextSibling !== dragState.placeholder) {
      targetParent.insertBefore(dragState.placeholder, nextSibling);
    }
  } else {
    const firstChild = targetParent.firstChild;
    if (firstChild !== dragState.placeholder) {
      targetParent.insertBefore(dragState.placeholder, firstChild);
    }
  }
}

function endDrag() {
  if (!dragState.draggedElement || !dragState.placeholder) return;
  
  // 新しい位置に要素を移動
  dragState.placeholder.parentNode.replaceChild(dragState.draggedElement, dragState.placeholder);
  
  // ドラッグ中のスタイルを削除
  dragState.draggedElement.classList.remove('dragging');
  
  // イベントリスナーを削除
  if (dragState.container) {
    dragState.container.removeEventListener('dragover', handleContainerDragOver);
  }
  
  // 新しい順序を保存（非同期で実行してUIブロックを避ける）
  requestAnimationFrame(() => {
    saveNewOrder();
  });
  
  // クリーンアップ
  dragState.draggedElement = null;
  dragState.placeholder = null;
  dragState.container = null;
  dragState.isDragging = false;
}

/**
 * 新しい順序を保存
 */
async function saveNewOrder() {
  try {
    const container = document.getElementById('customTagsList');
    if (!container) {
      console.warn('customTagsList container not found');
      return;
    }
    
    const tagElements = [...container.children].filter(elem => elem.dataset && elem.dataset.tagId);
    const newOrder = tagElements.map(elem => elem.dataset.tagId);
    
    // 順序に変更があった場合のみ保存
    if (JSON.stringify(customTagsOrder) !== JSON.stringify(newOrder)) {
      customTagsOrder = newOrder;
      
      // データベースが初期化されているかチェック
      if (characterDB && characterDB.db) {
        await characterDB.saveCustomTagsOrder(newOrder);
        console.log('タグ順序を保存しました:', newOrder);
      } else {
        console.warn('データベースが初期化されていません');
      }
    }
  } catch (error) {
    console.error('タグ順序の保存に失敗しました:', error);
    // エラーが発生してもUIの動作は続行
  }
}

/**
 * 新規タグ作成フォームを表示
 */
function showCreateTagForm() {
  const form = document.getElementById('tagCreateForm');
  form.style.display = 'block';
  
  // 入力フィールドをリセット
  document.getElementById('newTagName').value = '';
  document.getElementById('newTagColor').value = '#3b82f6';
  
  // 作成ボタンを「新規作成」状態にする
  const saveBtn = form.querySelector('.tag-save-btn');
  saveBtn.textContent = '保存';
  saveBtn.onclick = createNewTag;
  
  // 名前入力フィールドにフォーカス
  document.getElementById('newTagName').focus();
}

/**
 * タグ作成フォームを隠す
 */
function hideCreateTagForm() {
  document.getElementById('tagCreateForm').style.display = 'none';
}

/**
 * 新しいカスタムタグを作成
 */
async function createNewTag() {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  
  const name = nameInput.value.trim();
  const color = colorInput.value;
  
  if (!name) {
    alert('タグ名を入力してください。');
    nameInput.focus();
    return;
  }
  
  // 重複チェック
  const existingTag = Object.values(customTags).find(tag => tag.name === name);
  if (existingTag) {
    alert('同じ名前のタグが既に存在します。');
    nameInput.focus();
    return;
  }
  
  try {
    // 新しいタグIDを生成（現在のタイムスタンプ + ランダム）
    const tagId = 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const tagData = {
      name: name,
      color: color,
      createdAt: new Date().toISOString()
    };
    
    // IndexedDBに保存
    await characterDB.saveCustomTag(tagId, tagData);
    
    // メモリ上のデータも更新
    customTags[tagId] = tagData;
    
    // UI更新
    hideCreateTagForm();
    renderCustomTagsList();
    
    // 新しいタグを順序配列の最後に追加
    customTagsOrder.push(tagId);
    await characterDB.saveCustomTagsOrder(customTagsOrder);
    
    // フィルターオプションも更新（展開されている場合）
    const customTagsContainer = document.getElementById('customTagsFilters');
    if (customTagsContainer && customTagsContainer.style.display === 'block') {
      updateCustomTagsFilterOptions();
    }
    
    console.log('新しいカスタムタグを作成しました:', name);
    
  } catch (error) {
    console.error('カスタムタグ作成エラー:', error);
    alert('タグの作成に失敗しました。');
  }
}

/**
 * カスタムタグを編集
 */
function editCustomTag(tagId) {
  const tagData = customTags[tagId];
  if (!tagData) return;
  
  // フォームに現在の値をセット
  document.getElementById('newTagName').value = tagData.name;
  document.getElementById('newTagColor').value = tagData.color;
  
  // フォームを表示
  const form = document.getElementById('tagCreateForm');
  form.style.display = 'block';
  
  // 保存ボタンを「更新」状態にする
  const saveBtn = form.querySelector('.tag-save-btn');
  saveBtn.textContent = '更新';
  saveBtn.onclick = () => updateCustomTag(tagId);
  
  // フィールドにフォーカス
  document.getElementById('newTagName').focus();
}

/**
 * カスタムタグを更新
 */
async function updateCustomTag(tagId) {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  
  const name = nameInput.value.trim();
  const color = colorInput.value;
  
  if (!name) {
    alert('タグ名を入力してください。');
    nameInput.focus();
    return;
  }
  
  // 重複チェック（自分以外の同名タグ）
  const existingTag = Object.entries(customTags).find(([id, tag]) => 
    id !== tagId && tag.name === name
  );
  if (existingTag) {
    alert('同じ名前のタグが既に存在します。');
    nameInput.focus();
    return;
  }
  
  try {
    const tagData = {
      ...customTags[tagId],
      name: name,
      color: color,
      updatedAt: new Date().toISOString()
    };
    
    // IndexedDBに保存
    await characterDB.saveCustomTag(tagId, tagData);
    
    // メモリ上のデータも更新
    customTags[tagId] = tagData;
    
    // UI更新
    hideCreateTagForm();
    renderCustomTagsList();
    
    // フィルターオプションも更新（展開されている場合）
    const customTagsContainer = document.getElementById('customTagsFilters');
    if (customTagsContainer && customTagsContainer.style.display === 'block') {
      updateCustomTagsFilterOptions();
    }
    
    console.log('カスタムタグを更新しました:', name);
    
  } catch (error) {
    console.error('カスタムタグ更新エラー:', error);
    alert('タグの更新に失敗しました。');
  }
}

/**
 * カスタムタグを削除
 */
async function deleteCustomTag(tagId) {
  const tagData = customTags[tagId];
  if (!tagData) return;
  
  // 使用されているキャラクター数を確認
  const usageCount = Object.values(characterTags).filter(tags => tags.includes(tagId)).length;
  
  const message = usageCount > 0 
    ? `タグ「${tagData.name}」を削除しますか？\n${usageCount}人のキャラクターから削除されます。`
    : `タグ「${tagData.name}」を削除しますか？`;
  
  if (!confirm(message)) {
    return;
  }
  
  try {
    // IndexedDBから削除
    await characterDB.deleteCustomTag(tagId);
    
    // キャラクターからもタグを削除
    Object.keys(characterTags).forEach(async (charId) => {
      const tags = characterTags[charId];
      const tagIndex = tags.indexOf(tagId);
      if (tagIndex > -1) {
        tags.splice(tagIndex, 1);
        characterTags[charId] = tags;
        
        // IndexedDBに保存
        await characterDB.saveCharacterTags(parseInt(charId), tags);
      }
    });
    
    // メモリ上のデータも更新
    delete customTags[tagId];
    
    // 順序配列からも削除
    const orderIndex = customTagsOrder.indexOf(tagId);
    if (orderIndex > -1) {
      customTagsOrder.splice(orderIndex, 1);
      await characterDB.saveCustomTagsOrder(customTagsOrder);
    }
    
    // UI更新
    renderCustomTagsList();
    
    // フィルターオプションも更新（展開されている場合）
    const customTagsContainer = document.getElementById('customTagsFilters');
    if (customTagsContainer && customTagsContainer.style.display === 'block') {
      updateCustomTagsFilterOptions();
    }
    
    console.log('カスタムタグを削除しました:', tagData.name);
    
  } catch (error) {
    console.error('カスタムタグ削除エラー:', error);
    alert('タグの削除に失敗しました。');
  }
}

/**
 * タグの並び順を切り替える
 * @param {string} tagId - タグID
 */
async function cycleTagSortOrder(tagId) {
  const orders = ['id', 'name', 'random', 'custom'];
  const currentOrder = tagSortOrders[tagId] || 'id';
  const currentIndex = orders.indexOf(currentOrder);
  const newOrder = orders[(currentIndex + 1) % orders.length];
  
  tagSortOrders[tagId] = newOrder;
  
  // localStorageに保存
  localStorage.setItem('tagSortOrders', JSON.stringify(tagSortOrders));
  
  // UI更新
  renderCustomTagsList();
  
  // そのタグでフィルター中なら再描画
  if (activeFilters.customTags.includes(tagId)) {
    filterCharacters();
  }
}

/**
 * カスタム並び順を設定するモードを開始（後方互換性のため残す）
 */
function startCustomSortMode() {
  // 編集モードを有効化
  if (!isEditMode) {
    isEditMode = true;
    const editModeBtn = document.getElementById('editModeBtn');
    const editModeStatus = document.getElementById('editModeStatus');
    if (editModeBtn) editModeBtn.classList.add('active');
    if (editModeStatus) editModeStatus.textContent = 'オン';
  }
  
  // 並び替えサブモードに切り替え
  switchEditSubMode('sort');
}

/**
 * カードにドラッグ機能を追加
 */
function enableCardDragging() {
  const characterListContainer = document.getElementById('characterList');
  if (!characterListContainer) return;
  
  const cards = Array.from(characterListContainer.querySelectorAll('.card'));
  
  // カードにドラッグ可能属性を追加
  cards.forEach((card, index) => {
    card.draggable = true;
    card.dataset.index = index;
    card.classList.add('sortable-card');
    
    // ドラッグイベントを追加
    card.addEventListener('dragstart', handleCardDragStart);
    card.addEventListener('dragend', handleCardDragEnd);
  });
  
  // コンテナにdragoverとdropイベントを追加
  characterListContainer.addEventListener('dragover', handleContainerDragOver);
  characterListContainer.addEventListener('drop', handleContainerDrop);
  
  // 初期状態を保存
  saveTempSortOrder();
}

/**
 * 並び替えモードを再適用（filterCharacters後）
 */
function reapplyCustomSortMode() {
  if (!isCustomSortModeActive) return;
  
  // カードにドラッグ機能を再追加
  enableCardDragging();
}

/**
 * 現在のカード順序を一時保存
 */
function saveTempSortOrder() {
  const characterListContainer = document.getElementById('characterList');
  if (!characterListContainer) return;
  
  const cards = Array.from(characterListContainer.querySelectorAll('.card'));
  tempSortOrder = cards.map(card => parseInt(card.dataset.charId));
}

// カード並び替え用のドラッグ状態
let cardDragState = {
  draggedCard: null,
  draggedIndex: -1
};

function handleCardDragStart(e) {
  cardDragState.draggedCard = e.currentTarget;
  cardDragState.draggedIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleContainerDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const draggingCard = cardDragState.draggedCard;
  if (!draggingCard) return;
  
  const container = e.currentTarget;
  const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
  
  if (afterElement == null) {
    container.appendChild(draggingCard);
  } else {
    container.insertBefore(draggingCard, afterElement);
  }
}

function handleContainerDrop(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleCardDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  
  // インデックスを更新
  const characterListContainer = document.getElementById('characterList');
  const cards = Array.from(characterListContainer.querySelectorAll('.card'));
  cards.forEach((card, index) => {
    card.dataset.index = index;
  });
  
  // 変更後の順序を保存
  saveTempSortOrder();
  
  cardDragState.draggedCard = null;
  cardDragState.draggedIndex = -1;
}

function getDragAfterElement(container, x, y) {
  const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    
    // カードの中心点を計算
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    
    // マウス位置との距離を計算
    const offsetX = x - centerX;
    const offsetY = y - centerY;
    
    // カードレイアウトがグリッド形式なので、Y座標を優先し、同じ行ならX座標で判定
    let offset;
    if (Math.abs(offsetY) > box.height / 2) {
      // 異なる行
      offset = offsetY;
    } else {
      // 同じ行
      offset = offsetX;
    }
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * カスタム並び順適用ボタンを表示
 */
function showCustomSortApplyButton() {
  const toolbar = document.getElementById('editToolbar');
  if (!toolbar) return;
  
  // 既存のボタンを非表示
  const existingButtons = toolbar.querySelectorAll('.edit-btn');
  existingButtons.forEach(btn => btn.style.display = 'none');
  
  // 適用ボタンを作成
  let applyBtn = document.getElementById('customSortApplyBtn');
  if (!applyBtn) {
    applyBtn = document.createElement('button');
    applyBtn.id = 'customSortApplyBtn';
    applyBtn.className = 'edit-btn edit-btn-tag';
    applyBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 7L9 19l-5.5-5.5 1.414-1.414L9 16.172 19.586 5.586z"/>
      </svg>
      この並び順を保存
    `;
    applyBtn.onclick = applyCustomSort;
    toolbar.querySelector('.edit-actions').appendChild(applyBtn);
  }
  applyBtn.style.display = 'inline-flex';
  
  // キャンセルボタンを作成
  let cancelBtn = document.getElementById('customSortCancelBtn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'customSortCancelBtn';
    cancelBtn.className = 'edit-btn edit-btn-clear';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.onclick = cancelCustomSort;
    toolbar.querySelector('.edit-actions').appendChild(cancelBtn);
  }
  cancelBtn.style.display = 'inline-block';
}

/**
 * カスタム並び順を適用
 */
function applyCustomSort() {
  const characterListContainer = document.getElementById('characterList');
  const cards = Array.from(characterListContainer.querySelectorAll('.card'));
  
  // 現在の並び順からキャラクターIDを取得
  const newOrder = cards.map(card => parseInt(card.dataset.charId));
  
  // カスタムタグフィルターが1つだけ有効な場合は、そのタグ用に保存
  if (activeFilters.customTags.length === 1) {
    const tagId = activeFilters.customTags[0];
    tagCustomOrders[tagId] = newOrder;
    localStorage.setItem('tagCustomOrders', JSON.stringify(tagCustomOrders));
    
    // そのタグの並び順を'custom'に設定
    tagSortOrders[tagId] = 'custom';
    localStorage.setItem('tagSortOrders', JSON.stringify(tagSortOrders));
  } else {
    // グローバルなカスタム並び順として保存
    customCharacterOrder = newOrder;
    localStorage.setItem('customCharacterOrder', JSON.stringify(customCharacterOrder));
    
    // 並び順を'custom'に切り替え
    currentSortOrder = 'custom';
    localStorage.setItem('sortOrder', currentSortOrder);
    updateSortOrderStatusText();
  }
  
  // 並び替えモードを終了
  cancelCustomSort();
  
  // 再描画
  filterCharacters();
  
  addNotification('移動を適応しました', 'success');
}

/**
 * カスタム並び順設定をキャンセル
 */
function cancelCustomSort() {
  // 編集モード内なら選択モードに戻る
  if (isEditMode) {
    cancelEditModeSort();
    return;
  }
  
  // 並び替えモードを無効化
  isCustomSortModeActive = false;
  
  // 一時保存した順序をクリア
  tempSortOrder = [];
  
  const characterListContainer = document.getElementById('characterList');
  
  // コンテナのイベントリスナーを削除
  if (characterListContainer) {
    characterListContainer.removeEventListener('dragover', handleContainerDragOver);
    characterListContainer.removeEventListener('drop', handleContainerDrop);
  }
  
  // カードのドラッグイベントを削除
  const cards = document.querySelectorAll('.card.sortable-card');
  cards.forEach(card => {
    card.draggable = false;
    card.classList.remove('sortable-card', 'dragging');
    card.removeEventListener('dragstart', handleCardDragStart);
    card.removeEventListener('dragend', handleCardDragEnd);
  });
  
  // ツールバーを非表示
  const toolbar = document.getElementById('editToolbar');
  if (toolbar) {
    toolbar.style.display = 'none';
  }
  
  // ボタンを削除
  const applyBtn = document.getElementById('customSortApplyBtn');
  const cancelBtn = document.getElementById('customSortCancelBtn');
  if (applyBtn) applyBtn.remove();
  if (cancelBtn) cancelBtn.remove();
  
  // 元の表示に戻す
  filterCharacters();
}

/**
 * キャラクター詳細でタグ選択ポップアップを表示
 */
async function showTagSelectionPopup(charId) {
  currentEditingCharacter = charId;
  
  try {
    // カスタムタグをIndexedDBから読み込み（まだ読み込まれていない場合）
    if (Object.keys(customTags).length === 0 && characterDB.db) {
      customTags = await characterDB.getAllCustomTags();
      characterTags = await characterDB.getAllCharacterTags();
    }
    
    // ポップアップを表示
    document.getElementById('tagSelectionPopup').style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
    
    // タグ選択リストを更新
    renderTagSelectionList(charId);
    
  } catch (error) {
    console.error('タグ選択ポップアップ表示エラー:', error);
    document.getElementById('tagSelectionPopup').style.display = 'block';
    document.body.classList.add('modal-open'); // 背景スクロール防止
    renderTagSelectionList(charId);
  }
}

/**
 * タグ選択ポップアップを閉じる
 */
function closeTagSelectionPopup() {
  document.getElementById('tagSelectionPopup').style.display = 'none';
  document.body.classList.remove('modal-open'); // 背景スクロール防止解除
  currentEditingCharacter = null;
}

/**
 * タグ選択リストを描画
 */
function renderTagSelectionList(charId) {
  const container = document.getElementById('tagSelectionList');
  
  if (Object.keys(customTags).length === 0) {
    container.innerHTML = `
      <p style="text-align: center; color: #888; padding: 20px;">
        カスタムタグがありません。<br>
        <button onclick="closeTagSelectionPopup(); showCustomTagsFromMenu();" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          タグを作成する
        </button>
      </p>
    `;
    return;
  }
  
  // 現在選択されているタグを取得
  const selectedTags = characterTags[charId] || [];
  
  container.innerHTML = '';
  
  Object.entries(customTags).forEach(([tagId, tagData]) => {
    const isSelected = selectedTags.includes(tagId);
    
    const tagElement = document.createElement('div');
    tagElement.className = `tag-selection-item ${isSelected ? 'selected' : ''}`;
    tagElement.onclick = () => toggleTagSelection(charId, tagId);
    
    tagElement.innerHTML = `
      <div class="tag-color-indicator" style="background-color: ${tagData.color}"></div>
      <div class="tag-name">${escapeHtml(tagData.name)}</div>
      ${isSelected ? '<div style="margin-left: auto; color: #007bff;">✓</div>' : ''}
    `;
    
    container.appendChild(tagElement);
  });
}

/**
 * タグ選択状態を切り替え
 */
async function toggleTagSelection(charId, tagId) {
  if (!characterTags[charId]) {
    characterTags[charId] = [];
  }
  
  const tags = characterTags[charId];
  const tagIndex = tags.indexOf(tagId);
  
  if (tagIndex > -1) {
    // タグを削除
    tags.splice(tagIndex, 1);
  } else {
    // タグを追加
    tags.push(tagId);
  }
  
  try {
    // IndexedDBに保存
    await characterDB.saveCharacterTags(charId, tags);
    
    // UI更新
    renderTagSelectionList(charId);
    updateCharacterTagDisplay(charId);
    
  } catch (error) {
    console.error('タグ選択保存エラー:', error);
    // エラー時は変更を元に戻す
    if (tagIndex > -1) {
      tags.push(tagId);
    } else {
      tags.splice(tags.length - 1, 1);
    }
  }
}

/**
 * キャラクター詳細のタグ表示を更新
 */
function updateCharacterTagDisplay(charId) {
  const characterTagsContainer = document.getElementById('characterTagsDisplay');
  if (!characterTagsContainer) return;
  
  const tags = characterTags[charId] || [];
  
  if (tags.length === 0) {
    characterTagsContainer.innerHTML = '<p style="color: #888; font-size: 14px;">タグが設定されていません</p>';
    return;
  }
  
  const tagElements = tags.map(tagId => {
    const tagData = customTags[tagId];
    if (!tagData) return '';
    
    return `
      <div class="character-tag" style="background-color: ${tagData.color}">
        ${escapeHtml(tagData.name)}
        <button class="character-tag-remove" onclick="removeTagFromCharacter(${charId}, '${tagId}')" title="このタグを削除">
          ×
        </button>
      </div>
    `;
  }).filter(Boolean).join('');
  
  characterTagsContainer.innerHTML = `
    <div class="character-tags-list">
      ${tagElements}
    </div>
  `;
}

/**
 * キャラクターからタグを削除
 */
async function removeTagFromCharacter(charId, tagId) {
  if (!characterTags[charId]) return;
  
  const tags = characterTags[charId];
  const tagIndex = tags.indexOf(tagId);
  
  if (tagIndex > -1) {
    tags.splice(tagIndex, 1);
    
    try {
      // IndexedDBに保存
      await characterDB.saveCharacterTags(charId, tags);
      
      // UI更新
      updateCharacterTagDisplay(charId);
      
      // タグ選択ポップアップが開いている場合は更新
      if (currentEditingCharacter === charId) {
        renderTagSelectionList(charId);
      }
      
    } catch (error) {
      console.error('タグ削除エラー:', error);
      // エラー時は変更を元に戻す
      tags.splice(tagIndex, 0, tagId);
    }
  }
}

/**
 * IndexedDBからカスタムタグデータを読み込み
 */
async function loadCustomTagsFromIndexedDB() {
  try {
    customTags = await characterDB.getAllCustomTags();
    characterTags = await characterDB.getAllCharacterTags();
    console.log('カスタムタグデータをIndexedDBから読み込みました');
  } catch (error) {
    console.error('カスタムタグ読み込みエラー:', error);
    // エラー時はデフォルト値で初期化
    customTags = {};
    characterTags = {};
  }
}

// ===============================================
// カスタムタグフィルター機能
// ===============================================

/**
 * カスタムタグフィルターの展開/折りたたみを切り替え
 */
function toggleCustomTagsFilter() {
  // モバイル版では何もしない(常に開いた状態)
  if (window.innerWidth <= 767) return;
  
  const filtersContainer = document.getElementById('customTagsFilters');
  const toggle = document.getElementById('customTagsToggle');
  
  if (filtersContainer.style.display === 'none') {
    filtersContainer.style.display = '';  // CSSのデフォルト表示を使用
    toggle.textContent = '▲';
    
    // フィルターオプションを更新
    updateCustomTagsFilterOptions();
  } else {
    filtersContainer.style.display = 'none';
    toggle.textContent = '▼';
  }
}

/**
 * カスタムタグフィルターオプションを更新
 */
function updateCustomTagsFilterOptions() {
  const container = document.getElementById('customTagsFilters');
  
  if (Object.keys(customTags).length === 0) {
    container.innerHTML = '<p style="color: #888; font-size: 12px; text-align: center; margin: 10px 0;">カスタムタグがありません</p>';
    return;
  }
  
  container.innerHTML = '';
  
  Object.entries(customTags).forEach(([tagId, tagData]) => {
    // このタグが使われているキャラクター数を計算
    const usageCount = Object.values(characterTags).filter(tags => tags.includes(tagId)).length;
    
    const filterOption = document.createElement('div');
    filterOption.className = 'filter-option';
    filterOption.onclick = () => toggleCustomTagFilter(tagId, filterOption);
    
    filterOption.innerHTML = `
      <div class="tag-container">
        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${tagData.color}; border: 1px solid #ccc;"></div>
        <span>${escapeHtml(tagData.name)} (${usageCount})</span>
      </div>
    `;
    
    // 既に選択されている場合はスタイルを適用
    if (activeFilters.customTags.includes(tagId)) {
      filterOption.classList.add('selected');
    }
    
    container.appendChild(filterOption);
  });
}

/**
 * カスタムタグの個別フィルターを切り替え
 */
function toggleCustomTagFilter(tagId, element) {
  const index = activeFilters.customTags.indexOf(tagId);
  
  if (index === -1) {
    // タグを追加
    activeFilters.customTags.push(tagId);
    element.classList.add('selected');
  } else {
    // タグを削除
    activeFilters.customTags.splice(index, 1);
    element.classList.remove('selected');
  }
}

/**
 * カスタムタグフィルターをクリア
 */
function clearCustomTagsFilter() {
  activeFilters.customTags = [];
  const container = document.getElementById('customTagsFilters');
  const filterOptions = container.querySelectorAll('.filter-option');
  filterOptions.forEach(option => option.classList.remove('selected'));
}

// コンテキストメニュー管理
let currentContextMenu = null;

// 長押し処理用の変数
let longPressTimer = null;
let longPressTriggered = false;
let touchStartX = 0;
let touchStartY = 0;
const LONG_PRESS_DURATION = 500; // 500ms
const MOVE_THRESHOLD = 10; // 10px移動したらキャンセル

/**
 * 右クリックコンテキストメニューを表示
 * @param {MouseEvent} event - マウスイベント
 * @param {number} charId - キャラクターID
 */
function showContextMenu(event, charId) {
  console.log('showContextMenu called with charId:', charId); // デバッグログ
  event.preventDefault();
  event.stopPropagation();
  
  // 既存のコンテキストメニューを削除
  hideContextMenu();
  
  const character = characters.find(c => c.id === charId);
  if (!character) {
    console.error('Character not found:', charId);
    return;
  }
  
  console.log('Creating context menu for character:', character.name); // デバッグログ
  
  // コンテキストメニューを作成
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.id = 'characterContextMenu';
  
  const menuItems = [
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      text: '詳細を表示',
      action: () => showCharacterDetails(charId),
      closeMenu: true
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      text: favorites.includes(charId) ? 'お気に入りから削除' : 'お気に入りに追加',
      action: () => toggleFavoriteFromContextMenu(charId),
      closeMenu: false
    },
    { separator: true },
    // {
    //   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="m4 16 6-6 2 2 6-6"/></svg>',
    //   text: '画像をコピー',
    //   action: () => copyCharacterImage(character),
    //   closeMenu: true
    // },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      text: 'リンクをコピー',
      action: () => copyCharacterLink(charId),
      closeMenu: true
    },
    { separator: true },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.5 7.27A2.25 2.25 0 0 1 19 9.62v8.5a.25.25 0 0 1-.25.25H5.25a.25.25 0 0 1-.25-.25v-8.5a2.25 2.25 0 0 1-1.5-2.35l.75-3A2.25 2.25 0 0 1 6.35 2.5h11.3a2.25 2.25 0 0 1 2.1 1.52l.75 3Z"/><path d="m9 9 3 3 3-3"/></svg>',
      text: 'カスタムタグを追加',
      action: () => showTagSelectionPopup(charId),
      closeMenu: true
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      text: 'メモを編集',
      action: () => showNoteEditor(charId),
      closeMenu: true
    },
    {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>',
      text: 'データをコピー',
      action: () => copyCharacterData(character),
      closeMenu: true
    }
  ];
  
  // メニューアイテムを生成
  menuItems.forEach(item => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.className = 'context-menu-separator';
      contextMenu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.innerHTML = `${item.icon}<span>${item.text}</span>`;
      menuItem.onclick = (event) => {
        event.stopPropagation(); // イベントバブリングを防ぐ
        item.action();
        if (item.closeMenu) {
          hideContextMenu();
        }
      };
      contextMenu.appendChild(menuItem);
    }
  });
  
  // ドキュメントに追加
  document.body.appendChild(contextMenu);
  currentContextMenu = contextMenu;
  
  // コンテキストメニュー自体のクリックイベントを止める
  contextMenu.addEventListener('click', function(event) {
    event.stopPropagation();
  });
  
  console.log('Context menu created and added to DOM'); // デバッグログ
  
  // 位置調整
  positionContextMenu(contextMenu, event.clientX, event.clientY);
  
  // 表示（アニメーション付き）
  contextMenu.style.display = 'block';
  requestAnimationFrame(() => {
    contextMenu.classList.add('show');
  });
  console.log('Context menu should now be visible'); // デバッグログ
}

/**
 * コンテキストメニューの位置を調整
 * @param {HTMLElement} menu - メニュー要素
 * @param {number} x - X座標（ビューポート座標）
 * @param {number} y - Y座標（ビューポート座標）
 */
function positionContextMenu(menu, x, y) {
  // まず一時的に表示して正確なサイズを取得
  menu.style.visibility = 'hidden';
  menu.style.display = 'block';
  menu.style.position = 'fixed'; // fixedポジションで確実にビューポート基準にする
  
  const menuRect = menu.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let left = x;
  let top = y;
  
  // 右端はみ出し調整（優先度：左側に表示 > 右端に合わせる）
  if (left + menuRect.width > windowWidth) {
    // マウス位置より左側に表示を試みる
    const leftSidePosition = x - menuRect.width;
    if (leftSidePosition >= 10) {
      left = leftSidePosition;
    } else {
      // 左側に表示できない場合は右端に合わせる
      left = windowWidth - menuRect.width - 10;
    }
  }
  
  // 下端はみ出し調整（優先度：上側に表示 > 下端に合わせる）
  if (top + menuRect.height > windowHeight) {
    // マウス位置より上側に表示を試みる
    const topSidePosition = y - menuRect.height;
    if (topSidePosition >= 10) {
      top = topSidePosition;
    } else {
      // 上側に表示できない場合は下端に合わせる
      top = windowHeight - menuRect.height - 10;
    }
  }
  
  // 最小位置調整（画面の端から最低10px空ける）
  left = Math.max(10, Math.min(left, windowWidth - menuRect.width - 10));
  top = Math.max(10, Math.min(top, windowHeight - menuRect.height - 10));
  
  // fixedポジションなのでスクロール位置は考慮しない
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  
  // 表示状態に戻す
  menu.style.visibility = 'visible';
}

/**
 * コンテキストメニューを隠す
 */
function hideContextMenu() {
  if (currentContextMenu) {
    currentContextMenu.classList.remove('show');
    setTimeout(() => {
      if (currentContextMenu) {
        currentContextMenu.remove();
        currentContextMenu = null;
      }
    }, 150); // アニメーション時間と同期
  }
}

/**
 * コンテキストメニューイベントリスナーを設定
 */
function setupContextMenuEventListeners() {
  // ページスクロール時にコンテキストメニューを閉じる
  window.addEventListener('scroll', hideContextMenu, { passive: true });
  
  // ウィンドウリサイズ時にコンテキストメニューを閉じる
  window.addEventListener('resize', hideContextMenu, { passive: true });
  
  // ページのクリック時にコンテキストメニューを閉じる
  document.addEventListener('click', function(event) {
    if (currentContextMenu && !currentContextMenu.contains(event.target)) {
      hideContextMenu();
    }
  }, { passive: true });
  
  // タッチイベントでもコンテキストメニューを閉じる（モバイル対応）
  document.addEventListener('touchstart', function(event) {
    if (currentContextMenu && !currentContextMenu.contains(event.target)) {
      hideContextMenu();
    }
  }, { passive: true });
  
  // ESCキーでコンテキストメニューを閉じる
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && currentContextMenu) {
      hideContextMenu();
    }
  });
}

/**
 * カードのタッチ開始処理（長押し検出用）
 */
function handleCardTouchStart(event, charId) {
  // 編集モードまたは並び替えモードの場合は長押し無効
  if (isEditMode) {
    onCardHover(event.currentTarget, charId);
    return;
  }
  
  // タッチ開始位置を記録
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  longPressTriggered = false;
  
  // 長押しタイマーを設定
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    // バイブレーション（対応デバイスのみ）
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    // コンテキストメニューを表示
    const menuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    showContextMenu(menuEvent, charId);
  }, LONG_PRESS_DURATION);
  
  // 通常のホバー処理も実行
  onCardHover(event.currentTarget, charId);
}

/**
 * カードのタッチ移動処理（長押しキャンセル用）
 */
function handleCardTouchMove(event) {
  if (!longPressTimer) return;
  
  // 移動量を計算
  const touch = event.touches[0];
  const moveX = Math.abs(touch.clientX - touchStartX);
  const moveY = Math.abs(touch.clientY - touchStartY);
  
  // 一定以上移動したら長押しをキャンセル
  if (moveX > MOVE_THRESHOLD || moveY > MOVE_THRESHOLD) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    longPressTriggered = false;
  }
}

/**
 * カードのタッチ終了処理
 */
function handleCardTouchEnd(event) {
  // 長押しタイマーをクリア
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // 長押しが発動していた場合はクリックイベントを抑制
  if (longPressTriggered) {
    event.preventDefault();
    longPressTriggered = false;
  }
  
  // 通常のホバー解除処理
  onCardLeave();
}

/**
 * キャラクター画像をクリップボードにコピー
 * @param {object} character - キャラクターデータ
 */
async function copyCharacterImage(character) {
  try {
    const imgArr = character.img ? character.img.split('|') : ['placeholder.png'];
    const imagePath = `img/${imgArr[0]}`;
    
    // 画像をフェッチしてBlobに変換
    const response = await fetch(imagePath);
    const blob = await response.blob();
    
    // クリップボードに書き込み
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    
    showNotification('画像をクリップボードにコピーしました');
  } catch (error) {
    console.error('画像のコピーに失敗:', error);
    showNotification('画像のコピーに失敗しました', 'error');
  }
}

/**
 * キャラクターのリンクをクリップボードにコピー
 * @param {number} charId - キャラクターID
 */
async function copyCharacterLink(charId) {
  try {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('id', charId);
    
    await navigator.clipboard.writeText(currentUrl.toString());
    addNotification('URLをコピーしました！', 'success');
  } catch (error) {
    console.error('リンクのコピーに失敗:', error);
    addNotification('URLのコピーに失敗しました', 'error');
  }
}

/**
 * キャラクターデータをJSONとしてクリップボードにコピー
 * @param {object} character - キャラクターデータ
 */
async function copyCharacterData(character) {
  try {
    const jsonData = JSON.stringify(character, null, 2);
    await navigator.clipboard.writeText(jsonData);
    showNotification('データをクリップボードにコピーしました');
  } catch (error) {
    console.error('データのコピーに失敗:', error);
    showNotification('データのコピーに失敗しました', 'error');
  }
}

/**
 * コンテキストメニューからお気に入りを切り替え（メニューを閉じない）
 * @param {number} charId - キャラクターID
 */
function toggleFavoriteFromContextMenu(charId) {
  console.log('toggleFavoriteFromContextMenu called for charId:', charId); // デバッグログ
  
  // お気に入りを切り替え
  toggleFavorite(charId);
  
  // メニューのお気に入りアイテムのテキストとアイコンを更新
  updateContextMenuFavoriteItem(charId);
  
  // 通知を表示
  const isFavorite = favorites.includes(charId);
  const character = characters.find(c => c.id === charId);
  const characterName = character ? (character.name ? character.name[0] : 'キャラクター') : 'キャラクター';
  showNotification(
    isFavorite ? `${characterName}をお気に入りに追加しました` : `${characterName}をお気に入りから削除しました`
  );
  
  console.log('toggleFavoriteFromContextMenu completed, menu should stay open'); // デバッグログ
}

/**
 * コンテキストメニューのお気に入りアイテムを更新
 * @param {number} charId - キャラクターID
 */
function updateContextMenuFavoriteItem(charId) {
  const contextMenu = document.getElementById('characterContextMenu');
  if (!contextMenu) return;
  
  const isFavorite = favorites.includes(charId);
  const favoriteItem = contextMenu.querySelector('.context-menu-item:nth-child(2)'); // 2番目のアイテム（お気に入り）
  
  if (favoriteItem) {
    const newIcon = isFavorite 
      ? '<svg viewBox="0 0 24 24" fill="#ff6b00" stroke="#ff6b00" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    
    const newText = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
    
    favoriteItem.innerHTML = `${newIcon}<span>${newText}</span>`;
  }
}
function showNotification(message, type = 'success') {
  // 既存の通知を削除
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    z-index: 10002;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    background: ${type === 'error' ? '#ff4757' : '#2ed573'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  
  document.body.appendChild(notification);
  
  // アニメーション表示
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });
  
  // 3秒後に自動削除
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// グローバルクリックでコンテキストメニューを閉じる（メニュー内のクリックは除外）
document.addEventListener('click', function(event) {
  if (currentContextMenu && !currentContextMenu.contains(event.target)) {
    hideContextMenu();
  }
});
document.addEventListener('scroll', hideContextMenu);
window.addEventListener('resize', hideContextMenu);

// カード要素の右クリックメニューイベントを設定
document.addEventListener('contextmenu', function(event) {
  const cardElement = event.target.closest('.card');
  if (cardElement) {
    event.preventDefault();
    event.stopPropagation();
    
    const charId = parseInt(cardElement.getAttribute('data-char-id'));
    if (charId) {
      showContextMenu(event, charId);
    }
    return false;
  }
});

// 画像の右クリックメニューとドラッグを無効化
document.addEventListener('DOMContentLoaded', function() {
  // 既存の画像要素に対して
  const images = document.querySelectorAll('.card img');
  images.forEach(img => {
    img.addEventListener('contextmenu', function(e) {
      // 画像の右クリックのみを防止（カードの右クリックは許可）
      e.stopPropagation();
      e.preventDefault();
      return false;
    });
    img.addEventListener('dragstart', function(e) {
      e.preventDefault();
      return false;
    });
  });
});

// 動的に追加される画像に対してもイベントを設定

/**
 * 武器詳細のURLを生成する
 * @param {number} characterId - キャラクターID
 * @param {number} weaponIndex - 武器のインデックス（0から開始）
 * @returns {string} 武器詳細のURL
 */
function generateWeaponDetailUrl(characterId, weaponIndex = 0) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?id=${characterId}&weapon=${weaponIndex}&tab=weapon`;
}

/**
 * 武器情報のHTMLコンテンツを生成する
 * @param {Array} weapons - 武器の配列
 * @param {number} characterId - キャラクターID（URL生成用）
 * @returns {string} 武器情報のHTML
 */
function generateWeaponContent(weapons, characterId = null) {
  if (!weapons || !Array.isArray(weapons) || weapons.length === 0) {
    return '<div class="no-weapon">このキャラクターには武器情報がありません</div>';
  }

  return weapons.map((weapon, weaponIndex) => {
    const name = Array.isArray(weapon.name) ? weapon.name[0] : weapon.name;
    const nameEn = Array.isArray(weapon.name) && weapon.name[1] ? weapon.name[1] : '';
    const displayName = currentDisplayLanguage === 'en' && nameEn ? nameEn : name;
    
    // 武器詳細へのリンクURLを生成
    const weaponDetailUrl = characterId ? generateWeaponDetailUrl(characterId, weaponIndex) : null;
    
    return `
      <div class="weapon-info">
        <div class="weapon-name">
          ${weaponDetailUrl ? 
            `<a href="${weaponDetailUrl}" class="weapon-link" onclick="updateWeaponUrl(${characterId}, ${weaponIndex}); return false;">${displayName || 'N/A'}</a>` :
            `${displayName || 'N/A'}`
          }
        </div>
        <div class="weapon-description">${weapon.description || 'N/A'}</div>
      </div>
    `;
  }).join('');
}

/**
 * 武器詳細URLを更新する
 * @param {number} characterId - キャラクターID
 * @param {number} weaponIndex - 武器インデックス
 */
function updateWeaponUrl(characterId, weaponIndex = 0) {
  const newUrl = generateWeaponDetailUrl(characterId, weaponIndex);
  // ブラウザの履歴にURLを追加（ページリロードしない）
  window.history.pushState({characterId, weaponIndex, tab: 'weapon'}, '', newUrl);
}

/**
 * タブを切り替える
 * @param {string} tabName - 表示するタブ名（'basic' または 'weapon'）
 * @param {HTMLElement} clickedTab - クリックされたタブボタン
 */
function switchTab(tabName, clickedTab) {
  // すべてのタブコンテンツを非表示にする
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  // すべてのタブナビゲーションからactiveクラスを削除
  const tabNavItems = document.querySelectorAll('.tab-nav-item');
  tabNavItems.forEach(nav => {
    nav.classList.remove('active');
  });

  // 指定されたタブコンテンツを表示
  const targetTab = document.getElementById(`${tabName}-tab`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // クリックされたタブナビゲーションにactiveクラスを追加
  if (clickedTab) {
    clickedTab.classList.add('active');
  }

  // 画像の切り替え処理
  switchCharacterImage(tabName);
  
  // 名前の切り替え処理
  switchCharacterName(tabName);
  
  // URL更新処理
  const detailsContainer = document.getElementById('characterDetails');
  if (detailsContainer) {
    const charId = parseInt(detailsContainer.dataset.charId);
    const imgIndex = parseInt(detailsContainer.dataset.imgIndex) || 0;
    
    if (charId && tabName === 'weapon') {
      // 武器タブの場合、武器詳細URLに更新
      updateWeaponUrl(charId, 0);
    } else if (charId) {
      // 基本情報タブの場合、通常のキャラクター詳細URLに更新
      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = imgIndex > 0 ? `${baseUrl}?id=${charId}&img=${imgIndex}` : `${baseUrl}?id=${charId}`;
      window.history.pushState({characterId: charId, imgIndex, tab: 'basic'}, '', newUrl);
    }
  }
  
  // サムネイル（別スタイル）ボタンの表示/非表示
  const thumbnailList = document.querySelector('.thumbnail-list');
  if (thumbnailList) {
    if (tabName === 'weapon') {
      thumbnailList.style.display = 'none';  // 武器詳細時は非表示
    } else {
      thumbnailList.style.display = '';  // 基本情報時は表示
    }
  }
}

/**
 * タブに応じて表示画像を切り替える
 * @param {string} tabName - 表示するタブ名（'basic' または 'weapon'）
 */
function switchCharacterImage(tabName) {
  const detailsContainer = document.getElementById('characterDetails');
  const charId = parseInt(detailsContainer.dataset.charId);
  const imgIndex = parseInt(detailsContainer.dataset.imgIndex) || 0;
  const character = characters.find(c => c.id === charId);
  
  console.log('switchCharacterImage called:', { tabName, charId, character: character?.name });
  
  if (!character) return;

  const detailImage = document.querySelector('.detail-image');
  if (!detailImage) return;

  if (tabName === 'weapon' && character.weapon && character.weapon.length > 0) {
    // 武器タブの場合：最初の武器の画像を表示
    const firstWeapon = character.weapon[0];
    console.log('First weapon:', firstWeapon);
    if (firstWeapon.img) {
      const weaponImagePath = `./img/${firstWeapon.img}`;
      console.log('Setting weapon image path:', weaponImagePath);
      
      // 画像の存在確認
      const testImage = new Image();
      testImage.onload = function() {
        console.log('武器画像の読み込み成功:', weaponImagePath);
        detailImage.src = weaponImagePath;
        const weaponName = Array.isArray(firstWeapon.name) ? firstWeapon.name[0] : firstWeapon.name;
        detailImage.alt = `${weaponName}の画像`;
        // detailImage.classList.add('weapon-display-image');
      };
      testImage.onerror = function() {
        console.error('武器画像が見つかりません:', weaponImagePath);
        // 武器画像が見つからない場合はキャラクター画像を維持
        const imgArr = Array.isArray(character.img) ? character.img : [character.img];
        const img = imgArr[imgIndex] || imgArr[0];
        detailImage.src = `img/${img}`;
        // detailImage.classList.remove('weapon-display-image');
      };
      testImage.src = weaponImagePath;
    }
  } else {
    // 基本情報タブの場合：キャラクター画像を表示
    const imgArr = Array.isArray(character.img) ? character.img : [character.img];
    const img = imgArr[imgIndex] || imgArr[0];
    const nameArr = Array.isArray(character.name) ? character.name : [character.name];
    const name = nameArr[imgIndex] || nameArr[0];
    
    detailImage.src = `img/${img}`;
    detailImage.alt = `${name}の画像`;
    // detailImage.classList.remove('weapon-display-image');
    detailImage.onerror = function() {
      this.src = 'img/placeholder.png';
    };
  }
}

/**
 * タブに応じて表示名を切り替える
 * @param {string} tabName - 表示するタブ名（'basic' または 'weapon'）
 */
function switchCharacterName(tabName) {
  const detailsContainer = document.getElementById('characterDetails');
  const charId = parseInt(detailsContainer.dataset.charId);
  const imgIndex = parseInt(detailsContainer.dataset.imgIndex) || 0;
  const character = characters.find(c => c.id === charId);
  
  if (!character) return;

  const titleElement = document.querySelector('.character-title-row h1');
  if (!titleElement) return;

  console.log('switchCharacterName called:', { tabName, charId, character: character, weapon: character.weapon });

  if (tabName === 'weapon' && character.weapon && character.weapon.length > 0) {
    // 武器タブの場合：武器名を表示
    const firstWeapon = character.weapon[0];
    console.log('First weapon:', firstWeapon);
    if (firstWeapon && firstWeapon.name) {
      const weaponNames = Array.isArray(firstWeapon.name) ? firstWeapon.name : [firstWeapon.name];
      const weaponName = weaponNames[0] || 'Unknown Weapon';  // 日本語名
      const weaponNameEn = weaponNames[1] || '';  // 英語名
      const displayWeaponName = currentDisplayLanguage === 'en' && weaponNameEn ? weaponNameEn : weaponName;
      console.log('Setting weapon name:', displayWeaponName);
      titleElement.textContent = displayWeaponName;
      titleElement.classList.add('weapon-title');
    } else {
      console.log('No weapon name found, setting Unknown Weapon');
      titleElement.textContent = 'Unknown Weapon';
      titleElement.classList.add('weapon-title');
    }
  } else {
    // 基本情報タブの場合：キャラクター名を表示
    const nameArr = Array.isArray(character.name) ? character.name : [character.name];
    const nameEnArr = Array.isArray(character.name_en) ? character.name_en : [character.name_en];
    const name = nameArr[imgIndex] || nameArr[0];
    const nameEn = nameEnArr[imgIndex] || nameEnArr[0];
    const displayName = currentDisplayLanguage === 'en' && nameEn ? nameEn : name;
    titleElement.textContent = displayName;
    titleElement.classList.remove('weapon-title');
  }
}

// グローバル関数として公開
window.generateWeaponContent = generateWeaponContent;
window.generateWeaponDetailUrl = generateWeaponDetailUrl;
window.updateWeaponUrl = updateWeaponUrl;
window.switchTab = switchTab;
window.switchCharacterImage = switchCharacterImage;
window.switchCharacterName = switchCharacterName;
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) { // Element node
        const images = node.querySelectorAll ? node.querySelectorAll('.card img') : [];
        images.forEach(img => {
          img.addEventListener('contextmenu', function(e) {
            // 画像の右クリックのみを防止（カードの右クリックは許可）
            e.stopPropagation();
            e.preventDefault();
            return false;
          });
          img.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
          });
        });
      }
    });
  });
});

// オブザーバーを開始
observer.observe(document.body, {
  childList: true,
  subtree: true
});

/**
 * 武器アイコン表示モードを切り替える
 */
function toggleWeaponIconDisplay() {
  // モードを循環切り替え
  if (weaponIconDisplayMode === 'filterOnly') {
    weaponIconDisplayMode = 'always';
  } else if (weaponIconDisplayMode === 'always') {
    weaponIconDisplayMode = 'never';
  } else {
    weaponIconDisplayMode = 'filterOnly';
  }
  
  // 表示テキストを更新
  updateWeaponIconStatusText();
  
  // カードを再レンダリング
  filterCharacters();
  
  // 設定をローカルストレージに保存
  localStorage.setItem('weaponIconDisplayMode', weaponIconDisplayMode);
}

/**
 * 武器アイコン状態テキストを更新
 */
function updateWeaponIconStatusText() {
  const statusElement = document.getElementById('weaponIconStatus');
  if (statusElement) {
    let statusText = '';
    switch (weaponIconDisplayMode) {
      case 'filterOnly':
        statusText = 'フィルター時のみ';
        break;
      case 'always':
        statusText = '常に表示';
        break;
      case 'never':
        statusText = '非表示';
        break;
    }
    statusElement.textContent = statusText;
  }
}

// ページ読み込み時に設定を復元
document.addEventListener('DOMContentLoaded', function() {
  const savedMode = localStorage.getItem('weaponIconDisplayMode');
  if (savedMode && ['filterOnly', 'always', 'never'].includes(savedMode)) {
    weaponIconDisplayMode = savedMode;
  }
  updateWeaponIconStatusText();
  
  // 検索設定を復元
  const savedWeaponSearch = localStorage.getItem('weaponSearchEnabled');
  if (savedWeaponSearch !== null) {
    weaponSearchEnabled = savedWeaponSearch === 'true';
  }
  
  const savedCustomTagSearch = localStorage.getItem('customTagSearchEnabled');
  if (savedCustomTagSearch !== null) {
    customTagSearchEnabled = savedCustomTagSearch === 'true';
  }
  
  const savedHighlight = localStorage.getItem('highlightEnabled');
  if (savedHighlight !== null) {
    highlightEnabled = savedHighlight === 'true';
  }
  
  // 並び順設定を復元
  const savedSortOrder = localStorage.getItem('sortOrder');
  if (savedSortOrder && ['world', 'id', 'name', 'random', 'custom'].includes(savedSortOrder)) {
    currentSortOrder = savedSortOrder;
  }
  
  // カスタムタグごとの並び順設定を復元
  const savedTagSortOrders = localStorage.getItem('tagSortOrders');
  if (savedTagSortOrders) {
    try {
      tagSortOrders = JSON.parse(savedTagSortOrders);
    } catch (e) {
      console.error('タグ並び順設定の読み込みエラー:', e);
      tagSortOrders = {};
    }
  }
  
  // カスタム並び順を復元
  const savedCustomOrder = localStorage.getItem('customCharacterOrder');
  if (savedCustomOrder) {
    try {
      customCharacterOrder = JSON.parse(savedCustomOrder);
    } catch (e) {
      console.error('カスタム並び順の読み込みエラー:', e);
      customCharacterOrder = [];
    }
  }
  
  // タグごとのカスタム並び順を復元
  const savedTagCustomOrders = localStorage.getItem('tagCustomOrders');
  if (savedTagCustomOrders) {
    try {
      tagCustomOrders = JSON.parse(savedTagCustomOrders);
    } catch (e) {
      console.error('タグカスタム並び順の読み込みエラー:', e);
      tagCustomOrders = {};
    }
  }
  
  updateWeaponSearchStatusText();
  updateCustomTagSearchStatusText();
  updateHighlightStatusText();
  updateSortOrderStatusText();
});

// グローバル関数として公開
window.toggleWeaponIconDisplay = toggleWeaponIconDisplay;

/**
 * 武器検索設定の切り替え
 */
function toggleWeaponSearch() {
  weaponSearchEnabled = !weaponSearchEnabled;
  localStorage.setItem('weaponSearchEnabled', weaponSearchEnabled.toString());
  updateWeaponSearchStatusText();
}

/**
 * カスタムタグ検索設定の切り替え
 */
function toggleCustomTagSearch() {
  customTagSearchEnabled = !customTagSearchEnabled;
  localStorage.setItem('customTagSearchEnabled', customTagSearchEnabled.toString());
  updateCustomTagSearchStatusText();
}

/**
 * 武器検索設定のステータステキストを更新
 */
function updateWeaponSearchStatusText() {
  const statusElement = document.getElementById('weaponSearchStatus');
  if (statusElement) {
    statusElement.textContent = weaponSearchEnabled ? 'オン' : 'オフ';
  }
}

/**
 * カスタムタグ検索設定のステータステキストを更新
 */
function updateCustomTagSearchStatusText() {
  const statusElement = document.getElementById('customTagSearchStatus');
  if (statusElement) {
    statusElement.textContent = customTagSearchEnabled ? 'オン' : 'オフ';
  }
}

/**
 * 強調表示設定の切り替え
 */
function toggleHighlightMode() {
  highlightEnabled = !highlightEnabled;
  localStorage.setItem('highlightEnabled', highlightEnabled.toString());
  updateHighlightStatusText();
}

/**
 * 強調表示設定のステータステキストを更新
 */
function updateHighlightStatusText() {
  const statusElement = document.getElementById('highlightStatus');
  if (statusElement) {
    statusElement.textContent = highlightEnabled ? 'オン' : 'オフ';
  }
}

/**
 * 並び順を切り替える
 */
function toggleSortOrder() {
  const orders = ['world', 'id', 'name', 'random', 'custom'];
  const currentIndex = orders.indexOf(currentSortOrder);
  currentSortOrder = orders[(currentIndex + 1) % orders.length];
  localStorage.setItem('sortOrder', currentSortOrder);
  updateSortOrderStatusText();
  filterCharacters(); // 並び順変更後に再描画
}

/**
 * 並び順のステータステキストを更新
 */
function updateSortOrderStatusText() {
  const statusElement = document.getElementById('sortOrderStatus');
  if (statusElement) {
    const labels = {
      'world': '世界線ごと',
      'id': 'ID順',
      'name': '名前順',
      'random': 'ランダム',
      'custom': 'カスタム'
    };
    statusElement.textContent = labels[currentSortOrder] || '世界線ごと';
  }
}

/**
 * キャラクター配列に並び順を適用
 * @param {Array} characters - キャラクター配列
 * @param {string} sortOrder - 'id', 'name', 'random'
 * @returns {Array} 並び替えられたキャラクター配列
 */
function applySortOrder(chars, sortOrder) {
  const sorted = [...chars]; // コピーを作成
  
  switch(sortOrder) {
    case 'world':
      // 世界線ごとに並び替え（worldの値順）
      sorted.sort((a, b) => {
        const worldA = Number(a.world) || 0;
        const worldB = Number(b.world) || 0;
        return worldA - worldB;
      });
      break;
    case 'name':
      sorted.sort((a, b) => {
        const nameA = Array.isArray(a.name) ? a.name[0] : a.name;
        const nameB = Array.isArray(b.name) ? b.name[0] : b.name;
        return nameA.localeCompare(nameB, 'ja');
      });
      break;
    case 'random':
      // Fisher-Yatesシャッフル
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;
    case 'custom':
      // カスタム並び順を適用
      const orderArray = getCurrentCustomOrder();
      if (orderArray && orderArray.length > 0) {
        // orderArrayに含まれるキャラクターを順序通りに配置
        const orderedChars = [];
        const charMap = new Map(sorted.map(c => [c.id, c]));
        
        orderArray.forEach(charId => {
          if (charMap.has(charId)) {
            orderedChars.push(charMap.get(charId));
            charMap.delete(charId);
          }
        });
        
        // orderArrayに含まれないキャラクターを後ろに追加
        const remainingChars = Array.from(charMap.values()).sort((a, b) => a.id - b.id);
        return [...orderedChars, ...remainingChars];
      } else {
        // カスタム順が未設定の場合はID順
        sorted.sort((a, b) => a.id - b.id);
      }
      break;
    case 'id':
    default:
      sorted.sort((a, b) => a.id - b.id);
      break;
  }
  
  return sorted;
}

/**
 * 現在のコンテキストに応じたカスタム並び順を取得
 */
function getCurrentCustomOrder() {
  // カスタムタグフィルターが1つだけ有効な場合は、そのタグのカスタム順
  if (activeFilters.customTags.length === 1) {
    const tagId = activeFilters.customTags[0];
    return tagCustomOrders[tagId] || customCharacterOrder;
  }
  // それ以外はグローバルなカスタム順
  return customCharacterOrder;
}

/**
 * 使い方ガイドを表示
 */
function showUsageGuide() {
  console.log('showUsageGuide 関数が呼び出されました');
  const popup = document.getElementById('usageGuidePopup');
  console.log('popup 要素:', popup);
  if (popup) {
    popup.style.display = 'block';
    // モーダル表示時のスクロール防止
    document.body.classList.add('modal-open');
    console.log('使い方ガイドが表示されました');
  } else {
    console.error('usageGuidePopup 要素が見つかりません');
  }
}

/**
 * 使い方ガイドを閉じる
 */
function closeUsageGuide() {
  const popup = document.getElementById('usageGuidePopup');
  if (popup) {
    popup.style.display = 'none';
    // スクロール防止を解除
    document.body.classList.remove('modal-open');
  }
}

// グローバル関数として公開
window.toggleWeaponSearch = toggleWeaponSearch;
window.toggleCustomTagSearch = toggleCustomTagSearch;
window.toggleHighlightMode = toggleHighlightMode;
window.toggleSortOrder = toggleSortOrder;
window.startCustomSortMode = startCustomSortMode;
window.showUsageGuide = showUsageGuide;
window.closeUsageGuide = closeUsageGuide;

// ===============================================
// 編集モード関連の関数
// ===============================================

/**
 * 編集モードの切り替え
 */
function toggleEditMode() {
  isEditMode = !isEditMode;
  const editModeBtn = document.getElementById('editModeBtn');
  const editToolbar = document.getElementById('editToolbar');
  const editModeStatus = document.getElementById('editModeStatus');
  
  if (isEditMode) {
    editModeBtn.classList.add('active');
    editModeStatus.textContent = 'オン';
    editToolbar.style.display = 'block';
    selectedCharacters.clear();
    updateSelectedCount();
    // デフォルトは選択モード
    editSubMode = 'select';
    updateEditSubModeUI();
    
    // カードにedit-modeクラスを追加
    setTimeout(() => {
      const allCards = document.querySelectorAll('.card');
      allCards.forEach(card => {
        card.classList.add('edit-mode');
      });
    }, 0);
  } else {
    editModeBtn.classList.remove('active');
    editModeStatus.textContent = 'オフ';
    editToolbar.style.display = 'none';
    selectedCharacters.clear();
    // 並び替えモードが有効なら終了
    if (isCustomSortModeActive) {
      endCustomSortMode();
    }
    
    // カードから編集関連のクラスを削除
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
      card.classList.remove('edit-mode', 'selected');
    });
  }
  
  // カード表示を更新
  filterCharacters();
  
  // ハンバーガーメニューを閉じる
  toggleHamburgerMenu();
}

/**
 * 編集サブモード切り替え
 */
function switchEditSubMode(mode) {
  if (!isEditMode) return;
  
  const prevMode = editSubMode;
  editSubMode = mode;
  
  if (mode === 'select') {
    // 並び替えモードを終了
    if (isCustomSortModeActive) {
      endCustomSortMode();
    }
    selectedCharacters.clear();
    updateSelectedCount();
    
    // カードの選択チェックボックスを表示
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
      card.classList.add('edit-mode');
      card.classList.remove('selected');
    });
  } else if (mode === 'sort') {
    // 選択をクリア
    selectedCharacters.clear();
    
    // カードから編集モードのクラスを削除（チェックボックスを非表示）
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
      card.classList.remove('edit-mode', 'selected');
    });
    
    // 並び替えモードを開始
    startEditModeSortMode();
  }
  
  updateEditSubModeUI();
}

/**
 * 編集サブモードUIを更新
 */
function updateEditSubModeUI() {
  const selectBtn = document.getElementById('editSubModeSelectBtn');
  const sortBtn = document.getElementById('editSubModeSortBtn');
  const selectActions = document.getElementById('selectModeActions');
  const sortActions = document.getElementById('sortModeActions');
  const editModeInfo = document.getElementById('editModeInfo');
  
  if (!selectBtn || !sortBtn || !selectActions || !sortActions || !editModeInfo) {
    console.warn('編集モードUI要素が見つかりません');
    return;
  }
  
  if (editSubMode === 'select') {
    selectBtn.classList.add('active');
    sortBtn.classList.remove('active');
    selectActions.style.display = 'flex';
    sortActions.style.display = 'none';
    editModeInfo.style.display = 'inline';
  } else if (editSubMode === 'sort') {
    selectBtn.classList.remove('active');
    sortBtn.classList.add('active');
    selectActions.style.display = 'none';
    sortActions.style.display = 'flex';
    editModeInfo.style.display = 'none';
  }
}

/**
 * 編集モード内で並び替えモードを開始
 */
function startEditModeSortMode() {
  const characterListContainer = document.getElementById('characterList');
  const cards = Array.from(characterListContainer.querySelectorAll('.card'));
  
  if (cards.length === 0) {
    alert('キャラクターが表示されていません。まず検索またはフィルターでキャラクターを表示してください。');
    editSubMode = 'select';
    updateEditSubModeUI();
    return;
  }
  
  isCustomSortModeActive = true;
  enableCardDragging();
}

/**
 * 編集モード内で並び替えをキャンセル
 */
function cancelEditModeSort() {
  editSubMode = 'select';
  endCustomSortMode();
  updateEditSubModeUI();
  filterCharacters();
}

/**
 * 並び替えモードを終了（内部処理）
 */
function endCustomSortMode() {
  isCustomSortModeActive = false;
  tempSortOrder = [];
  
  const characterListContainer = document.getElementById('characterList');
  
  if (characterListContainer) {
    characterListContainer.removeEventListener('dragover', handleContainerDragOver);
    characterListContainer.removeEventListener('drop', handleContainerDrop);
  }
  
  const cards = document.querySelectorAll('.card.sortable-card');
  cards.forEach(card => {
    card.draggable = false;
    card.classList.remove('sortable-card', 'dragging');
    card.removeEventListener('dragstart', handleCardDragStart);
    card.removeEventListener('dragend', handleCardDragEnd);
  });
}

/**
 * カードクリック処理（編集モード対応）
 */
function handleCardClick(charId, event) {
  // 長押しが発動していた場合はクリックを無視
  if (longPressTriggered) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  if (isEditMode && editSubMode === 'select') {
    event.preventDefault();
    event.stopPropagation();
    toggleCharacterSelection(charId);
  } else if (isEditMode && editSubMode === 'sort') {
    // 並び替えモード中はクリック無効
    event.preventDefault();
    event.stopPropagation();
  } else {
    showCharacterDetails(charId);
  }
}

/**
 * キャラクター選択状態の切り替え
 */
function toggleCharacterSelection(charId) {
  if (selectedCharacters.has(charId)) {
    selectedCharacters.delete(charId);
  } else {
    selectedCharacters.add(charId);
  }
  
  updateSelectedCount();
  updateCardSelectionUI(charId);
  updateBulkTagButtonState();
}

/**
 * 選択数の更新
 */
function updateSelectedCount() {
  const selectedCountEl = document.getElementById('selectedCount');
  if (selectedCountEl) {
    selectedCountEl.textContent = selectedCharacters.size;
  }
}

/**
 * カードの選択状態UIを更新
 */
function updateCardSelectionUI(charId) {
  const cardElement = document.querySelector(`[data-char-id="${charId}"]`);
  if (cardElement) {
    if (selectedCharacters.has(charId)) {
      cardElement.classList.add('selected');
    } else {
      cardElement.classList.remove('selected');
    }
  }
}

/**
 * 全選択
 */
function selectAllCharacters() {
  const visibleCards = document.querySelectorAll('.card[data-char-id]');
  visibleCards.forEach(card => {
    const charId = parseInt(card.getAttribute('data-char-id'));
    selectedCharacters.add(charId);
    card.classList.add('selected');
  });
  
  updateSelectedCount();
  updateBulkTagButtonState();
}

/**
 * 選択解除
 */
function clearSelection() {
  selectedCharacters.clear();
  
  const selectedCards = document.querySelectorAll('.card.selected');
  selectedCards.forEach(card => {
    card.classList.remove('selected');
  });
  
  updateSelectedCount();
  updateBulkTagButtonState();
}

/**
 * 一括タグ追加ボタンの状態更新
 */
function updateBulkTagButtonState() {
  const bulkTagBtn = document.getElementById('bulkTagBtn');
  if (bulkTagBtn) {
    bulkTagBtn.disabled = selectedCharacters.size === 0;
  }
}

/**
 * 一括タグ編集ポップアップを表示
 */
async function showBulkTagEditor() {
  if (selectedCharacters.size === 0) return;
  
  try {
    // カスタムタグをIndexedDBから読み込み
    if (Object.keys(customTags).length === 0 && characterDB.db) {
      customTags = await characterDB.getAllCustomTags();
    }
    
    // 選択数を表示
    const bulkEditSelectedCount = document.getElementById('bulkEditSelectedCount');
    if (bulkEditSelectedCount) {
      bulkEditSelectedCount.textContent = selectedCharacters.size;
    }
    
    // ポップアップを表示
    document.getElementById('bulkTagEditPopup').style.display = 'block';
    document.body.classList.add('modal-open');
    
    // タグ選択リストを更新
    renderBulkTagSelectionList();
    
  } catch (error) {
    console.error('一括タグ編集ポップアップ表示エラー:', error);
  }
}

/**
 * 一括タグ編集ポップアップを閉じる
 */
function closeBulkTagEditor() {
  document.getElementById('bulkTagEditPopup').style.display = 'none';
  document.body.classList.remove('modal-open');
  
  // 選択状態をリセット
  const selectedTagElements = document.querySelectorAll('#bulkTagSelectionList .tag-item.selected');
  selectedTagElements.forEach(el => el.classList.remove('selected'));
  
  updateApplyBulkTagsButtonState();
}　

/**
 * 一括タグ選択リストのレンダリング
 */
function renderBulkTagSelectionList() {
  const container = document.getElementById('bulkTagSelectionList');
  if (!container) return;
  
  // カスタムタグ一覧を表示
  const tagKeys = Object.keys(customTags).sort();
  
  if (tagKeys.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">カスタムタグがありません</p>';
    return;
  }
  
  const html = tagKeys.map(tagKey => {
    const tag = customTags[tagKey];
    return `
      <div class="tag-item" data-tag-key="${tagKey}" onclick="toggleBulkTagSelection('${tagKey}')">
        <span class="tag-color" style="background-color: ${tag.color}"></span>
        <span class="tag-name">${tag.name}</span>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
}

/**
 * 一括タグ選択の切り替え
 */
function toggleBulkTagSelection(tagKey) {
  const tagElement = document.querySelector(`#bulkTagSelectionList .tag-item[data-tag-key="${tagKey}"]`);
  if (tagElement) {
    tagElement.classList.toggle('selected');
    updateApplyBulkTagsButtonState();
  }
}

/**
 * 一括タグ適用ボタンの状態更新
 */
function updateApplyBulkTagsButtonState() {
  const applyBtn = document.getElementById('bulkApplyBtn');
  const selectedTags = document.querySelectorAll('#bulkTagSelectionList .tag-item.selected');
  
  if (applyBtn) {
    applyBtn.disabled = selectedTags.length === 0;
  }
}

/**
 * 一括タグ適用
 */
async function applyBulkTags() {
  const selectedTagElements = document.querySelectorAll('#bulkTagSelectionList .tag-item.selected');
  const selectedTagKeys = Array.from(selectedTagElements).map(el => el.getAttribute('data-tag-key'));
  
  if (selectedTagKeys.length === 0 || selectedCharacters.size === 0) return;
  
  try {
    // 各キャラクターにタグを追加
    for (const charId of selectedCharacters) {
      // 現在のタグを取得
      const currentTags = characterTags[charId] || [];
      
      // 新しいタグを追加（重複を避ける）
      const updatedTags = [...new Set([...currentTags, ...selectedTagKeys])];
      
      // IndexedDBに保存
      await characterDB.saveCharacterTags(charId, updatedTags);
    }
    
    // キャラクタータグデータを再読み込み
    characterTags = await characterDB.getAllCharacterTags();
    
    // 成功通知
    const tagNames = selectedTagKeys.map(key => customTags[key]?.name || key).join('、');
    addNotification(`${selectedCharacters.size}人のキャラに${tagNames}のタグを付与しました`, 'success');
    
    // ポップアップを閉じる
    closeBulkTagEditor();
    
    // 編集モードを終了
    if (isEditMode) {
      toggleEditMode();
    }
    
    // フィルターを更新してタグの追加を反映
    filterCharacters();
    
  } catch (error) {
    console.error('一括タグ適用エラー:', error);
    addNotification('タグの追加に失敗しました', 'error');
  }
}

/**
 * 一括編集用のタグ作成フォーム表示切り替え
 */
function toggleBulkTagCreateForm() {
  const form = document.getElementById('bulkTagCreateForm');
  const toggleBtn = document.getElementById('bulkTagCreateToggle');
  
  if (!form || !toggleBtn) return;
  
  if (form.style.display === 'none' || !form.style.display) {
    form.style.display = 'block';
    toggleBtn.textContent = '作成をキャンセル';
    
    // 入力フィールドをクリア
    const nameInput = document.getElementById('bulkNewTagName');
    const colorInput = document.getElementById('bulkNewTagColor');
    if (nameInput) nameInput.value = '';
    if (colorInput) colorInput.value = '#3b82f6';
    
    // 名前入力にフォーカス
    if (nameInput) nameInput.focus();
  } else {
    form.style.display = 'none';
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      新しいタグを作成
    `;
  }
}

/**
 * 一括編集用の新規タグ作成
 */
async function createBulkTag() {
  const nameInput = document.getElementById('bulkNewTagName');
  const colorInput = document.getElementById('bulkNewTagColor');
  
  if (!nameInput || !colorInput) return;
  
  const name = nameInput.value.trim();
  const color = colorInput.value;
  
  if (!name) {
    alert('タグ名を入力してください');
    nameInput.focus();
    return;
  }
  
  // 既存のタグ名と重複チェック
  const existingTag = Object.values(customTags).find(tag => tag.name.toLowerCase() === name.toLowerCase());
  if (existingTag) {
    alert('同じ名前のタグが既に存在します');
    nameInput.focus();
    return;
  }
  
  try {
    // 新しいタグを作成
    const tagId = 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const tagData = { name, color };
    
    // IndexedDBに保存
    if (characterDB.db) {
      await characterDB.saveCustomTag(tagId, tagData);
    }
    
    // メモリ上でも更新
    customTags[tagId] = tagData;
    
    // フォームを閉じる
    toggleBulkTagCreateForm();
    
    // タグ選択リストを更新
    renderBulkTagSelectionList();
    
    // 作成したタグを自動選択
    setTimeout(() => {
      const newTagElement = document.querySelector(`#bulkTagSelectionList .tag-item[data-tag-key="${tagId}"]`);
      if (newTagElement) {
        newTagElement.classList.add('selected');
        updateApplyBulkTagsButtonState();
      }
    }, 100);
    
    addNotification(`タグ「${name}」を作成しました`, 'success');
    
  } catch (error) {
    console.error('タグ作成エラー:', error);
    addNotification('タグの作成に失敗しました', 'error');
  }
}

// グローバル関数として公開
window.toggleEditMode = toggleEditMode;
window.handleCardClick = handleCardClick;
window.handleCardTouchStart = handleCardTouchStart;
window.handleCardTouchMove = handleCardTouchMove;
window.handleCardTouchEnd = handleCardTouchEnd;
window.selectAllCharacters = selectAllCharacters;
window.clearSelection = clearSelection;
window.showBulkTagEditor = showBulkTagEditor;
window.closeBulkTagEditor = closeBulkTagEditor;
window.toggleBulkTagSelection = toggleBulkTagSelection;
window.applyBulkTags = applyBulkTags;
window.toggleBulkTagCreateForm = toggleBulkTagCreateForm;
window.createBulkTag = createBulkTag;

// カスタムタグ関連の関数をグローバルに公開
window.showTagSelectionPopup = showTagSelectionPopup;
window.closeTagSelectionPopup = closeTagSelectionPopup;
window.showCustomTagsFromMenu = showCustomTagsFromMenu;
window.closeCustomTagsPopup = closeCustomTagsPopup;
window.showCreateTagForm = showCreateTagForm;
window.hideCreateTagForm = hideCreateTagForm;
window.createNewTag = createNewTag;
window.toggleTagSelection = toggleTagSelection;
window.editCustomTag = editCustomTag;
window.deleteCustomTag = deleteCustomTag;
window.cycleTagSortOrder = cycleTagSortOrder;

// ===============================================
// フィルター情報表示機能
// ===============================================

/**
 * フィルター情報ポップアップの表示/非表示を切り替え
 */
function toggleFilterInfo() {
  const popup = document.getElementById('filterInfoPopup');
  const btn = document.getElementById('filterInfoBtn');
  if (!popup || !btn) return;
  
  if (filterInfoPopupVisible) {
    hideFilterInfo();
  } else {
    showFilterInfo();
  }
}

/**
 * フィルター情報ポップアップを表示
 */
function showFilterInfo() {
  const popup = document.getElementById('filterInfoPopup');
  const btn = document.getElementById('filterInfoBtn');
  if (!popup || !btn) return;
  
  // タイマーをクリア
  if (filterInfoHoverTimer) {
    clearTimeout(filterInfoHoverTimer);
    filterInfoHoverTimer = null;
  }
  
  // 既に表示されている場合は何もしない
  if (filterInfoPopupVisible) return;
  
  // 表示する
  updateFilterInfoContent();
  
  // ボタンの位置を取得
  const btnRect = btn.getBoundingClientRect();
  const popupWidth = 300; // 推定最大幅
  const margin = 12;
  
  // 画面サイズに応じて位置を調整
  let left, top;
  
  if (window.innerWidth > 900) {
    // PC: ボタンの右側に表示
    const rightSpace = window.innerWidth - (btnRect.right + margin + popupWidth);
    if (rightSpace > 0) {
      // 右側に十分なスペースがある
      left = btnRect.right + margin;
    } else {
      // 右側にスペースがない場合は左側に表示
      left = btnRect.left - popupWidth - margin;
      if (left < 0) {
        // 左側にもスペースがない場合は画面中央に
        left = (window.innerWidth - popupWidth) / 2;
      }
    }
    top = btnRect.top;
  } else {
    // モバイル: ボタンの下に表示
    left = btnRect.left;
    top = btnRect.bottom + 10;
    
    // 画面外に出る場合は調整
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }
  }
  
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.display = 'block';
  
  // フェードイン
  setTimeout(() => {
    popup.classList.add('visible');
  }, 10);
  
  filterInfoPopupVisible = true;
}

/**
 * フィルター情報ポップアップを非表示
 */
function hideFilterInfo() {
  const popup = document.getElementById('filterInfoPopup');
  if (!popup) return;
  
  popup.classList.remove('visible');
  filterInfoPopupVisible = false;
  setTimeout(() => {
    popup.style.display = 'none';
  }, 180);
}

/**
 * フィルター情報ポップアップを遅延表示（ホバー用）
 */
function showFilterInfoDelayed() {
  // タイマーをクリア
  if (filterInfoHoverTimer) {
    clearTimeout(filterInfoHoverTimer);
  }
  
  // 300ms後に表示
  filterInfoHoverTimer = setTimeout(() => {
    showFilterInfo();
  }, 300);
}

/**
 * フィルター情報ポップアップを遅延非表示（ホバー用）
 */
function hideFilterInfoDelayed() {
  // タイマーをクリア
  if (filterInfoHoverTimer) {
    clearTimeout(filterInfoHoverTimer);
  }
  
  // 200ms後に非表示
  filterInfoHoverTimer = setTimeout(() => {
    hideFilterInfo();
  }, 200);
}

/**
 * フィルター情報の内容を更新
 */
function updateFilterInfoContent() {
  const listElement = document.getElementById('filterInfoList');
  if (!listElement) return;
  
  const filterItems = [];
  
  // 世界線フィルター
  if (activeFilters.world && activeFilters.world.length > 0) {
    const values = activeFilters.world.map(w => {
      const displayName = getDisplayTerm('world', w, currentDisplayLanguage);
      return `<span class="filter-info-tag">${displayName}</span>`;
    }).join('');
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">世界線</span>
        <div class="filter-info-values">${values}</div>
      </div>
    `);
  }
  
  // 種族フィルター
  if (activeFilters.race && activeFilters.race.length > 0) {
    const values = activeFilters.race.map(r => {
      const displayName = getDisplayTerm('race', r, currentDisplayLanguage);
      return `<span class="filter-info-tag">${displayName}</span>`;
    }).join('');
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">種族</span>
        <div class="filter-info-values">${values}</div>
      </div>
    `);
  }
  
  // 戦闘スタイルフィルター
  if (activeFilters.fightingStyle && activeFilters.fightingStyle.length > 0) {
    const values = activeFilters.fightingStyle.map(fs => {
      const displayName = getDisplayTerm('fightingStyle', fs, currentDisplayLanguage);
      return `<span class="filter-info-tag">${displayName}</span>`;
    }).join('');
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">戦闘スタイル</span>
        <div class="filter-info-values">${values}</div>
      </div>
    `);
  }
  
  // 属性フィルター
  if (activeFilters.attribute && activeFilters.attribute.length > 0) {
    const values = activeFilters.attribute.map(a => {
      const displayName = getDisplayTerm('attribute', a, currentDisplayLanguage);
      return `<span class="filter-info-tag">${displayName}</span>`;
    }).join('');
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">属性</span>
        <div class="filter-info-values">${values}</div>
      </div>
    `);
  }
  
  // グループフィルター
  if (activeFilters.group && activeFilters.group.length > 0) {
    const values = activeFilters.group.map(g => {
      const displayName = getDisplayTerm('group', g, currentDisplayLanguage);
      return `<span class="filter-info-tag">${displayName}</span>`;
    }).join('');
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">グループ</span>
        <div class="filter-info-values">${values}</div>
      </div>
    `);
  }
  
  // カスタムタグフィルター
  if (activeFilters.customTags && activeFilters.customTags.length > 0) {
    const values = activeFilters.customTags.map(tagId => {
      const tag = customTags[tagId];
      if (!tag) return '';
      return `<span class="filter-info-tag custom-tag" style="background-color: ${tag.color};">${tag.name}</span>`;
    }).filter(v => v).join('');
    if (values) {
      filterItems.push(`
        <div class="filter-info-item">
          <span class="filter-info-label">カスタムタグ</span>
          <div class="filter-info-values">${values}</div>
        </div>
      `);
    }
  }
  
  // お気に入りフィルター
  if (favoritesOnly) {
    filterItems.push(`
      <div class="filter-info-item">
        <span class="filter-info-label">その他</span>
        <div class="filter-info-values"><span class="filter-info-tag">お気に入り</span></div>
      </div>
    `);
  }
  
  // メモ済みフィルター
  if (memoOnly) {
    const lastItemIndex = filterItems.length - 1;
    if (favoritesOnly && lastItemIndex >= 0) {
      // お気に入りと同じ「その他」に追加
      filterItems[lastItemIndex] = filterItems[lastItemIndex].replace(
        '</div>\n      </div>',
        '<span class="filter-info-tag">メモ済み</span></div>\n      </div>'
      );
    } else {
      filterItems.push(`
        <div class="filter-info-item">
          <span class="filter-info-label">その他</span>
          <div class="filter-info-values"><span class="filter-info-tag">メモ済み</span></div>
        </div>
      `);
    }
  }
  
  // ユニーク武器フィルター
  if (uniqueWeaponOnly) {
    const lastItemIndex = filterItems.length - 1;
    if ((favoritesOnly || memoOnly) && lastItemIndex >= 0) {
      // 「その他」に追加
      filterItems[lastItemIndex] = filterItems[lastItemIndex].replace(
        '</div>\n      </div>',
        '<span class="filter-info-tag">ユニーク武器</span></div>\n      </div>'
      );
    } else {
      filterItems.push(`
        <div class="filter-info-item">
          <span class="filter-info-label">その他</span>
          <div class="filter-info-values"><span class="filter-info-tag">ユニーク武器</span></div>
        </div>
      `);
    }
  }
  
  if (filterItems.length > 0) {
    listElement.innerHTML = filterItems.join('');
  } else {
    listElement.innerHTML = '<div style="color: #999; font-size: 12px;">フィルターが適用されていません</div>';
  }
}

/**
 * フィルター情報アイコンの表示/非表示を更新
 */
function updateFilterInfoButtonVisibility() {
  const filterInfoBtn = document.getElementById('filterInfoBtn');
  const filterButton = document.getElementById('filterButton');
  if (!filterInfoBtn || !filterButton) return;
  
  // フィルターが適用されているかチェック
  const hasActiveFilters = 
    (activeFilters.world && activeFilters.world.length > 0) ||
    (activeFilters.race && activeFilters.race.length > 0) ||
    (activeFilters.fightingStyle && activeFilters.fightingStyle.length > 0) ||
    (activeFilters.attribute && activeFilters.attribute.length > 0) ||
    (activeFilters.group && activeFilters.group.length > 0) ||
    (activeFilters.customTags && activeFilters.customTags.length > 0) ||
    favoritesOnly ||
    memoOnly ||
    uniqueWeaponOnly;
  
  // フィルターが適用されている場合のみアイコンを表示
  if (hasActiveFilters) {
    filterInfoBtn.style.display = 'flex';
    filterButton.classList.add('has-info');
  } else {
    filterInfoBtn.style.display = 'none';
    filterButton.classList.remove('has-info');
  }
}

/**
 * フィルター情報ポップアップを閉じる（外側クリック用）
 */
function closeFilterInfoOnOutsideClick(event) {
  const popup = document.getElementById('filterInfoPopup');
  const btn = document.getElementById('filterInfoBtn');
  
  if (!popup || !btn) return;
  if (!filterInfoPopupVisible) return;
  
  // クリックされた要素がポップアップ内でもボタンでもない場合は閉じる
  if (!popup.contains(event.target) && !btn.contains(event.target)) {
    popup.style.display = 'none';
    filterInfoPopupVisible = false;
  }
}

// グローバル関数として公開
window.toggleFilterInfo = toggleFilterInfo;
window.showFilterInfoDelayed = showFilterInfoDelayed;
window.hideFilterInfoDelayed = hideFilterInfoDelayed;
window.showFilterInfo = showFilterInfo;
window.clearFiltersFromPopup = clearFiltersFromPopup;

// ページ読み込み時にイベントリスナーを設定
document.addEventListener('DOMContentLoaded', () => {
  // 外側クリックでポップアップを閉じる
  document.addEventListener('click', closeFilterInfoOnOutsideClick);
  
  // ホバーイベントを設定
  const filterInfoBtn = document.getElementById('filterInfoBtn');
  const filterInfoPopup = document.getElementById('filterInfoPopup');
  
  if (filterInfoBtn) {
    filterInfoBtn.addEventListener('mouseenter', showFilterInfoDelayed);
    filterInfoBtn.addEventListener('mouseleave', hideFilterInfoDelayed);
  }
  
  if (filterInfoPopup) {
    filterInfoPopup.addEventListener('mouseenter', () => {
      // ポップアップ上にマウスがある場合は非表示タイマーをクリア
      if (filterInfoHoverTimer) {
        clearTimeout(filterInfoHoverTimer);
        filterInfoHoverTimer = null;
      }
    });
    filterInfoPopup.addEventListener('mouseleave', hideFilterInfoDelayed);
  }
});
