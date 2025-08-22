// RPG マップエディター JavaScript

class MapEditor {
    constructor() {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // エディター設定
        this.tileSize = 16; // 元画像の1タイルサイズ
        this.scale = 2; // 拡大倍率
        this.drawSize = this.tileSize * this.scale;
        this.zoom = 2;
        
        // マップデータ
        this.mapWidth = 20;
        this.mapHeight = 20;
        this.mapData = [];
        this.decorationData = [];
        this.eventData = [];
        this.tileData = {};
        
        // エディター状態
        this.currentLayer = 'ground'; // 'ground', 'decoration', 'event'
        this.selectedTile = null;
        this.currentTool = 'paint'; // 'paint', 'erase', 'fill'
        this.isDrawing = false;
        
        // カメラ
        this.camera = { x: 0, y: 0 };
        
        // 画像
        this.mapImg = new Image();
        this.mapImg.src = './src/img/splite/maptile1.png';
        this.mapImg.onload = () => this.onImageLoad();
        
        this.backImg = new Image();
        this.backImg.src = './src/img/splite/back.png';
        this.backImg.onload = () => this.onImageLoad();
        
        this.imagesLoaded = 0;
        this.totalImages = 2;
        
        this.init();
    }
    
    init() {
        this.setupUI();
        this.loadTileData();
        this.loadEventData(); // イベントデータを読み込み
        this.initializeMap();
        this.updateCanvasSize();
        this.setupEventListeners();
    }
    
