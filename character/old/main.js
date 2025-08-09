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
  customTags: [] // カスタムタグフィルター追加
};

// カスタムタグ関連の変数
let customTags = {}; // カスタムタグのデータ {tagId: {name, color, characterIds: []}}
let characterTags = {}; // キャラクターIDとタグIDの関連付け {characterId: [tagId1, tagId2, ...]}
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

// ===============================================
// IndexedDB管理クラス
// ===============================================

class CharacterDB {
  constructor() {
    this.dbName = 'CharacterDatabase';
    this.dbVersion = 2; // カスタムタグ機能追加のためバージョンアップ
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
    alert('BMCDデータのインポートが完了しました。');
  } catch (error) {
    console.error('データインポートエラー:', error);
    if (error.message.includes('BMCDファイル')) {
      alert(error.message);
    } else if (error.message.includes('JSON')) {
      alert('BMCDファイルの形式が正しくありません。正しいBMCDファイルを選択してください。');
    } else {
      alert('データのインポートに失敗しました。正しいBMCDファイルか確認してください。');
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
  manager.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    z-index: 10000;
    min-width: 280px;
    max-width: 400px;
  `;
  
  manager.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
      <h4 style="margin: 0; color: #333; font-size: 1.2em;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        データ管理
      </h4>
      <button onclick="showDataManager()" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer; padding: 0; line-height: 1;" title="閉じる">&times;</button>
    </div>
    <div style="margin-bottom: 12px;">
      <button onclick="exportAllData()" class="data-manager-btn export-btn" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-bottom: 8px; padding: 12px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.18s;">
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
      <button onclick="document.getElementById('importFile').click()" class="data-manager-btn import-btn" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; background: linear-gradient(135deg, #28a745, #1e7e34); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.18s;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        インポート
      </button>
    </div>
    <p style="font-size: 12px; color: #666; margin: 0; text-align: center; line-height: 1.4;">
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
    
    console.log('アプリケーション初期化完了');
  } catch (error) {
    console.error('アプリケーション初期化エラー:', error);
    // IndexedDBが使用できない場合でも継続
    console.log('IndexedDBなしモードで動作します');
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
    
    // PHP側で指定されたキャラクターIDもチェック
    const initialCharacterId = window.initialCharacterId;
    
    // URLパラメータまたはPHP側のIDが指定されている場合
    const targetId = id && !isNaN(Number(id)) ? Number(id) : initialCharacterId;
    
    if (targetId) {
      showCharacterDetails(targetId, img && !isNaN(Number(img)) ? Number(img) : 0);
      document.getElementById('detailsPopup').style.display = 'block';
      updateHamburgerMenuVisibility();
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
        const enLowerCase = settings[type].en[i].toLowerCase();
        const jaLowerCase = settings[type].ja[i].toLowerCase();

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
  if (world === "1") worldClass = "card-world-1";
  else if (world === "2") worldClass = "card-world-2";
  else if (world === "3") worldClass = "card-world-3";

  const isFavorite = favorites.includes(char.id);

  return `
    <div class="card ${worldClass}" data-char-id="${char.id}"
      onmouseenter="onCardHover(this, ${char.id})"
      onmouseleave="onCardLeave()"
      ontouchstart="onCardHover(this, ${char.id})"
      ontouchend="onCardLeave()"
    >
      <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
              onclick="event.stopPropagation(); toggleFavorite(${char.id})"
              title="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}"
              aria-label="${isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFavorite ? '#ff6b00' : 'none'}" stroke="${isFavorite ? '#ff6b00' : '#666'}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <div class="imgframe" onclick="showCharacterDetails(${char.id})">
        <img src="img/${imgArr[0]}" alt="${nameArr[0]}の画像" onerror="this.src='img/placeholder.png';" style="width:${imgWidth};object-position:${objectPosition};">
      </div>
      <h2 title="${displayName}" onclick="showCharacterDetails(${char.id})">${displayNameShort}</h2>
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
      if (nameArr.some(n => (n || '').toLowerCase() === keyword) ||
          nameEnArr.some(n => (n || '').toLowerCase() === keyword)) {
        matchType = 'exact';
      } else if (
        nameArr.some(n => (n || '').toLowerCase().includes(keyword)) ||
        nameEnArr.some(n => (n || '').toLowerCase().includes(keyword))
      ) {
        matchType = 'partial';
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
      const raceMatch = activeFilters.race.length === 0 ||
        c.race.some(r => {
          const canonicalRace = languageMaps.race[r.toLowerCase()] || r.toLowerCase();
          return activeFilters.race.includes(canonicalRace);
        });
      const styleMatch = activeFilters.fightingStyle.length === 0 ||
        (Array.isArray(fightingStyleArr[i] || fightingStyleArr[0])
          ? (fightingStyleArr[i] || fightingStyleArr[0]).some(s => {
              const canonicalStyle = languageMaps.fightingStyle[(s || '').toLowerCase()] || (s || '').toLowerCase();
              return activeFilters.fightingStyle.includes(canonicalStyle);
            })
          : false);
      const attrMatch = activeFilters.attribute.length === 0 ||
        (Array.isArray(attributeArr[i] || attributeArr[0])
          ? (attributeArr[i] || attributeArr[0]).some(a => {
              const canonicalAttr = languageMaps.attribute[(a || '').toLowerCase()] || (a || '').toLowerCase();
              return activeFilters.attribute.includes(canonicalAttr);
            })
          : false);
      const groupMatch = activeFilters.group.length === 0 ||
        c.group.some(g => {
          const canonicalGroup = languageMaps.group[g.toLowerCase()] || g.toLowerCase();
          return activeFilters.group.includes(canonicalGroup);
        });
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
      
      if (raceMatch && styleMatch && attrMatch && groupMatch && worldMatch && favoritesMatch && memoMatch && customTagsMatch) {
        filterMatch = true;
        break;
      }
    }

    if (filterMatch && matchType === 'exact') exactMatches.push(c);
    else if (filterMatch && matchType === 'partial') partialMatches.push(c);
  });

