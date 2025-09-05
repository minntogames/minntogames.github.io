<?php
// URLパラメータからIDとimgインデックスを取得
$characterId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$imgIndex = isset($_GET['img']) ? (int)$_GET['img'] : 0;
$characterData = null;
$ogTitle = 'キャラ図鑑';
$ogDescription = 'キャラクター図鑑です';
$ogImage = '';

// キャラクターデータを読み込み
if ($characterId) {
    $jsonData = file_get_contents(__DIR__ . '/cha.json');
    $characters = json_decode($jsonData, true);
    
    // 設定データを除外
    $characterList = array_slice($characters, 1);
    
    // 指定されたIDのキャラクターを検索
    foreach ($characterList as $character) {
        if (isset($character['id']) && $character['id'] == $characterId) {
            $characterData = $character;
            break;
        }
    }
    
    // キャラクターデータが見つかった場合、メタタグ用のデータを設定
    if ($characterData) {
        // 名前の処理（imgIndexに対応）
        $nameArray = is_array($characterData['name']) ? $characterData['name'] : [$characterData['name']];
        $characterName = isset($nameArray[$imgIndex]) ? $nameArray[$imgIndex] : $nameArray[0];
        $ogTitle = htmlspecialchars($characterName) . ' - キャラ図鑑';
        
        // 説明の処理（imgIndexに対応）
        $description = '';
        if (isset($characterData['description'])) {
            $descArray = is_array($characterData['description']) ? $characterData['description'] : [$characterData['description']];
            $targetDesc = isset($descArray[$imgIndex]) ? $descArray[$imgIndex] : $descArray[0];
            if ($targetDesc) {
                $description = strip_tags($targetDesc);
                // 長すぎる場合は切り詰める
                if (strlen($description) > 160) {
                    $description = mb_substr($description, 0, 157) . '...';
                }
            }
        }
        $ogDescription = htmlspecialchars($description ? $description : $characterName . 'のキャラクター情報');
        
        // 画像URLの設定（imgIndexに対応）
        if (isset($characterData['img']) && !empty($characterData['img'])) {
            $imageArray = is_array($characterData['img']) ? $characterData['img'] : [$characterData['img']];
            $targetImage = isset($imageArray[$imgIndex]) ? $imageArray[$imgIndex] : $imageArray[0];
            $ogImage = 'https://minntogames.github.io/character/img/' . htmlspecialchars($targetImage);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title><?php echo $ogTitle; ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- OGP メタタグ -->
  <meta property="og:title" content="<?php echo $ogTitle; ?>" />
  <meta property="og:description" content="<?php echo $ogDescription; ?>" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="<?php echo htmlspecialchars('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']); ?>" />
  <?php if ($ogImage): ?>
  <meta property="og:image" content="<?php echo $ogImage; ?>" />
  <?php endif; ?>
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?php echo $ogTitle; ?>" />
  <meta name="twitter:description" content="<?php echo $ogDescription; ?>" />
  <?php if ($ogImage): ?>
  <meta name="twitter:image" content="<?php echo $ogImage; ?>" />
  <?php endif; ?>
  
  <!-- 通常のメタタグ -->
  <meta name="description" content="<?php echo $ogDescription; ?>" />
  
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- ▼ハンバーガーメニュー追加 -->
  <div id="hamburgerMenu" class="hamburger-menu">
    <button id="hamburgerBtn" class="hamburger-btn" aria-label="メニュー" onclick="toggleHamburgerMenu()">
      <span></span><span></span><span></span>
    </button>
    <div id="hamburgerDrawer" class="hamburger-drawer">
      <!-- ▼バツボタンを左上に移動 -->
      <button class="hamburger-close-btn" onclick="toggleHamburgerMenu()" aria-label="閉じる" type="button">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" fill="#fff" stroke="#bbb" stroke-width="1.5"/>
          <path d="M9 9l10 10M19 9l-10 10" stroke="#888" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </button>
      <!-- ▼バツボタンと被らないように下に余白を追加 -->
      <div style="height:38px;"></div>
      
      <!-- ▼編集モードボタン -->
      <button onclick="toggleEditMode()" class="hamburger-edit-btn" id="editModeBtn" title="編集モード切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        編集モード: <span id="editModeStatus">オフ</span>
      </button>
      
      <!-- ▼設定セクション -->
      <div style="margin-top: 16px; margin-bottom: 8px; font-size: 14px; color: #666; font-weight: bold;">設定</div>
      
      <button onclick="toggleLanguage()" class="hamburger-lang-btn" id="langToggleBtn">言語切替 (現在: 日本語)</button>
      <!-- ▼テーマ切替ボタン（3テーマ対応） -->
      <button onclick="toggleTheme()" class="hamburger-theme-btn" id="themeToggleBtn">テーマ切替 (現在: ライト)</button>
      
      <button onclick="toggleWeaponIconDisplay()" class="hamburger-lang-btn" id="weaponIconToggleBtn" title="武器アイコン表示切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6.5 6.5h11L16 8.5v7L14.5 17h-5L8 15.5v-7z"/>
          <path d="M6.5 6.5L4 4"/>
          <path d="M17.5 6.5L20 4"/>
          <path d="M12 8.5V13"/>
        </svg>
        武器アイコン: <span id="weaponIconStatus">フィルター時のみ</span>
      </button>
      
      <button onclick="toggleWeaponSearch()" class="hamburger-lang-btn" id="weaponSearchToggleBtn" title="武器名での検索切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M6.5 6.5h11L16 8.5v7L14.5 17h-5L8 15.5v-7z"/>
        </svg>
        武器検索: <span id="weaponSearchStatus">有効</span>
      </button>
      
      <button onclick="toggleCustomTagSearch()" class="hamburger-lang-btn" id="customTagSearchToggleBtn" title="カスタムタグでの検索切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M21 7L9 19l-5.5-5.5 1.414-1.414L9 16.172 19.586 5.586z"/>
        </svg>
        タグ検索: <span id="customTagSearchStatus">有効</span>
      </button>
      
      <button onclick="toggleHighlightMode()" class="hamburger-lang-btn" id="highlightToggleBtn" title="予測変換の強調表示切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <rect x="3" y="7" width="3" height="2" fill="currentColor"/>
          <rect x="8" y="7" width="8" height="2" fill="currentColor"/>
        </svg>
        強調表示: <span id="highlightStatus">有効</span>
      </button>
      
      <!-- ▼データ管理セクション -->
      <div style="margin-top: 16px; margin-bottom: 8px; font-size: 14px; color: #666; font-weight: bold;">データ管理</div>
      <button onclick="showDataManagerFromMenu()" class="hamburger-lang-btn" id="dataManagerBtn" title="データのエクスポート・インポート">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        データ管理
      </button>
      <button onclick="showCustomTagsFromMenu()" class="hamburger-lang-btn" id="customTagsBtn" title="カスタムタグ管理">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7L9 19l-5.5-5.5 1.414-1.414L9 16.172 19.586 5.586z"/>
          <path d="M12 2L8 6v6l4 4 6-6V4z"/>
          <circle cx="15.5" cy="6.5" r="1.5"/>
        </svg>
        カスタムタグ
      </button>
      
      <button onclick="console.log('使い方ガイドボタンがクリックされました'); showUsageGuide();" class="hamburger-lang-btn" id="usageGuideBtn" title="サイトの使い方">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        使い方
      </button>

      <div style="margin-top: 16px; margin-bottom: 8px; font-size: 14px; color: #666; font-weight: bold;">その他</div>
      <button onclick="window.location.href='cards.html'" class="hamburger-lang-btn" id="cardsViewBtn" title="ピクセルアートスタイル表示">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
        </svg>
        カードビュー
      </button>
    </div>
  </div>

  <h1>キャラ図鑑</h1>

  <!-- ▼編集モードツールバー -->
  <div id="editToolbar" class="edit-toolbar" style="display: none;">
    <div class="edit-toolbar-content">
      <div class="edit-info">
        <span id="selectedCount">0</span>件選択中
      </div>
      <div class="edit-actions">
        <button onclick="selectAllCharacters()" class="edit-btn edit-btn-select">全選択</button>
        <button onclick="clearSelection()" class="edit-btn edit-btn-clear">選択解除</button>
        <button onclick="showBulkTagEditor()" class="edit-btn edit-btn-tag" id="bulkTagBtn" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7L9 19l-5.5-5.5 1.414-1.414L9 16.172 19.586 5.586z"/>
            <path d="M12 2L8 6v6l4 4 6-6V4z"/>
            <circle cx="15.5" cy="6.5" r="1.5"/>
          </svg>
          一括タグ追加
        </button>
      </div>
    </div>
  </div>

  <div class="search-container">
    <div class="search-input-wrapper">
      <input type="text" id="searchName" placeholder="名前で検索" autocomplete="off" oninput="showNameSuggestions()" onkeydown="handleSuggestionKey(event)">
      <!-- ▼虫メガネアイコン追加 -->
      <button type="button" id="searchIconBtn" class="search-icon-btn" onclick="filterCharacters()" tabindex="-1" aria-label="検索">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="10" cy="10" r="7" stroke="#4a88a2" stroke-width="2"/>
          <line x1="16" y1="16" x2="21" y2="21" stroke="#4a88a2" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <!-- ▼追加: クリアボタン -->
      <button type="button" id="clearSearchBtn" class="search-clear-btn" onclick="clearSearchInput()" tabindex="-1" style="display:none;">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="#fff" stroke="#bbb" stroke-width="1.5"/>
          <path d="M7 7l6 6M13 7l-6 6" stroke="#888" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div id="nameSuggestions" class="name-suggestions"></div>
    </div>
    <button onclick="filterCharacters()" class="buttonOutlineGradient"><div class="buttonOutlineGradient_item">検索</div></button>
    <button id="filterButton" onclick="toggleFilterPopup()" class="buttonOutlineGradient"><div class="buttonOutlineGradient_item">フィルター</div></button>
    <!-- ▼言語切り替えボタン削除
    <button onclick="toggleLanguage()" class="buttonOutlineGradient"><div class="buttonOutlineGradient_item" id="langToggleBtn">言語切替 (現在: 日本語)</div></button>
    -->
  </div>

  <div id="filterPopup" class="popup">
    <div class="popup-content">
      <span class="close" onclick="toggleFilterPopup()">&times;</span>
      <h3>フィルターオプション</h3>
            <!-- ▲追加ここまで -->
      <!-- ▼追加：世界線フィルター -->
      <div class="filter-section">
        <h4>世界線</h4>
        <div id="worldFilters" class="filter-options"></div>
      </div>
      <!-- ▲追加ここまで -->
      
      <div class="filter-section">
        <h4>種族</h4>
        <div id="raceFilters" class="filter-options"></div>
      </div>
      
      <div class="filter-section">
        <h4>戦闘スタイル</h4>
        <div id="fightingStyleFilters" class="filter-options"></div>
      </div>
      
      <div class="filter-section">
        <h4>属性</h4>
        <div id="attributeFilters" class="filter-options"></div>
      </div>
      
      <div class="filter-section">
        <h4>グループ</h4>
        <div id="groupFilters" class="filter-options"></div>
      </div>

      
      <!-- ▼追加：カスタムタグフィルター -->
      <div class="filter-section">
        <h4 onclick="toggleCustomTagsFilter()" style="cursor: pointer; user-select: none; position: relative;">
          カスタムタグ
          <span id="customTagsToggle" style="position: absolute; right: 0; font-size: 14px;">▼</span>
        </h4>
        <div id="customTagsFilters" class="filter-options" style="display: none;"></div>
      </div>
      <!-- ▲追加ここまで -->

      <!-- ▼追加：お気に入りフィルター -->
      <div class="filter-section">
        <h4>その他</h4>
        <div class="filter-options">
          <div id="favoritesOnlyBtn" onclick="toggleFilterOption('favorites', 'favorites', this)" class="filter-option">
            お気に入り (<span id="favoritesCount">0</span>)
          </div>
          <div id="memoOnlyBtn" onclick="toggleFilterOption('memo', 'memo', this)" class="filter-option">
            メモ済み (<span id="memoCount">0</span>)
          </div>
          <div id="uniqueWeaponBtn" onclick="toggleFilterOption('uniqueWeapon', 'uniqueWeapon', this)" class="filter-option">
            ユニーク武器
          </div>
        </div>
      </div>
      <!-- ▲追加ここまで -->
      
      <button onclick="applyFilters()" class="buttonRound">適用</button>
      <button onclick="clearFilters()" class="buttonRound">クリア</button>
    </div>
  </div>

  <!-- キャラクター詳細表示の要素 (ポップアップ型ではない) -->
  <div id="detailsPopup">
    <div class="popup-content" data-v-12839f6c>
      <span class="close" onclick="closeDetailsPopup()">&times;</span>
      <div id="characterDetails">
        <!-- キャラクターの詳細がここに表示されます -->
      </div>
      <hr data-v-12831233>
      <h3 data-v-12831233>関連キャラクター</h3>
      <div id="relatedCharacters" class="card-container">
        <!-- 関連キャラクターのカードがここに表示されます -->
      </div>
    </div>
  </div>

  <!-- カスタムタグ管理ポップアップ -->
  <div id="customTagsPopup" class="popup" style="display: none;">
    <div class="popup-content">
      <span class="close" onclick="closeCustomTagsPopup()">&times;</span>
      <h3>カスタムタグ管理</h3>
      
      <!-- 新規タグ作成ボタン -->
      <div class="custom-tag-create">
        <button onclick="showCreateTagForm()" class="tag-create-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新規タグ作成
        </button>
      </div>

      <!-- タグ作成フォーム（初期状態では非表示） -->
      <div id="tagCreateForm" class="tag-create-form" style="display: none;">
        <div class="tag-input-group">
          <input type="text" id="newTagName" placeholder="タグ名を入力" maxlength="20">
          <input type="color" id="newTagColor" value="#3b82f6" title="タグの色を選択">
          <button onclick="createNewTag()" class="tag-save-btn">保存</button>
          <button onclick="hideCreateTagForm()" class="tag-cancel-btn">キャンセル</button>
        </div>
      </div>

      <!-- タグ一覧 -->
      <div id="customTagsList" class="custom-tags-list">
        <!-- カスタムタグがここに表示されます -->
      </div>
    </div>
  </div>

  <!-- タグ選択ポップアップ（キャラ詳細で使用） -->
  <div id="tagSelectionPopup" class="popup" style="display: none;">
    <div class="popup-content">
      <span class="close" onclick="closeTagSelectionPopup()">&times;</span>
      <h3>タグを選択</h3>
      <div id="tagSelectionList" class="tag-selection-list">
        <!-- 選択可能なタグがここに表示されます -->
      </div>
    </div>
  </div>

  <div id="characterList" class="card-container"></div>
  
  <!-- キャラクターが見つからなかった場合のメッセージ -->
  <div id="noCharactersMessage" class="no-characters-message" style="display: none;">
    対象のキャラが見つかりませんでした
  </div>

  <!-- 使い方ガイドポップアップ -->
  <div id="usageGuidePopup" class="popup-overlay" style="display: none;">
    <div class="popup-content usage-guide-content">
      <span class="close" onclick="closeUsageGuide()">&times;</span>
      <h2>🎮 キャラ図鑑の使い方</h2>
      
      <div class="usage-section">
        <h3>📝 基本的な使い方</h3>
        <ul>
          <li><strong>検索</strong>: 上部の検索ボックスでキャラクター名、武器名、カスタムタグで検索できます</li>
          <li><strong>フィルター</strong>: 種族、戦闘スタイル、属性、グループで絞り込み検索ができます</li>
          <li><strong>キャラクター詳細</strong>: カードをクリックすると詳細情報が表示されます</li>
          <li><strong>お気に入り</strong>: ❤️ボタンでお気に入りに追加/削除できます</li>
        </ul>
      </div>

      <div class="usage-section">
        <h3>🔍 予測変換機能</h3>
        <ul>
          <li>検索時に候補が自動表示されます</li>
          <li><strong>キャラクター名</strong>: 日本語・英語・カナで検索</li>
          <li><strong>武器名</strong>: 「武器：浄冥の宝珠 (所有者: ミント)」形式で表示</li>
          <li><strong>カスタムタグ</strong>: 「カスタムタグ：強いキャラ」形式で表示</li>
          <li>↑↓キーで選択、Enterで決定、Escで閉じる</li>
        </ul>
      </div>

      <div class="usage-section">
        <h3>🏷️ カスタムタグ機能</h3>
        <ul>
          <li><strong>編集モード</strong>: メニューから編集モードを有効にしてキャラクターを選択</li>
          <li><strong>一括編集</strong>: 複数キャラクターを選択して一括でタグを追加</li>
          <li><strong>タグ管理</strong>: メニューの「カスタムタグ」からタグの作成・編集・削除</li>
          <li><strong>タグ検索</strong>: カスタムタグでも検索・フィルタリング可能</li>
        </ul>
      </div>

      <div class="usage-section">
        <h3>⚙️ 設定機能</h3>
        <ul>
          <li><strong>武器アイコン表示</strong>: フィルター時のみ/常に表示/非表示を切り替え</li>
          <li><strong>検索設定</strong>: 武器名検索・カスタムタグ検索のオン/オフ</li>
          <li><strong>強調表示</strong>: 予測変換でのマッチ部分ハイライトのオン/オフ</li>
          <li><strong>テーマ</strong>: ライト/ダーク/モダンテーマの切り替え</li>
          <li><strong>言語</strong>: 日本語/英語の表示切り替え</li>
        </ul>
      </div>

      <div class="usage-section">
        <h3>⌨️ キーボードショートカット</h3>
        <ul>
          <li><kbd>Ctrl+F</kbd> 検索欄にフォーカス</li>
          <li><kbd>F</kbd> フィルター開く</li>
          <li><kbd>Escape</kbd> ポップアップを閉じる</li>
          <li><kbd>←→</kbd> キャラクター詳細で前後のキャラクターに移動</li>
        </ul>
      </div>

      <div class="usage-section">
        <h3>💾 データ管理</h3>
        <ul>
          <li><strong>エクスポート</strong>: お気に入りやカスタムタグをJSONファイルで保存</li>
          <li><strong>インポート</strong>: 保存したデータを読み込み</li>
          <li><strong>データ同期</strong>: 複数デバイス間でのデータ共有が可能</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- キーボードショートカット説明 -->
  <div class="keyboard-shortcuts-info">
    <details>
      <summary>キーボードショートカット</summary>
      <div class="shortcuts-list">
        <div><kbd>Ctrl+F</kbd> 検索欄にフォーカス</div>
        <div><kbd>F</kbd> フィルター</div>
        <div><kbd>R</kbd> ランダム表示</div>
        <div><kbd>L</kbd> 言語切り替え</div>
        <div><kbd>T</kbd> テーマ切り替え</div>
        <div><kbd>Esc</kbd> ポップアップを閉じる</div>
        <div><kbd>Ctrl+Shift+D</kbd> データ管理</div>
        <div class="shortcuts-detail">詳細画面で：</div>
        <div><kbd>H</kbd> 前のキャラクター</div>
        <div><kbd>J</kbd> 次のキャラクター</div>
        <div><kbd>M</kbd> メモ編集</div>
      </div>
    </details>
  </div>

  <!-- PHP で取得したキャラクターデータをJavaScriptに渡す -->
  <?php if ($characterData): ?>
  <script>
    // 初期表示時に指定されたキャラクターを表示
    window.initialCharacterId = <?php echo json_encode($characterId); ?>;
    window.initialImgIndex = <?php echo json_encode($imgIndex); ?>;
  </script>
  <?php endif; ?>

  <script src="main.js"></script>
</body>
</html>
