const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ピクセルアートのスムージングを無効化
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

const tileSize = 16; // 元画像の1タイルサイズ
const scale = 4; // 拡大倍率（例：2倍）
const drawSize = tileSize * scale; // 描画サイズ
let mapWidth = 10;
let mapHeight = 10;
let map = [];
let decorationMap = []; // 装飾レイヤー
let tileData = {}; // タイル属性データ
let eventData = {}; // イベントデータ
let eventPositions = {}; // イベント位置データ

// ワイプアニメーション用変数
let wipeAnimation = {
  active: false,
  direction: 0, // 0:上, 1:下, 2:左, 3:右
  progress: 0, // 0-1のアニメーション進行度
  phase: 'in', // 'in':ワイプイン, 'out':ワイプアウト
  callback: null,
  duration: 400 // アニメーション時間（ミリ秒）- 800から400に短縮
};

// プレイヤー座標（初期値）
let player = { x: 1, y: 0 };

// プレイヤーの向き（0:上, 1:下, 2:左, 3:右）
let playerDirection = 0; // 初期は下向き

// イベントシステム
let currentDialog = null;
let dialogIndex = 0;
let isDialogActive = false;
let pendingTransport = null; // ダイアログ後の移動処理用

// カメラ座標（マップの描画オフセット）
let camera = { x: 0, y: 0 };

// 画面サイズ（タイル単位）
const screenWidthTiles = Math.ceil(canvas.width / drawSize);
const screenHeightTiles = Math.ceil(canvas.height / drawSize);

// 移動クールダウン管理
let lastMoveTime = 0;
const moveCooldown = 100; // ミリ秒（150ms = 0.15秒）

// スプライト画像
const mapImg = new Image();
mapImg.src = './src/img/splite/maptile1.png';
const charaImg = new Image();
charaImg.src = './src/img/splite/chara.png';
const backImg = new Image();
backImg.src = './src/img/splite/back.png';

console.log('Loading images:', mapImg.src, charaImg.src, backImg.src);

let imagesLoaded = 0;
const totalImages = 3;

function onImageLoad() {
  imagesLoaded++;
  console.log(`Image loaded: ${imagesLoaded}/${totalImages}`);
  console.log('Map image loaded:', mapImg.complete, mapImg.naturalWidth, 'x', mapImg.naturalHeight);
  console.log('Chara image loaded:', charaImg.complete, charaImg.naturalWidth, 'x', charaImg.naturalHeight);
  console.log('Back image loaded:', backImg.complete, backImg.naturalWidth, 'x', backImg.naturalHeight);
  if (imagesLoaded === totalImages) {
    // 全画像読み込み完了後にマップデータ読込
    console.log('All images loaded');
    loadMapData();
  }
}

mapImg.onload = onImageLoad;
charaImg.onload = onImageLoad;
backImg.onload = onImageLoad;

// 画像読み込みエラーハンドリング
mapImg.onerror = () => {
  console.error('Failed to load maptile1.png');
  onImageLoad(); // エラーでもカウントを進める
};
charaImg.onerror = () => {
  console.error('Failed to load chara.png');
  onImageLoad(); // エラーでもカウントを進める
};
backImg.onerror = () => {
  console.error('Failed to load back.png');
  onImageLoad(); // エラーでもカウントを進める
};

// マップデータ読込
function loadMapData() {
  // まずタイルデータを読み込む
  fetch('tiledata.json')
    .then(res => res.json())
    .then(tileDataJson => {
      tileData = tileDataJson;
      console.log('Tile data loaded:', Object.keys(tileData.tiles).length, 'tiles,', Object.keys(tileData.decorations).length, 'decorations');
      
      // タイルデータ読み込み後、マップデータを読み込む
      return fetch('maps/map.json');
    })
    .then(res => res.json())
    .then(json => {
      mapWidth = json.width;
      mapHeight = json.height;
      map = json.data;
      decorationMap = json.decoration || []; // 装飾レイヤー読み込み
      
      // マップ内のイベントポジションを取得（エディターで生成された場合）
      if (json.eventPositions) {
        eventPositions = json.eventPositions;
        console.log('Event positions loaded from map:', Object.keys(eventPositions).length, 'events');
      }
      
      // デバッグ情報
      console.log('Map loaded:', { width: mapWidth, height: mapHeight, actualRows: map.length });
      console.log('Decoration loaded:', decorationMap.length > 0 ? 'Yes' : 'No');
      console.log('Player position:', player);
      
      // イベントデータを読み込む
      return fetch('maps/events.json');
    })
    .then(res => res.json())
    .then(eventsJson => {
      eventData = eventsJson.events;
      // エディターから読み込まれていない場合のみevents.jsonから読み込む
      if (!eventPositions || Object.keys(eventPositions).length === 0) {
        eventPositions = eventsJson.eventPositions;
      }
      console.log('Events loaded:', Object.keys(eventData).length, 'events');
      console.log('Total event positions:', Object.keys(eventPositions).length);
      
      updateCamera();
      draw();
    })
    .catch(error => {
      console.error('Error loading data:', error);
      // エラーでも最低限の初期化は行う
      updateCamera();
      draw();
    });
}