  // 重複除去（完全一致が優先)
  partialMatches = partialMatches.filter(c => !exactMatches.includes(c));
  const filtered = [...exactMatches, ...partialMatches];

  if (filtered.length > 0) {
    characterListContainer.innerHTML = filtered.map(renderCharacter).join("");
    noCharactersMessage.style.display = 'none';
  } else {
    characterListContainer.innerHTML = '';
    noCharactersMessage.style.display = 'block';
  }
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
    const index = activeFilters.favorites.indexOf('favorites');
    if (index === -1) {
      activeFilters.favorites.push('favorites');
    } else {
      activeFilters.favorites.splice(index, 1);
    }
    return;
  }
  
  // メモ済みフィルターの特別処理
  if (type === 'memo') {
    const index = activeFilters.memo.indexOf('memo');
    if (index === -1) {
      activeFilters.memo.push('memo');
    } else {
      activeFilters.memo.splice(index, 1);
    }
    return;
  }
  
  // フィルターの表示値(日本語)を正規の英語名に変換してactiveFiltersに格納
  const canonicalValue = type === 'world' ? value : (languageMaps[type][value.toLowerCase()] || value.toLowerCase());
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
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
}

/**
 * フィルターを適用し、ポップアップを閉じる
 */
function applyFilters() {
  filterCharacters();
  toggleFilterPopup();
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
    customTags: []
  };
  
  // お気に入りフィルターもクリア
  favoritesOnly = false;
  
  // メモ済みフィルターもクリア
  memoOnly = false;
  
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
  let canonicalEnTerm = languageMaps[type][lowerCaseTermInCharacterData];

  // マッピングが見つからない場合、日本語から英語への逆引きを試行
  if (!canonicalEnTerm && displayLanguageMaps[type] && displayLanguageMaps[type].enToJa) {
    // 日本語から英語への逆引き
    for (const [enTerm, jaTerm] of Object.entries(displayLanguageMaps[type].enToJa)) {
      if (jaTerm.toLowerCase() === lowerCaseTermInCharacterData) {
        canonicalEnTerm = enTerm;
        break;
      }
    }
  }

  // それでも見つからない場合、その用語自体が正規の英語であると仮定
  if (!canonicalEnTerm) {
    return actualTerm; // 変換せずにそのまま返す
  }

  // 2. 正規の英語用語をターゲット言語の表示名に変換
  if (targetLanguage === 'ja') {
    return displayLanguageMaps[type].enToJa[canonicalEnTerm] || actualTerm;
  } else if (targetLanguage === 'en') {
    return displayLanguageMaps[type].enToEn[canonicalEnTerm] || actualTerm;
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
const themeOrder = ['light', 'dark', 'modern'];

function setThemeCookie(theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}
function getThemeCookie() {
  const m = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  return m ? m[1] : null;
}

function applyTheme(theme) {
  const body = document.body;
  body.classList.remove('theme-dark', 'theme-modern');
  if (theme === 'dark') body.classList.add('theme-dark');
  if (theme === 'modern') body.classList.add('theme-modern');
  currentTheme = theme;
  updateThemeButtonText();
  setThemeCookie(theme);
}

function toggleTheme() {
  let idx = themeOrder.indexOf(currentTheme);
  idx = (idx + 1) % themeOrder.length;
  applyTheme(themeOrder[idx]);
}

function updateThemeButtonText() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    let label = 'テーマ切替 (現在: ライト)';
    if (currentTheme === 'dark') label = 'テーマ切替 (現在: ダーク)';
    if (currentTheme === 'modern') label = 'テーマ切替 (現在: モダン)';
    btn.textContent = label;
  }
}

