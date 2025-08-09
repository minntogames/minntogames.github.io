<?php
// URLパラメータからIDを取得
$characterId = isset($_GET['id']) ? (int)$_GET['id'] : null;
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
        $characterName = is_array($characterData['name']) ? $characterData['name'][0] : $characterData['name'];
        $ogTitle = htmlspecialchars($characterName) . ' - キャラ図鑑';
        
        $description = '';
        if (isset($characterData['description'])) {
            if (is_array($characterData['description'])) {
                $description = strip_tags($characterData['description'][0]);
            } else {
                $description = strip_tags($characterData['description']);
            }
            // 長すぎる場合は切り詰める
            if (strlen($description) > 160) {
                $description = mb_substr($description, 0, 157) . '...';
            }
        }
        $ogDescription = htmlspecialchars($description ? $description : $characterName . 'のキャラクター情報');
        
        // 画像URLの設定
        if (isset($characterData['img']) && !empty($characterData['img'])) {
            $imageName = is_array($characterData['img']) ? $characterData['img'][0] : $characterData['img'];
            $ogImage = 'https://minntogames.github.io/character/img/' . htmlspecialchars($imageName);
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
      <button onclick="toggleLanguage()" class="hamburger-lang-btn" id="langToggleBtn">言語切替 (現在: 日本語)</button>
      <!-- ▼テーマ切替ボタン（3テーマ対応） -->
      <button onclick="toggleTheme()" class="hamburger-theme-btn" id="themeToggleBtn">テーマ切替 (現在: ライト)</button>
      <!-- ▼データ管理ボタン -->
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
    </div>
  </div>

  <h1>キャラ図鑑</h1>

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
        </div>
      </div>
      <!-- ▲追加ここまで -->
      
      <button onclick="applyFilters()" class="buttonRound">適用</button>
      <button onclick="clearFilters()" class="buttonRound">クリア</button>
    </div>
  </div>

  <!-- キャラクター詳細表示の要素 (ポップアップ型ではない) -->
  <div id="detailsPopup">
    <div class="popup-content">
      <span class="close" onclick="closeDetailsPopup()">&times;</span>
      <div id="characterDetails">
        <!-- キャラクターの詳細がここに表示されます -->
      </div>
      <hr>
      <h3>関連キャラクター</h3>
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
  </script>
  <?php endif; ?>

  <script src="main.js"></script>
</body>
</html>