// カメラ位置を更新（プレイヤー中心、マップ端で停止）
function updateCamera() {
  // プレイヤーを画面中央に配置する理想的なカメラ位置
  const idealCameraX = player.x - Math.floor(screenWidthTiles / 2);
  const idealCameraY = player.y - Math.floor(screenHeightTiles / 2);
  
  // カメラの制限範囲を計算
  const maxCameraX = Math.max(0, mapWidth - screenWidthTiles);
  const maxCameraY = Math.max(0, mapHeight - screenHeightTiles);
  
  // カメラ位置をマップ範囲内に制限
  camera.x = Math.max(0, Math.min(idealCameraX, maxCameraX));
  camera.y = Math.max(0, Math.min(idealCameraY, maxCameraY));
}

// タイルが歩行可能かチェック
function isWalkable(tileId, isDecoration = false) {
  if (isDecoration) {
    const decorationInfo = tileData.decorations && tileData.decorations[tileId];
    if (decorationInfo && decorationInfo.walkable === false) {
      return false;
    }
    return true; // 装飾タイルは基本的に歩行可能
  } else {
    const tileInfo = tileData.tiles && tileData.tiles[tileId];
    return tileInfo ? tileInfo.walkable : false;
  }
}

// タイルの描画レイヤーを取得
function getTileLayer(tileId, isDecoration = false) {
  if (isDecoration) {
    const decorationInfo = tileData.decorations && tileData.decorations[tileId];
    return decorationInfo ? decorationInfo.layer : 'decoration';
  } else {
    const tileInfo = tileData.tiles && tileData.tiles[tileId];
    return tileInfo ? tileInfo.layer : 'ground';
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // デバッグ: 背景色で確認
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // マップ描画（カメラオフセット適用）
  const startX = Math.max(0, camera.x);
  const startY = Math.max(0, camera.y);
  const endX = Math.min(mapWidth, camera.x + screenWidthTiles + 1);
  const endY = Math.min(mapHeight, camera.y + screenHeightTiles + 1);
  
  for (let y = startY; y < endY && y < map.length; y++) {
    for (let x = startX; x < endX && x < (map[y] ? map[y].length : 0); x++) {
      const tile = map[y][x];
      if (!tile) continue;
      
      // tile番号を16進数で扱う
      const tnum = parseInt(tile, 16);
      // スプライトシートからタイル描画（カメラオフセット適用）
      try {
        ctx.drawImage(
          mapImg,
          (tnum % 16) * tileSize, Math.floor(tnum / 16) * tileSize,
          tileSize, tileSize,
          (x - camera.x) * drawSize, (y - camera.y) * drawSize,
          drawSize, drawSize
        );
      } catch (e) {
        console.error('Map tile draw error:', e, 'tile:', tile, 'tnum:', tnum);
      }
    }
  }
  
  // 装飾レイヤー描画（decoration層のみ、foreground層は後で描画）
  if (decorationMap.length > 0) {
    for (let y = startY; y < endY && y < decorationMap.length; y++) {
      for (let x = startX; x < endX && x < (decorationMap[y] ? decorationMap[y].length : 0); x++) {
        const decorationTile = decorationMap[y][x];
        if (!decorationTile || decorationTile === "") continue;
        
        // レイヤーをチェック（decorationまたはgroundのみ描画）
        const layer = getTileLayer(decorationTile, true);
        if (layer === 'foreground') continue; // 前景は後で描画
        
        // decoration tile番号を16進数で扱う
        const dtnum = parseInt(decorationTile, 16);
        // back.pngから装飾タイル描画（カメラオフセット適用）
        try {
          ctx.drawImage(
            backImg,
            (dtnum % 16) * tileSize, Math.floor(dtnum / 16) * tileSize,
            tileSize, tileSize,
            (x - camera.x) * drawSize, (y - camera.y) * drawSize,
            drawSize, drawSize
          );
        } catch (e) {
          console.error('Decoration tile draw error:', e, 'tile:', decorationTile, 'dtnum:', dtnum);
        }
      }
    }
  }
  
  // キャラ描画（方向に応じたスプライト）を縦2タイル分（カメラオフセット適用）
  const playerScreenX = (player.x - camera.x) * drawSize;
  const playerScreenY = (player.y - camera.y) * drawSize;
  
  console.log('Drawing character at screen pos:', playerScreenX, playerScreenY, 'facing direction:', playerDirection);
  
  // charaImg が正常に読み込まれているかチェック
  if (charaImg.complete && charaImg.naturalWidth > 0) {
    // 方向に応じたスプライトのベース番号
    // 0:上向き, 1:下向き, 2:左向き, 3:右向き
    const directionSprites = {
      0: [0x0, 0x10], // 上向き: 0番と16番（2行目の0番）
      1: [0x3, 0x13], // 下向き: 3番と19番（2行目の3番）
      2: [0x1, 0x11], // 左向き: 1番と17番（2行目の1番）  
      3: [0x2, 0x12]  // 右向き: 2番と18番（2行目の2番）
    };
    
    const sprites = directionSprites[playerDirection] || directionSprites[1]; // デフォルトは下向き
    
    try {
      // 上半身スプライト
      const topSpriteNum = sprites[0];
      console.log('Top sprite:', topSpriteNum, 'Bottom sprite:', sprites[1]);
      console.log('Top sprite coords:', (topSpriteNum % 16) * tileSize, Math.floor(topSpriteNum / 16) * tileSize);
      console.log('Bottom sprite coords:', (sprites[1] % 16) * tileSize, Math.floor(sprites[1] / 16) * tileSize);
      
      ctx.drawImage(
        charaImg,
        (topSpriteNum % 16) * tileSize, Math.floor(topSpriteNum / 16) * tileSize,
        tileSize, tileSize,
        playerScreenX, playerScreenY,
        drawSize, drawSize
      );
      
      // 下半身スプライト
      const bottomSpriteNum = sprites[1];
      ctx.drawImage(
        charaImg,
        (bottomSpriteNum % 16) * tileSize, Math.floor(bottomSpriteNum / 16) * tileSize,
        tileSize, tileSize,
        playerScreenX, playerScreenY + drawSize,
        drawSize, drawSize
      );
      
      console.log('Character sprites drawn successfully for direction:', playerDirection);
    } catch (e) {
      console.error('Character draw error:', e);
    }
  } else {
    console.warn('Character image not loaded, using fallback');
  }
  
  // 前景レイヤー描画（キャラクターより前面）
  if (decorationMap.length > 0) {
    for (let y = startY; y < endY && y < decorationMap.length; y++) {
      for (let x = startX; x < endX && x < (decorationMap[y] ? decorationMap[y].length : 0); x++) {
        const decorationTile = decorationMap[y][x];
        if (!decorationTile || decorationTile === "") continue;
        
        // 前景レイヤーのみ描画
        const layer = getTileLayer(decorationTile, true);
        if (layer !== 'foreground') continue;
        
        // decoration tile番号を16進数で扱う
        const dtnum = parseInt(decorationTile, 16);
        // back.pngから前景タイル描画（カメラオフセット適用）
        try {
          ctx.drawImage(
            backImg,
            (dtnum % 16) * tileSize, Math.floor(dtnum / 16) * tileSize,
            tileSize, tileSize,
            (x - camera.x) * drawSize, (y - camera.y) * drawSize,
            drawSize, drawSize
          );
        } catch (e) {
          console.error('Foreground tile draw error:', e, 'tile:', decorationTile, 'dtnum:', dtnum);
        }
      }
    }
  }
  
  // ワイプアニメーション描画
  if (wipeAnimation.active) {
    drawWipeAnimation();
  }
  
  // デバッグ: キャラ位置に赤い四角を描画
  // ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
  // ctx.fillRect(player.x * drawSize, player.y * drawSize, drawSize, drawSize * 2);
}

// ワイプアニメーション描画
function drawWipeAnimation() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  console.log(`Drawing wipe: direction=${wipeAnimation.direction}, phase=${wipeAnimation.phase}, progress=${wipeAnimation.progress.toFixed(2)}`);
  
  // アニメーション進行度に基づいて黒い矩形の位置とサイズを計算
  let x, y, width, height;
  
  switch (wipeAnimation.direction) {
    case 0: // 上から下へワイプ
      x = 0;
      width = canvasWidth;
      if (wipeAnimation.phase === 'in') {
        // ワイプイン: 上から黒い矩形が降りてくる
        y = 0;
        height = canvasHeight * wipeAnimation.progress;
      } else {
        // ワイプアウト: 黒い矩形が上に消えていく
        y = 0;
        height = canvasHeight * (1 - wipeAnimation.progress);
      }
      break;
      
    case 1: // 下から上へワイプ
      x = 0;
      width = canvasWidth;
      if (wipeAnimation.phase === 'in') {
        // ワイプイン: 下から黒い矩形が上がってくる
        height = canvasHeight * wipeAnimation.progress;
        y = canvasHeight - height;
      } else {
        // ワイプアウト: 黒い矩形が下に消えていく
        height = canvasHeight * (1 - wipeAnimation.progress);
        y = canvasHeight - height;
      }
      break;
      
    case 2: // 左から右へワイプ
      y = 0;
      height = canvasHeight;
      if (wipeAnimation.phase === 'in') {
        // ワイプイン: 左から黒い矩形が右に広がる
        x = 0;
        width = canvasWidth * wipeAnimation.progress;
      } else {
        // ワイプアウト: 黒い矩形が左に消えていく
        x = 0;
        width = canvasWidth * (1 - wipeAnimation.progress);
      }
      break;
      
    case 3: // 右から左へワイプ
      y = 0;
      height = canvasHeight;
      if (wipeAnimation.phase === 'in') {
        // ワイプイン: 右から黒い矩形が左に広がる
        width = canvasWidth * wipeAnimation.progress;
        x = canvasWidth - width;
      } else {
        // ワイプアウト: 黒い矩形が右に消えていく
        width = canvasWidth * (1 - wipeAnimation.progress);
        x = canvasWidth - width;
      }
      break;
  }
  
  // 黒い矩形を描画
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, width, height);
}