// ページロード時にテーマを初期化（cookie対応）
window.addEventListener('DOMContentLoaded', () => {
  const saved = getThemeCookie();
  if (themeOrder.includes(saved)) {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
});

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
    const attributeArr = Array.isArray(character.attribute && character.attribute[0]) && Array.isArray(character.attribute[0])
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
        <h2 style="margin:0;">${displayName}</h2>
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

    detailsContainer.innerHTML = `
      <div class="character-detail-content">
        <img src="img/${img}" alt="${name}の画像" onerror="this.src='img/placeholder.png';" class="detail-image">
        ${thumbnailsHtml}
        ${titleRowHtml}
        <p><strong>${getTranslatedLabel('description')}:</strong> ${desc || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('world')}:</strong> ${character.world || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('race')}:</strong> ${character.race.map(r => getDisplayTerm('race', r, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('fightingStyle')}:</strong> ${fightingStyle.map(s => getDisplayTerm('fightingStyle', s, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('attribute')}:</strong> ${attribute.map(a => getDisplayTerm('attribute', a, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('height')}:</strong> ${character.height ? character.height + ' cm' : 'N/A'}</p>
        ${character.age !== undefined && character.age !== null ? `<p><strong>${getTranslatedLabel('age')}:</strong> ${character.age}</p>` : ''}
        <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${convertYearToCalendar(character.birthday.year)}${character.birthday.month}${getTranslatedLabel('month')}${character.birthday.day}${getTranslatedLabel('day')}` : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('group')}:</strong> ${character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
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
    
    // データセット属性を設定
    detailsContainer.dataset.charId = charId;
    detailsContainer.dataset.imgIndex = imgIndex;
    
    // メモ表示を更新
    updateNoteDisplay(charId);
    
    // カスタムタグ表示を更新
    updateCharacterTagDisplay(charId);
    
    renderRelatedCharacters(character.group, character.id, false); // ←showAll=falseで初回5件
    renderRelationCharacters(character.id);
    detailsPopup.style.display = 'block';
    updateHamburgerMenuVisibility();
  }
}

