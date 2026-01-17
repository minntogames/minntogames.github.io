// ===============================================
// バージョン管理・キャッシュ制御システム
// ===============================================

(function() {
  'use strict';

  const VERSION_CHECK_KEY = 'characterPageVersion';
  const VERSION_API_URL = 'version.php';

  /**
   * バージョン情報を取得
   */
  async function fetchVersion() {
    try {
      const response = await fetch(VERSION_API_URL + '?_=' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('バージョン情報の取得に失敗しました');
      }
      
      return await response.json();
    } catch (error) {
      console.warn('バージョンチェックエラー:', error);
      return null;
    }
  }

  /**
   * ローカルストレージからバージョン情報を取得
   */
  function getLocalVersion() {
    try {
      const stored = localStorage.getItem(VERSION_CHECK_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('ローカルバージョンの取得エラー:', error);
      return null;
    }
  }

  /**
   * ローカルストレージにバージョン情報を保存
   */
  function saveLocalVersion(versionData) {
    try {
      localStorage.setItem(VERSION_CHECK_KEY, JSON.stringify(versionData));
    } catch (error) {
      console.warn('バージョン情報の保存エラー:', error);
    }
  }

  /**
   * キャッシュをクリアしてページをリロード
   */
  async function clearCacheAndReload() {
    console.log('新しいバージョンが検出されました。キャッシュをクリアしてリロードします...');
    
    // Service Workerのキャッシュをクリア（存在する場合）
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (error) {
        console.warn('Service Worker クリアエラー:', error);
      }
    }

    // キャッシュストレージをクリア
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      } catch (error) {
        console.warn('キャッシュクリアエラー:', error);
      }
    }

    // ハードリロード（Ctrl+Shift+R相当）を実行
    // Cache-Control: no-cacheヘッダー付きでリクエスト
    const currentUrl = window.location.href;
    
    // 一時的なiframeを使ってキャッシュをバイパス
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // iframeで新しいバージョンをプリロード
    iframe.src = currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_nocache=' + Date.now();
    
    // 少し待ってからリロード
    setTimeout(() => {
      window.location.href = currentUrl + (currentUrl.includes('?') ? '&' : '?') + '_v=' + Date.now();
    }, 300);
  }

  /**
   * スクリプトを動的に再読み込み
   */
  function reloadScript(scriptSrc) {
    return new Promise((resolve, reject) => {
      // 既存のスクリプトタグを探す
      const oldScript = document.querySelector(`script[src*="${scriptSrc.split('?')[0]}"]`);
      
      // 新しいスクリプトタグを作成
      const newScript = document.createElement('script');
      newScript.src = scriptSrc + '?v=' + Date.now();
      newScript.async = false;
      
      newScript.onload = () => {
        console.log(`スクリプト再読み込み成功: ${scriptSrc}`);
        resolve();
      };
      
      newScript.onerror = () => {
        console.error(`スクリプト再読み込み失敗: ${scriptSrc}`);
        reject(new Error(`Failed to load ${scriptSrc}`));
      };
      
      // 古いスクリプトを削除してから新しいスクリプトを追加
      if (oldScript && oldScript.parentNode) {
        oldScript.parentNode.removeChild(oldScript);
      }
      
      document.body.appendChild(newScript);
    });
  }

  /**
   * バージョン情報をDOMに表示
   */
  function displayVersionInfo(versionData) {
    const versionNumberElement = document.getElementById('versionNumber');
    const versionTimestampElement = document.getElementById('versionTimestamp');
    
    if (versionNumberElement && versionData) {
      versionNumberElement.textContent = versionData.version;
    }
    
    if (versionTimestampElement && versionData && versionData.updated) {
      const date = new Date(versionData.updated * 1000);
      const formattedDate = date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      versionTimestampElement.textContent = `更新: ${formattedDate}`;
    }
  }

  /**
   * バージョンチェックを実行
   */
  async function checkVersion() {
    const localVersion = getLocalVersion();
    const serverVersion = await fetchVersion();

    if (!serverVersion) {
      // サーバーバージョンが取得できない場合はチェックをスキップ
      console.log('サーバーバージョンの取得に失敗したため、バージョンチェックをスキップします');
      // ローカルバージョンがあれば表示
      if (localVersion) {
        displayVersionInfo(localVersion);
      }
      return;
    }

    // バージョン情報を表示
    displayVersionInfo(serverVersion);

    console.log('ローカルバージョン:', localVersion);
    console.log('サーバーバージョン:', serverVersion);

    // 初回アクセスまたはバージョンが異なる場合
    if (!localVersion || 
        localVersion.version !== serverVersion.version || 
        localVersion.updated !== serverVersion.updated) {
      
      console.log('バージョンの変更を検出しました');
      
      // 通知を表示（オプション）
      if (localVersion && typeof addNotification === 'function') {
        addNotification('新しいバージョンが利用可能です。更新しています...', 'info');
      }
      
      // バージョン情報を保存
      saveLocalVersion(serverVersion);
      
      // キャッシュをクリアしてリロード
      await clearCacheAndReload();
    } else {
      console.log('バージョンは最新です');
    }
  }

  /**
   * 手動でバージョンチェックを実行する関数（デバッグ用）
   */
  window.forceVersionCheck = async function() {
    console.log('手動バージョンチェックを実行します...');
    await checkVersion();
  };

  /**
   * バージョン情報をリセットする関数（デバッグ用）
   */
  window.resetVersionInfo = function() {
    localStorage.removeItem(VERSION_CHECK_KEY);
    console.log('バージョン情報をリセットしました');
  };

  /**
   * URLからバージョン管理用のパラメータを削除
   */
  function cleanupUrlParameters() {
    const url = new URL(window.location.href);
    let hasChanges = false;

    // バージョンチェック用のパラメータを削除
    if (url.searchParams.has('_v')) {
      url.searchParams.delete('_v');
      hasChanges = true;
    }
    
    if (url.searchParams.has('_nocache')) {
      url.searchParams.delete('_nocache');
      hasChanges = true;
    }

    // URLが変更された場合のみ履歴を更新
    if (hasChanges) {
      const cleanUrl = url.toString();
      window.history.replaceState(window.history.state, '', cleanUrl);
      console.log('URLパラメータをクリーンアップしました');
      
      // クリーンアップ成功後に通知を表示
      setTimeout(() => {
        if (typeof addNotification === 'function') {
          addNotification('最新バージョンに更新されました', 'success');
        }
      }, 500);
    }
  }

  // ページロード完了後にURLをクリーンアップ
  function onPageLoadComplete() {
    cleanupUrlParameters();
    checkVersion();
  }

  // ページロード時にバージョンチェックとURLクリーンアップを実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoadComplete);
  } else {
    onPageLoadComplete();
  }

  // 定期的なバージョンチェック（オプション：30分ごと）
  // setInterval(checkVersion, 30 * 60 * 1000);

})();