// キャンバス内ワイプアニメーション開始
function startCanvasWipeAnimation(direction, callback) {
  console.log('Starting canvas wipe animation, direction:', direction);
  wipeAnimation.active = true;
  wipeAnimation.direction = direction;
  wipeAnimation.progress = 0;
  wipeAnimation.phase = 'in';
  wipeAnimation.callback = callback;
  
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    wipeAnimation.progress = Math.min(elapsed / wipeAnimation.duration, 1);
    
    // ワイプアニメーション描画のため毎フレームdraw()を呼ぶ
    draw();
    
    if (wipeAnimation.progress >= 1) {
      if (wipeAnimation.phase === 'in') {
        // ワイプイン完了、コールバック実行
        if (wipeAnimation.callback) {
          wipeAnimation.callback();
        }
        
        // ワイプアウト開始
        wipeAnimation.phase = 'out';
        wipeAnimation.progress = 0;
        
        // 少し遅延してワイプアウト開始（200msから100msに短縮）
        setTimeout(() => {
          const outStartTime = Date.now();
          
          function animateOut() {
            const outElapsed = Date.now() - outStartTime;
            wipeAnimation.progress = Math.min(outElapsed / wipeAnimation.duration, 1);
            
            // ワイプアニメーション描画のため毎フレームdraw()を呼ぶ
            draw();
            
            if (wipeAnimation.progress >= 1) {
              // ワイプアウト完了
              wipeAnimation.active = false;
              draw(); // 最終描画
            } else {
              requestAnimationFrame(animateOut);
            }
          }
          
          animateOut();
        }, 100); // 200msから100msに短縮
        
      }
    } else {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// キー操作
window.addEventListener('keydown', (e) => {
  // ワイプアニメーション中は操作を無効化
  if (wipeAnimation.active) {
    e.preventDefault();
    return;
  }
  
  // ダイアログが表示中の場合
  if (isDialogActive) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nextDialog();
    }
    return;
  }
  
  // インタラクトキー（スペース）
  if (e.key === ' ') {
    e.preventDefault();
    checkInteraction();
    return;
  }
  
  // クールダウンチェック
  const currentTime = Date.now();
  if (currentTime - lastMoveTime < moveCooldown) {
    return; // クールダウン中は移動しない
  }

  let dx = 0, dy = 0;
  if (e.key === 'ArrowUp') {
    dy = -1;
    playerDirection = 1; // 上向き
  }
  if (e.key === 'ArrowDown') {
    dy = 1;
    playerDirection = 0; // 下向き
  }
  if (e.key === 'ArrowLeft') {
    dx = -1;
    playerDirection = 2; // 左向き
  }
  if (e.key === 'ArrowRight') {
    dx = 1;
    playerDirection = 3; // 右向き
  }
  
  // 移動キーが押されていない場合は何もしない
  if (dx === 0 && dy === 0) return;
  
  const nx = player.x + dx;
  const ny = player.y + dy;
  
  // 当たり判定は10番（下側）のタイルのみ
  const collisionY = ny + 1; // キャラの下側（10番）の位置
  
  // マップ範囲内かつ進行可能か（タイルデータベースで判定）
  if (
    collisionY >= 0 && collisionY < mapHeight &&
    nx >= 0 && nx < mapWidth &&
    map[collisionY] && map[collisionY][nx]
  ) {
    const groundTile = map[collisionY][nx];
    const decorationTile = decorationMap[collisionY] && decorationMap[collisionY][nx];
    
    // 地面タイルと装飾タイルの両方をチェック
    const groundWalkable = isWalkable(groundTile, false);
    const decorationWalkable = !decorationTile || decorationTile === "" || isWalkable(decorationTile, true);
    
    if (groundWalkable && decorationWalkable) {
      player.x = nx;
      player.y = ny;
      lastMoveTime = currentTime; // 移動成功時のみクールダウンを更新
      updateCamera(); // カメラ位置を更新
      
      // ステップイベントをチェック
      checkStepEvent(nx, ny);
      
      draw();
    }
  }
});