    setupUI() {
        // レイヤー選択ボタン
        document.getElementById('groundLayer').addEventListener('click', () => this.switchLayer('ground'));
        document.getElementById('decorationLayer').addEventListener('click', () => this.switchLayer('decoration'));
        document.getElementById('eventLayer').addEventListener('click', () => this.switchLayer('event'));
        
        // ツール選択ボタン
        document.getElementById('paintTool').addEventListener('click', () => this.selectTool('paint'));
        document.getElementById('eraseTool').addEventListener('click', () => this.selectTool('erase'));
        document.getElementById('fillTool').addEventListener('click', () => this.selectTool('fill'));
        
        // マップ操作ボタン
        document.getElementById('newMap').addEventListener('click', () => this.newMap());
        document.getElementById('loadMap').addEventListener('click', () => this.loadMap());
        document.getElementById('saveMap').addEventListener('click', () => this.saveMap());
        document.getElementById('exportJson').addEventListener('click', () => this.exportJson());
        document.getElementById('resizeMap').addEventListener('click', () => this.resizeMap());
        
        // キャンバスコントロール
        document.getElementById('zoomSlider').addEventListener('input', (e) => this.setZoom(parseFloat(e.target.value)));
        document.getElementById('centerView').addEventListener('click', () => this.centerView());
        document.getElementById('showGrid').addEventListener('change', (e) => this.toggleGrid(e.target.checked));
        
        // ファイル入力
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileLoad(e));
    }
    
    async loadTileData() {
        try {
            const response = await fetch('./tiledata.json');
            this.tileData = await response.json();
            this.createTilePalette();
        } catch (error) {
            console.error('タイルデータの読み込みに失敗:', error);
            this.showStatus('タイルデータの読み込みに失敗しました', 'error');
        }
    }
    
    async loadEventData() {
        try {
            console.log('イベントデータ読み込み開始...');
            const response = await fetch('./maps/events.json');
            console.log('fetch完了:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const eventJson = await response.json();
            console.log('JSON解析完了:', eventJson);
            
            this.eventDataSource = eventJson.events || {};
            this.loadedEventPositions = eventJson.eventPositions || {}; // 表示専用
            this.editableEventPositions = {}; // 編集用（初期は空）
            console.log('イベントデータ読み込み完了:', Object.keys(this.eventDataSource).length, 'events');
            console.log('イベントデータ内容:', this.eventDataSource);
            this.createEventPalette();
        } catch (error) {
            console.error('イベントデータの読み込みに失敗:', error);
            this.eventDataSource = {};
            this.loadedEventPositions = {};
            this.editableEventPositions = {};
        }
    }
    
    onImageLoad() {
        this.imagesLoaded++;
        console.log(`画像読み込み: ${this.imagesLoaded}/${this.totalImages}`);
        
        if (this.imagesLoaded >= this.totalImages) {
            this.createTilePalette();
            this.render();
            this.showStatus('画像の読み込みが完了しました');
        }
    }
    
    createTilePalette() {
        if (this.imagesLoaded < this.totalImages || !this.tileData.tiles) return;
        
        // 基本タイルパレット
        const groundTilesContainer = document.getElementById('groundTiles');
        groundTilesContainer.innerHTML = '';
        
        Object.entries(this.tileData.tiles).forEach(([id, tile]) => {
            const tileElement = this.createTileElement(id, tile.name, 'ground');
            groundTilesContainer.appendChild(tileElement);
        });
        
        // デコレーションタイルパレット
        const decorationTilesContainer = document.getElementById('decorationTiles');
        decorationTilesContainer.innerHTML = '';
        
        // 空のタイル（削除用）
        const emptyTile = this.createTileElement('', '空', 'decoration');
        decorationTilesContainer.appendChild(emptyTile);
        
        Object.entries(this.tileData.decorations || {}).forEach(([id, decoration]) => {
            const tileElement = this.createTileElement(id, decoration.name, 'decoration');
            decorationTilesContainer.appendChild(tileElement);
        });
    }
    
    createEventPalette() {
        console.log('createEventPalette開始...');
        const eventTilesContainer = document.getElementById('eventTiles');
        console.log('eventTilesContainer:', eventTilesContainer);
        if (!eventTilesContainer) {
            console.error('eventTilesContainer が見つかりません');
            return;
        }
        
        eventTilesContainer.innerHTML = '';
        
        // 空のタイル（削除用）
        const emptyEventTile = this.createTileElement('', '空', 'event');
        eventTilesContainer.appendChild(emptyEventTile);
        console.log('空のタイル追加完了');
        
        // events.jsonから読み込んだイベントデータを使用
        console.log('イベントデータ処理開始:', this.eventDataSource);
        Object.entries(this.eventDataSource || {}).forEach(([id, event]) => {
            console.log(`イベント処理中: ${id}`, event);
            const tileElement = this.createTileElement(id, event.name || `イベント${id}`, 'event');
            eventTilesContainer.appendChild(tileElement);
        });
        
        // tiledata.jsonのイベントデータもあれば追加
        console.log('tiledata.jsonのイベント処理:', this.tileData.events);
        Object.entries(this.tileData.events || {}).forEach(([id, event]) => {
            const tileElement = this.createTileElement(`tile_${id}`, event.name, 'event');
            eventTilesContainer.appendChild(tileElement);
        });
        
        console.log('createEventPalette完了');
    }
    
    createTileElement(tileId, tileName, layer) {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile-item';
        tileElement.dataset.tileId = tileId;
        tileElement.dataset.layer = layer;
        tileElement.dataset.name = tileName;
        
        if (layer === 'event') {
            tileElement.classList.add('event-tile');
            
            if (tileId !== '') {
                // イベントタイルにはアイコンを表示
                const eventData = this.tileData.events[tileId];
                tileElement.textContent = eventData?.icon || '❓';
            } else {
                // 空のイベントタイル用の表示
                tileElement.textContent = '🚫';
                tileElement.style.background = '#666';
            }
        } else {
            // タイルの小さなプレビューを作成
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 32;
            previewCanvas.height = 32;
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.imageSmoothingEnabled = false;
            
            if (tileId !== '' && this.imagesLoaded >= this.totalImages) {
                this.drawTilePreview(previewCtx, tileId, layer);
            } else if (tileId === '') {
                // 空のタイル用の表示
                previewCtx.fillStyle = '#666';
                previewCtx.fillRect(0, 0, 32, 32);
                previewCtx.strokeStyle = '#999';
                previewCtx.strokeRect(0, 0, 32, 32);
            }
            
            tileElement.appendChild(previewCanvas);
        }
        
        tileElement.addEventListener('click', () => {
            this.selectTile(tileId, layer);
        });
        
        return tileElement;
    }
    
    drawTilePreview(ctx, tileId, layer) {
        if (this.imagesLoaded < this.totalImages) return;
        
        if (!tileId || tileId === '') return;
        
        // イベントレイヤーの場合は特別処理
        if (layer === 'event') {
            this.drawEventPreview(ctx, tileId);
            return;
        }
        
        // 16進数として解析（元のゲームと同じ方式）
        const id = parseInt(tileId, 16);
        if (isNaN(id)) {
            console.warn(`Invalid tile ID: ${tileId}`);
            return;
        }
        
        // レイヤーに応じて適切な画像を選択
        const sourceImg = layer === 'decoration' ? this.backImg : this.mapImg;
        
        // スプライトシートから該当のタイルを描画（16タイル幅固定）
        const tilesPerRow = 16;
        const srcX = (id % tilesPerRow) * this.tileSize;
        const srcY = Math.floor(id / tilesPerRow) * this.tileSize;
        
        console.log(`Drawing preview tile ${tileId} (${layer}): id=${id}, srcX=${srcX}, srcY=${srcY}, tilesPerRow=${tilesPerRow}`);
        
        try {
            ctx.drawImage(
                sourceImg,
                srcX, srcY, this.tileSize, this.tileSize,
                0, 0, 32, 32
            );
        } catch (error) {
            console.warn(`タイル ${tileId} (${layer}) の描画に失敗:`, error);
        }
    }
    
    drawEventPreview(ctx, eventId) {
        // イベント情報を取得
        let eventInfo = this.eventDataSource && this.eventDataSource[eventId];
        if (!eventInfo) {
            eventInfo = this.tileData.events && this.tileData.events[eventId];
        }
        if (!eventInfo) {
            eventInfo = { name: `イベント${eventId}`, type: 'unknown' };
        }
        
        // 背景色を設定（イベントタイプに応じて）
        let backgroundColor = '#e74c3c'; // デフォルト: 赤
        if (eventInfo.type === 'dialog') {
            backgroundColor = '#3498db'; // 青（ダイアログ）
        } else if (eventInfo.type === 'transport') {
            backgroundColor = '#9b59b6'; // 紫（移動）
        }
        
        // 背景を描画
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, 32, 32);
        
        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 32, 32);
        
        // アイコンを描画
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // アイコンを決定（drawEventMarkerと同じロジック）
        let icon = '❓';
        if (eventInfo.icon) {
            // カスタムアイコンが最優先
            icon = eventInfo.icon;
        } else if (eventInfo.type === 'dialog') {
            icon = '�';
        } else if (eventInfo.type === 'transport') {
            icon = '🚪';
        } else if (eventInfo.name) {
            const name = eventInfo.name.toLowerCase();
            if (name.includes('看板')) icon = '📋';
            else if (name.includes('村人')) icon = '👤';
            else if (name.includes('宝')) icon = '💎';
            else if (name.includes('商人')) icon = '🛒';
            else if (name.includes('石碑')) icon = '🗿';
            else if (name.includes('ダンジョン')) icon = '⚔️';
            else if (name.includes('扉')) icon = '🚪';
        }
        
        ctx.fillText(icon, 16, 16);
    }
    
    selectTile(tileId, layer) {
        this.selectedTile = tileId;
        
        // 選択状態を更新
        document.querySelectorAll('.tile-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedElement = document.querySelector(`[data-tile-id="${tileId}"][data-layer="${layer}"]`);
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }
        
        // 情報を更新
        const tileName = tileId === '' ? '空' : 
            (layer === 'ground' ? this.tileData.tiles[tileId]?.name : 
             layer === 'decoration' ? this.tileData.decorations[tileId]?.name :
             this.tileData.events[tileId]?.name) || '不明';
        document.getElementById('selectedTile').textContent = tileName;
        
        this.showStatus(`タイル "${tileName}" を選択しました`);
    }
    
    switchLayer(layer) {
        this.currentLayer = layer;
        
        // ボタンの表示を更新
        document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(layer + 'Layer').classList.add('active');
        
        // タイルパレットの表示を切り替え
        document.getElementById('groundTiles').style.display = layer === 'ground' ? 'grid' : 'none';
        document.getElementById('decorationTiles').style.display = layer === 'decoration' ? 'grid' : 'none';
        document.getElementById('eventTiles').style.display = layer === 'event' ? 'grid' : 'none';
        
        // 情報を更新
        const layerName = layer === 'ground' ? '基本マップ' : 
                         layer === 'decoration' ? 'デコレーション' : 'イベント';
        document.getElementById('currentLayer').textContent = layerName;
        
        // 選択タイルをクリア
        this.selectedTile = null;
        document.querySelectorAll('.tile-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.getElementById('selectedTile').textContent = 'なし';
        
        this.render();
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // ボタンの表示を更新
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');
        
        // カーソルスタイルを変更
        const cursor = {
            paint: 'crosshair',
            erase: 'cell',
            fill: 'copy'
        }[tool];
        this.canvas.style.cursor = cursor;
        
        this.showStatus(`ツール "${tool}" を選択しました`);
    }
    
    initializeMap() {
        this.mapData = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(''));
        this.decorationData = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(''));
        this.eventData = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(''));
        this.updateMapInfo();
    }
    
    updateCanvasSize() {
        const actualSize = this.drawSize * this.zoom;
        this.canvas.width = this.mapWidth * actualSize;
        this.canvas.height = this.mapHeight * actualSize;
        
        this.updateGridOverlay();
        this.render();
    }
    
    updateGridOverlay() {
        const gridOverlay = document.getElementById('grid-overlay');
        const actualSize = this.drawSize * this.zoom;
        gridOverlay.style.width = (this.mapWidth * actualSize) + 'px';
        gridOverlay.style.height = (this.mapHeight * actualSize) + 'px';
        
        if (document.getElementById('showGrid').checked) {
            this.drawGrid(gridOverlay, actualSize);
        }
    }
    
    drawGrid(container, size) {
        container.innerHTML = '';
        container.style.backgroundImage = `
            linear-gradient(to right, #555 1px, transparent 1px),
            linear-gradient(to bottom, #555 1px, transparent 1px)
        `;
        container.style.backgroundSize = `${size}px ${size}px`;
    }
    
    toggleGrid(show) {
        const gridOverlay = document.getElementById('grid-overlay');
        if (show) {
            this.updateGridOverlay();
        } else {
            gridOverlay.style.backgroundImage = 'none';
        }
    }
    
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        // マップサイズ変更
        document.getElementById('mapWidth').addEventListener('change', () => this.updateMapInfo());
        document.getElementById('mapHeight').addEventListener('change', () => this.updateMapInfo());
    }
    
    onMouseDown(e) {
        if (this.selectedTile === null && this.currentTool === 'paint') {
            this.showStatus('タイルを選択してください', 'error');
            return;
        }
        
        this.isDrawing = true;
        this.handleClick(e);
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const actualSize = this.drawSize * this.zoom;
        const tileX = Math.floor(x / actualSize);
        const tileY = Math.floor(y / actualSize);
        
        document.getElementById('mousePos').textContent = `マウス位置: (${tileX}, ${tileY})`;
        
        if (this.isDrawing && this.currentTool === 'paint') {
            this.handleClick(e);
        }
    }
    
    onMouseUp() {
        this.isDrawing = false;
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const actualSize = this.drawSize * this.zoom;
        const tileX = Math.floor(x / actualSize);
        const tileY = Math.floor(y / actualSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return;
        }
        
        switch (this.currentTool) {
            case 'paint':
                this.paintTile(tileX, tileY);
                break;
            case 'erase':
                this.eraseTile(tileX, tileY);
                break;
            case 'fill':
                this.fillArea(tileX, tileY);
                break;
        }
        
        this.render();
    }
    
    paintTile(x, y) {
        if (this.selectedTile === null) return;
        
        if (this.currentLayer === 'ground') {
            this.mapData[y][x] = this.selectedTile;
        } else if (this.currentLayer === 'decoration') {
            this.decorationData[y][x] = this.selectedTile;
        } else if (this.currentLayer === 'event') {
            if (this.selectedTile === '') {
                // 空のタイルを選択した場合は削除
                delete this.editableEventPositions[`${x},${y}`];
                this.eventData[y][x] = '';
            } else {
                // イベントを配置
                this.editableEventPositions[`${x},${y}`] = this.selectedTile;
                this.eventData[y][x] = this.selectedTile;
            }
        }
    }
    
    eraseTile(x, y) {
        if (this.currentLayer === 'ground') {
            this.mapData[y][x] = '';
        } else if (this.currentLayer === 'decoration') {
            this.decorationData[y][x] = '';
        } else if (this.currentLayer === 'event') {
            // 編集可能なイベントを削除
            delete this.editableEventPositions[`${x},${y}`];
            this.eventData[y][x] = '';
        }
    }
    
    fillArea(x, y) {
        if (this.selectedTile === null) return;
        
        let targetData;
        if (this.currentLayer === 'ground') {
            targetData = this.mapData;
        } else if (this.currentLayer === 'decoration') {
            targetData = this.decorationData;
        } else if (this.currentLayer === 'event') {
            targetData = this.eventData;
        }
        
        const originalTile = targetData[y][x];
        
        if (originalTile === this.selectedTile) return;
        
        this.floodFill(targetData, x, y, originalTile, this.selectedTile);
    }
    
    floodFill(data, x, y, originalTile, newTile) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
        if (data[y][x] !== originalTile) return;
        
        data[y][x] = newTile;
        
        this.floodFill(data, x + 1, y, originalTile, newTile);
        this.floodFill(data, x - 1, y, originalTile, newTile);
        this.floodFill(data, x, y + 1, originalTile, newTile);
        this.floodFill(data, x, y - 1, originalTile, newTile);
    }
    
    render() {
        if (this.imagesLoaded < this.totalImages) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const actualSize = this.drawSize * this.zoom;
        
        // 基本マップを描画
        this.renderLayer(this.mapData, actualSize, 'ground');
        
        // デコレーションレイヤーを描画
        if (this.currentLayer === 'decoration') {
            this.renderLayer(this.decorationData, actualSize, 'decoration', 0.7);
        } else {
            this.renderLayer(this.decorationData, actualSize, 'decoration');
        }
        
        // イベントレイヤーを描画
        if (this.currentLayer === 'event') {
            this.renderEventLayer(actualSize, 1.0);
        } else {
            this.renderEventLayer(actualSize, 0.6);
        }
    }
    
    renderLayer(data, size, layer, opacity = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileId = data[y][x];
                if (tileId && tileId !== '') {
                    this.drawTile(x, y, tileId, size, layer);
                }
            }
        }
        
        this.ctx.restore();
    }
    
    renderEventLayer(size, opacity = 1) {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // 従来のeventData形式をサポート（編集中のイベント）
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const eventId = this.eventData[y] && this.eventData[y][x];
                if (eventId && eventId !== '') {
                    this.drawEventMarker(x, y, eventId, size, false); // 編集可能
                }
            }
        }
        
        // 編集可能なイベント（新しく配置したもの）
        if (this.editableEventPositions) {
            Object.entries(this.editableEventPositions).forEach(([posKey, eventId]) => {
                const [x, y] = posKey.split(',').map(Number);
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    this.drawEventMarker(x, y, eventId, size, false); // 編集可能
                }
            });
        }
        
        // 読み込まれたイベント（参照専用、薄く表示）
        if (this.loadedEventPositions && this.currentLayer !== 'event') {
            this.ctx.globalAlpha = opacity * 0.3; // より薄く表示
            Object.entries(this.loadedEventPositions).forEach(([posKey, eventId]) => {
                const [x, y] = posKey.split(',').map(Number);
                if (x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
                    this.drawEventMarker(x, y, eventId, size, true); // 参照専用
                }
            });
        }
        
        this.ctx.restore();
    }
    
    drawEventMarker(x, y, eventId, size, isReadOnly = false) {
        // 新しいイベントデータから情報取得を試行
        let eventInfo = this.eventDataSource && this.eventDataSource[eventId];
        
        console.log('Drawing event marker:', eventId, 'eventInfo:', eventInfo);
        
        // 古いtiledata.jsonのイベントデータも確認
        if (!eventInfo) {
            eventInfo = this.tileData.events && this.tileData.events[eventId];
        }
        
        if (!eventInfo) {
            // イベントIDが見つからない場合のデフォルト表示
            eventInfo = { name: `イベント${eventId}`, type: 'unknown' };
        }
        
        const drawX = x * size;
        const drawY = y * size;
        
        // イベントタイプに応じた色分け
        let backgroundColor = 'rgba(231, 76, 60, 0.8)'; // デフォルト: 赤
        let borderColor = '#e74c3c';
        
        if (eventInfo.type === 'dialog') {
            backgroundColor = 'rgba(52, 152, 219, 0.8)'; // 青（ダイアログ）
            borderColor = '#3498db';
        } else if (eventInfo.type === 'transport') {
            backgroundColor = 'rgba(155, 89, 182, 0.8)'; // 紫（移動）
            borderColor = '#9b59b6';
        }
        
        // イベントマーカーの背景
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(drawX, drawY, size, size);
        
        // 枠線（読み込み専用の場合は破線）
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        
        if (isReadOnly) {
            // 破線で表示（読み込み専用）
            this.ctx.setLineDash([5, 5]);
        } else {
            // 実線で表示（編集可能）
            this.ctx.setLineDash([]);
        }
        
        this.ctx.strokeRect(drawX, drawY, size, size);
        this.ctx.setLineDash([]); // リセット
        
        // アイコン描画
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.floor(size * 0.6)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // イベントタイプに応じたアイコンを決定
        let icon = '❓'; // デフォルト
        
        if (eventInfo.icon) {
            // カスタムアイコンが最優先
            icon = eventInfo.icon;
        } else if (eventInfo.type === 'dialog') {
            icon = '�'; // ダイアログ
        } else if (eventInfo.type === 'transport') {
            icon = '🚪'; // 移動/扉
        } else if (eventInfo.name) {
            // 名前に基づいてアイコンを推測
            const name = eventInfo.name.toLowerCase();
            if (name.includes('看板') || name.includes('sign')) {
                icon = '📋';
            } else if (name.includes('村人') || name.includes('人')) {
                icon = '👤';
            } else if (name.includes('宝') || name.includes('treasure')) {
                icon = '💎';
            } else if (name.includes('商人') || name.includes('shop')) {
                icon = '🛒';
            } else if (name.includes('石碑') || name.includes('monument')) {
                icon = '🗿';
            } else if (name.includes('ダンジョン') || name.includes('dungeon')) {
                icon = '⚔️';
            } else if (name.includes('扉') || name.includes('door')) {
                icon = '🚪';
            }
        }
        
        this.ctx.fillText(icon, drawX + size / 2, drawY + size / 2);
        
        // イベントID表示（小さく）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${Math.floor(size * 0.2)}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(eventId, drawX + 2, drawY + 2);
    }
    
    drawTile(x, y, tileId, size, layer) {
        if (!tileId || tileId === '') return;
        
        // 16進数として解析（元のゲームと同じ方式）
        const id = parseInt(tileId, 16);
        if (isNaN(id)) {
            console.warn(`Invalid tile ID: ${tileId}`);
            return;
        }
        
        // レイヤーに応じて適切な画像を選択
        const sourceImg = layer === 'decoration' ? this.backImg : this.mapImg;
        
        // スプライトシートから該当のタイルを描画（16タイル幅固定）
        const tilesPerRow = 16;
        const srcX = (id % tilesPerRow) * this.tileSize;
        const srcY = Math.floor(id / tilesPerRow) * this.tileSize;
        
        console.log(`Drawing tile ${tileId} at (${x},${y}) (${layer}): id=${id}, srcX=${srcX}, srcY=${srcY}`);
        
        try {
            this.ctx.drawImage(
                sourceImg,
                srcX, srcY, this.tileSize, this.tileSize,
                x * size, y * size, size, size
            );
        } catch (error) {
            console.warn(`タイル ${tileId} (${layer}) の描画に失敗:`, error);
        }
    }
    
    setZoom(zoom) {
        this.zoom = zoom;
        document.getElementById('zoomValue').textContent = Math.round(zoom * 100) + '%';
        this.updateCanvasSize();
    }
    
    centerView() {
        this.camera.x = 0;
        this.camera.y = 0;
        // キャンバスを中央に配置（CSSで既に中央配置されているため、特別な処理は不要）
        this.showStatus('ビューを中央に戻しました');
    }
    
    newMap() {
        if (confirm('新しいマップを作成しますか？現在の変更は失われます。')) {
            this.initializeMap();
            this.render();
            this.showStatus('新しいマップを作成しました');
        }
    }
    
    loadMap() {
        document.getElementById('fileInput').click();
    }
    
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const mapJson = JSON.parse(e.target.result);
                this.loadMapData(mapJson);
                this.showStatus('マップを読み込みました');
            } catch (error) {
                console.error('マップ読み込みエラー:', error);
                this.showStatus('マップの読み込みに失敗しました', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    loadMapData(mapJson) {
        this.mapWidth = mapJson.width || 20;
        this.mapHeight = mapJson.height || 20;
        this.mapData = mapJson.data || [];
        this.decorationData = mapJson.decoration || [];
        this.eventData = mapJson.events || [];
        
        // マップサイズを入力フィールドに反映
        document.getElementById('mapWidth').value = this.mapWidth;
        document.getElementById('mapHeight').value = this.mapHeight;
        
        // データが不足している場合は補完
        this.ensureMapSize();
        
        this.updateCanvasSize();
        this.updateMapInfo();
        this.render();
    }
    
    ensureMapSize() {
        // マップデータのサイズを調整
        while (this.mapData.length < this.mapHeight) {
            this.mapData.push(Array(this.mapWidth).fill(''));
        }
        while (this.decorationData.length < this.mapHeight) {
            this.decorationData.push(Array(this.mapWidth).fill(''));
        }
        while (this.eventData.length < this.mapHeight) {
            this.eventData.push(Array(this.mapWidth).fill(''));
        }
        
        for (let y = 0; y < this.mapHeight; y++) {
            while (this.mapData[y].length < this.mapWidth) {
                this.mapData[y].push('');
            }
            while (this.decorationData[y].length < this.mapWidth) {
                this.decorationData[y].push('');
            }
            while (this.eventData[y].length < this.mapWidth) {
                this.eventData[y].push('');
            }
            
            // サイズが大きすぎる場合は切り詰め
            this.mapData[y] = this.mapData[y].slice(0, this.mapWidth);
            this.decorationData[y] = this.decorationData[y].slice(0, this.mapWidth);
            this.eventData[y] = this.eventData[y].slice(0, this.mapWidth);
        }
        
        // 行数を調整
        this.mapData = this.mapData.slice(0, this.mapHeight);
        this.decorationData = this.decorationData.slice(0, this.mapHeight);
        this.eventData = this.eventData.slice(0, this.mapHeight);
    }
    
    saveMap() {
        const mapJson = this.generateMapJson();
        const dataStr = JSON.stringify(mapJson, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'map.json';
        link.click();
        
        this.showStatus('マップを保存しました');
    }
    
    exportJson() {
        const mapJson = this.generateMapJson();
        const dataStr = JSON.stringify(mapJson, null, 2);
        
        navigator.clipboard.writeText(dataStr).then(() => {
            this.showStatus('JSONをクリップボードにコピーしました');
        }).catch(() => {
            // フォールバック: テキストエリアを作成してコピー
            const textarea = document.createElement('textarea');
            textarea.value = dataStr;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showStatus('JSONをクリップボードにコピーしました');
        });
    }
    
    generateMapJson() {
        // イベントデータからeventPositionsを生成
        const eventPositions = {};
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const eventId = this.eventData[y][x];
                if (eventId && eventId !== '') {
                    eventPositions[`${x},${y}`] = eventId;
                }
            }
        }
        
        return {
            width: this.mapWidth,
            height: this.mapHeight,
            data: this.mapData,
            decoration: this.decorationData,
            events: this.eventData,
            eventPositions: eventPositions
        };
    }
    
    resizeMap() {
        const newWidth = parseInt(document.getElementById('mapWidth').value);
        const newHeight = parseInt(document.getElementById('mapHeight').value);
        
        if (newWidth < 1 || newHeight < 1 || newWidth > 100 || newHeight > 100) {
            this.showStatus('マップサイズは1-100の範囲で入力してください', 'error');
            return;
        }
        
        if (confirm(`マップサイズを ${newWidth}x${newHeight} に変更しますか？`)) {
            this.mapWidth = newWidth;
            this.mapHeight = newHeight;
            this.ensureMapSize();
            this.updateCanvasSize();
            this.updateMapInfo();
            this.render();
            this.showStatus(`マップサイズを ${newWidth}x${newHeight} に変更しました`);
        }
    }
    
    updateMapInfo() {
        const width = parseInt(document.getElementById('mapWidth').value) || this.mapWidth;
        const height = parseInt(document.getElementById('mapHeight').value) || this.mapHeight;
        document.getElementById('currentSize').textContent = `${width}x${height}`;
    }
    
    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = type;
        
        // 3秒後にクリア
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = '準備完了';
                statusElement.className = '';
            }
        }, 3000);
    }
}

// エディターを初期化
document.addEventListener('DOMContentLoaded', () => {
    new MapEditor();
});
