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
  // 画像の拡大位置を設定 (cha.jsonにimageZoomPositionプロパティがある場合)
  const objectPosition = char.imageZoomPosition || 'center';
  const imgWidth = char.imgsize || '100%'; // imgsizeがない場合は100%

  return `
    <div class="card" onclick="showCharacterDetails(${char.id})">
      <div class="imgframe">
        <img src="img/${char.img}" alt="${char.name}の画像" onerror="this.src='img/placeholder.png';" style="width:${imgWidth};object-position:${objectPosition};">
      </div>
      <h2>${char.name}</h2>
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
    const nameMatch = keyword === '' || c.name.toLowerCase().includes(keyword);
    
    // フィルター検索
    // activeFiltersには英語の正規名が格納されていることを想定
    // キャラクターのプロパティ値は、言語マッピングを通じて英語の正規名に変換して比較する
    
    const raceMatch = activeFilters.race.length === 0 || 
                      c.race.some(r => {
                          const canonicalRace = languageMaps.race[r.toLowerCase()] || r.toLowerCase();
                          return activeFilters.race.includes(canonicalRace);
                      });
    const styleMatch = activeFilters.fightingStyle.length === 0 || 
                       c.fightingStyle.some(s => {
                           const canonicalStyle = languageMaps.fightingStyle[s.toLowerCase()] || s.toLowerCase();
                           return activeFilters.fightingStyle.includes(canonicalStyle);
                       });
    const attrMatch = activeFilters.attribute.length === 0 || 
                      c.attribute.some(a => {
                          const canonicalAttr = languageMaps.attribute[a.toLowerCase()] || a.toLowerCase();
                          return activeFilters.attribute.includes(canonicalAttr);
                      });
    const groupMatch = activeFilters.group.length === 0 || 
                       c.group.some(g => {
                           const canonicalGroup = languageMaps.group[g.toLowerCase()] || g.toLowerCase();
                           return activeFilters.group.includes(canonicalGroup);
                       });
    
    return nameMatch && raceMatch && styleMatch && attrMatch && groupMatch;
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
 */
function showCharacterDetails(charId) {
  const character = characters.find(c => c.id === charId);
  const detailsContainer = document.getElementById('characterDetails');
  const detailsPopup = document.getElementById('detailsPopup');

  if (character) {
    // キャラクターIDを要素のデータ属性に保存（言語切り替え時に再利用するため）
    detailsContainer.dataset.charId = charId;

    // キャラクターの詳細情報をHTMLとして生成（言語切り替えを適用）
    detailsContainer.innerHTML = `
      <div class="character-detail-content">
        <img src="img/${character.img}" alt="${character.name}の画像" onerror="this.src='img/placeholder.png';" class="detail-image">
        <h2>${character.name}</h2>
        <p><strong>${getTranslatedLabel('description')}:</strong> ${character.description || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('world')}:</strong> ${character.world || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('race')}:</strong> ${character.race.map(r => getDisplayTerm('race', r, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('fightingStyle')}:</strong> ${character.fightingStyle.map(s => getDisplayTerm('fightingStyle', s, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('attribute')}:</strong> ${character.attribute.map(a => getDisplayTerm('attribute', a, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('height')}:</strong> ${character.height ? character.height + ' cm' : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('birthday')}:</strong> ${character.birthday ? `${character.birthday.year}${getTranslatedLabel('year')}${character.birthday.month}${getTranslatedLabel('month')}${character.birthday.day}${getTranslatedLabel('day')}` : 'N/A'}</p>
        <p><strong>${getTranslatedLabel('personality')}:</strong> ${character.personality || 'N/A'}</p>
        <p><strong>${getTranslatedLabel('group')}:</strong> ${character.group.map(g => getDisplayTerm('group', g, currentDisplayLanguage)).join(', ') || 'N/A'}</p>
      </div>
    `;
    
    // 関連キャラクターを表示
    renderRelatedCharacters(character.group, character.id);
    
    // 詳細画面を表示
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

// グローバルスコープに関数を公開 (HTMLから直接呼び出すため)
window.filterCharacters = filterCharacters;
window.toggleFilterPopup = toggleFilterPopup;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.showCharacterDetails = showCharacterDetails;
window.closeDetailsPopup = closeDetailsPopup;
window.toggleLanguage = toggleLanguage; // 新しい言語切り替え関数を公開