// ===============================
// イベントシステム
// ===============================

// インタラクションイベントをチェック（プレイヤーの前方向）
function checkInteraction() {
  console.log('=== INTERACTION CHECK ===');
  console.log('Player head position:', player.x, player.y);
  console.log('Player direction:', playerDirection, ['Up', 'Down', 'Left', 'Right'][playerDirection]);
  
  // プレイヤーの頭部座標
  const playerHeadX = player.x;
  const playerHeadY = player.y;
  
  // プレイヤーの足元座標（下半身の位置）
  const playerFootX = player.x;
  const playerFootY = player.y + 1; // 下半身の位置
  
  console.log('Player foot position:', playerFootX, playerFootY);
  
  // プレイヤーの向きに基づいて前方の座標を計算
  let checkX, checkY;
  
  switch (playerDirection) {
    case 0: // 上向き - 頭の上をチェック
      checkX = playerHeadX;
      checkY = playerHeadY + 2; // 頭の上は足元の上
      break;
    case 1: // 下向き - 足元の下をチェック  
      checkX = playerFootX;
      checkY = playerFootY - 1;
      break;
    case 2: // 左向き - 足元の左をチェック
      checkX = playerFootX - 1;
      checkY = playerFootY;
      break;
    case 3: // 右向き - 足元の右をチェック
      checkX = playerFootX + 1;
      checkY = playerFootY;
      break;
  }
  
  console.log(`Player foot at (${playerFootX}, ${playerFootY}) facing direction ${playerDirection}, checking (${checkX}, ${checkY})`);
  
  // プレイヤーが向いている方向のイベントをチェック
  const eventId = getEventAt(checkX, checkY);
  console.log(`Checking forward position (${checkX}, ${checkY}): eventId=${eventId}`);
  
  if (eventId && eventData[eventId]) {
    const event = eventData[eventId];
    console.log(`Event found: trigger=${event.trigger}`);
    
    if (event.trigger === 'interact' || event.trigger === 'adjacent') {
      console.log(`Triggering event ${eventId} at (${checkX}, ${checkY}) - player facing towards event`);
      triggerEvent(eventId);
      return;
    }
  }
  
  console.log('No interactable events found or player not facing the right direction');
}

