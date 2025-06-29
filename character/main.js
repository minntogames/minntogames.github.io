let characters = [];
let settings = {};
let activeFilters = {
  race: [],
  fightingStyle: [],
  attribute: [],
  group: []
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
    'day': { 'ja': '日', 'en': '' }
};

// cha.json を読み込み、キャラクターデータと設定を初期化
fetch('cha.json')
  .then(res => res.json())
  .then(data => {
    characters = data.slice(1); // 設定は先頭にある
    settings = data[0].settings;
    
    // 言語マッピングを作成
    createLanguageMaps();

    // フィルターオプションを設定
    setupFilterOptions();
    
    // 初期表示
    filterCharacters();

    // 言語切り替えボタンのテキストを初期設定
    document.getElementById('langToggleBtn').textContent = currentDisplayLanguage === 'ja' ? '言語切替 (現在: 日本語)' : '言語 Toggle (Current: English)';
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

  return `
    <div class="card" onclick="showCharacterDetails(${char.id})">
      <div class="imgframe">
        <img src="img/${imgArr[0]}" alt="${nameArr[0]}の画像" onerror="this.src='img/placeholder.png';" style="width:${imgWidth};object-position:${objectPosition};">
      </div>
      <h2>${displayName}</h2>
    </div>
  `;
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

      if (raceMatch && styleMatch && attrMatch && groupMatch) {
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
  const canonicalValue = languageMaps[type][value.toLowerCase()] || value.toLowerCase();
  
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
    group: []
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

  // 言語切り替えボタンのテキストを更新
  document.getElementById('langToggleBtn').textContent = currentDisplayLanguage === 'ja' ? '言語切替 (現在: 日本語)' : '言語 Toggle (Current: English)';
}

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

    detailsContainer.innerHTML = `
      <div class="character-detail-content">
        <img src="img/${img}" alt="${name}の画像" onerror="this.src='img/placeholder.png';" class="detail-image">
        ${thumbnailsHtml}
        <div><h2>${currentDisplayLanguage === 'en' && nameEn ? nameEn : name}</h2></div>
        <p><strong>${getTranslatedLabel('description')}:</strong> ${desc || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('world')}:</strong> ${character.world || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('race')}:</strong> ${character.race.map(r => getDisplayTerm('race', r, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('fightingStyle')}:</strong> ${fightingStyle.map(s => getDisplayTerm('fightingStyle', s, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('attribute')}:</strong> ${attribute.map(a => getDisplayTerm('attribute', a, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('height')}:</strong> ${character.height ? character.height + ' cm' : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${character.birthday.year}${getTranslatedLabel('year')}${character.birthday.month}${getTranslatedLabel('month')}${character.birthday.day}${getTranslatedLabel('day')}` : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('group')}:</strong> ${character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
      </div>
    `;
    renderRelatedCharacters(character.group, character.id);
    detailsPopup.style.display = 'block';
  }
}

/**
 * キャラクター詳細画面を閉じる
 */
function closeDetailsPopup() {
  document.getElementById('detailsPopup').style.display = 'none';
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
 * 画面幅がモバイル（900px以下）かどうかを判定
 * @returns {boolean}
 */
function isMobileWidth() {
  return window.innerWidth <= 900;
}

// ウィンドウリサイズ時にカードを再描画
window.addEventListener('resize', () => {
  filterCharacters();
});

// ページロード時にURLパラメータからキャラ詳細を自動表示
window.onload = () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const img = params.get('img');
  if (id && !isNaN(Number(id))) {
    showCharacterDetails(Number(id), img && !isNaN(Number(img)) ? Number(img) : 0);
    document.getElementById('detailsPopup').style.display = 'block';
  }
};

// グローバルスコープに関数を公開 (HTMLから直接呼び出すため)
window.filterCharacters = filterCharacters;
window.toggleFilterPopup = toggleFilterPopup;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.showCharacterDetails = showCharacterDetails;
window.closeDetailsPopup = closeDetailsPopup;
window.toggleLanguage = toggleLanguage; // 新しい言語切り替え関数を公開
window.copyCharacterUrl = copyCharacterUrl;

/**
 * キャラ詳細URLをクリップボードにコピー
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
    alert('URLをコピーしました');
  });
}