/**
 * キャラクター詳細画面を閉じる
 */
function closeDetailsPopup() {
  document.getElementById('detailsPopup').style.display = 'none';
  updateHamburgerMenuVisibility(); // ▼詳細閉じたらメニュー再表示
}

/**
 * 関連キャラクターのカードをレンダリングする
 * @param {string[]} groups - 関連キャラクターを検索するグループの配列
 * @param {number} currentId - 現在表示中のキャラクターのID
 */
function renderRelatedCharacters(groups, currentId, showAll = false) {
  const relatedContainer = document.getElementById('relatedCharacters');
  // 現在のキャラクターと同じグループに属するキャラクターをフィルタリング
  let related = characters.filter(c => 
    c.id !== currentId &&
    c.group.some(g => {
      const canonicalGroups = groups.map(gName => languageMaps.group[gName.toLowerCase()] || gName.toLowerCase());
      const characterGroups = c.group.map(cName => languageMaps.group[cName.toLowerCase()] || cName.toLowerCase());
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
    relatedContainer.innerHTML = related.map(renderCharacter).join('');
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
    // 詳細ポップアップのpopup-content内のcharacterDetailsの直後に挿入
    const details = document.getElementById('characterDetails');
    relationContainer = document.createElement('div');
    relationContainer.id = relationContainerId;
    relationContainer.style.marginTop = '30px';
    details.parentNode.insertBefore(relationContainer, details.nextSibling);
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
      // 背景クリックで閉じる
      setTimeout(() => {
        document.addEventListener('click', closeHamburgerOnOutside, { capture: true });
      }, 0);
    } else {
      document.removeEventListener('click', closeHamburgerOnOutside, true);
    }
  }
}
function closeHamburgerOnOutside(e) {
  const drawer = document.getElementById('hamburgerDrawer');
  const btn = document.getElementById('hamburgerBtn');
  if (!drawer.contains(e.target) && (!btn || !btn.contains(e.target))) {
    drawer.classList.remove('open');
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
 * 名前予測候補を表示する
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
        id: c.id,
        name: nameArr[0] || '',
        name_en: nameEnArr[0] || '',
        name_kana: nameKana || ''
      });
    }
  });

  // 重複除去
  candidates = candidates.filter((v, i, arr) =>
    arr.findIndex(x => x.id === v.id) === i
  );

  // 最大10件まで
  candidates = candidates.slice(0, 10);

  if (candidates.length === 0) {
    suggestionsDiv.style.display = 'none';
    suggestionsDiv.innerHTML = '';
    suggestionActiveIndex = -1;
    return;
  }

  // 候補リスト描画
  suggestionsDiv.innerHTML = candidates.map((c, idx) =>
    `<div class="suggestion-item${idx === suggestionActiveIndex ? ' active' : ''}" 
      onclick="selectNameSuggestion(${c.id})">${c.name} <span style="color:#888;font-size:0.95em;">${c.name_en ? ' / ' + c.name_en : ''}${c.name_kana ? ' / ' + c.name_kana : ''}</span></div>`
  ).join('');
  suggestionsDiv.style.display = 'block';
}

/**
 * 予測候補クリック時の処理
 */
function selectNameSuggestion(charId) {
  const char = characters.find(c => c.id === charId);
  if (!char) return;
  // 入力欄に日本語名をセット
  const nameArr = Array.isArray(char.name) ? char.name : [char.name];
  document.getElementById('searchName').value = nameArr[0] || '';
  document.getElementById('nameSuggestions').style.display = 'none';
  suggestionActiveIndex = -1;
  filterCharacters();
}

/**
 * 予測候補のキーボード操作
 */