// ステップイベントをチェック
function checkStepEvent(x, y) {
  // プレイヤーの足元座標（下半身の位置）
  const playerFootX = x;
  const playerFootY = y + 1;
  
  // 足元の位置のイベント（重なった時）
  const eventId = getEventAt(playerFootX, playerFootY);
  if (eventId && eventData[eventId] && eventData[eventId].trigger === 'step') {
    console.log(`Step event triggered at foot position (${playerFootX}, ${playerFootY}): ${eventId}`);
    triggerEvent(eventId);
    return;
  }
  
  // 足元周辺の隣接位置の自動トリガーイベントをチェック（頭部分は除く）
  const adjacentPositions = [
    {x: playerFootX, y: playerFootY + 1, direction: 1}, // 下
    {x: playerFootX - 1, y: playerFootY, direction: 2}, // 左
    {x: playerFootX + 1, y: playerFootY, direction: 3}  // 右
  ];
  
  for (const pos of adjacentPositions) {
    const adjEventId = getEventAt(pos.x, pos.y);
    if (adjEventId && eventData[adjEventId] && eventData[adjEventId].trigger === 'auto_adjacent') {
      console.log(`Auto adjacent event triggered at (${pos.x}, ${pos.y}): ${adjEventId}`);
      triggerEvent(adjEventId);
      return;
    }
  }
  
  // 移動後に足元周辺で隣接したadjacent系イベントもチェック（方向は考慮しない、移動したことによる発見）
  for (const pos of adjacentPositions) {
    const adjEventId = getEventAt(pos.x, pos.y);
    if (adjEventId && eventData[adjEventId] && eventData[adjEventId].trigger === 'adjacent') {
      // 移動によって新しく隣接したイベントを発見した場合の通知
      console.log(`Found adjacent event at (${pos.x}, ${pos.y}): ${adjEventId} - use space key to interact`);
      showInteractionHint(eventData[adjEventId].name);
    }
  }
}

