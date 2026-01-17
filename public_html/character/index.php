<?php
// URLパラメータからIDとimgインデックス、武器インデックスを取得
$characterId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$imgIndex = isset($_GET['img']) ? (int)$_GET['img'] : 0;
$weaponIndex = isset($_GET['weapon']) ? (int)$_GET['weapon'] : null;
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
        
        // 武器情報の処理
        if ($weaponIndex !== null && isset($characterData['weapon']) && is_array($characterData['weapon'])) {
            $weaponData = isset($characterData['weapon'][$weaponIndex]) ? $characterData['weapon'][$weaponIndex] : null;
            if ($weaponData) {
                $weaponName = is_array($weaponData['name']) ? $weaponData['name'][0] : $weaponData['name'];
                $ogTitle = htmlspecialchars($weaponName . ' - ' . $characterName . 'の武器 - キャラ図鑑');
                $weaponDescription = isset($weaponData['description']) ? $weaponData['description'] : '';
                if ($weaponDescription) {
                    $weaponDescription = strip_tags($weaponDescription);
                    // 長すぎる場合は切り詰める
                    if (strlen($weaponDescription) > 120) {
                        $weaponDescription = mb_substr($weaponDescription, 0, 117) . '...';
                    }
                    $ogDescription = htmlspecialchars($characterName . 'の武器「' . $weaponName . '」- ' . $weaponDescription);
                } else {
                    $ogDescription = htmlspecialchars($characterName . 'の武器「' . $weaponName . '」の詳細情報');
                }
            } else {
                $ogTitle = htmlspecialchars($characterName . 'の武器 - キャラ図鑑');
                $ogDescription = htmlspecialchars($characterName . 'の武器情報');
            }
        } else {
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
        }
        
        // 画像URLの設定（imgIndexに対応）
        if (isset($characterData['img']) && !empty($characterData['img'])) {
            $imageArray = is_array($characterData['img']) ? $characterData['img'] : [$characterData['img']];
            $targetImage = isset($imageArray[$imgIndex]) ? $imageArray[$imgIndex] : $imageArray[0];
            $ogImage = 'https://youtube.minntelia.com/character/img/' . htmlspecialchars($targetImage);
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
  <link rel="icon" href="favicon.ico" />
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
  
  <?php
  // CSSのバージョン（更新時刻をバージョンとして使用）
  $styleVersion = filemtime(__DIR__ . '/style.css');
  ?>
  <link rel="stylesheet" href="style.css?v=<?php echo $styleVersion; ?>">
  <style>
    /* 通知システムのスタイル */
    .notification-item {
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      position: absolute;
      top: 0;
      right: 0;
    }
    
    .notification-enter {
      transform: translate3d(100%, 0, 0);
      opacity: 0;
    }
    
    .glass {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  </style>
</head>
<body>
  <!-- 通知コンテナ -->
  <div id="notification-container" class="fixed top-8 right-8 z-50 w-80 h-[500px] pointer-events-none" style="position: fixed; top: 32px; right: 32px; z-index: 9999; width: 320px; height: 500px; pointer-events: none;"></div>
  
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

      <button onclick="showUsageGuide();" class="hamburger-lang-btn" id="usageGuideBtn" title="サイトの使い方">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        使い方
      </button>
      
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
      <!-- ▼テーマ選択ドロップダウン -->
      <div class="theme-dropdown-wrapper">
        <button onclick="toggleThemeDropdown()" class="hamburger-theme-btn" id="themeToggleBtn">
          テーマ: <span id="currentThemeName">ライト</span> ▼
        </button>
        <div class="theme-dropdown-menu" id="themeDropdownMenu">
          <div class="theme-option" onclick="selectTheme('light')">ライト</div>
          <div class="theme-option" onclick="selectTheme('dark')">ダーク</div>
          <div class="theme-option" onclick="selectTheme('modern')">ネオン</div>
          <div class="theme-option" onclick="selectTheme('aquamarine')">アクアマリン</div>
        </div>
      </div>
      
      <button onclick="toggleWeaponIconDisplay()" class="hamburger-lang-btn" id="weaponIconToggleBtn" title="武器アイコン表示切り替え">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="14.04107" height="13.96386" viewBox="0,0,14.04107,13.96386">
            <g transform="translate(-232.88883,-173.01807)">
                <g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill="none" fill-rule="nonzero" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" style="mix-blend-mode: normal">
                    <path d="M233.69936,179.05225l7.13299,7.42968"/>
                    <path d="M236.05059,181.32248l5.80685,-7.80441h4.45086l0.11513,4.62801l-7.91758,5.63486"/>
                    <path d="M237.38526,182.42213l5.55356,-5.50703"/>
                    <path d="M237.61296,183.239l-3.14179,2.98028l-0.89461,-0.95782l3.02922,-3.17202"/>
                </g>
            </g>
        </svg>
        武器アイコン: <span id="weaponIconStatus">フィルター時のみ</span>
      </button>
      
      <button onclick="toggleWeaponSearch()" class="hamburger-lang-btn" id="weaponSearchToggleBtn" title="武器名での検索切り替え">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="15.60193" height="15.66555" viewBox="0,0,15.60193,15.66555">
          <g transform="translate(-232.31609,-172.20013)">
              <g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill="none" fill-rule="nonzero" stroke="#ffffff" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" style="mix-blend-mode: normal">
                  <path d="M235.26308,178.78413l4.49109,4.6779" stroke-width="0.5" stroke-linecap="round"/>
                  <path d="M236.74347,180.21352l3.65613,-4.91384h2.80237l0.0725,2.91391l-4.98509,3.54784" stroke-width="0.5" stroke-linecap="round"/>
                  <path d="M237.5838,180.90589l3.49665,-3.46736" stroke-width="0.5" stroke-linecap="round"/>
                  <path d="M237.72717,181.4202l-1.97814,1.87645l-0.56327,-0.60307l1.90726,-1.99718" stroke-width="0.5" stroke-linecap="round"/>
                  <path d="M245.77346,179.15559c0,-3.56526 -2.9006,-6.45546 -6.47868,-6.45546c-3.57808,0 -6.47869,2.8902 -6.47869,6.45546c0,3.56526 2.90061,6.45546 6.47869,6.45546c3.57808,0 6.47868,-2.89021 6.47868,-6.45546z" stroke-width="1" stroke-linecap="butt"/>
                  <path d="M243.85807,183.73593l3.55996,3.62975" stroke-width="1" stroke-linecap="round"/>
              </g>
          </g>
      </svg>
        武器検索: <span id="weaponSearchStatus">有効</span>
      </button>
      
      <button onclick="toggleCustomTagSearch()" class="hamburger-lang-btn" id="customTagSearchToggleBtn" title="カスタムタグでの検索切り替え">
      <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="width: 16px; height: 16px; opacity: 1;" xml:space="preserve">
        <style type="text/css">
          .st0{fill:#4B4B4B;}
        </style>
        <g>
          <path class="st0" d="M500.746,268.14L245.047,12.461L0,0.005l12.455,245.047l266.952,266.942L512,279.393L500.746,268.14z
            M43.625,231.209L33.574,33.599l197.629,10.041l235.772,235.752L279.408,466.97L43.625,231.209z" style="fill: rgba(255, 255, 255, 1);"></path>
          <path class="st0" d="M103.084,103.079c-14.507,14.518-14.507,38.019,0,52.526c14.506,14.507,38.008,14.507,52.516,0
            c14.507-14.507,14.507-38.008,0-52.526C141.093,88.572,117.591,88.572,103.084,103.079z" style="fill: rgba(255, 255, 255, 1);"></path>
        </g>
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
      
      <button onclick="toggleSortOrder()" class="hamburger-lang-btn" id="sortOrderToggleBtn" title="キャラクターの並び順切り替え">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18"/>
          <path d="M7 12h14"/>
          <path d="M10 18h11"/>
        </svg>
        並び順: <span id="sortOrderStatus">ID順</span>
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
        <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="width: 16px; height: 16px; opacity: 1;" xml:space="preserve">
          <style type="text/css">
            .st0{fill:#4B4B4B;}
          </style>
          <g>
            <path class="st0" d="M500.746,268.14L245.047,12.461L0,0.005l12.455,245.047l266.952,266.942L512,279.393L500.746,268.14z
              M43.625,231.209L33.574,33.599l197.629,10.041l235.772,235.752L279.408,466.97L43.625,231.209z" style="fill: rgba(255, 255, 255, 1);"></path>
            <path class="st0" d="M103.084,103.079c-14.507,14.518-14.507,38.019,0,52.526c14.506,14.507,38.008,14.507,52.516,0
              c14.507-14.507,14.507-38.008,0-52.526C141.093,88.572,117.591,88.572,103.084,103.079z" style="fill: rgba(255, 255, 255, 1);"></path>
          </g>
        </svg>
        カスタムタグ
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

      <!-- バージョン情報表示 -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
        <div id="versionDisplay">Version: <span id="versionNumber">読み込み中...</span></div>
        <div id="versionTimestamp" style="font-size: 10px; color: #bbb; margin-top: 4px;"></div>
      </div>

      <br><br><br><br>
    </div>
  </div>

  <h1>キャラ図鑑</h1>

  <!-- ▼編集モードツールバー -->
  <div id="editToolbar" class="edit-toolbar" style="display: none;">
    <div class="edit-toolbar-content">
      <div class="edit-info">
        <button onclick="switchEditSubMode('select')" class="edit-submode-btn" id="editSubModeSelectBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          選択
        </button>
        <button onclick="switchEditSubMode('sort')" class="edit-submode-btn" id="editSubModeSortBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          並び替え
        </button>
        <span id="editModeInfo" style="margin-left: 12px;"><span id="selectedCount">0</span>件選択中</span>
      </div>
      <div class="edit-actions" id="selectModeActions">
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
      <div class="edit-actions" id="sortModeActions" style="display: none;">
        <button onclick="applyCustomSort()" class="edit-btn edit-btn-apply" id="sortApplyBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          並び順を保存
        </button>
        <button onclick="cancelEditModeSort()" class="edit-btn edit-btn-cancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          キャンセル
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
    <button id="filterButton" onclick="toggleFilterPopup()" class="buttonOutlineGradient filter-button-with-info">
      <div class="buttonOutlineGradient_item">フィルター</div>
      <!-- フィルター情報アイコン -->
      <button id="filterInfoBtn" class="filter-info-btn-inline" style="display: none;" onclick="event.stopPropagation(); toggleFilterInfo()" aria-label="フィルター情報" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
    </button>
    <!-- ▼言語切り替えボタン削除
    <button onclick="toggleLanguage()" class="buttonOutlineGradient"><div class="buttonOutlineGradient_item" id="langToggleBtn">言語切替 (現在: 日本語)</div></button>
    -->
  </div>

  <!-- フィルター情報ミニポップアップ -->
  <div id="filterInfoPopup" class="filter-info-popup" style="display: none;">
    <div class="filter-info-content">
      <h4>適用中のフィルター</h4>
      <div id="filterInfoList"></div>
      <button onclick="clearFiltersFromPopup()" class="filter-clear-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        フィルターをクリア
      </button>
    </div>
  </div>

  <div id="filterPopup" class="popup">
    <div class="popup-content">
      <span class="close" onclick="toggleFilterPopup()">&times;</span>
      <h3>フィルターオプション</h3>
      
      <!-- タブナビゲーション -->
      <div class="filter-tab-nav">
        <button class="filter-tab-btn active" onclick="switchFilterTab('main')" data-tab="main">基本フィルター</button>
        <button class="filter-tab-btn" onclick="switchFilterTab('other')" data-tab="other">その他・カスタム</button>
      </div>
      
      <!-- メインタブの内容 -->
      <div id="filterTabMain" class="filter-tab-content active">
        <!-- モバイル用縦タブナビゲーション -->
        <div class="mobile-category-tabs">
          <button class="mobile-cat-tab active" onclick="switchMobileCategoryTab('world')" data-cat="world">世界線</button>
          <button class="mobile-cat-tab" onclick="switchMobileCategoryTab('race')" data-cat="race">種族</button>
          <button class="mobile-cat-tab" onclick="switchMobileCategoryTab('fighting')" data-cat="fighting">戦闘</button>
          <button class="mobile-cat-tab" onclick="switchMobileCategoryTab('attribute')" data-cat="attribute">属性</button>
          <button class="mobile-cat-tab" onclick="switchMobileCategoryTab('group')" data-cat="group">グループ</button>
        </div>
        
        <!-- モバイル用カテゴリコンテンツエリア -->
        <div class="mobile-category-content">
          <div class="filter-sections-container">
        <!-- ▲追加ここまで -->
        <!-- ▼追加：世界線フィルター -->
        <div class="filter-section" data-category="world">
          <h4 class="desktop-only">世界線</h4>
          <div id="worldFilters" class="filter-options"></div>
        </div>
        <!-- ▲追加ここまで -->
        
        <div class="filter-section" data-category="race">
          <h4 class="desktop-only">種族</h4>
          <div id="raceFilters" class="filter-options"></div>
        </div>
        
        <div class="filter-section" data-category="fighting">
          <h4 class="desktop-only">戦闘スタイル</h4>
          <div id="fightingStyleFilters" class="filter-options"></div>
        </div>
        
        <div class="filter-section" data-category="attribute">
          <h4 class="desktop-only">属性</h4>
          <div id="attributeFilters" class="filter-options"></div>
        </div>
        
          <div class="filter-section" data-category="group">
            <h4 class="desktop-only">グループ</h4>
            <div id="groupFilters" class="filter-options"></div>
          </div>
          </div>
        </div>
      </div>
      
      <!-- その他・カスタムタブの内容 -->
      <div id="filterTabOther" class="filter-tab-content">
        <!-- モバイル用縦タブナビゲーション -->
        <div class="mobile-category-tabs">
          <button class="mobile-cat-tab active" onclick="switchMobileCategoryTab('customtags')" data-cat="customtags">カスタム</button>
          <button class="mobile-cat-tab" onclick="switchMobileCategoryTab('other')" data-cat="other">その他</button>
        </div>
        
        <!-- モバイル用カテゴリコンテンツエリア -->
        <div class="mobile-category-content">
          <div class="filter-sections-container">
          <!-- ▼追加：カスタムタグフィルター -->
          <div class="filter-section" data-category="customtags">
            <h4 class="desktop-only" onclick="toggleCustomTagsFilter()" style="cursor: pointer; user-select: none; position: relative;">
              カスタムタグ
              <span id="customTagsToggle" style="position: absolute; right: 0; font-size: 14px;">▼</span>
            </h4>
            <div id="customTagsFilters" class="filter-options"></div>
          </div>
          <!-- ▲追加ここまで -->

          <!-- ▼追加：お気に入りフィルター -->
          <div class="filter-section" data-category="other">
            <h4 class="desktop-only">その他</h4>
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
          </div>
        </div>
      </div>      <button onclick="applyFilters()" class="buttonRound">適用</button>
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

  <!-- 一括タグ編集ポップアップ -->
  <div id="bulkTagEditPopup" class="popup" style="display: none;">
    <div class="popup-content">
      <span class="close" onclick="closeBulkTagEditor()">&times;</span>
      <h3>一括タグ編集</h3>
      <p><span id="bulkEditSelectedCount">0</span>件のキャラクターにタグを追加します</p>
      
      <!-- タグ選択リスト -->
      <div id="bulkTagSelectionList" class="bulk-tag-selection-list">
        <!-- 選択可能なタグがここに表示されます -->
      </div>
      
      <!-- 新規タグ作成（一括編集用） -->
      <div class="bulk-tag-create-section">
        <button onclick="toggleBulkTagCreateForm()" class="tag-create-btn" id="bulkTagCreateToggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新しいタグを作成
        </button>
        
        <div id="bulkTagCreateForm" class="tag-create-form" style="display: none;">
          <div class="tag-input-group">
            <input type="text" id="bulkNewTagName" placeholder="タグ名を入力" maxlength="20">
            <input type="color" id="bulkNewTagColor" value="#3b82f6" title="タグの色を選択">
            <button onclick="createBulkTag()" class="tag-save-btn">作成して選択</button>
            <button onclick="toggleBulkTagCreateForm()" class="tag-cancel-btn">キャンセル</button>
          </div>
        </div>
      </div>
      
      <!-- 実行ボタン -->
      <div class="bulk-tag-actions">
        <button onclick="applyBulkTags()" class="bulk-apply-btn" id="bulkApplyBtn" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7L9 19l-5.5-5.5 1.414-1.414L9 16.172 19.586 5.586z"/>
          </svg>
          タグを追加
        </button>
        <button onclick="closeBulkTagEditor()" class="bulk-cancel-btn">キャンセル</button>
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

  <?php
  // main.jsのバージョン（更新時刻をバージョンとして使用）
  $mainJsVersion = filemtime(__DIR__ . '/main.js');
  $versionCheckJsVersion = filemtime(__DIR__ . '/version-check.js');
  ?>
  <script src="version-check.js?v=<?php echo $versionCheckJsVersion; ?>"></script>
  <script src="main.js?v=<?php echo $mainJsVersion; ?>"></script>
</body>
</html>
