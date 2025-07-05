let characters = [];
let settings = {};
let activeFilters = {
  race: [],
  fightingStyle: [],
  attribute: [],
  group: [],
  world: [] // 追加
};

// 現在の表示言語 (ja: 日本語, en: 英語)
let currentDisplayLanguage = 'ja'; 

// 言語マッピングを格納するオブジェクト
// `languageMaps`はUIからのフィルター選択（日本語）をキャラクターデータ内の正規の英語名に変換するために使用
// `displayLanguageMaps`はキャラクターデータ内の値（日本語または英語）を現在の表示言語に変換するために使用
let languageMaps = {
  race: {},
  fightingStyle: {},
  attribute: {},
  group: {}
};
let displayLanguageMaps = {
  race: { enToJa: {}, enToEn: {} }, // canonical English to Japanese/English for display
  fightingStyle: { enToJa: {}, enToEn: {} },
  attribute: { enToJa: {}, enToEn: {} },
  group: { enToJa: {}, enToEn: {} }
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
    'age': { 'ja': '歳', 'en': 'Age' } // 追加
};

// cha.json を読み込み、キャラクターデータと設定を初期化
let relationGroups = []; // relationデータ保持用

fetch('cha.json')
  .then(res => res.json())
  .then(data => {
    characters = data.slice(1); // 設定は先頭にある
    settings = data[0].settings;
    // relationデータも保持
    relationGroups = data[0].relation || [];
    
    // 言語マッピングを作成
    createLanguageMaps();

    // フィルターオプションを設定
    setupFilterOptions();
    
    // 初期表示
    filterCharacters();

    // 言語切り替えボタンのテキストを初期設定
    document.getElementById('langToggleBtn').textContent = currentDisplayLanguage === 'ja' ? '言語切替 (現在: 日本語)' : '言語 Toggle (Current: English)';

    // ▼JSONロード後にURLパラメータで詳細表示
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const img = params.get('img');
    if (id && !isNaN(Number(id))) {
      showCharacterDetails(Number(id), img && !isNaN(Number(img)) ? Number(img) : 0);
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

  return `
    <div class="card ${worldClass}" onclick="showCharacterDetails(${char.id})"
      onmouseenter="onCardHover(this, ${char.id})"
      onmouseleave="onCardLeave()"
      ontouchstart="onCardHover(this, ${char.id})"
      ontouchend="onCardLeave()"
    >
      <div class="imgframe">
        <img src="img/${imgArr[0]}" alt="${nameArr[0]}の画像" onerror="this.src='img/placeholder.png';" style="width:${imgWidth};object-position:${objectPosition};">
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

  popup.innerHTML =
    worldBar +
    `<div style="font-weight:bold;font-size:1.13em;margin-bottom:2px;">${displayName}</div>` +
    `<div style="color:#008080;font-size:0.98em;">${worldLabel}${char.world || 'N/A'}</div>`;

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

  const filtered = characters.filter(c => {
    // 名前検索
    const nameArr = Array.isArray(c.name) ? c.name : [c.name];
    const nameMatch = keyword === '' || nameArr.some(n => (n || '').toLowerCase().includes(keyword));

    // 複数バリエーション対応
    const imgCount =
      Math.max(
        Array.isArray(c.img) ? c.img.length : 1,
        Array.isArray(c.name) ? c.name.length : 1,
        Array.isArray(c.description) ? c.description.length : 1,
        Array.isArray(c.fightingStyle) && Array.isArray(c.fightingStyle[0]) ? c.fightingStyle.length : 1,
        Array.isArray(c.attribute) && Array.isArray(c.attribute[0]) ? c.attribute.length : 1
      );

    // どれかのバリエーションがフィルター条件を満たせばOK
    let filterMatch = false;
    for (let i = 0; i < imgCount; i++) {
      // fightingStyle/attributeは配列の配列対応
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

      // ▼追加：worldフィルター
      const worldMatch = activeFilters.world.length === 0 ||
        activeFilters.world.includes(String(c.world));

      if (raceMatch && styleMatch && attrMatch && groupMatch && worldMatch) {
        filterMatch = true;
        break;
      }
    }

    return nameMatch && filterMatch;
  });
  
  // フィルターされたキャラクターをリストに表示
  if (filtered.length > 0) {
    characterListContainer.innerHTML = filtered.map(renderCharacter).join("");
    noCharactersMessage.style.display = 'none'; // メッセージを非表示にする
  } else {
    characterListContainer.innerHTML = ''; // キャラクターリストを空にする
    noCharactersMessage.style.display = 'block'; // メッセージを表示する
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
    world: []
  };
  
  // 選択状態をクリア
  document.querySelectorAll('.filter-option').forEach(option => {
    option.classList.remove('selected');
  });
  
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
  const lowerCaseTermInCharacterData = termInCharacterData.toLowerCase();

  // 1. キャラクターデータ内の用語を正規の英語（小文字）に変換
  let canonicalEnTerm = languageMaps[type][lowerCaseTermInCharacterData];

  // マッピングが見つからない場合、その用語自体が正規の英語であると仮定
  if (!canonicalEnTerm) {
    return termInCharacterData; // 変換せずにそのまま返す
  }

  // 2. 正規の英語用語をターゲット言語の表示名に変換
  if (targetLanguage === 'ja') {
    return displayLanguageMaps[type].enToJa[canonicalEnTerm] || termInCharacterData;
  } else if (targetLanguage === 'en') {
    return displayLanguageMaps[type].enToEn[canonicalEnTerm] || termInCharacterData;
  }
  return termInCharacterData; // Fallback
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

    // ▼キャラ名＋コピーボタン横並び
    const displayName = currentDisplayLanguage === 'en' && nameEn ? nameEn : name;
    const titleRowHtml = `
      <div class="character-title-row">
        <h2 style="margin:0;">${displayName}</h2>
        <button onclick="copyCharacterUrl()" class="buttonCopyIcon" title="URLをコピー">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a88a2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" fill="none"/>
            <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
          </svg>
        </button>
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
        <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${character.birthday.year}${getTranslatedLabel('year')}${character.birthday.month}${getTranslatedLabel('month')}${character.birthday.day}${getTranslatedLabel('day')}` : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('group')}:</strong> ${character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
      </div>
    `;
    renderRelatedCharacters(character.group, character.id);
    renderRelationCharacters(character.id); // ←追加
    detailsPopup.style.display = 'block';
    updateHamburgerMenuVisibility(); // ▼詳細表示時はメニュー非表示
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
function renderRelatedCharacters(groups, currentId) {
  const relatedContainer = document.getElementById('relatedCharacters');
  
  // 現在のキャラクターと同じグループに属するキャラクターをフィルタリング
  let related = characters.filter(c => 
    c.id !== currentId && // 現在のキャラクター自身を除外
    c.group.some(g => {
        // 関連キャラクターのグループも英語の正規名に変換して比較
        const canonicalGroups = groups.map(gName => languageMaps.group[gName.toLowerCase()] || gName.toLowerCase());
        const characterGroups = c.group.map(cName => languageMaps.group[cName.toLowerCase()] || cName.toLowerCase());
        return canonicalGroups.some(cg => characterGroups.includes(cg));
    })
  );
  
  // 関連キャラクターを最大5個に制限
  related = related.slice(0, 5);

  if (related.length > 0) {
    relatedContainer.innerHTML = related.map(renderCharacter).join('');
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
        groupTitle.textContent = `関係関連${relationGroups.length > 1 ? ` (${idx + 1})` : ''}`;
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
window.onCardLeave = function() {
  hideMiniPopup();
};