// インタラクション可能なオブジェクトが近くにあることをプレイヤーに知らせる
function showInteractionHint(eventName) {
  // 画面上に短時間だけヒントを表示
  const existingHint = document.getElementById('interactionHint');
  if (existingHint) {
    existingHint.remove();
  }
  
  const hint = document.createElement('div');
  hint.id = 'interactionHint';
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(52, 152, 219, 0.9);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-size: 14px;
    z-index: 1001;
    animation: fadeInOut 3s ease-in-out forwards;
  `;
  hint.textContent = `💡 ${eventName} (スペースキーで調べる)`;
  
  // CSS アニメーションを追加
  if (!document.getElementById('hintStyle')) {
    const style = document.createElement('style');
    style.id = 'hintStyle';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(100px); }
        20% { opacity: 1; transform: translateX(0); }
        80% { opacity: 1; transform: translateX(0); }
        100% { opacity: 0; transform: translateX(100px); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(hint);
  
  // 3秒後に自動削除
  setTimeout(() => {
    if (hint.parentNode) {
      hint.remove();
    }
  }, 3000);
}

// 指定座標のイベントIDを取得
function getEventAt(x, y) {
  const posKey = `${x},${y}`;
  const eventId = eventPositions[posKey] || null;
  console.log(`getEventAt(${x}, ${y}): posKey="${posKey}", eventId=${eventId}, available positions:`, Object.keys(eventPositions));
  return eventId;
}

// イベントを実行
function triggerEvent(eventId) {
  console.log(`triggerEvent called with eventId: ${eventId}`);
  const event = eventData[eventId];
  console.log(`Event data for ${eventId}:`, event);
  console.log('Available eventData keys:', Object.keys(eventData));
  
  if (!event) {
    console.warn(`Event ${eventId} not found in eventData`);
    return;
  }
  
  console.log(`Triggering event ${eventId}:`, event.name, event.type);
  
  if (event.type === 'dialog') {
    startDialog(event.dialog);
  } else if (event.type === 'transport') {
    // ダイアログがある場合は先に表示してから移動
    if (event.dialog) {
      currentDialog = event.dialog;
      dialogIndex = 0;
      isDialogActive = true;
      pendingTransport = event.transport; // 移動情報を保存
      
      showDialogUI();
      updateDialogContent();
    } else {
      // ダイアログなしで即座に移動
      executeTransport(event.transport);
    }
  }
}

// マップ移動を実行（キャンバス内ワイプアニメーション付き）
function executeTransport(transport) {
  console.log('Executing transport to:', transport.mapFile);
  
  // 現在のプレイヤー方向でキャンバス内ワイプアニメーション開始
  startCanvasWipeAnimation(playerDirection, () => {
    // ワイプイン完了後にマップ切り替え
    fetch(transport.mapFile)
      .then(res => res.json())
      .then(json => {
        // マップデータを更新
        mapWidth = json.width;
        mapHeight = json.height;
        map = json.data;
        decorationMap = json.decoration || [];
        
        // マップ固有のイベント配置を読み込み
        eventPositions = json.eventPositions || {};
        console.log('Map event positions loaded:', eventPositions);
        
        // プレイヤー位置を移動先に設定
        player.x = transport.targetX;
        player.y = transport.targetY;
        playerDirection = transport.direction || playerDirection;
        
        // カメラをプレイヤーに合わせる
        updateCamera();
        
        // イベントデータも新しいマップに合わせて再読み込み
        loadEventData();
        
        console.log('Map transport completed to:', transport.mapFile);
      })
      .catch(error => {
        console.error('Failed to load map:', transport.mapFile, error);
      });
  });
}

// イベントデータを読み込む
function loadEventData() {
  fetch('maps/events.json')
    .then(res => res.json())
    .then(eventsJson => {
      eventData = eventsJson.events;
      // eventPositionsは上書きしない（マップファイルから読み込まれたものを保持）
      console.log('Event data reloaded:', Object.keys(eventData).length, 'events');
      console.log('Current eventPositions preserved:', Object.keys(eventPositions).length, 'positions');
    })
    .catch(error => {
      console.error('Failed to load events:', error);
    });
}

// ダイアログを開始
function startDialog(dialog) {
  currentDialog = dialog;
  dialogIndex = 0;
  isDialogActive = true;
  
  showDialogUI();
  updateDialogContent();
}

// ダイアログUIを表示
function showDialogUI() {
  const overlay = document.getElementById('dialogOverlay');
  overlay.style.display = 'flex';
}

// ダイアログUIを非表示
function hideDialogUI() {
  const overlay = document.getElementById('dialogOverlay');
  overlay.style.display = 'none';
}

// ダイアログの内容を更新
function updateDialogContent() {
  if (!currentDialog) return;
  
  const speakerElement = document.getElementById('dialogSpeaker');
  const textElement = document.getElementById('dialogText');
  const nextButton = document.getElementById('dialogNext');
  const closeButton = document.getElementById('dialogClose');
  
  speakerElement.textContent = currentDialog.speaker || '';
  textElement.textContent = currentDialog.text[dialogIndex] || '';
  
  // ボタンの表示制御
  if (dialogIndex < currentDialog.text.length - 1) {
    nextButton.style.display = 'inline-block';
    closeButton.textContent = 'スキップ';
  } else {
    nextButton.style.display = 'none';
    closeButton.textContent = '閉じる';
  }
}

// 次のダイアログへ進む
function nextDialog() {
  if (!currentDialog) return;
  
  if (dialogIndex < currentDialog.text.length - 1) {
    dialogIndex++;
    updateDialogContent();
  } else {
    closeDialog();
  }
}

// ダイアログを閉じる
function closeDialog() {
  isDialogActive = false;
  currentDialog = null;
  dialogIndex = 0;
  hideDialogUI();
  
  // ダイアログ終了後に移動処理があるかチェック
  if (pendingTransport) {
    const transport = pendingTransport;
    pendingTransport = null; // 移動情報をクリア
    executeTransport(transport); // 移動実行
  }
}

// ダイアログのボタンイベント
document.getElementById('dialogNext').addEventListener('click', nextDialog);
document.getElementById('dialogClose').addEventListener('click', closeDialog);

// ダイアログオーバーレイクリックで閉じる（オプション）
document.getElementById('dialogOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'dialogOverlay') {
    closeDialog();
  }
});