function handleSuggestionKey(e) {
  const suggestionsDiv = document.getElementById('nameSuggestions');
  const items = suggestionsDiv.querySelectorAll('.suggestion-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    suggestionActiveIndex = (suggestionActiveIndex + 1) % items.length;
    updateSuggestionActive();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    suggestionActiveIndex = (suggestionActiveIndex - 1 + items.length) % items.length;
    updateSuggestionActive();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (suggestionActiveIndex >= 0 && suggestionActiveIndex < items.length) {
      items[suggestionActiveIndex].click();
    }
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
  searchInput.addEventListener('input', function() {
    clearBtn.style.display = this.value ? 'flex' : 'none';
  });
  // 初期化時も
  clearBtn.style.display = searchInput.value ? 'flex' : 'none';

  // ▼追加: フォーカス時にキーワードがあれば予測候補を再表示
  searchInput.addEventListener('focus', function() {
    if (this.value && this.value.trim()) {
      showNameSuggestions();
    }
  });
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
});

// ウィンドウリサイズ時にカードを再描画
window.addEventListener('resize', () => {
  filterCharacters();
});

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
window.closeDetailsPopup = closeDetailsPopup;
window.toggleLanguage = toggleLanguage; // 新しい言語切り替え関数を公開
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.toggleTheme = toggleTheme;

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
    showCopyPopup('URLをコピーしました！');
  });
}

/**
 * コピー通知ミニポップアップを表示
 */
function showCopyPopup(msg) {
  let popup = document.getElementById('copyPopup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'copyPopup';
    popup.className = 'copy-popup';
    document.body.appendChild(popup);
  }
  popup.textContent = msg;
  popup.classList.add('visible');
  setTimeout(() => {
    popup.classList.remove('visible');
  }, 1600);
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
  document.getElementById('detailsPopup').style.display = 'block';
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
    closeNoteEditor();
  } catch (error) {
    console.error('メモ保存処理エラー:', error);
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
    const isPopupOpen = detailsPopup.style.display === 'block';
    
    // Escape でポップアップを閉じる
    if (e.key === 'Escape' && isPopupOpen) {
      closeDetailsPopup();
      return;
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
    
    // タグ一覧を更新
    renderCustomTagsList();
    
  } catch (error) {
    console.error('カスタムタグ読み込みエラー:', error);
    // エラー時はデフォルト値で初期化
    customTags = {};
    characterTags = {};
    document.getElementById('customTagsPopup').style.display = 'block';
    renderCustomTagsList();
  }
}

/**
 * カスタムタグ一覧ポップアップを閉じる
 */
function closeCustomTagsPopup() {
  document.getElementById('customTagsPopup').style.display = 'none';
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
  
  Object.entries(customTags).forEach(([tagId, tagData]) => {
    // このタグが使われているキャラクター数を計算
    const usageCount = Object.values(characterTags).filter(tags => tags.includes(tagId)).length;
    
    const tagElement = document.createElement('div');
    tagElement.className = 'custom-tag-item';
    tagElement.innerHTML = `
      <div class="tag-info">
        <div class="tag-color-indicator" style="background-color: ${tagData.color}"></div>
        <div class="tag-name">${escapeHtml(tagData.name)}</div>
        <div class="tag-count">${usageCount}キャラ</div>
      </div>
      <div class="tag-actions">
        <button class="tag-edit-btn" onclick="editCustomTag('${tagId}')">編集</button>
        <button class="tag-delete-btn" onclick="deleteCustomTag('${tagId}')">削除</button>
      </div>
    `;
    
    container.appendChild(tagElement);
  });
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
    
    // タグ選択リストを更新
    renderTagSelectionList(charId);
    
  } catch (error) {
    console.error('タグ選択ポップアップ表示エラー:', error);
    document.getElementById('tagSelectionPopup').style.display = 'block';
    renderTagSelectionList(charId);
  }
}

/**
 * タグ選択ポップアップを閉じる
 */
function closeTagSelectionPopup() {
  document.getElementById('tagSelectionPopup').style.display = 'none';
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
