/**
 * NEON DEFENSE ENGINE
 */

// Canvas & Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameActive = false;
let gamePaused = false;
let lastTime = 0;
let animationFrameId = null;
let debugMode = false; // Debug mode toggle
const showDebugUI = true; // Set to false to hide debug button

// DPS Tracking
let totalDamageDealt = 0; // Total damage dealt in current second
let lastDPSUpdateTime = 0; // Timestamp of last DPS calculation
let currentDPS = 0; // Current DPS value

let money = 150;
let lives = 20;
let wave = 1;
let waveActive = false;
let enemiesToSpawn = 0;
let totalWaveEnemies = 0; // Added for progress bar
let spawnTimer = 0;
let spawnInterval = 1000;
let bossSpawned = false;

// Electronic Chips (for skill tree)
let electronicChips = 0;
let tempChipsThisGame = 0; // Temporary chips collected during current game
const CHIP_DROP_RATE = 0.3; // 30% chance to drop chip

// Title Animation
let titleAnimationActive = true;

// Endless Mode
let endlessMode = false;
let endlessScore = 0;
let endlessBestScore = 0;
let fortressBossSpawned = false;
let bossDeathAnimation = null; // Boss death animation state
let stormGroupIdCounter = 0; // Counter for unique storm group IDs
let stormGroupKillCount = new Map(); // Track kills per storm group (groupId -> count)

// Auto Wave Mode
let autoWaveMode = false;
let autoWavePressTimer = null;

// Tutorial System
let tutorialActive = false;
let currentTutorialPage = 0;
const tutorialData = [
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'NEON DEFENCEへようこそ、私はここのナビゲーター、エイコと申します。\n指揮者様はここで働かれるのは初めてのようですので\n私がナビゲートさせていただきます。',
        highlight: null,
        showUI: true,
        clickable: false,
        screen: 'menu'
    },
    {
        character: 'img/chara/cha1-2.png',
        name: 'エイコ',
        message: '早速なのですが、指揮者様にはベースを破壊を企んでいるモンスターから守ってもらいます',
        highlight: null,
        showUI: true,
        clickable: false,
        screen: 'menu'
    },
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'playgameを押してステージへと移動してください',
        highlight: '.menu-button',
        showUI: false,
        clickable: true,
        screen: 'menu'
    },
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'STAGE 1を押して戦闘を開始しましょう',
        highlight: '#stage-node-1',
        showUI: false,
        clickable: true,
        screen: 'stage-map',
        showOverlay: false
    },
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'ゲームが始まりました！\n画面下部のボタンから\nタワーを選択してみましょう',
        highlight: '#btn-turret',
        showUI: true,
        clickable: false,
        screen: 'game'
    },
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'タワーを選んだら\nフィールド上をクリックして\n配置しましょう',
        highlight: null,
        showUI: true,
        clickable: false,
        screen: 'game'
    },
    {
        character: 'img/chara/cha1-0.png',
        name: 'エイコ',
        message: 'タワーは経験値でレベルアップし\n特定レベルで進化できます。\n戦略的に配置して敵を倒しましょう！',
        highlight: null,
        showUI: true,
        clickable: false,
        screen: 'game'
    },
    {
        character: 'img/chara/cha1-1.png',
        name: 'エイコ',
        message: 'それでは指揮者様、\nベースを守り抜いてくださいね！',
        highlight: null,
        showUI: true,
        clickable: false,
        screen: 'game'
    }
];

// Entities
let enemies = [];
let towers = [];
let projectiles = [];
let particles = [];
let damageTexts = [];
let freezeZones = [];
let stunZones = [];
let lightningStrikes = [];
let zombies = []; // ネクロマンサーによって生成されたゾンビ
let warpEffects = []; // ワープエフェクト
let mines = []; // Sweeperタワーによって設置された地雷
let solarFlares = []; // Sol-Blasterによって放出されたフレア

// Sound Effects
const sounds = {
    select: new Audio('src/se/select.wav'),
    enemyDestroy: new Audio('src/se/enemyDestroy.wav'),
    ice: new Audio('src/se/ice.mp3'),
    warp: new Audio('src/se/warp.mp3')
};

// BGM
const bgm = new Audio('src/bgm/SuperBall.mp3');
bgm.volume = 0.25; // 75% volume
bgm.loop = true; // Loop playback

// Preload assets
const assetsToLoad = {
    images: [
        'img/chara/cha1-0.png',
        'img/chara/cha1-1.png',
        'img/chara/cha1-2.png',
        'img/chara/skill/cha1.png',
        'img/chara/skill/cha2.png',
        'img/chara/skill/cha3.png',
        'img/chara/navi_normal.PNG',
        'img/tree/base.PNG',
        'img/tree/base2.PNG',
        'img/tree/base3.PNG',
        'img/tree/base4.PNG',
        'img/tree/turret.PNG',
        'img/tree/sniper.PNG',
        'img/tree/blaster.PNG',
        'img/tree/rod.PNG',
        'img/tree/credit.PNG',
        'img/tree/chip.PNG',
        'img/tree/damage.PNG',
        'img/tree/freeze.PNG',
        'img/tree/burn.PNG',
        'img/tree/sweeper.PNG',
        'img/tree/gear.PNG'
    ],
    audio: [
        'src/se/select.wav',
        'src/se/enemyDestroy.wav',
        'src/se/ice.mp3',
        'src/se/warp.mp3',
        'src/bgm/SuperBall.mp3'
    ]
};

let loadedAssets = 0;
let totalAssets = assetsToLoad.images.length + assetsToLoad.audio.length;
let isAssetsLoaded = false;

function updateLoadingProgress(current, total, status = '') {
    const percent = Math.floor((current / total) * 100);
    const progressBar = document.getElementById('loading-progress-bar');
    const percentText = document.getElementById('loading-percent');
    const statusText = document.getElementById('loading-status');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (percentText) percentText.textContent = percent + '%';
    if (statusText && status) statusText.textContent = status;
}

function preloadAssets() {
    return new Promise((resolve) => {
        let loaded = 0;
        const incrementLoaded = () => {
            loaded++;
            if (loaded === totalAssets) {
                resolve();
            }
        };
        
        // Preload images
        assetsToLoad.images.forEach((src, index) => {
            const img = new Image();
            img.onload = () => {
                updateLoadingProgress(loaded + 1, totalAssets, `Loading images (${index + 1}/${assetsToLoad.images.length})`);
                incrementLoaded();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                updateLoadingProgress(loaded + 1, totalAssets, `Loading images (${index + 1}/${assetsToLoad.images.length})`);
                incrementLoaded();
            };
            img.src = src;
        });
        
        // Preload audio - use simpler approach
        assetsToLoad.audio.forEach((src, index) => {
            const audio = new Audio();
            
            // Use a timeout as fallback
            const timeout = setTimeout(() => {
                updateLoadingProgress(loaded + 1, totalAssets, `Loading audio (${index + 1}/${assetsToLoad.audio.length})`);
                incrementLoaded();
            }, 2000);
            
            audio.onloadeddata = () => {
                clearTimeout(timeout);
                updateLoadingProgress(loaded + 1, totalAssets, `Loading audio (${index + 1}/${assetsToLoad.audio.length})`);
                incrementLoaded();
            };
            audio.onerror = () => {
                clearTimeout(timeout);
                console.warn(`Failed to load audio: ${src}`);
                updateLoadingProgress(loaded + 1, totalAssets, `Loading audio (${index + 1}/${assetsToLoad.audio.length})`);
                incrementLoaded();
            };
            audio.src = src;
            audio.load();
        });
    });
}

// Initialize loading on page load
window.addEventListener('load', async () => {
    updateLoadingProgress(0, totalAssets, 'Initializing...');
    
    await preloadAssets();
    
    updateLoadingProgress(totalAssets, totalAssets, 'Complete!');
    isAssetsLoaded = true;
    
    // Fade out loading screen and show title screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        const titleScreen = document.getElementById('title-screen');
        
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.5s ease';
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (titleScreen) {
                    titleScreen.style.display = 'flex';
                }
            }, 500);
        }
    }, 500);
});

// Set volume levels
sounds.enemyDestroy.volume = 0.75; // 50% volume

// Play sound function with error handling (supports simultaneous playback)
function playSound(soundName) {
    try {
        // Don't play sound if SE volume is 0
        if (qualitySettings.seVolume === 0) return;
        
        const originalSound = sounds[soundName];
        if (originalSound) {
            // Clone the audio to allow simultaneous playback
            const sound = originalSound.cloneNode();
            sound.volume = originalSound.volume;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    } catch (e) {
        console.log('Sound error:', e);
    }
}

// Grid & Pathing
const CELL_SIZE = 40;
let gridCols = 0;
let gridRows = 0;
let path = [];

// Interaction
let selectedTowerType = null; // For building
let selectedTowerInstance = null; // For upgrading
let copiedTowerData = null; // For copy & paste (debug feature)
let commandInputActive = false; // Debug command input
let mouseX = 0;
let mouseY = 0;

// Temporary tower placement (for mobile confirmation)
let tempTowerX = null;
let tempTowerY = null;
let tempTowerType = null;

// Camera offset for panning
let cameraOffsetX = 0;
let cameraOffsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;
let initialPinchDistance = 0;

// Zoom
let zoomLevel = 1.0;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

// Field boundaries (playable area)
const FIELD_WIDTH = 1200;
const FIELD_HEIGHT = 800;
const FIELD_MARGIN = 50; // Border around the field
let dashOffset = 0; // For animated dashed border

// Grid snap settings
let gridSnapEnabled = false;
const GRID_SIZE = 40; // Grid cell size in pixels
let showGridWhilePasting = false; // Shift+スペースキー押下時の一時的なグリッド表示
let showPreviewWithShift = false; // Shiftキー押下中のプレビュー表示

// Performance and Quality Settings
let qualitySettings = {
    graphics: 'high', // 'high', 'medium', 'low'
    effects: 'standard', // 'standard', 'low'
    seVolume: 0.75,
    bgmVolume: 0.25,
    showFPS: false,
    fpsLimit: 0 // 0 = unlimited, 30-144
};

// FPS Tracking
let fpsHistory = [];
let currentFPS = 0;
let minFPS = 60;
let maxFPS = 60;
let lastFrameTime = 0;

// Delta time for frame-independent game speed
let dt = 1; // Delta time multiplier (1 = 60 FPS baseline)
const TARGET_FPS = 60;

// Mobile device detection
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0);

// Custom field shapes for each stage
// NOTE: ゲーム中プレイ可能領域
const stageFieldShapes = {
    1: null, // Default rectangular field
    2: {
        // L-shape with bottom-left protrusion
        excludeZones: [
            // Bottom-left cutout (the protruding area is playable, so we cut out the area that would normally be there)
        ],
        customPlayableZones: [
            // Main rectangular area
            { x: FIELD_MARGIN, y: FIELD_MARGIN, width: FIELD_WIDTH, height: FIELD_HEIGHT - 200 },
            // Bottom-left protrusion
            { x: 50, y: FIELD_HEIGHT + FIELD_MARGIN - 200, width: FIELD_MARGIN * 5 - 10, height: FIELD_MARGIN * 4 }
        ]
    },
    3: {
        // Custom shape for stage 3
        excludeZones: [],
        customPlayableZones: [
            { x: 50, y: 50, width: 1200, height: 800 }
        ]
    }
};

// Boss appearance animation
let bossShockwaveRadius = 0;
let bossShockwaveActive = false;
let screenShakeDuration = 0;
let screenShakeIntensity = 0;

// Damage flash effect
let damageFlashAlpha = 0; // 0 to 1, for red screen flash
let baseDestroyed = false; // Hide base when destroyed

// Skill Tree System
let unlockedSkills = [];

// Commander System
let unlockedCommanders = ['eiko']; // Initial commander unlocked
let selectedCommander = null; // Currently equipped commander
let activeSkillCooldown = 0; // Cooldown timer in frames
let activeSkillDuration = 0; // Active skill effect duration in frames
let activeSkillActive = false; // Is active skill currently active
let cutinAnimationActive = false; // Cutin animation flag
let cutinAnimationProgress = 0; // Animation progress (0-1)

const commanders = {
    'eiko': {
        id: 'eiko',
        name: 'エイコ',
        image: 'img/chara/skill/cha1.png',
        unlockCost: 0, // Free (initial commander)
        activeSkill: {
            name: 'クイックファスト',
            description: '全タワーの攻撃速度+100%',
            duration: 1800, // 30s * 60fps
            cooldown: 3600, // 60s * 60fps
            icon: '⚡'
        },
        passiveSkill: {
            name: '効率的な生産',
            description: 'タワーのLvupコスト-10%',
            icon: '💰'
        }
    },
    'reika': {
        id: 'reika',
        name: 'レイカ',
        image: 'img/chara/skill/cha2.png',
        unlockCost: 100, // Electronic chips
        activeSkill: {
            name: 'ホワイトアウト',
            description: 'フィールド全体「猛吹雪」(スロー+継続ダメージ)',
            duration: 600, // 10s * 60fps
            cooldown: 3600, // 60s * 60fps
            icon: '❄️'
        },
        passiveSkill: {
            name: 'しもやけ',
            description: '凍結、スロー付与された敵に追加ダメージを与える',
            icon: '🧊'
        }
    },
    'benix': {
        id: 'benix',
        name: 'べニックス',
        image: 'img/chara/skill/cha3.png',
        unlockCost: 150, // Electronic chips
        activeSkill: {
            name: '鼓舞！鼓舞！',
            description: 'クリティカル率+10%、クリティカルダメージ+100%',
            duration: 1800, // 30s * 60fps
            cooldown: 3600, // 60s * 60fps
            icon: '🔥'
        },
        passiveSkill: {
            name: '追い詰める',
            description: 'デバフの継続時間+3s',
            icon: '⏱️'
        }
    }
};
const skillTree = {
    'base_upgrade2': {
        id: 'base_upgrade2',
        name: 'ベース改造',
        description: '初期ライフ+5',
        cost: 25,
        icon: '🏯',
        image: 'img/tree/base2.PNG',
        requires: ['unlock_rod', 'enemy_credits', 'all_tower_damage'],
        unlocks: [/* cross_specialization, initial_credits4 */ 'weak_point_analysis', 'terraforming'],
        special: true, // Mark as special/important skill
        effect: () => { /* Applied in resetGameVars */ }
    },
    'base_upgrade': {
        id: 'base_upgrade',
        name: 'ベース強化',
        description: '初期ライフ+5',
        cost: 5,
        icon: '🏰',
        image: 'img/tree/base.PNG',
        requires: [],
        unlocks: ['initial_credits', 'base_upgrade2'],
        special: true, // Mark as special/important skill
        effect: () => { /* Applied in resetGameVars */ }
    },
    'initial_credits': {
        id: 'initial_credits',
        name: '支援金I',
        description: '初期クレジット+50',
        cost: 5,
        icon: '$',
        image: 'img/tree/credit.PNG',
        requires: ['base_upgrade'],
        unlocks: ['turret_damage', 'sniper_damage', 'blaster_damage', 'unlock_rod', 'initial_credits2'],
        effect: () => { /* Applied in resetGameVars */ }
    },
    'unlock_rod': {
        id: 'unlock_rod',
        name: '新兵器',
        description: 'RODタワーを解放',
        cost: 20,
        icon: '🔧',
        image: 'img/tree/rod.PNG',
        requires: ['initial_credits'],
        unlocks: ['rod_damage', 'base_upgrade2', 'cross_specialization', 'voltage_transformer', /* base_upgrade2 */, 'obey'],
        effect: () => { /* Unlocks ROD tower */ }
    },
    'voltage_transformer': {
        id: 'voltage_transformer',
        name: '変電圧',
        description: 'サージ能力解放、発生確率+10%',
        cost: 30,
        icon: '⚡',
        image: 'img/tree/rod.PNG',
        requires: ['unlock_rod'],
        unlocks: [],
        better: true,
        effect: () => { /* Unlocks surge ability */ }
    },
    'turret_damage': {
        id: 'turret_damage',
        name: 'TURRETダメージ強化',
        description: 'TURRET系タワーのダメージ+5%',
        cost: 10,
        icon: '⚡',
        image: 'img/tree/turret.PNG',
        requires: ['initial_credits'],
        unlocks: ['turret_range'],
        effect: () => { /* Applied to turret towers */ }
    },
    'turret_range': {
        id: 'turret_range',
        name: 'TURRET射程強化',
        description: 'TURRET系タワーの射程+1%',
        cost: 10,
        icon: '◎',
        image: 'img/tree/turret.PNG',
        requires: ['turret_damage'],
        unlocks: ['all_tower_damage'],
        effect: () => { /* Applied to turret towers */ }
    },
    'sniper_damage': {
        id: 'sniper_damage',
        name: 'SNIPERダメージ強化',
        description: 'SNIPER系タワーのダメージ+5%',
        cost: 10,
        icon: '🎯',
        image: 'img/tree/sniper.PNG',
        requires: ['initial_credits'],
        unlocks: ['sniper_range'],
        effect: () => { /* Applied to sniper towers */ }
    },
    'sniper_range': {
        id: 'sniper_range',
        name: 'SNIPER射程強化',
        description: 'SNIPER系タワーの射程+1%',
        cost: 10,
        icon: '🔭',
        image: 'img/tree/sniper.PNG',
        requires: ['sniper_damage'],
        unlocks: ['all_tower_damage'],
        effect: () => { /* Applied to sniper towers */ }
    },
    'blaster_damage': {
        id: 'blaster_damage',
        name: 'BLASTERダメージ強化',
        description: 'BLASTER系タワーのダメージ+5%',
        cost: 10,
        icon: '🔥',
        image: 'img/tree/blaster.PNG',
        requires: ['initial_credits'],
        unlocks: ['blaster_range'],
        effect: () => { /* Applied to blaster towers */ }
    },
    'blaster_range': {
        id: 'blaster_range',
        name: 'BLASTER射程強化',
        description: 'BLASTER系タワーの射程+1%',
        cost: 10,
        icon: '💥',
        image: 'img/tree/blaster.PNG',
        requires: ['blaster_damage'],
        unlocks: ['all_tower_damage', 'burn_damage', 'freeze_duration'],
        effect: () => { /* Applied to blaster towers */ }
    },
    'all_tower_damage': {
        id: 'all_tower_damage',
        name: '全タワー強化',
        description: '全タワーのダメージ+10%',
        cost: 30,
        icon: '⚔️',
        image: 'img/tree/damage.PNG',
        requires: ['turret_range', 'sniper_range', 'blaster_range'],
        unlocks: ['quantity_over_quality', 'mass', 'hotfix'],
        effect: () => { /* Applied to all towers */ }
    },
    'weak_point_analysis': {
        id: 'weak_point_analysis',
        name: '弱点解析',
        description: 'クリティカル率+1%',
        cost: 10,
        icon: '🎯',
        image: 'img/tree/damage.PNG',
        requires: ['base_upgrade2'],
        unlocks: ['vulnerability'],
        better: true,
        effect: () => { /* Applied to crit rate */ }
    },
    'rod_damage': {
        id: 'rod_damage',
        name: 'RODダメージ強化',
        description: 'ROD系タワーのダメージ+5%',
        cost: 10,
        icon: '⚡',
        image: 'img/tree/rod.PNG',
        requires: ['unlock_rod'],
        unlocks: ['rod_range'],
        effect: () => { /* Applied to rod towers */ }
    },
    'rod_range': {
        id: 'rod_range',
        name: 'ROD射程強化',
        description: 'ROD系タワーの射程+1%',
        cost: 10,
        icon: '⚡',
        image: 'img/tree/rod.PNG',
        requires: ['rod_damage'],
        unlocks: [],
        effect: () => { /* Applied to rod towers */ }
    },
    'initial_credits2': {
        id: 'initial_credits2',
        name: '支援金II',
        description: '初期クレジット+50',
        cost: 10,
        icon: '$',
        image: 'img/tree/credit.PNG',
        requires: ['initial_credits'],
        unlocks: ['chip_rate', 'initial_credits3'],
        effect: () => { /* Applied in resetGameVars */ }
    },
    'chip_rate': {
        id: 'chip_rate',
        name: 'クロック強化',
        description: '電子チップのドロップ率+10%',
        cost: 10,
        icon: '💰',
        image: 'img/tree/chip.PNG',
        requires: ['initial_credits2'],
        unlocks: ['enemy_credits'],
        effect: () => { /* Applied to drop rate */ }
    },
    'initial_credits3': {
        id: 'initial_credits3',
        name: '支援金III',
        description: '初期クレジット+100',
        cost: 15,
        icon: '$',
        image: 'img/tree/credit.PNG',
        requires: ['initial_credits2'],
        unlocks: ['enemy_credits','initial_credits4'],
        effect: () => { /* Applied in resetGameVars */ }
    },
    'initial_credits4': {
        id: 'initial_credits4',
        name: '支援金IV',
        description: '初期クレジット+100',
        cost: 30,
        icon: '$',
        image: 'img/tree/credit.PNG',
        requires: ['initial_credits3', 'base_upgrade2'],
        unlocks: [],
        effect: () => { /* Applied in resetGameVars */ }
    },
    'enemy_credits': {
        id: 'enemy_credits',
        name: '略奪',
        description: '敵を倒した際のクレジット獲得量+20%',
        cost: 20,
        icon: '💵',
        image: 'img/tree/credit.PNG',
        requires: ['initial_credits3', 'chip_rate'],
        unlocks: [/* base_upgrade2 */, 'economics'],
        effect: () => { /* Applied when enemy dies */ }
    },
    'freeze_duration': {
        id: 'freeze_duration',
        name: '冷凍強化',
        description: '氷結状態の持続時間+50%',
        cost: 10,
        icon: '❄️',
        image: 'img/tree/freeze.PNG',
        requires: ['blaster_range'],
        unlocks: [],
        effect: () => { /* Applied to freeze duration */ }
    },
    'burn_damage': {
        id: 'burn_damage',
        name: '延焼強化',
        description: '延焼状態の与ダメージ+50%',
        cost: 10,
        icon: '🔥',
        image: 'img/tree/burn.PNG',
        requires: ['blaster_range'],
        unlocks: [/* cross_specialization */ 'inferno'],
        effect: () => { /* Applied to burn damage */ }
    },
    'cross_specialization': {
        id: 'cross_specialization',
        name: '専門外',
        description: 'RODタワーの新たな進化を解放',
        cost: 20,
        icon: '⚡',
        image: 'img/tree/burn.PNG',
        requires: ['burn_damage', 'unlock_rod', 'base_upgrade2'],
        unlocks: [],
        better: true, // Mark as better skill (blue when unlocked)
        effect: () => { /* Unlocks Burn-Lightning evolution */ }
    },
    'obey': {
        id: 'obey',
        name: '服従せよ',
        description: 'Necromancer(rod)を解放',
        cost: 100,
        icon: '💀',
        image: 'img/tree/rod.PNG',
        requires: ['unlock_rod', 'terraforming'],
        unlocks: ['magician'],
        better: true,
        effect: () => { /* Unlocks Necromancer evolution */ }
    },
    'magician': {
        id: 'magician',
        name: '彼はマジシャン？',
        description: 'Warp(rod)を解放',
        cost: 100,
        icon: '🎩',
        image: 'img/tree/rod.PNG',
        requires: ['terraforming'],
        unlocks: ['quantum_transfer'],
        better: true,
        effect: () => { /* Unlocks Warp-Rod evolution */ }
    },
    'ultimate_power': {
        id: 'ultimate_power',
        name: '更なる力を求めて',
        description: 'すべてのlv70の進化を解放',
        cost: 1000,
        icon: '⭐',
        image: 'img/tree/damage.PNG',
        requires: ['terraforming'],
        unlocks: [],
        epic: true,
        effect: () => { /* Unlocks all level 70 evolutions */ }
    },
    'vulnerability': {
        id: 'vulnerability',
        name: '脆弱性',
        description: 'クリティカル率+1%',
        cost: 200,
        icon: '🎯',
        image: 'img/tree/damage.PNG',
        requires: ['terraforming'],
        unlocks: ['ai_analysis'],
        better: true,
        effect: () => { /* +1% crit rate */ }
    },
    'quantity_over_quality': {
        id: 'quantity_over_quality',
        name: '質より物量',
        description: 'TURRETの連射速度+5%',
        cost: 100,
        icon: '🔫',
        image: 'img/tree/turret.PNG',
        requires: ['terraforming'],
        unlocks: ['bullet_hardening'],
        better: true,
        effect: () => { /* +5% turret fire rate */ }
    },
    'mass': {
        id: 'mass',
        name: '質量',
        description: 'SNIPERの攻撃力+5%',
        cost: 100,
        icon: '💪',
        image: 'img/tree/sniper.PNG',
        requires: ['terraforming'],
        unlocks: ['sharpness_or_hardness'],
        better: true,
        effect: () => { /* +5% sniper damage */ }
    },
    'hotfix': {
        id: 'hotfix',
        name: 'hotfix',
        description: 'Blasterの射程+5%',
        cost: 100,
        icon: '🔧',
        image: 'img/tree/blaster.PNG',
        requires: ['terraforming'],
        unlocks: ['bang'],
        better: true,
        effect: () => { /* +5% blaster range */ }
    },
    'quantum_transfer': {
        id: 'quantum_transfer',
        name: '量子転移',
        description: 'ワープ確率+5%',
        cost: 200,
        icon: '🌀',
        image: 'img/tree/rod.PNG',
        requires: ['terraforming', 'magician'],
        unlocks: [],
        effect: () => { /* +5% warp chance */ }
    },
    'economics': {
        id: 'economics',
        name: '経済学',
        description: '敵を倒した際のクレジット獲得量+20%',
        cost: 200,
        icon: '💰',
        image: 'img/tree/credit.PNG',
        requires: ['terraforming'],
        unlocks: [],
        effect: () => { /* +20% credits from enemies */ }
    },
    'terraforming': {
        id: 'terraforming',
        name: 'テラフォーミング',
        description: 'Life+5',
        cost: 500,
        icon: '🏔️',
        image: 'img/tree/base3.PNG',
        requires: ['base_upgrade2'],
        unlocks: ['ultimate_power', 'minesweeper', 'terraforming2'],
        epic: true,
        special: true,
        effect: () => { /* +5 life */ }
    },
    'minesweeper': {
        id: 'minesweeper',
        name: 'マインスイーパー',
        description: 'Sweeperタワーを解放',
        cost: 100,
        icon: '💣',
        image: 'img/tree/sweeper.PNG',
        requires: ['terraforming'],
        unlocks: [],
        better: true,
        effect: () => { /* Unlocks Sweeper tower */ }
    },
    'terraforming2': {
        id: 'terraforming2',
        name: 'テラフォーミングII',
        description: 'Life+5',
        cost: 700,
        icon: '🏔️',
        image: 'img/tree/base4.PNG',
        requires: ['terraforming'],
        unlocks: ['self_generation'],
        special: true,
        effect: () => { /* +5 life */ }
    },
    'bullet_hardening': {
        id: 'bullet_hardening',
        name: '弾丸硬化',
        description: 'TURRETのダメージ+10%',
        cost: 300,
        icon: '🔫',
        image: 'img/tree/turret.PNG',
        requires: ['terraforming2', 'quantity_over_quality'],
        unlocks: ['rapid_fire'],
        better: true,
        effect: () => { /* +10% turret damage */ }
    },
    'rapid_fire': {
        id: 'rapid_fire',
        name: '叩いて、叩いて、叩いて',
        description: 'TURRETの連射速度+5%',
        cost: 300,
        icon: '🔫',
        image: 'img/tree/turret.PNG',
        requires: ['bullet_hardening'],
        unlocks: ['ultimate_power2'],
        better: true,
        effect: () => { /* +5% turret fire rate */ }
    },
    'sharpness_or_hardness': {
        id: 'sharpness_or_hardness',
        name: '鋭さが先か、硬さが先か',
        description: 'SNIPERのダメージ+10%',
        cost: 300,
        icon: '🎯',
        image: 'img/tree/sniper.PNG',
        requires: ['terraforming2', 'mass'],
        unlocks: ['tile_break'],
        better: true,
        effect: () => { /* +10% sniper damage */ }
    },
    'bang': {
        id: 'bang',
        name: 'BANG',
        description: 'BLASTERのダメージ+10%',
        cost: 300,
        icon: '💥',
        image: 'img/tree/blaster.PNG',
        requires: ['terraforming2', 'hotfix'],
        unlocks: [],
        better: true,
        effect: () => { /* +10% blaster damage */ }
    },
    'inferno': {
        id: 'inferno',
        name: '業火',
        description: '延焼状態の与ダメージ+100%',
        cost: 300,
        icon: '🔥',
        image: 'img/tree/burn.PNG',
        requires: ['terraforming2', 'burn_damage'],
        unlocks: [],
        better: true,
        effect: () => { /* +100% burn damage */ }
    },
    'self_generation': {
        id: 'self_generation',
        name: '自家発電',
        description: 'Gearタワー解放',
        cost: 300,
        icon: '⚙️',
        image: 'img/tree/gear.PNG',
        requires: ['terraforming2'],
        unlocks: ['durability_improvement'],
        epic: true,
        effect: () => { /* Unlocks Gear tower */ }
    },
    'durability_improvement': {
        id: 'durability_improvement',
        name: '耐久性向上',
        description: 'Gear(第一形態)の連鎖上限+5',
        cost: 300,
        icon: '⚙️',
        image: 'img/tree/gear.PNG',
        requires: ['self_generation'],
        unlocks: [],
        better: true,
        effect: () => { /* +5 chain limit for Gear */ }
    },
    'ai_analysis': {
        id: 'ai_analysis',
        name: 'AI解析',
        description: 'クリティカル率+1%',
        cost: 300,
        icon: '🤖',
        image: 'img/tree/damage.PNG',
        requires: ['terraforming2'],
        unlocks: [],
        better: true,
        effect: () => { /* +1% crit rate */ }
    },
    'tile_break': {
        id: 'tile_break',
        name: '瓦割り',
        description: '裂傷の割合増加+20%',
        cost: 300,
        icon: '💢',
        image: 'img/tree/damage.PNG',
        requires: ['terraforming2'],
        unlocks: ['ultimate_power2'],
        better: true,
        effect: () => { /* +20% laceration damage */ }
    },
    'ultimate_power2': {
        id: 'ultimate_power2',
        name: 'アルティメットパワー',
        description: '全タワーダメージ+10%',
        cost: 500,
        icon: '⭐',
        image: 'img/tree/damage.PNG',
        requires: ['tile_break','rapid_fire'],
        unlocks: [],
        epic: true,
        effect: () => { /* +10% all tower damage */ }
    }
};

// Get skill tree bonus multipliers
function getSkillBonus(type, towerBaseType = null) {
    let bonus = 1.0;
    if (type === 'damage') {
        if (towerBaseType === 'turret' && unlockedSkills.includes('turret_damage')) bonus *= 1.05;
        if (towerBaseType === 'turret' && unlockedSkills.includes('bullet_hardening')) bonus *= 1.10; // +10% turret damage
        if (towerBaseType === 'sniper' && unlockedSkills.includes('sniper_damage')) bonus *= 1.05;
        if (towerBaseType === 'sniper' && unlockedSkills.includes('mass')) bonus *= 1.05; // +5% sniper damage
        if (towerBaseType === 'sniper' && unlockedSkills.includes('sharpness_or_hardness')) bonus *= 1.10; // +10% sniper damage
        if (towerBaseType === 'blaster' && unlockedSkills.includes('blaster_damage')) bonus *= 1.05;
        if (towerBaseType === 'blaster' && unlockedSkills.includes('bang')) bonus *= 1.10; // +10% blaster damage
        if (towerBaseType === 'rod' && unlockedSkills.includes('rod_damage')) bonus *= 1.05;
        // All tower damage bonus (applies to all types)
        if (unlockedSkills.includes('all_tower_damage')) bonus *= 1.10;
        if (unlockedSkills.includes('ultimate_power2')) bonus *= 1.10; // +10% all tower damage
    } else if (type === 'range') {
        if (towerBaseType === 'turret' && unlockedSkills.includes('turret_range')) bonus *= 1.01;
        if (towerBaseType === 'sniper' && unlockedSkills.includes('sniper_range')) bonus *= 1.01;
        if (towerBaseType === 'blaster' && unlockedSkills.includes('blaster_range')) bonus *= 1.01;
        if (towerBaseType === 'blaster' && unlockedSkills.includes('hotfix')) bonus *= 1.05; // +5% blaster range
        if (towerBaseType === 'rod' && unlockedSkills.includes('rod_range')) bonus *= 1.01;
    } else if (type === 'chip_rate') {
        if (unlockedSkills.includes('chip_rate')) bonus = 0.1; // Add 10% to base drop rate
    } else if (type === 'enemy_credits') {
        if (unlockedSkills.includes('enemy_credits')) bonus *= 1.20; // +20% credits from enemies
        if (unlockedSkills.includes('economics')) bonus *= 1.20; // +20% credits from enemies
    } else if (type === 'freeze_duration') {
        if (unlockedSkills.includes('freeze_duration')) bonus *= 1.50; // +50% freeze duration
    } else if (type === 'burn_damage') {
        if (unlockedSkills.includes('burn_damage')) bonus *= 1.50; // +50% burn damage
        if (unlockedSkills.includes('inferno')) bonus *= 2.00; // +100% burn damage
    } else if (type === 'crit_rate') {
        let critRate = 0.0; // Base 0%
        if (unlockedSkills.includes('weak_point_analysis')) critRate += 0.01; // +1%
        if (unlockedSkills.includes('vulnerability')) critRate += 0.01; // +1%
        if (unlockedSkills.includes('ai_analysis')) critRate += 0.01; // +1%
        return critRate;
    } else if (type === 'surge_chance') {
        let surgeChance = 0.0; // Base 0%
        if (unlockedSkills.includes('voltage_transformer')) surgeChance += 0.10; // +10%
        return surgeChance;
    } else if (type === 'warp_chance') {
        let warpChance = 0.10; // Base 10%
        if (unlockedSkills.includes('quantum_transfer')) warpChance += 0.05; // +5%
        return warpChance;
    } else if (type === 'cooldown_reduction') {
        if (towerBaseType === 'turret' && unlockedSkills.includes('quantity_over_quality')) bonus *= 0.95; // -5% cooldown = +5% fire rate
        if (towerBaseType === 'turret' && unlockedSkills.includes('rapid_fire')) bonus *= 0.95; // -5% cooldown = +5% fire rate
        return bonus;
    } else if (type === 'gear_chain_limit') {
        let chainLimit = 0;
        if (unlockedSkills.includes('durability_improvement')) chainLimit += 5; // +5 chain limit
        return chainLimit;
    } else if (type === 'laceration_damage') {
        if (unlockedSkills.includes('tile_break')) bonus *= 1.20; // +20% laceration damage
        return bonus;
    }
    return bonus;
}

// Tower Definitions
const TOWER_TYPES = {
    'turret': {
        name: 'Turret',
        cost: 50,
        range: 120,
        damage: 20,
        cooldown: 600, 
        color: '#00ffff',
        shape: 'circle',
        baseType: 'turret'
    },
    'sniper': {
        name: 'Sniper',
        cost: 120,
        range: 300,
        damage: 100,
        cooldown: 2000,
        color: '#ff00ff',
        shape: 'square',
        baseType: 'sniper'
    },
    'blaster': {
        name: 'Blaster',
        cost: 200,
        range: 80,
        damage: 8,
        cooldown: 100,
        color: '#ff8800',
        shape: 'triangle',
        baseType: 'blaster'
    },
    'sweeper': {
        name: 'Sweeper',
        cost: 150,
        range: 150, // 地雷設置範囲
        damage: 50, // 地雷の爆発ダメージ
        cooldown: 3000, // 地雷設置間隔
        color: '#ffcc00',
        shape: 'pentagon',
        baseType: 'sweeper',
        special: 'mine-layer', // 地雷設置
        requiredSkill: 'minesweeper'
    },
    // Sweeper Evolutions
    'big-sweeper': {
        name: 'Big-Sweeper',
        cost: 0,
        range: 180, // 地雷設置範囲増加
        damage: 80, // 地雷の爆発ダメージ増加
        cooldown: 2800,
        color: '#ffbb00',
        shape: 'pentagon',
        baseType: 'sweeper',
        isEvolution: true,
        special: 'big-mine-layer' // より強力な地雷
    },
    'spike-sweeper': {
        name: 'Spike-Sweeper',
        cost: 0,
        range: 210, // 地雷設置範囲さらに増加
        damage: 120, // 地雷の爆発ダメージさらに増加
        cooldown: 2600,
        color: '#ff9900',
        shape: 'pentagon',
        baseType: 'sweeper',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'big-sweeper',
        special: 'spike-mine-layer' // とげをまき散らす地雷
    },
    'incendiary-sweeper': {
        name: 'Incendiary-Sweeper',
        cost: 0,
        range: 210, // 地雷設置範囲さらに増加
        damage: 100, // 地雷の爆発ダメージ増加
        cooldown: 2600,
        color: '#ff4400',
        shape: 'pentagon',
        baseType: 'sweeper',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'big-sweeper',
        special: 'incendiary-mine-layer' // 延焼状態にする地雷
    },
    // Turret Evolutions
    'dual-turret': {
        name: 'Dual-Turret',
        cost: 0, // Evolution cost handled separately
        range: 140,
        damage: 30,
        cooldown: 300, // Faster fire rate (was 500)
        color: '#00ffff',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        special: 'rapid-fire' // Faster fire rate
    },
    'big-turret': {
        name: 'Big-Turret',
        cost: 0,
        range: 150,
        damage: 40,
        cooldown: 800, // Slower but powerful
        color: '#00dddd',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        special: 'splash' // Area damage
    },
    // Sniper Evolutions
    'sniper-mr2': {
        name: 'Sniper-MR2',
        cost: 0,
        range: 320,
        damage: 200, // High damage
        cooldown: 1800,
        color: '#ff00ff',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true
    },
    'large-sniper': {
        name: 'Large-Sniper',
        cost: 0,
        range: 280,
        damage: 120,
        cooldown: 2200,
        color: '#ff44ff',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true,
        special: 'pierce' // Pierces through enemies
    },
    // Blaster Evolutions
    'flame-blaster': {
        name: 'Flame-Blaster',
        cost: 0,
        range: 90,
        damage: 10,
        cooldown: 120,
        color: '#ff4400',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        special: 'burn' // Applies burn damage
    },
    'frost-blaster': {
        name: 'Frost-Blaster',
        cost: 0,
        range: 95,
        damage: 9,
        cooldown: 110,
        color: '#44aaff',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        special: 'slow' // Slows enemies
    },
    // Second Evolution (Lv25+)
    'quadruple-turret': {
        name: 'Quadruple-Turret',
        cost: 0,
        range: 150,
        damage: 35,
        cooldown: 200, // Very fast fire rate (was 450)
        color: '#00ffff',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'dual-turret',
        special: 'hyper-rapid-fire'
    },
    'machine-turret': {
        name: 'Machine-TURRET',
        cost: 0,
        range: 160,
        damage: 40,
        cooldown: 100, // 高速連射
        color: '#00ffee',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'quadruple-turret',
        special: 'machine-gun',
        requiredSkill: 'ultimate_power'
    },
    'bugle-turret': {
        name: 'Bugle-Turret',
        cost: 0,
        range: 160,
        damage: 25,
        cooldown: 550,
        color: '#00eeff',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'dual-turret',
        special: 'spread' // Shoots multiple projectiles in spread pattern
    },
    'flugrl-turret': {
        name: 'Flugrl-TURRET',
        cost: 0,
        range: 170,
        damage: 28,
        cooldown: 600,
        color: '#00ddff',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'bugle-turret',
        special: 'super-spread', // さらに散弾数が増加
        requiredSkill: 'ultimate_power'
    },
    'giga-turret': {
        name: 'Giga-Turret',
        cost: 0,
        range: 170,
        damage: 80,
        cooldown: 900,
        color: '#00aaaa',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'big-turret',
        special: 'giga-splash' // Bigger splash
    },
    'auger-turret': {
        name: 'Auger-TURRET',
        cost: 0,
        range: 180,
        damage: 90,
        cooldown: 950,
        color: '#008888',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'giga-turret',
        special: 'knockback-splash', // 被弾した敵を押し戻す
        requiredSkill: 'ultimate_power'
    },
    'peta-turret': {
        name: 'Peta-TURRET',
        cost: 0,
        range: 190,
        damage: 120,
        cooldown: 1000,
        color: '#006666',
        shape: 'circle',
        baseType: 'turret',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'giga-turret',
        special: 'peta-splash', // giga-turretの上位互換
        requiredSkill: 'ultimate_power'
    },
    'sniper-mr3': {
        name: 'Sniper-MR3',
        cost: 0,
        range: 350,
        damage: 350,
        cooldown: 1600,
        color: '#ff00ff',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'sniper-mr2'
    },
    'laser': {
        name: 'Laser',
        cost: 0,
        range: 400,
        damage: 500,
        cooldown: 1800,
        color: '#ff00aa',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'sniper-mr3',
        special: 'laser', // 敵を一網打尽
        requiredSkill: 'ultimate_power'
    },
    'giga-sniper': {
        name: 'Giga-Sniper',
        cost: 0,
        range: 320,
        damage: 180,
        cooldown: 2000,
        color: '#ff66ff',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'large-sniper',
        special: 'giga-pierce' // Enhanced pierce
    },
    'missile-snipper': {
        name: 'Missile-SNIPPER',
        cost: 0,
        range: 350,
        damage: 200,
        cooldown: 2200,
        color: '#ff88ff',
        shape: 'square',
        baseType: 'sniper',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'giga-sniper',
        special: 'laceration', // 裂傷状態
        requiredSkill: 'ultimate_power'
    },
    'blast-blaster': {
        name: 'Blast-Blaster',
        cost: 0,
        range: 100,
        damage: 15,
        cooldown: 140,
        color: '#ff2200',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'flame-blaster',
        special: 'chain-burn' // Burn explosion on kill
    },
    'explosion-blaster': {
        name: 'Explosion-Blaster',
        cost: 0,
        range: 110,
        damage: 18,
        cooldown: 160,
        color: '#ff1100',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'blast-blaster',
        special: 'mega-chain-burn', // 死亡時の爆破範囲が増加
        requiredSkill: 'ultimate_power'
    },
    'sol-blaster': {
        name: 'Sol-Blaster',
        cost: 0,
        range: 120,
        damage: 25,
        cooldown: 150,
        color: '#ffaa00',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        isFourthEvolution: true,
        evolvesFrom: 'explosion-blaster',
        special: 'solar-flare', // フレア発射 + 強化された延焼
        requiredSkill: null
    },
    'blizzard-blaster': {
        name: 'Blizzard-Blaster',
        cost: 0,
        range: 110,
        damage: 12,
        cooldown: 900, // Much slower - powerful freeze effect
        color: '#0099ff',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'frost-blaster',
        special: 'freeze-zone' // Creates freeze zones
    },
    'iceage-blaster': {
        name: 'IceAge-Blaster',
        cost: 0,
        range: 120,
        damage: 14,
        cooldown: 1000,
        color: '#0088ee',
        shape: 'triangle',
        baseType: 'blaster',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'blizzard-blaster',
        special: 'stack-freeze', // 凍結が重複
        requiredSkill: 'ultimate_power'
    },
    // Rod Tower - Lightning based
    'rod': {
        name: 'Rod',
        cost: 80,
        range: 0, // No attack until evolved
        damage: 0,
        cooldown: 999999,
        color: '#ffdd00',
        shape: 'rod',
        baseType: 'rod'
    },
    // Rod First Evolution (Lv5)
    'lightning-rod': {
        name: 'Lightning-Rod',
        cost: 0,
        range: 200,
        damage: 50,
        cooldown: 1500,
        color: '#ffee00',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        special: 'lightning' // Lightning strike with stun chance
    },
    'warp-rod': {
        name: 'Warp-Rod',
        cost: 0,
        range: 220,
        damage: 40,
        cooldown: 1600,
        color: '#00ffff',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        special: 'warp', // 被弾した敵をワープ
        requiredSkill: 'magician' // 「彼はマジシャン？」スキルが必要
    },
    'necromancer': {
        name: 'Necromancer',
        cost: 0,
        range: 180,
        damage: 45,
        cooldown: 1700,
        color: '#aa00ff',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        special: 'necromancy', // 敵を味方として復活
        requiredSkill: 'obey' // 「服従せよ」スキルが必要
    },
    // Rod Second Evolution (Lv15)
    'lightning-rod-ii': {
        name: 'Lightning-Rod-II',
        cost: 0,
        range: 250,
        damage: 120,
        cooldown: 1200,
        color: '#ffff00',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'lightning-rod',
        special: 'lightning' // Enhanced lightning
    },
    // Rod Third Evolution (Lv25)
    'lightning-spark': {
        name: 'Lightning-Spark',
        cost: 0,
        range: 280,
        damage: 150,
        cooldown: 1000,
        color: '#ffffaa',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'lightning-rod-ii',
        special: 'lightning-zone', // Lightning with stun zone
        requiredSkill: null
    },
    'chain-spark': {
        name: 'Chain-Spark',
        cost: 0,
        range: 300,
        damage: 170,
        cooldown: 950,
        color: '#ffffcc',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        isFourthEvolution: true,
        evolvesFrom: 'lightning-spark',
        special: 'chain-lightning', // 周りの敵も感電
        requiredSkill: 'ultimate_power'
    },
    // Rod Third Evolution Alternative (Lv25) - Burn-Lightning
    'burn-lightning': {
        name: 'Burn-Lightning',
        cost: 0,
        range: 270,
        damage: 140,
        cooldown: 1100,
        color: '#ffaa00',
        shape: 'rod',
        baseType: 'rod',
        isEvolution: true,
        isSecondEvolution: true,
        isThirdEvolution: true,
        evolvesFrom: 'lightning-rod-ii',
        special: 'burn-lightning', // Lightning with burn + stun chance
        requiredSkill: 'cross_specialization' // Requires cross_specialization skill
    },
    'gear': {
        name: 'Gear',
        cost: 100,
        range: 100,
        damage: 15,
        cooldown: 800,
        color: '#888888',
        shape: 'gear',
        baseType: 'gear',
        special: 'chain' // 連鎖システム
    },
    'gear-second': {
        name: 'Gear-Second',
        cost: 150,
        range: 120,
        damage: 20,
        cooldown: 750,
        color: '#aaaaaa',
        shape: 'gear',
        baseType: 'gear',
        special: 'chain',
        isEvolution: true
    },
    'gear-third': {
        name: 'Gear-Third',
        cost: 200,
        range: 140,
        damage: 30,
        cooldown: 700,
        color: '#cccccc',
        shape: 'gear',
        baseType: 'gear',
        special: 'chain',
        isEvolution: true,
        isSecondEvolution: true,
        evolvesFrom: 'gear-second'
    }
};

// --- Core Setup ---

function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Recalculate grid based on new size
    gridCols = Math.floor(canvas.width / CELL_SIZE);
    gridRows = Math.floor(canvas.height / CELL_SIZE);
    
    // Don't regenerate path on resize to keep it fixed
}

window.addEventListener('resize', resizeCanvas);

// NOTE: 敵の軌道
function generatePath() {
    // Generate path based on current stage
    if (currentStage === 3) {
        path = [
            { x: 50, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 800 },
            { x: 1200, y: 800 },
            { x: 1200, y: 100 },
            { x: 750, y: 100 },
            { x: 750, y: 450 }
        ];
    }
    else if (currentStage === 2) {
        // Stage 2: Start from bottom-left, go up, then right to top-right
        path = [
            {x: FIELD_WIDTH * 0.9 + FIELD_MARGIN, y: FIELD_MARGIN}, // start (top-right)
            {x: FIELD_WIDTH * 0.9 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.5 + FIELD_MARGIN },
            {x: FIELD_WIDTH * 0.7 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.5 + FIELD_MARGIN },
            {x: FIELD_WIDTH * 0.5 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.5 + FIELD_MARGIN },
            {x: FIELD_WIDTH * 0.5 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.7 + FIELD_MARGIN },
            {x: FIELD_WIDTH * 0.3 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.7 + FIELD_MARGIN },
            {x: FIELD_WIDTH * 0.3 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.2 + FIELD_MARGIN },
            {x: FIELD_MARGIN + 130, y: FIELD_HEIGHT * 0.2 + FIELD_MARGIN }, 
            {x: FIELD_MARGIN + 130, y: FIELD_HEIGHT + FIELD_MARGIN }, // goal (bottom-left)
        ];
    } else {
        // Stage 1 (default): Original winding path
        path = [
            {x: FIELD_MARGIN, y: FIELD_HEIGHT * 0.2 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.2 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.2 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.2 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.7 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.5 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.7 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.5 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.3 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.8 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.3 + FIELD_MARGIN},
            {x: FIELD_WIDTH * 0.8 + FIELD_MARGIN, y: FIELD_HEIGHT * 0.8 + FIELD_MARGIN},
            {x: FIELD_WIDTH + FIELD_MARGIN, y: FIELD_HEIGHT * 0.8 + FIELD_MARGIN}
        ];
    }
}

// --- Game Logic ---

// Show menu from title screen
function showMenu() {
    document.getElementById('title-screen').classList.add('hidden');
    titleAnimationActive = false; // Stop title animation
    
    // Check if this is first time
    const hasSeenTutorial = localStorage.getItem('neon_defense_tutorial_seen');
    
    // Force tutorial for testing (remove this line after testing)
    // localStorage.removeItem('neon_defense_tutorial_seen');
    
    if (!hasSeenTutorial) {
        // Show tutorial first
        console.log('Starting tutorial...');
        showTutorial();
    } else {
        console.log('Tutorial already seen, showing menu');
        // Show menu directly
        document.getElementById('menu-screen').classList.remove('hidden');
    }
}

// Show Help Screen
function showHelp() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('help-screen').classList.remove('hidden');
    switchHelpTab('how-to-play'); // デフォルトでプレイ方法を表示
}

function backToMenuFromHelp() {
    document.getElementById('help-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
}

// Commander System Functions
function showCommanderScreen() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('commander-screen').classList.remove('hidden');
    renderCommanderCards();
    updateCurrentCommanderDisplay();
}

function backToMenuFromCommander() {
    document.getElementById('commander-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
}

function renderCommanderCards() {
    const container = document.getElementById('commander-cards-container');
    container.innerHTML = '';
    
    for (let commanderId in commanders) {
        const commander = commanders[commanderId];
        const isUnlocked = unlockedCommanders.includes(commanderId);
        const isSelected = selectedCommander === commanderId;
        
        const card = document.createElement('div');
        card.className = `commander-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        card.onclick = () => isUnlocked ? showCommanderDetail(commanderId) : unlockCommander(commanderId);
        
        card.innerHTML = `
            ${!isUnlocked ? `<div class="commander-unlock-badge">💎 ${commander.unlockCost}</div>` : ''}
            <img src="${commander.image}" class="commander-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23334%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-size=%2220%22%3E${commander.name}%3C/text%3E%3C/svg%3E'">
            <div class="commander-card-name">${commander.name}</div>
            <div class="commander-card-status">
                ${isUnlocked ? (isSelected ? '✅ 編成中' : 'クリックで詳細') : '🔒 ロック中'}
            </div>
        `;
        
        container.appendChild(card);
    }
}

function updateCurrentCommanderDisplay() {
    const display = document.getElementById('current-commander-info');
    
    if (!selectedCommander) {
        display.innerHTML = '<p style="color: #999;">指揮官が選択されていません</p>';
        return;
    }
    
    const commander = commanders[selectedCommander];
    display.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1.5rem;">
            <img src="${commander.image}" style="width: 100px; height: 100px; border-radius: 8px; border: 2px solid #00ffff; object-fit: cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23334%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-size=%2214%22%3E${commander.name}%3C/text%3E%3C/svg%3E'">
            <div style="flex: 1; text-align: left;">
                <h3 style="color: #00ffff; font-size: 1.5rem; margin-bottom: 0.5rem;">${commander.name}</h3>
                <div style="color: #aaffff; margin-bottom: 0.3rem;">
                    <strong>${commander.activeSkill.icon} ${commander.activeSkill.name}:</strong> ${commander.activeSkill.description}
                </div>
                <div style="color: #aaffff;">
                    <strong>${commander.passiveSkill.icon} ${commander.passiveSkill.name}:</strong> ${commander.passiveSkill.description}
                </div>
            </div>
        </div>
    `;
}

function showCommanderDetail(commanderId) {
    const commander = commanders[commanderId];
    const isSelected = selectedCommander === commanderId;
    
    const popup = document.getElementById('commander-detail-popup');
    const content = document.getElementById('commander-detail-content');
    
    content.innerHTML = `
        <div style="text-align: center;">
            <img src="${commander.image}" style="width: 200px; height: 200px; border-radius: 12px; border: 3px solid #00ffff; margin-bottom: 1rem; object-fit: cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23334%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23fff%22 font-size=%2224%22%3E${commander.name}%3C/text%3E%3C/svg%3E'">
            <h2 style="color: #00ffff; font-size: 2rem; margin-bottom: 1.5rem; font-family: 'Orbitron', sans-serif;">${commander.name}</h2>
            
            <div style="background: rgba(0, 100, 200, 0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: left;">
                <h3 style="color: #ffaa00; margin-bottom: 0.5rem;">${commander.activeSkill.icon} アクティブスキル: ${commander.activeSkill.name}</h3>
                <p style="color: #ffffff; margin-bottom: 0.5rem;">${commander.activeSkill.description}</p>
                <p style="color: #aaffff; font-size: 0.9rem;">効果時間: ${Math.floor(commander.activeSkill.duration / 60)}秒 / クールダウン: ${Math.floor(commander.activeSkill.cooldown / 60)}秒</p>
            </div>
            
            <div style="background: rgba(100, 200, 0, 0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                <h3 style="color: #00ff88; margin-bottom: 0.5rem;">${commander.passiveSkill.icon} パッシブスキル: ${commander.passiveSkill.name}</h3>
                <p style="color: #ffffff;">${commander.passiveSkill.description}</p>
            </div>
            
            ${isSelected 
                ? '<button class="menu-button" onclick="unselectCommander()" style="background: rgba(200, 100, 100, 0.8);">編成解除</button>'
                : '<button class="menu-button" onclick="selectCommander(\'' + commanderId + '\')">編成する</button>'
            }
        </div>
    `;
    
    popup.classList.remove('hidden');
}

function hideCommanderDetail() {
    document.getElementById('commander-detail-popup').classList.add('hidden');
}

function selectCommander(commanderId) {
    selectedCommander = commanderId;
    saveCommanderData();
    hideCommanderDetail();
    renderCommanderCards();
    updateCurrentCommanderDisplay();
    playSound('select');
}

function unselectCommander() {
    selectedCommander = null;
    saveCommanderData();
    hideCommanderDetail();
    renderCommanderCards();
    updateCurrentCommanderDisplay();
}

function unlockCommander(commanderId) {
    const commander = commanders[commanderId];
    
    if (electronicChips >= commander.unlockCost) {
        if (confirm(`${commander.name}を${commander.unlockCost}💎で解放しますか？`)) {
            electronicChips -= commander.unlockCost;
            unlockedCommanders.push(commanderId);
            saveCommanderData();
            saveSkillTree(); // Save electronic chips
            renderCommanderCards();
            playSound('select');
        }
    } else {
        alert(`電子チップが不足しています。必要: ${commander.unlockCost}💎`);
    }
}

function saveCommanderData() {
    const data = {
        unlockedCommanders: unlockedCommanders,
        selectedCommander: selectedCommander
    };
    localStorage.setItem('neonDefenseCommanders', JSON.stringify(data));
}

function loadCommanderData() {
    try {
        const saved = localStorage.getItem('neonDefenseCommanders');
        if (saved) {
            const data = JSON.parse(saved);
            unlockedCommanders = data.unlockedCommanders || ['eiko'];
            selectedCommander = data.selectedCommander || null;
        }
    } catch (e) {
        console.error('Failed to load commander data:', e);
    }
}

// Commander Active Skill Functions
function setupCommanderUI() {
    
    const skillButton = document.getElementById('active-skill-button');
    const skillIcon = document.getElementById('skill-icon-display');
    
    if (selectedCommander) {
        const commander = commanders[selectedCommander];
        skillIcon.textContent = commander.activeSkill.icon;
        skillButton.style.display = 'block';
        skillButton.style.pointerEvents = 'auto'; // 明示的に有効化
        
        // Remove old event listeners and add new one
        const newButton = skillButton.cloneNode(true);
        skillButton.parentNode.replaceChild(newButton, skillButton);
        
        // Add click event listener
        newButton.addEventListener('click', function(e) {
            activateCommanderSkill();
        });
        
        // Also add mousedown for testing
        newButton.addEventListener('mousedown', function(e) {
            console.log('Button mousedown detected');
        });
        
        // Reset skill states
        activeSkillCooldown = 0;
        activeSkillDuration = 0;
        activeSkillActive = false;
        updateSkillButtonDisplay();
        
    } else {
        console.log('No commander selected, hiding button');
        skillButton.style.display = 'none';
    }
}

function activateCommanderSkill() {
    if (!selectedCommander) {
        console.log('No commander selected');
        return;
    }
    
    if (!gameActive) {
        console.log('Game not active');
        return;
    }
    
    if (gamePaused) {
        console.log('Game paused');
        return;
    }
    
    // Check if on cooldown
    if (activeSkillCooldown > 0) {
        console.log('Skill on cooldown');
        return; // Still on cooldown
    }
    
    // Check if already active
    if (activeSkillActive) {
        console.log('Skill already active');
        return; // Already active
    }
    
    const commander = commanders[selectedCommander];
    console.log('Activating skill for commander:', commander.name);
    
    // Activate skill
    activeSkillActive = true;
    activeSkillDuration = commander.activeSkill.duration;
    // Don't start cooldown yet - it starts after effect ends
    
    // Play cutin animation
    playCutinAnimation(selectedCommander);
    
    // Play sound
    playSound('select');
    
    // Apply skill effects immediately
    applyCommanderActiveSkill(selectedCommander);
    
    updateSkillButtonDisplay();
}

function playCutinAnimation(commanderId) {
    const commander = commanders[commanderId];
    const cutinEl = document.getElementById('cutin-animation');
    const characterImg = document.getElementById('cutin-character-img');
    const skillName = document.getElementById('cutin-skill-name');
    const commanderName = document.getElementById('cutin-commander-name');
    
    // Set content
    characterImg.src = commander.image;
    skillName.textContent = commander.activeSkill.name;
    commanderName.textContent = commander.name;
    
    // Slide in
    cutinEl.style.right = '20px';
    
    // Slide out after 2 seconds
    setTimeout(() => {
        cutinEl.style.right = '-350px';
    }, 2000);
}

function applyCommanderActiveSkill(commanderId) {
    // Skill effects are applied each frame in the game loop
    // This function can be used for one-time effects if needed
    
    if (commanderId === 'reika') {
        // Reika's Whiteout: Apply slow and damage to all enemies immediately
        for (let enemy of enemies) {
            if (enemy.active) {
                enemy.slowAmount = 0.5; // 50% slow
                enemy.slowDuration = Math.max(enemy.slowDuration, 600); // 10 seconds
            }
        }
    }
}

function updateSkillButtonDisplay() {
    if (!selectedCommander) return;
    
    const commander = commanders[selectedCommander];
    const skillButton = document.getElementById('skill-icon-display');
    const cooldownOverlay = document.getElementById('skill-cooldown-overlay');
    const cooldownCircle = document.getElementById('skill-cooldown-circle');
    const activeOverlay = document.getElementById('skill-active-overlay');
    const activeCircle = document.getElementById('skill-active-circle');
    const countdownText = document.getElementById('skill-countdown-text');
    
    const circumference = 2 * Math.PI * 26; // r=26
    
    if (activeSkillActive && activeSkillDuration > 0) {
        // Show active effect
        activeOverlay.style.display = 'block';
        cooldownOverlay.style.display = 'none';
        
        const progress = activeSkillDuration / commander.activeSkill.duration;
        const offset = circumference * (1 - progress);
        activeCircle.style.strokeDashoffset = offset;
        
        // Show countdown
        const secondsLeft = Math.ceil(activeSkillDuration / 60);
        countdownText.textContent = secondsLeft;
        countdownText.style.display = 'block';
        countdownText.style.color = '#ffd700';
        
        skillButton.style.borderColor = '#ffd700';
        skillButton.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        skillButton.style.cursor = 'default';
    } else if (activeSkillCooldown > 0) {
        // Show cooldown
        activeOverlay.style.display = 'none';
        cooldownOverlay.style.display = 'block';
        
        const progress = activeSkillCooldown / commander.activeSkill.cooldown;
        const offset = circumference * (1 - progress);
        cooldownCircle.style.strokeDashoffset = offset;
        
        // Show countdown
        const secondsLeft = Math.ceil(activeSkillCooldown / 60);
        countdownText.textContent = secondsLeft;
        countdownText.style.display = 'block';
        countdownText.style.color = '#00ffff';
        
        skillButton.style.borderColor = '#666';
        skillButton.style.boxShadow = 'none';
        skillButton.style.cursor = 'not-allowed';
        skillButton.style.opacity = '0.5';
    } else {
        // Ready to use
        activeOverlay.style.display = 'none';
        cooldownOverlay.style.display = 'none';
        countdownText.style.display = 'none';
        
        skillButton.style.borderColor = '#00ffff';
        skillButton.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        skillButton.style.cursor = 'pointer';
        skillButton.style.opacity = '1';
    }
}

function applyCommanderActiveSkillEffects() {
    if (!activeSkillActive || !selectedCommander) return;
    
    if (selectedCommander === 'reika') {
        // Reika's Whiteout: Continuous slow and damage to all enemies
        const showDamage = Math.floor(activeSkillDuration) % 30 === 0; // Show damage every 30 frames (0.5s)
        
        for (let enemy of enemies) {
            if (enemy.active) {
                // Apply slow if not already at max
                if (enemy.slowDuration < 60) {
                    enemy.slowAmount = 0.5;
                    enemy.slowDuration = 60;
                }
                
                // Increase whiteout time (cumulative exposure)
                enemy.whiteoutTime += dt;
                
                // Calculate damage multiplier based on exposure time
                // Starts at 2 damage/frame, increases by 50% every 3 seconds (180 frames)
                const timeInSeconds = enemy.whiteoutTime / 60;
                const damageMultiplier = 1 + Math.floor(timeInSeconds / 3) * 0.5; // +50% every 3s
                
                // Apply continuous damage with increasing intensity
                const baseDamage = 2 * dt / TARGET_FPS; // 2 damage per frame at 60fps
                const damageAmount = baseDamage * damageMultiplier;
                enemy.takeDamage(damageAmount, null, false); // Don't show damage every frame
                
                // Show damage text every 30 frames (accumulated damage)
                if (showDamage) {
                    const accumulatedDamage = 2 * 30 / 60 * damageMultiplier; // 30 frames worth of damage
                    createDamageText(enemy.x, enemy.y - enemy.radius - 10, accumulatedDamage, false, false, false, null, true);
                    createExplosion(enemy.x, enemy.y, '#aaffff', 8);
                }
            }
        }
    }
}

// Get commander passive bonus multipliers
function getCommanderBonus(type) {
    if (!selectedCommander) return 1;
    
    const commanderId = selectedCommander;
    
    // Eiko's passive: Tower level up cost -10%
    if (commanderId === 'eiko' && type === 'upgrade_cost') {
        return 0.9; // 10% discount
    }
    
    // Reika's passive: Additional damage to slowed/frozen enemies
    if (commanderId === 'reika' && type === 'slow_bonus_damage') {
        return 1.2; // 20% bonus damage
    }
    
    // Benix's passive: Debuff duration +3s
    if (commanderId === 'benix' && type === 'debuff_duration') {
        return 180; // +3s = +180 frames
    }
    
    // Default values
    if (type === 'upgrade_cost') return 1; // No discount
    if (type === 'slow_bonus_damage') return 1; // No bonus damage
    if (type === 'debuff_duration') return 0; // No additional duration
    
    return 0;
}

// Get active skill bonuses
function getActiveSkillBonus(type) {
    if (!activeSkillActive || !selectedCommander) return 0;
    
    const commanderId = selectedCommander;
    
    // Eiko's active: Attack speed +100%
    if (commanderId === 'eiko' && type === 'attack_speed') {
        return 1.0; // 100% bonus (2x speed)
    }
    
    // Benix's active: Crit rate +10%, Crit damage +100%
    if (commanderId === 'benix') {
        if (type === 'crit_rate') return 0.1;
        if (type === 'crit_damage') return 1.0;
    }
    
    return 0;
}

function switchHelpTab(tabName) {
    // タブのアクティブ状態を切り替え
    const tabs = document.querySelectorAll('.help-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('help-content');
    
    if (tabName === 'how-to-play') {
        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 1rem;">プレイ方法</h2>
            <div style="line-height: 1.8;">
                <h3 style="color: #aaffff; margin-top: 1.5rem;">基本操作</h3>
                <ul style="list-style: none; padding-left: 0;">
                    <li>🎯 <strong>タワーの配置:</strong> 画面下部のタワーアイコンをクリックし、マップ上の灰色のマスをクリックして配置</li>
                    <li>💰 <strong>お金:</strong> タワーの配置やアップグレードにはお金が必要。敵を倒すと獲得できます</li>
                    <li>⬆️ <strong>アップグレード:</strong> タワーをクリックして選択し、「UPGRADE」ボタンでレベルアップ</li>
                    <li>🔄 <strong>進化:</strong> 一定レベルに達したタワーは進化可能。「EVOLVE」ボタンで進化</li>
                    <li>❤️ <strong>ライフ:</strong> 敵が基地に到達するとライフが減少。0になるとゲームオーバー</li>
                </ul>
                
                <h3 style="color: #aaffff; margin-top: 1.5rem;">ゲームの流れ</h3>
                <ol style="padding-left: 1.5rem;">
                    <li>ステージを選択してゲーム開始</li>
                    <li>敵が出現する前にタワーを配置</li>
                    <li>ウェーブごとに敵が出現。タワーで迎撃</li>
                    <li>敵を倒してお金を稼ぎ、タワーを強化</li>
                    <li>全20ウェーブをクリアするとステージクリア</li>
                </ol>
                
                <h3 style="color: #aaffff; margin-top: 1.5rem;">電子チップとスキルツリー</h3>
                <p>敵を倒すと一定確率で<span style="color: #ffff00;">電子チップ</span>がドロップします。</p>
                <p>電子チップはメニューの「スキルツリー」で永続的な強化に使用できます。</p>
            </div>
        `;
    } else if (tabName === 'enemies') {
        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 1rem;">敵の種類</h2>
            <div style="line-height: 1.8;">
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 51, 51, 0.2); border-left: 4px solid #ff3333; border-radius: 4px;">
                    <h3 style="color: #ff3333; margin-bottom: 0.5rem;">🔴 通常敵 (Normal)</h3>
                    <p style="margin: 0;">最も基本的な敵。特殊能力はないが、ウェーブが進むごとに強化される。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 0, 0.2); border-left: 4px solid #ffff00; border-radius: 4px;">
                    <h3 style="color: #ffff00; margin-bottom: 0.5rem;">🟡 高速敵 (Fast)</h3>
                    <p style="margin: 0;">移動速度が速いが、HPは低い。Wave 2から出現。素早く倒さないと基地に到達してしまう。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(153, 0, 255, 0.2); border-left: 4px solid #9900ff; border-radius: 4px;">
                    <h3 style="color: #9900ff; margin-bottom: 0.5rem;">🟣 タンク敵 (Tank)</h3>
                    <p style="margin: 0;">非常に高いHPを持つが移動は遅い。Wave 4から出現。倒すのに時間がかかるが、報酬も高い。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(136, 136, 136, 0.2); border-left: 4px solid #888888; border-radius: 4px;">
                    <h3 style="color: #888888; margin-bottom: 0.5rem;">⬡ シールダー (Shielder)</h3>
                    <p style="margin: 0;">シールドを持つ敵。シールドがある間はダメージが1/3に軽減される。エンドレスモードWave 50から出現。スポーン枠を10個消費。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 102, 0, 0.2); border-left: 4px solid #ff6600; border-radius: 4px;">
                    <h3 style="color: #ff6600; margin-bottom: 0.5rem;">🔶 ランページ (Rampage)</h3>
                    <p style="margin: 0;">通常の5倍のHPを持つ強敵。エンドレスモードWave 100から出現。ランダムな形状で出現する。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 0, 0, 0.3); border-left: 4px solid #ff0000; border-radius: 4px;">
                    <h3 style="color: #ff0000; margin-bottom: 0.5rem;">👑 ボス (Boss)</h3>
                    <p style="margin: 0;">Wave 10と20に出現する強力な敵。通常の15倍のHPを持つ。倒すとライフが5回復する。画面上部にHPバーが表示される。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(136, 0, 0, 0.3); border-left: 4px solid #880000; border-radius: 4px;">
                    <h3 style="color: #880000; margin-bottom: 0.5rem;">⬢ フォートレス (Fortress)</h3>
                    <p style="margin: 0;">エンドレスモードで50ウェーブごとに出現する超強力なボス。通常ボスの10倍のHPを持つ六角形の要塞。</p>
                </div>
            </div>
        `;
    } else if (tabName === 'towers') {
        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 1rem;">タワーの種類</h2>
            <div style="line-height: 1.8;">
                <p style="margin-bottom: 1.5rem;">タワーは4つの基本タイプがあり、レベルアップで進化します。各タワーは独自の特性と進化ツリーを持ちます。</p>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 255, 255, 0.2); border-left: 4px solid #00ffff; border-radius: 4px;">
                    <h3 style="color: #00ffff; margin-bottom: 0.5rem;">🔫 Turret (タレット)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 50 | <strong>射程:</strong> 中 | <strong>攻撃速度:</strong> 速い</p>
                    <p style="margin: 0;">バランスの取れた万能タワー。進化により連射力や範囲攻撃が可能に。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        進化: Dual-Turret → Quadruple-Turret → Machine-TURRET<br>
                        別系統: Big-Turret → Giga-Turret → Auger-TURRET / Peta-TURRET
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 0, 0.2); border-left: 4px solid #ffaa00; border-radius: 4px;">
                    <h3 style="color: #ffaa00; margin-bottom: 0.5rem;">🎯 Sniper (スナイパー)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 120 | <strong>射程:</strong> 超長 | <strong>攻撃速度:</strong> 遅い</p>
                    <p style="margin: 0;">高威力・長射程のタワー。単体の敵に大ダメージを与える。進化で貫通やレーザー攻撃が可能に。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        進化: Sniper-MR2 → Sniper-MR3 → Laser<br>
                        別系統: Large-Sniper → Giga-Sniper → Missile-SNIPPER
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 136, 0, 0.2); border-left: 4px solid #ff8800; border-radius: 4px;">
                    <h3 style="color: #ff8800; margin-bottom: 0.5rem;">🔥 Blaster (ブラスター)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 70 | <strong>射程:</strong> 短 | <strong>攻撃速度:</strong> 普通</p>
                    <p style="margin: 0;">属性攻撃が得意なタワー。炎系統は延焼、氷系統はスロー・凍結効果を付与。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        炎系統: Flame-Blaster → Blast-Blaster → Explosion-Blaster → Sol-Blaster<br>
                        氷系統: Frost-Blaster → Blizzard-Blaster → IceAge-Blaster
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 238, 0, 0.2); border-left: 4px solid #ffee00; border-radius: 4px;">
                    <h3 style="color: #ffee00; margin-bottom: 0.5rem;">⚡ Rod (ロッド)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 80 | <strong>進化必須:</strong> Lv5</p>
                    <p style="margin: 0;">初期状態では攻撃不可。進化すると強力な特殊攻撃が可能に。雷撃、ワープ、ネクロマンシーなど。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        雷系統: Lightning-Rod → Lightning-Rod-II → Lightning-Spark → Chain-Spark<br>
                        特殊系統: Warp-Rod (要スキル), Necromancer (要スキル)
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 204, 0, 0.2); border-left: 4px solid #ffcc00; border-radius: 4px;">
                    <h3 style="color: #ffcc00; margin-bottom: 0.5rem;">💣 Sweeper (スイーパー)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 150 | <strong>要スキル:</strong> 「掃討屋」</p>
                    <p style="margin: 0;">敵の進路上に地雷を設置するタワー。敵が踏むと爆発してダメージ。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        進化: Big-Sweeper → Spike-Sweeper / Incendiary-Sweeper
                    </p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(170, 0, 255, 0.2); border-left: 4px solid #aa00ff; border-radius: 4px;">
                    <h3 style="color: #aa00ff; margin-bottom: 0.5rem;">⚙️ Gear (ギア)</h3>
                    <p style="margin-bottom: 0.5rem;"><strong>コスト:</strong> 動的 | <strong>要スキル:</strong> 「自家発電」</p>
                    <p style="margin: 0;">他のGearタワーと連鎖してダメージと攻撃速度がアップ。連鎖がないと攻撃不可。設置数が増えるごとにコストが上昇。</p>
                    <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #aaffff;">
                        進化: Gear (Lv10) → Gear-Second (Lv100) → Gear-Third (オーバークロックシステム)
                    </p>
                </div>
                
                <p style="margin-top: 1.5rem; color: #aaffff; font-size: 0.95rem;">
                    💡 <strong>ヒント:</strong> タワーの進化レベルは基本的にLv10→Lv25→Lv70→Lv200です。<br>
                    一部のタワーは第3・第4進化に特定のスキルが必要です。
                </p>
            </div>
        `;
    } else if (tabName === 'debuffs') {
        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 1rem;">デバフの説明</h2>
            <div style="line-height: 1.8;">
                <p style="margin-bottom: 1.5rem;">タワーの攻撃により、敵に様々なデバフ効果を与えることができます。</p>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 68, 0, 0.2); border-left: 4px solid #ff4400; border-radius: 4px;">
                    <h3 style="color: #ff4400; margin-bottom: 0.5rem;">🔥 延焼 (Burn)</h3>
                    <p style="margin: 0;">炎系統のタワーが付与。継続ダメージを与える。Chain-Burn効果を持つタワーは、延焼中の敵が倒されると周囲の敵に延焼が広がる。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 0, 0, 0.2); border-left: 4px solid #ff0000; border-radius: 4px;">
                    <h3 style="color: #ff0000; margin-bottom: 0.5rem;">🔥🔥 延延焼 (Double Burn)</h3>
                    <p style="margin: 0;"><strong>延焼の上位互換デバフ。</strong>Sol-Blasterの広がる円攻撃が付与。通常の延焼より高い継続ダメージを与え、<span style="color: #ffff00;">死ぬまで永続的に継続</span>する。非常に強力なデバフ効果。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(68, 170, 255, 0.2); border-left: 4px solid #44aaff; border-radius: 4px;">
                    <h3 style="color: #44aaff; margin-bottom: 0.5rem;">❄️ スロー (Slow)</h3>
                    <p style="margin: 0;">氷系統のタワーが付与。敵の移動速度を低下させる。効果時間中は敵が青く表示される。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(100, 200, 255, 0.2); border-left: 4px solid #64c8ff; border-radius: 4px;">
                    <h3 style="color: #64c8ff; margin-bottom: 0.5rem;">🧊 凍結 (Freeze)</h3>
                    <p style="margin: 0;">Blizzard-Blaster以降の氷系統タワーが付与。凍結スタックが3つ溜まると敵が完全に凍結し、一定時間動けなくなる。IceAge-Blasterは凍結が重複する。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 0, 0.2); border-left: 4px solid #ffff00; border-radius: 4px;">
                    <h3 style="color: #ffff00; margin-bottom: 0.5rem;">⚡ スタン (Stun)</h3>
                    <p style="margin: 0;">雷系統のタワーが一定確率で付与。スタン中の敵は移動不可。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 100, 100, 0.2); border-left: 4px solid #ff6464; border-radius: 4px;">
                    <h3 style="color: #ff6464; margin-bottom: 0.5rem;">🩸 裂傷 (Laceration)</h3>
                    <p style="margin: 0;">Missile-SNIPPERが付与。シールドの防御効果を軽減し、シールドを貫通しHPにダメージを与える。裂傷スタック数に応じて効果が増加。</p>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 255, 255, 0.2); border-left: 4px solid #00ffff; border-radius: 4px;">
                    <h3 style="color: #00ffff; margin-bottom: 0.5rem;">↩️ ノックバック (Knockback)</h3>
                    <p style="margin: 0;">Auger-TURRETとPeta-TURRETが付与。敵を後方に押し戻す効果。経路を逆戻りさせることで、敵の到達時間を遅らせる。</p>
                </div>
                
                <p style="margin-top: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
                    💡 <strong>重要:</strong> 複数のデバフは同時に付与可能です。デバフアイコンは敵のHPバー下に表示されます。<br>
                    ボス敵のデバフ状態は画面上部のHPバー横に表示されます。
                </p>
            </div>
        `;
    }
}

// Show options (placeholder)
function showOptions() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('options-screen').classList.remove('hidden');
    
    // Update checkbox state
    const gridCheckbox = document.getElementById('gridSnapCheckbox');
    if (gridCheckbox) {
        gridCheckbox.checked = gridSnapEnabled;
    }
    
    // Update quality settings
    document.getElementById('graphicsQuality').value = qualitySettings.graphics;
    document.getElementById('effectsQuality').value = qualitySettings.effects;
    document.getElementById('seVolume').value = Math.round(qualitySettings.seVolume * 100);
    document.getElementById('bgmVolume').value = Math.round(qualitySettings.bgmVolume * 100);
    document.getElementById('showFPSCheckbox').checked = qualitySettings.showFPS;
    document.getElementById('fpsLimit').value = qualitySettings.fpsLimit;
    
    // Update labels
    document.getElementById('seVolumeLabel').textContent = Math.round(qualitySettings.seVolume * 100) + '%';
    document.getElementById('bgmVolumeLabel').textContent = Math.round(qualitySettings.bgmVolume * 100) + '%';
    document.getElementById('fpsLimitLabel').textContent = qualitySettings.fpsLimit === 0 ? '無制限' : qualitySettings.fpsLimit + ' FPS';
}

function updateGraphicsQuality() {
    qualitySettings.graphics = document.getElementById('graphicsQuality').value;
    saveSettings();
}

function updateEffectsQuality() {
    qualitySettings.effects = document.getElementById('effectsQuality').value;
    saveSettings();
}

function updateSEVolume() {
    const value = parseInt(document.getElementById('seVolume').value) / 100;
    qualitySettings.seVolume = value;
    document.getElementById('seVolumeLabel').textContent = Math.round(value * 100) + '%';
    
    // Update all sound effects volumes
    for (let key in sounds) {
        sounds[key].volume = value;
    }
    saveSettings();
}

function updateBGMVolume() {
    const value = parseInt(document.getElementById('bgmVolume').value) / 100;
    qualitySettings.bgmVolume = value;
    document.getElementById('bgmVolumeLabel').textContent = Math.round(value * 100) + '%';
    bgm.volume = value;
    saveSettings();
}

function toggleFPS() {
    qualitySettings.showFPS = document.getElementById('showFPSCheckbox').checked;
    saveSettings();
}

function updateFPSLimit() {
    const value = parseInt(document.getElementById('fpsLimit').value);
    qualitySettings.fpsLimit = value;
    document.getElementById('fpsLimitLabel').textContent = value === 0 ? '無制限' : value + ' FPS';
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('neon_defense_settings', JSON.stringify(qualitySettings));
}

// Helper function to get shadow blur based on quality settings
function getShadowBlur(baseBlur) {
    if (qualitySettings.graphics === 'low') return 0;
    if (qualitySettings.graphics === 'medium') return baseBlur * 0.5;
    return baseBlur;
}

// Helper function to check if we should draw effects
function shouldDrawEffect() {
    if (qualitySettings.graphics === 'low') return false;
    if (qualitySettings.effects === 'low') return Math.random() < 0.3; // 30% chance
    return true;
}

function backToMenuFromOptions() {
    document.getElementById('options-screen').classList.add('hidden');
    
    // Check if coming from pause screen or menu
    if (gamePaused) {
        backToPauseFromOptions();
    } else {
        document.getElementById('menu-screen').classList.remove('hidden');
    }
}

function toggleGridSnap() {
    const checkbox = document.getElementById('gridSnapCheckbox');
    gridSnapEnabled = checkbox.checked;
    
    // Save to localStorage
    localStorage.setItem('neon_defense_grid_snap', gridSnapEnabled.toString());
}
function showTutorial() {
    tutorialActive = true;
    currentTutorialPage = 0;
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('tutorial-highlight-overlay').classList.remove('hidden');
    document.getElementById('tutorial-screen').classList.remove('hidden');
    updateTutorialContent();
}

function updateTutorialContent() {
    const data = tutorialData[currentTutorialPage];
    document.getElementById('tutorial-character-img').src = data.character;
    document.getElementById('tutorial-name').textContent = data.name;
    document.getElementById('tutorial-message').textContent = data.message;
    
    // Show/hide UI elements based on showUI flag
    const textBox = document.querySelector('.tutorial-text-box');
    const character = document.querySelector('.tutorial-character');
    const tutorialScreen = document.getElementById('tutorial-screen');
    
    if (data.showUI === false) {
        textBox.style.display = 'none';
        character.style.display = 'none';
        // Allow clicks to pass through tutorial screen when UI is hidden
        tutorialScreen.style.pointerEvents = 'none';
    } else {
        textBox.style.display = 'block';
        character.style.display = 'block';
        tutorialScreen.style.pointerEvents = '';
    }

    // Update highlight
    const overlay = document.getElementById('tutorial-highlight-overlay');
    
    // Control overlay visibility based on showOverlay property
    if (data.showOverlay === false) {
        overlay.style.display = 'none';
    } else {
        overlay.style.display = 'block';
    }
    
    // Remove previous click listener if exists
    if (window.tutorialClickHandler) {
        const prevElements = document.querySelectorAll('[data-tutorial-clickable]');
        prevElements.forEach(el => {
            el.removeEventListener('click', window.tutorialClickHandler);
            el.removeAttribute('data-tutorial-clickable');
            el.style.pointerEvents = '';
        });
    }
    
    if (data.highlight) {
        // Special handling for stage map canvas elements
        if (data.highlight === '#stage-node-1' && data.screen === 'stage-map') {
            // Find stage 1 position
            const stage1 = stages.find(s => s.id === 1);
            if (stage1 && stage1.hitbox) {
                const canvas = document.getElementById('stage-map-canvas');
                const rect = canvas.getBoundingClientRect();
                const { x, y, width, height } = stage1.hitbox;
                
                // Make canvas clickable and bring to front
                canvas.style.position = 'relative';
                canvas.style.zIndex = '2001';
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'pointer';
                
                // Account for camera offset
                const highlightLeft = rect.left + x + stageMapOffsetX;
                const highlightTop = rect.top + y + stageMapOffsetY;
                const highlightRight = highlightLeft + width;
                const highlightBottom = highlightTop + height;
                
                overlay.style.clipPath = `polygon(
                    0 0,
                    0 100%,
                    ${highlightLeft}px 100%,
                    ${highlightLeft}px ${highlightTop}px,
                    ${highlightRight}px ${highlightTop}px,
                    ${highlightRight}px ${highlightBottom}px,
                    ${highlightLeft}px ${highlightBottom}px,
                    ${highlightLeft}px 100%,
                    100% 100%,
                    100% 0
                )`;
                
                // Make stage map clickable for tutorial
                if (data.clickable) {
                    canvas.setAttribute('data-tutorial-clickable', 'true');
                    
                    // Create a simple click handler that works anywhere on canvas during tutorial
                    window.tutorialClickHandler = function(e) {
                        console.log('Canvas clicked during tutorial!');
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        
                        const canvasRect = canvas.getBoundingClientRect();
                        const clickX = e.clientX - canvasRect.left - stageMapOffsetX;
                        const clickY = e.clientY - canvasRect.top - stageMapOffsetY;
                        
                        console.log('Click position:', clickX, clickY);
                        console.log('Stage1 hitbox:', stage1.hitbox);
                        console.log('Stage1 unlocked:', stage1.unlocked);
                        
                        // Check if clicked on stage 1
                        if (stage1.hitbox && stage1.unlocked) {
                            const { x, y, width, height } = stage1.hitbox;
                            if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
                                console.log('Stage 1 clicked! Starting game...');
                                // Don't close tutorial, just start the game
                                // Tutorial will continue in game screen
                                startGameWithStage(1);
                            } else {
                                console.log('Clicked outside Stage 1 area');
                            }
                        }
                    };
                    
                    // Remove any existing handlers first
                    canvas.removeEventListener('click', window.tutorialClickHandler, true);
                    canvas.removeEventListener('click', window.tutorialClickHandler, false);
                    
                    // Add with capture phase to ensure it fires first
                    canvas.addEventListener('click', window.tutorialClickHandler, true);
                    console.log('Tutorial click handler attached to canvas');
                }
            }
        } else {
            // Normal DOM element highlighting
            const targetElement = document.querySelector(data.highlight);
            if (targetElement) {
                const rect = targetElement.getBoundingClientRect();
                overlay.style.clipPath = `polygon(
                    0 0,
                    0 100%,
                    ${rect.left}px 100%,
                    ${rect.left}px ${rect.top}px,
                    ${rect.right}px ${rect.top}px,
                    ${rect.right}px ${rect.bottom}px,
                    ${rect.left}px ${rect.bottom}px,
                    ${rect.left}px 100%,
                    100% 100%,
                    100% 0
                )`;
                targetElement.style.position = 'relative';
                targetElement.style.zIndex = '2001';
                
                // If clickable, add click listener to proceed to next page
                if (data.clickable) {
                    targetElement.style.pointerEvents = 'auto';
                    targetElement.setAttribute('data-tutorial-clickable', 'true');
                    window.tutorialClickHandler = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        nextTutorial();
                    };
                    targetElement.addEventListener('click', window.tutorialClickHandler);
                }
            }
        }
    } else {
        overlay.style.clipPath = 'none';
        // Reset all menu buttons z-index
        document.querySelectorAll('.menu-button').forEach(btn => {
            btn.style.zIndex = '';
        });
    }
}

function nextTutorial() {
    currentTutorialPage++;
    if (currentTutorialPage >= tutorialData.length) {
        closeTutorial();
    } else {
        const data = tutorialData[currentTutorialPage];
        // If next page is on stage-map screen, call showStageMap
        if (data.screen === 'stage-map') {
            // Don't close tutorial, just hide it temporarily
            document.getElementById('tutorial-highlight-overlay').classList.add('hidden');
            document.getElementById('tutorial-screen').classList.add('hidden');
            showStageMap();
        } else if (data.screen === 'game') {
            // Game screen - tutorial continues in game
            // Show tutorial elements
            document.getElementById('tutorial-highlight-overlay').classList.remove('hidden');
            document.getElementById('tutorial-screen').classList.remove('hidden');
            updateTutorialContent();
        } else {
            updateTutorialContent();
        }
    }
}

function skipTutorial(event) {
    if (event) {
        event.stopPropagation();
    }
    closeTutorial();
}

function closeTutorial() {
    tutorialActive = false;
    document.getElementById('tutorial-highlight-overlay').classList.add('hidden');
    document.getElementById('tutorial-screen').classList.add('hidden');
    // document.getElementById('menu-screen').classList.remove('hidden');
    
    // Remove click listeners
    if (window.tutorialClickHandler) {
        const prevElements = document.querySelectorAll('[data-tutorial-clickable]');
        prevElements.forEach(el => {
            el.removeEventListener('click', window.tutorialClickHandler, true);
            el.removeAttribute('data-tutorial-clickable');
            el.style.pointerEvents = '';
            el.style.cursor = '';
            el.style.zIndex = '';
            el.style.position = '';
        });
        window.tutorialClickHandler = null;
    }
    
    // Re-enable stage map click if on stage map screen
    const stageMapCanvas = document.getElementById('stage-map-canvas');
    if (stageMapCanvas && !document.getElementById('stage-map-screen').classList.contains('hidden')) {
        stageMapCanvas.addEventListener('click', handleStageMapClick);
    }
    
    // Reset highlight
    const overlay = document.getElementById('tutorial-highlight-overlay');
    overlay.style.clipPath = 'none';
    document.querySelectorAll('.menu-button').forEach(btn => {
        btn.style.zIndex = '';
    });
    
    // Mark tutorial as seen
    localStorage.setItem('neon_defense_tutorial_seen', 'true');
}

// 

function loadSettings() {
    // Load grid snap setting
    const savedGridSnap = localStorage.getItem('neon_defense_grid_snap');
    if (savedGridSnap !== null) {
        gridSnapEnabled = savedGridSnap === 'true';
    }
    
    // Load quality settings
    const saved = localStorage.getItem('neon_defense_settings');
    if (saved) {
        qualitySettings = JSON.parse(saved);
    }
    
    // Apply settings
    bgm.volume = qualitySettings.bgmVolume;
    for (let key in sounds) {
        sounds[key].volume = qualitySettings.seVolume;
    }
}

// Pause Functions
function togglePause() {
    if (!gameActive) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        // Hide game UI and canvas
        document.getElementById('gameCanvas').classList.remove('active');
        document.getElementById('uiLayer').classList.remove('active');
        // Show pause screen
        document.getElementById('pause-screen').classList.remove('hidden');
        // Pause BGM
        bgm.pause();
    } else {
        // Show game UI and canvas
        document.getElementById('gameCanvas').classList.add('active');
        document.getElementById('uiLayer').classList.add('active');
        // Hide pause screen
        document.getElementById('pause-screen').classList.add('hidden');
        // Resume BGM (only if volume is not 0)
        if (qualitySettings.bgmVolume > 0) {
            bgm.play().catch(e => console.log('BGM play failed:', e));
        }
    }
}

function resumeGame() {
    if (gamePaused) {
        togglePause();
    }
}

function toggleDebugMode() {
    debugMode = !debugMode;
    const debugBtn = document.getElementById('debugBtn');
    if (debugMode) {
        debugBtn.textContent = 'DEBUG: ON';
        debugBtn.style.background = '#ff4444';
    } else {
        debugBtn.textContent = 'DEBUG: OFF';
        debugBtn.style.background = '#666';
    }
    updateUI();
}

function initDebugUI() {
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
        debugBtn.style.display = showDebugUI ? 'block' : 'none';
    }
}

function pauseToOptions() {
    // Hide pause screen
    document.getElementById('pause-screen').classList.add('hidden');
    // Show options screen
    document.getElementById('options-screen').classList.remove('hidden');
    
    // Update checkbox state
    const gridCheckbox = document.getElementById('gridSnapCheckbox');
    if (gridCheckbox) {
        gridCheckbox.checked = gridSnapEnabled;
    }
}

function backToPauseFromOptions() {
    // Hide options screen
    document.getElementById('options-screen').classList.add('hidden');
    // Show pause screen (game UI remains hidden)
    document.getElementById('pause-screen').classList.remove('hidden');
}

function pauseToMenu() {
    // Show custom confirmation dialog
    showConfirmDialog();
}

function showConfirmDialog() {
    document.getElementById('confirm-dialog').classList.remove('hidden');
}

function hideConfirmDialog() {
    document.getElementById('confirm-dialog').classList.add('hidden');
}

function confirmAction() {
    // Hide confirmation dialog
    hideConfirmDialog();
    
    // Stop BGM
    bgm.pause();
    bgm.currentTime = 0;
    
    // Hide pause screen
    document.getElementById('pause-screen').classList.add('hidden');
    
    // Hide canvas and UI
    document.getElementById('gameCanvas').classList.remove('active');
    document.getElementById('uiLayer').classList.remove('active');
    
    // Show menu screen
    document.getElementById('menu-screen').classList.remove('hidden');
    
    // Reset game state
    gameActive = false;
    gamePaused = false;
}

function startGame() {
    // Setup command input system (once)
    if (!window.commandSystemInitialized) {
        setupCommandInput();
        window.commandSystemInitialized = true;
    }
    
    // Cancel any existing animation loop
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Hide all screens
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Show canvas and UI
    document.getElementById('gameCanvas').classList.add('active');
    document.getElementById('uiLayer').classList.add('active');
    
    // Update UI visibility for game mode
    if (endlessMode) {
        document.getElementById('chipDisplayBox').style.display = 'none';
        document.getElementById('endlessScoreBox').style.display = 'flex';
    } else {
        document.getElementById('chipDisplayBox').style.display = 'flex';
        document.getElementById('endlessScoreBox').style.display = 'none';
    }
    
    // Setup commander active skill UI
    setupCommanderUI();
    
    resetGameVars();
    generatePath(); // Generate fixed path once at game start
    resizeCanvas();
    gameActive = true;
    lastTime = 0; // Reset animation timestamp
    updateUI();
    
    // Start BGM (only if volume is not 0)
    bgm.currentTime = 0;
    if (qualitySettings.bgmVolume > 0) {
        bgm.play().catch(e => console.log('BGM play failed:', e));
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startEndlessMode() {
    endlessMode = true;
    endlessScore = 0;
    currentStage = 1; // Use stage 1 for endless mode
    wave = 1;
    document.getElementById('menu-screen').classList.add('hidden');
    startGame();
}

// NOTE: ゲーム変数のリセット
function resetGameVars() {
    // Apply skill bonuses
    let startMoney = 150;　//default 150
    if (unlockedSkills.includes('initial_credits')) {
        startMoney += 50;
    }
    if (unlockedSkills.includes('initial_credits2')) {
        startMoney += 50;
    }
    if (unlockedSkills.includes('initial_credits3')) {
        startMoney += 100;
    }
    if (unlockedSkills.includes('initial_credits4')) {
        startMoney += 100;
    }
    
    let startLives = 20;
    if (unlockedSkills.includes('base_upgrade')) {
        startLives += 5;
    }
    if (unlockedSkills.includes('base_upgrade2')) {
        startLives += 5;
    }
    if (unlockedSkills.includes('terraforming')) {
        startLives += 5;
    }
    if (unlockedSkills.includes('terraforming2')) {
        startLives += 5;
    }
    
    money = startMoney; 
    lives = startLives;
    wave = 1;
    enemies = [];
    towers = [];
    projectiles = [];
    particles = [];
    damageTexts = [];
    freezeZones = [];
    stunZones = [];
    lightningStrikes = [];
    zombies = [];
    warpEffects = [];
    mines = [];
    solarFlares = [];
    waveActive = false;
    bossSpawned = false;
    baseDestroyed = false; // Reset base destroyed flag
    tempChipsThisGame = 0; // Reset temporary chips
    selectedTowerType = null;
    selectedTowerInstance = null;
    tempTowerX = null;
    tempTowerY = null;
    tempTowerType = null;
    enemiesToSpawn = 0;
    totalWaveEnemies = 1; // Avoid divide by zero init
    cameraOffsetX = 0;
    cameraOffsetY = 0;
    isDragging = false;
    isSwiping = false;
    document.getElementById('upgradePanel').classList.add('hidden');
    document.getElementById('waveProgressBar').style.width = '0%';
    // Reset next wave button
    document.getElementById('nextWaveBtn').disabled = false;
    document.getElementById('nextWaveBtn').classList.remove('opacity-50');
    // Reset auto wave mode
    autoWaveMode = false;
    updateNextWaveButton();
}

// Skill Tree Data Management
function loadSkillTree() {
    const saved = localStorage.getItem('neon_defense_unlocked_skills');
    if (saved) {
        unlockedSkills = JSON.parse(saved);
    }
    const savedChips = localStorage.getItem('neon_defense_chips');
    if (savedChips) {
        electronicChips = parseInt(savedChips);
    }
}

function saveSkillTree() {
    localStorage.setItem('neon_defense_unlocked_skills', JSON.stringify(unlockedSkills));
    localStorage.setItem('neon_defense_chips', electronicChips.toString());
}

function saveStageProgress() {
    const stageData = {
        currentStage: currentStage,
        unlockedStages: stages.filter(s => s.unlocked).map(s => s.id),
        clearedStages: stages.filter(s => s.cleared).map(s => s.id)
    };
    localStorage.setItem('neonDefenseStages', JSON.stringify(stageData));
}

function loadStageProgress() {
    try {
        const saved = localStorage.getItem('neonDefenseStages');
        if (saved) {
            const stageData = JSON.parse(saved);
            currentStage = stageData.currentStage || 1;
            if (stageData.unlockedStages) {
                stages.forEach(stage => {
                    stage.unlocked = stageData.unlockedStages.includes(stage.id);
                });
            }
            if (stageData.clearedStages) {
                stages.forEach(stage => {
                    stage.cleared = stageData.clearedStages.includes(stage.id);
                });
            }
        }
    } catch (e) {
        console.error('Failed to load stage progress:', e);
    }
}

function canUnlockSkill(skillId) {
    const skill = skillTree[skillId];
    if (!skill) return false;
    if (unlockedSkills.includes(skillId)) return false;
    if (electronicChips < skill.cost) return false;
    
    // Check prerequisites
    if (skill.requires.length === 0) return true;
    return skill.requires.every(reqId => unlockedSkills.includes(reqId));
}

function unlockSkill(skillId) {
    if (!canUnlockSkill(skillId)) return false;
    
    const skill = skillTree[skillId];
    electronicChips -= skill.cost;
    unlockedSkills.push(skillId);
    saveSkillTree();
    updateChipDisplay();
    drawSkillTree();
    
    // If ROD was unlocked, update tower buttons
    if (skillId === 'unlock_rod') {
        updateTowerButtons();
    }
    
    // If Gear was unlocked (unlock_gear or self_generation), update tower buttons
    if (skillId === 'unlock_gear' || skillId === 'self_generation') {
        updateTowerButtons();
    }
    
    // If Terraforming was unlocked, add +5 life
    if (skillId === 'terraforming') {
        playerLife += 5;
    }
    
    // If Terraforming II was unlocked, add +5 life
    if (skillId === 'terraforming2') {
        playerLife += 5;
    }
    
    playSound('select');
    return true;
}

// Get visible skills (unlocked + unlockable only)
function getVisibleSkills() {
    const visible = new Set();
    
    // Add all unlocked skills
    unlockedSkills.forEach(id => visible.add(id));
    
    // Find unlockable skills
    Object.keys(skillTree).forEach(id => {
        if (unlockedSkills.includes(id)) return;
        const skill = skillTree[id];
        const canUnlock = skill.requires.length === 0 || 
                         skill.requires.every(reqId => unlockedSkills.includes(reqId));
        if (canUnlock) {
            visible.add(id);
        }
    });
    
    return Array.from(visible);
}

function resetGame() {
    // Keep endless mode state when retrying
    const wasEndlessMode = endlessMode;
    if (wasEndlessMode) {
        endlessScore = 0;
    }
    startGame();
}

function backToMenu() {
    // Stop BGM
    bgm.pause();
    bgm.currentTime = 0;
    
    // Reset endless mode
    endlessMode = false;
    endlessScore = 0;
    
    // Hide game over screen
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Hide canvas and UI
    document.getElementById('gameCanvas').classList.remove('active');
    document.getElementById('uiLayer').classList.remove('active');
    
    // Show menu screen
    document.getElementById('menu-screen').classList.remove('hidden');
    
    // Reset game state
    gameActive = false;
}

// Skill Tree Screen Functions
function showSkillTree() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('skill-tree-screen').classList.remove('hidden');
    loadSkillTree();
    updateChipDisplay();
    
    // Wait for DOM to render before initializing canvas
    setTimeout(() => {
        initSkillCanvas();
    }, 50);
}

function backToMenuFromSkillTree() {
    document.getElementById('skill-tree-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    // Stop skill tree animation
    stopSkillTreeAnimation();
    // Update tower buttons in case ROD was unlocked
    updateTowerButtons();
}

// Show unlocked skills popup
function showUnlockedSkillsPopup() {
    const popup = document.getElementById('unlocked-skills-popup');
    const content = document.getElementById('unlocked-skills-content');
    
    // Track cumulative effects
    const effects = {
        'BASE': {
            '初期クレジット': 0,
            '電子チップドロップ率': 0,
            '敵からのクレジット': 0,
            '基地HP': 0,
            'クリティカル率': 0
        },
        'TURRET': {
            'ダメージ': 0,
            '射程': 0,
            '連射速度': 0,
            '解放': false
        },
        'SNIPER': {
            'ダメージ': 0,
            '射程': 0,
            '解放': false
        },
        'BLASTER': {
            'ダメージ': 0,
            '射程': 0,
            '氷結持続時間': 0,
            '延焼ダメージ': 0,
            '解放': false
        },
        'ROD': {
            'ダメージ': 0,
            '射程': 0,
            'サージ発動率': 0,
            'ワープ成功率': 0,
            '解放': false,
            '進化': []
        },
        'SWEEPER': {
            '解放': false,
            '地雷設置': false
        },
        'GEAR': {
            '解放': false
        },
        'その他': []
    };
    
    // Check if all_tower_damage is unlocked
    const hasAllTowerDamage = unlockedSkills.includes('all_tower_damage');
    
    // Process each unlocked skill
    // NOTE: スキル総数
    for (const skillId of unlockedSkills) {
        switch(skillId) {
            // BASE
            case 'initial_credits':
                effects.BASE['初期クレジット'] += 50;
                break;
            case 'initial_credits2':
                effects.BASE['初期クレジット'] += 50;
                break;
            case 'initial_credits3':
                effects.BASE['初期クレジット'] += 100;
                break;
            case 'initial_credits4':
                effects.BASE['初期クレジット'] += 100;
                break;
            case 'chip_rate':
                effects.BASE['電子チップドロップ率'] += 10;
                break;
            case 'enemy_credits':
                effects.BASE['敵からのクレジット'] += 20;
                break;
            case 'economics':
                effects.BASE['敵からのクレジット'] += 20;
                break;
            case 'base_upgrade':
                effects.BASE['基地HP'] += 10;
                break;
            case 'base_upgrade2':
                effects.BASE['基地HP'] += 10;
                break;
            case 'weak_point_analysis':
                effects.BASE['クリティカル率'] += 1;
                break;
            case 'vulnerability':
                effects.BASE['クリティカル率'] += 1;
                break;
            case 'terraforming':
                effects.BASE['基地HP'] += 5;
                break;
            case 'terraforming2':
                effects.BASE['基地HP'] += 5;
                break;
            case 'ai_analysis':
                effects.BASE['クリティカル率'] += 1;
                break;
            
            // TURRET
            case 'turret_damage':
                effects.TURRET['ダメージ'] += 5;
                effects.TURRET['解放'] = true;
                break;
            case 'turret_range':
                effects.TURRET['射程'] += 1;
                effects.TURRET['解放'] = true;
                break;
            case 'quantity_over_quality':
                effects.TURRET['連射速度'] += 5;
                effects.TURRET['解放'] = true;
                break;
            case 'bullet_hardening':
                effects.TURRET['ダメージ'] += 10;
                effects.TURRET['解放'] = true;
                break;
            case 'rapid_fire':
                effects.TURRET['連射速度'] += 5;
                effects.TURRET['解放'] = true;
                break;
            
            // SNIPER
            case 'sniper_damage':
                effects.SNIPER['ダメージ'] += 5;
                effects.SNIPER['解放'] = true;
                break;
            case 'sniper_range':
                effects.SNIPER['射程'] += 1;
                effects.SNIPER['解放'] = true;
                break;
            case 'mass':
                effects.SNIPER['ダメージ'] += 5;
                effects.SNIPER['解放'] = true;
                break;
            case 'sharpness_or_hardness':
                effects.SNIPER['ダメージ'] += 10;
                effects.SNIPER['解放'] = true;
                break;
            
            // BLASTER
            case 'blaster_damage':
                effects.BLASTER['ダメージ'] += 5;
                effects.BLASTER['解放'] = true;
                break;
            case 'blaster_range':
                effects.BLASTER['射程'] += 1;
                effects.BLASTER['解放'] = true;
                break;
            case 'hotfix':
                effects.BLASTER['射程'] += 5;
                effects.BLASTER['解放'] = true;
                break;
            case 'freeze_duration':
                effects.BLASTER['氷結持続時間'] += 50;
                effects.BLASTER['解放'] = true;
                break;
            case 'burn_damage':
                effects.BLASTER['延焼ダメージ'] += 50;
                effects.BLASTER['解放'] = true;
                break;
            case 'bang':
                effects.BLASTER['ダメージ'] += 10;
                effects.BLASTER['解放'] = true;
                break;
            case 'inferno':
                effects.BLASTER['延焼ダメージ'] += 100;
                effects.BLASTER['解放'] = true;
                break;
            
            // ROD
            case 'unlock_rod':
                effects.ROD['解放'] = true;
                break;
            case 'rod_damage':
                effects.ROD['ダメージ'] += 5;
                break;
            case 'rod_range':
                effects.ROD['射程'] += 1;
                break;
            case 'voltage_transformer':
                effects.ROD['サージ発動率'] += 10;
                break;
            case 'quantum_transfer':
                effects.ROD['ワープ成功率'] += 5;
                break;
            case 'cross_specialization':
                effects.ROD['進化'].push('Burn-Lightning');
                break;
            case 'obey':
                effects.ROD['進化'].push('Necromancer');
                break;
            case 'magician':
                effects.ROD['進化'].push('Warp-Rod');
                break;
            
            // SWEEPER
            case 'unlock_sweeper':
                effects.SWEEPER['解放'] = true;
                break;
            case 'minesweeper':
                effects.SWEEPER['地雷設置'] = true;
                break;
            
            // GEAR
            case 'unlock_gear':
                effects.GEAR['解放'] = true;
                break;
            case 'self_generation':
                effects.GEAR['解放'] = true;
                break;
            case 'durability_improvement':
                if (!effects.GEAR['連鎖上限']) effects.GEAR['連鎖上限'] = 0;
                effects.GEAR['連鎖上限'] += 5;
                effects.GEAR['解放'] = true;
                break;
            
            // その他
            case 'tile_break':
                effects['その他'].push('裂傷の割合増加');
                break;
            case 'ultimate_power':
                effects['その他'].push('Lv70進化すべて解放');
                break;
        }
    }
    
    // Add all_tower_damage to unlocked tower categories
    if (hasAllTowerDamage) {
        if (effects.TURRET['解放']) effects.TURRET['ダメージ'] += 10;
        if (effects.SNIPER['解放']) effects.SNIPER['ダメージ'] += 10;
        if (effects.BLASTER['解放']) effects.BLASTER['ダメージ'] += 10;
        if (effects.ROD['解放']) effects.ROD['ダメージ'] += 10;
        if (effects.SWEEPER['解放']) effects.SWEEPER['ダメージ'] = (effects.SWEEPER['ダメージ'] || 0) + 10;
        if (effects.GEAR['解放']) effects.GEAR['ダメージ'] = (effects.GEAR['ダメージ'] || 0) + 10;
    }
    
    // Add ultimate_power2 to unlocked tower categories
    if (unlockedSkills.includes('ultimate_power2')) {
        if (effects.TURRET['解放']) effects.TURRET['ダメージ'] += 10;
        if (effects.SNIPER['解放']) effects.SNIPER['ダメージ'] += 10;
        if (effects.BLASTER['解放']) effects.BLASTER['ダメージ'] += 10;
        if (effects.ROD['解放']) effects.ROD['ダメージ'] += 10;
        if (effects.SWEEPER['解放']) effects.SWEEPER['ダメージ'] = (effects.SWEEPER['ダメージ'] || 0) + 10;
        if (effects.GEAR['解放']) effects.GEAR['ダメージ'] = (effects.GEAR['ダメージ'] || 0) + 10;
    }
    
    // Build HTML
    let html = '';
    
    // BASE
    if (Object.values(effects.BASE).some(v => v > 0)) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【BASE】</div>`;
        if (effects.BASE['初期クレジット'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 初期クレジット+${effects.BASE['初期クレジット']}</div>`;
        if (effects.BASE['電子チップドロップ率'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 電子チップドロップ率+${effects.BASE['電子チップドロップ率']}%</div>`;
        if (effects.BASE['敵からのクレジット'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 敵からのクレジット+${effects.BASE['敵からのクレジット']}%</div>`;
        if (effects.BASE['基地HP'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 基地HP+${effects.BASE['基地HP']}</div>`;
        if (effects.BASE['クリティカル率'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• クリティカル率+${effects.BASE['クリティカル率']}%</div>`;
        html += `</div>`;
    }
    
    // TURRET
    if (effects.TURRET['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【TURRET】</div>`;
        if (effects.TURRET['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.TURRET['ダメージ']}%</div>`;
        if (effects.TURRET['射程'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 射程+${effects.TURRET['射程']}%</div>`;
        if (effects.TURRET['連射速度'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 連射速度+${effects.TURRET['連射速度']}%</div>`;
        html += `</div>`;
    }
    
    // SNIPER
    if (effects.SNIPER['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【SNIPER】</div>`;
        if (effects.SNIPER['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.SNIPER['ダメージ']}%</div>`;
        if (effects.SNIPER['射程'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 射程+${effects.SNIPER['射程']}%</div>`;
        html += `</div>`;
    }
    
    // BLASTER
    if (effects.BLASTER['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【BLASTER】</div>`;
        if (effects.BLASTER['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.BLASTER['ダメージ']}%</div>`;
        if (effects.BLASTER['射程'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 射程+${effects.BLASTER['射程']}%</div>`;
        if (effects.BLASTER['氷結持続時間'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 氷結持続時間+${effects.BLASTER['氷結持続時間']}%</div>`;
        if (effects.BLASTER['延焼ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 延焼ダメージ+${effects.BLASTER['延焼ダメージ']}%</div>`;
        html += `</div>`;
    }
    
    // ROD
    if (effects.ROD['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【ROD】</div>`;
        html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• RODタワー解放</div>`;
        if (effects.ROD['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.ROD['ダメージ']}%</div>`;
        if (effects.ROD['射程'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 射程+${effects.ROD['射程']}%</div>`;
        if (effects.ROD['サージ発動率'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• サージ発動率+${effects.ROD['サージ発動率']}%</div>`;
        if (effects.ROD['ワープ成功率'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ワープ成功率+${effects.ROD['ワープ成功率']}%</div>`;
        if (effects.ROD['進化'].length > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 進化解放: ${effects.ROD['進化'].join(', ')}</div>`;
        html += `</div>`;
    }
    
    // SWEEPER
    if (effects.SWEEPER['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【SWEEPER】</div>`;
        html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• Sweeperタワー解放</div>`;
        if (effects.SWEEPER['地雷設置']) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• 地雷設置タワー解放</div>`;
        if (effects.SWEEPER['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.SWEEPER['ダメージ']}%</div>`;
        html += `</div>`;
    }
    
    // GEAR
    if (effects.GEAR['解放']) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【GEAR】</div>`;
        html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• Gearタワー解放</div>`;
        if (effects.GEAR['ダメージ'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ダメージ+${effects.GEAR['ダメージ']}%</div>`;
        if (effects.GEAR['連鎖上限'] > 0) html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• Gear連鎖上限+${effects.GEAR['連鎖上限']}</div>`;
        html += `</div>`;
    }
    
    // その他
    if (effects['その他'].length > 0) {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<div style="color: #ffaa00; font-size: 1.1rem; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ffaa00; padding-bottom: 4px;">【その他】</div>`;
        for (const effect of effects['その他']) {
            html += `<div style="color: #ffffff; margin-left: 10px; margin-bottom: 4px;">• ${effect}</div>`;
        }
        html += `</div>`;
    }
    
    if (html === '') {
        html = '<div style="color: #aaaaaa; text-align: center; padding: 40px;">まだスキルが解放されていません</div>';
    }
    
    content.innerHTML = html;
    popup.classList.remove('hidden');
}

function hideUnlockedSkillsPopup() {
    document.getElementById('unlocked-skills-popup').classList.add('hidden');
}

// Stage Map System
let stageMapCanvas = null;
let stageMapCtx = null;
let stageMapAnimationId = null;
let selectedStage = null;
let currentStage = 1; // Current unlocked stage

// Stage Map Camera
let stageMapOffsetX = 0;
let stageMapOffsetY = 0;
let stageMapDragging = false;
let stageMapDragStartX = 0;
let stageMapDragStartY = 0;
let stageMapLastTouchX = 0;
let stageMapLastTouchY = 0;

// NOTE: ステージ一覧
const stages = [
    { id: 1, name: 'STAGE 1', x: 1, y: 6, unlocked: true, cleared: false, description: '初期ステージ' },
    { id: 2, name: 'STAGE 2', x: 5, y: 5, unlocked: false, cleared: false, description: 'なんかのステージ' },
    { id: 3, name: 'STAGE 3', x: 9, y: 4, unlocked: false, cleared: false, description: 'TEST' },
    // { id: 4, name: 'STAGE 4', x: 13, y: 3, unlocked: false, cleared: false, description: 'エキスパート' },
    // { id: 5, name: 'STAGE 5', x: 17, y: 2, unlocked: false, cleared: false, description: '最終ステージ' },
];

function showStageMap() {
    loadStageProgress();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('stage-map-screen').classList.remove('hidden');
    
    setTimeout(() => {
        initStageMapCanvas();
        
        // If tutorial is active and on stage-map screen, update highlight
        if (tutorialActive && currentTutorialPage < tutorialData.length) {
            const data = tutorialData[currentTutorialPage];
            if (data.screen === 'stage-map') {
                document.getElementById('tutorial-highlight-overlay').classList.remove('hidden');
                document.getElementById('tutorial-screen').classList.remove('hidden');
                setTimeout(() => {
                    updateTutorialContent();
                }, 100);
            }
        }
    }, 50);
}

function backToMenuFromStageMap() {
    document.getElementById('stage-map-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    stopStageMapAnimation();
}

function initStageMapCanvas() {
    stageMapCanvas = document.getElementById('stage-map-canvas');
    if (!stageMapCanvas) return;
    
    stageMapCtx = stageMapCanvas.getContext('2d');
    resizeStageMapCanvas();
    
    // Add event listeners (but not click if tutorial is active)
    if (!tutorialActive) {
        stageMapCanvas.addEventListener('click', handleStageMapClick);
    }
    stageMapCanvas.addEventListener('mousedown', handleStageMapMouseDown);
    stageMapCanvas.addEventListener('mousemove', handleStageMapMouseMove);
    stageMapCanvas.addEventListener('mouseup', handleStageMapMouseUp);
    stageMapCanvas.addEventListener('mouseleave', handleStageMapMouseUp);
    stageMapCanvas.addEventListener('touchstart', handleStageMapTouchStart);
    stageMapCanvas.addEventListener('touchmove', handleStageMapTouchMove);
    stageMapCanvas.addEventListener('touchend', handleStageMapTouchEnd);
    window.addEventListener('resize', resizeStageMapCanvas);
    
    // Start animation
    animateStageMap();
}

function resizeStageMapCanvas() {
    if (!stageMapCanvas) return;
    stageMapCanvas.width = stageMapCanvas.offsetWidth;
    stageMapCanvas.height = stageMapCanvas.offsetHeight;
}

function animateStageMap() {
    if (!stageMapCtx) return;
    
    drawStageMap();
    stageMapAnimationId = requestAnimationFrame(animateStageMap);
}

function stopStageMapAnimation() {
    if (stageMapAnimationId) {
        cancelAnimationFrame(stageMapAnimationId);
        stageMapAnimationId = null;
    }
}

function drawStageMap() {
    if (!stageMapCtx || !stageMapCanvas) return;
    
    const ctx = stageMapCtx;
    const width = stageMapCanvas.width;
    const height = stageMapCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Apply camera offset
    ctx.save();
    ctx.translate(stageMapOffsetX, stageMapOffsetY);
    
    // Draw grid
    const gridSize = 60;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    
    // Expand grid drawing area based on camera offset
    const gridMargin = 2000; // Extra space for grid beyond visible area
    const gridStartX = -gridMargin - (stageMapOffsetX % gridSize);
    const gridEndX = width + gridMargin;
    const gridStartY = -gridMargin - (stageMapOffsetY % gridSize);
    const gridEndY = height + gridMargin;
    
    for (let x = gridStartX; x < gridEndX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, gridStartY);
        ctx.lineTo(x, gridEndY);
        ctx.stroke();
    }
    
    for (let y = gridStartY; y < gridEndY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gridStartX, y);
        ctx.lineTo(gridEndX, y);
        ctx.stroke();
    }
    
    // Calculate stage positions
    const marginX = 100;
    const marginY = 100;
    const stageWidth = 200;
    const stageHeight = 100;
    
    // Draw connections between stages
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i < stages.length - 1; i++) {
        if (stages[i].unlocked || stages[i + 1].unlocked) {
            const stage1 = stages[i];
            const stage2 = stages[i + 1];
            
            const x1 = marginX + (stage1.x * gridSize);
            const y1 = marginY + (stage1.y * gridSize);
            const x2 = marginX + (stage2.x * gridSize);
            const y2 = marginY + (stage2.y * gridSize);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    // Draw stages
    const time = Date.now();
    const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
    
    stages.forEach(stage => {
        const x = marginX + (stage.x * gridSize) - stageWidth / 2;
        const y = marginY + (stage.y * gridSize) - stageHeight / 2;
        
        // Store hitbox for click detection
        stage.hitbox = { x, y, width: stageWidth, height: stageHeight };
        
        // Draw rounded rectangle
        const radius = 15;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + stageWidth - radius, y);
        ctx.quadraticCurveTo(x + stageWidth, y, x + stageWidth, y + radius);
        ctx.lineTo(x + stageWidth, y + stageHeight - radius);
        ctx.quadraticCurveTo(x + stageWidth, y + stageHeight, x + stageWidth - radius, y + stageHeight);
        ctx.lineTo(x + radius, y + stageHeight);
        ctx.quadraticCurveTo(x, y + stageHeight, x, y + stageHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        // Style based on state
        if (stage.unlocked) {
            if (stage.cleared) {
                // Cleared
                if (selectedStage === stage.id) {
                    ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
                    ctx.strokeStyle = '#00ff66';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#00ff66';
                } else {
                    ctx.fillStyle = 'rgba(0, 200, 100, 0.7)';
                    ctx.strokeStyle = '#00dd66';
                    ctx.shadowBlur = 15 * pulse;
                    ctx.shadowColor = '#00ff66';
                }
            } else if (selectedStage === stage.id) {
                // Selected
                ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
                ctx.strokeStyle = '#00ffff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#00ffff';
            } else {
                // Unlocked
                ctx.fillStyle = 'rgba(0, 200, 200, 0.7)';
                ctx.strokeStyle = '#00dddd';
                ctx.shadowBlur = 15 * pulse;
                ctx.shadowColor = '#00ffff';
            }
        } else {
            // Locked
            ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
            ctx.strokeStyle = '#666666';
            ctx.shadowBlur = 0;
        }
        
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Draw stage name
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = stage.unlocked ? '#ffffff' : '#999999';
        ctx.fillText(stage.name, x + stageWidth / 2, y + stageHeight / 2 - 10);
        
        // Draw description
        ctx.font = '14px Orbitron';
        ctx.fillStyle = stage.unlocked ? '#aaffff' : '#666666';
        ctx.fillText(stage.description, x + stageWidth / 2, y + stageHeight / 2 + 15);
        
        // Draw "cleared" text for cleared stages
        if (stage.cleared) {
            ctx.font = 'bold 12px Orbitron';
            ctx.fillStyle = '#00ff88';
            ctx.fillText('CLEARED', x + stageWidth / 2, y + stageHeight / 2 + 35);
        }
        
        // Draw lock icon if locked
        if (!stage.unlocked) {
            ctx.font = '30px Arial';
            ctx.fillStyle = '#999999';
            ctx.fillText('🔒', x + stageWidth / 2, y + stageHeight / 2);
        }
    });
    
    // Restore camera transform
    ctx.restore();
}

function handleStageMapClick(e) {
    // Don't trigger click if we were dragging
    if (stageMapDragging) return;
    
    const rect = stageMapCanvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - stageMapOffsetX;
    const clickY = e.clientY - rect.top - stageMapOffsetY;
    
    // Check if clicked on any stage
    stages.forEach(stage => {
        if (stage.hitbox && stage.unlocked) {
            const { x, y, width, height } = stage.hitbox;
            if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
                selectedStage = stage.id;
                playSound('select');
                // Start game with selected stage
                startGameWithStage(stage.id);
            }
        }
    });
}

function startGameWithStage(stageId) {
    // Hide stage map
    document.getElementById('stage-map-screen').classList.add('hidden');
    stopStageMapAnimation();
    
    // Reset endless mode (ステージモードではエンドレスモードをオフ)
    endlessMode = false;
    endlessScore = 0;
    
    // Set current stage
    currentStage = stageId;
    
    // Set wave based on stage (always start at wave 1 for each stage)
    //wave = (stageId - 1) * 10 + 1;
    wave = 1; // Each stage starts at wave 1
    
    // Start game
    startGame();
    
    // Continue tutorial if active
    if (tutorialActive && currentTutorialPage < tutorialData.length - 1) {
        setTimeout(() => {
            // Check if next page is for game screen
            if (currentTutorialPage + 1 < tutorialData.length && tutorialData[currentTutorialPage + 1].screen === 'game') {
                nextTutorial();
            }
        }, 1000);
    }
}

// Stage Map drag handlers
function handleStageMapMouseDown(e) {
    stageMapDragging = true;
    stageMapDragStartX = e.clientX - stageMapOffsetX;
    stageMapDragStartY = e.clientY - stageMapOffsetY;
}

function handleStageMapMouseMove(e) {
    if (stageMapDragging) {
        stageMapOffsetX = e.clientX - stageMapDragStartX;
        stageMapOffsetY = e.clientY - stageMapDragStartY;
    }
}

function handleStageMapMouseUp(e) {
    stageMapDragging = false;
}

function handleStageMapTouchStart(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        stageMapDragging = true;
        stageMapLastTouchX = touch.clientX;
        stageMapLastTouchY = touch.clientY;
        stageMapDragStartX = touch.clientX - stageMapOffsetX;
        stageMapDragStartY = touch.clientY - stageMapOffsetY;
    }
}

function handleStageMapTouchMove(e) {
    if (e.touches.length === 1 && stageMapDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        stageMapOffsetX = touch.clientX - stageMapDragStartX;
        stageMapOffsetY = touch.clientY - stageMapDragStartY;
        stageMapLastTouchX = touch.clientX;
        stageMapLastTouchY = touch.clientY;
    }
}

function handleStageMapTouchEnd(e) {
    stageMapDragging = false;
}

function updateChipDisplay() {
    const chipCountElement = document.getElementById('chip-count');
    if (chipCountElement) {
        chipCountElement.innerText = electronicChips;
    }
}

function startWave() {
    if (waveActive) return;
    waveActive = true;
    
    // Base spawn count
    let baseSpawn = 5 + Math.floor(wave * 2.5);
    
    // Double the spawn slots from wave 100+
    if (wave >= 100) {
        baseSpawn *= 2;
    }
    
    enemiesToSpawn = baseSpawn;
    totalWaveEnemies = enemiesToSpawn; // Set total for progress
    spawnInterval = Math.max(200, 1000 - (wave * 50));
    document.getElementById('nextWaveBtn').disabled = true;
    document.getElementById('nextWaveBtn').classList.add('opacity-50');
    document.getElementById('waveProgressBar').style.width = '0%';
}

// Auto wave mode - long press to toggle
const nextWaveBtn = document.getElementById('nextWaveBtn');
let isLongPress = false;

nextWaveBtn.addEventListener('mousedown', () => {
    isLongPress = false;
    autoWavePressTimer = setTimeout(() => {
        isLongPress = true;
        toggleAutoWaveMode();
    }, 800); // 800ms long press
});

nextWaveBtn.addEventListener('mouseup', () => {
    if (autoWavePressTimer) {
        clearTimeout(autoWavePressTimer);
        autoWavePressTimer = null;
    }
});

nextWaveBtn.addEventListener('mouseleave', () => {
    if (autoWavePressTimer) {
        clearTimeout(autoWavePressTimer);
        autoWavePressTimer = null;
    }
});

nextWaveBtn.addEventListener('touchstart', (e) => {
    isLongPress = false;
    autoWavePressTimer = setTimeout(() => {
        isLongPress = true;
        toggleAutoWaveMode();
    }, 800);
});

nextWaveBtn.addEventListener('touchend', () => {
    if (autoWavePressTimer) {
        clearTimeout(autoWavePressTimer);
        autoWavePressTimer = null;
    }
});

nextWaveBtn.addEventListener('click', (e) => {
    // Only trigger startWave if it wasn't a long press
    if (!isLongPress) {
        startWave();
    }
    isLongPress = false;
});

function toggleAutoWaveMode() {
    autoWaveMode = !autoWaveMode;
    updateNextWaveButton();
    playSound('select');
}

function updateNextWaveButton() {
    const btn = document.getElementById('nextWaveBtn');
    if (autoWaveMode) {
        btn.style.background = 'linear-gradient(45deg, #9900ff, #6600cc)';
        btn.style.borderColor = '#9900ff';
        btn.innerText = 'AUTO MODE';
    } else {
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.innerText = 'NEXT WAVE';
    }
}

// --- Classes ---

class Enemy {
    constructor(path, type = 'normal') {
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.path = path;
        this.active = true;
        this.frozen = false;
        this.type = type;
        this.burnDamage = 0;
        this.burnDuration = 0;
        this.doubleBurnDamage = 0; // 延延焼のダメージ（死ぬまで継続）
        this.doubleBurnTickCounter = 0; // 延延焼のダメージ表示用カウンター
        this.slowAmount = 0;
        this.slowDuration = 0;
        this.stunDuration = 0; // Stun effect
        this.isBoss = false;
        this.chainBurn = false;
        this.lacerationStacks = 0; // 裂傷状態のスタック数
        this.freezeStacks = 0; // 凍結のスタック数（3回まで）
        this.whiteoutTime = 0; // 猛吹雪を食らっている累積時間（フレーム数）
        
        // Shield properties (for shielder type)
        this.shield = 0;
        this.maxShield = 0;
        this.hasShield = false;
        
        // Knockback animation
        this.knockbackActive = false;
        this.knockbackStartIndex = 0;
        this.knockbackTargetIndex = 0;
        this.knockbackProgress = 0;
        this.knockbackDuration = 30; // フレーム数

        const baseHp = 30 + (wave * 15);
        // Cap speed increase at wave 50
        const effectiveWave = Math.min(wave, 50);
        const baseSpeed = 1.5 + (effectiveWave * 0.1);
        // Cap fast enemy speed at wave 30
        const fastEffectiveWave = Math.min(wave, 30);
        const fastBaseSpeed = 1.5 + (fastEffectiveWave * 0.1);
        const baseReward = 10 + Math.floor(wave * 1.5); // Increased reward with wave progression
        
        // Wave-based multiplier for normal/fast/tank (wave 101+)
        // wave 1-100: multiplier=1, wave 101-200: multiplier=2, wave 201-300: multiplier=3, etc.
        const waveMultiplier = Math.max(1, Math.floor((wave - 1) / 100) + 1);
        
        // Rampage multiplier: wave 200,300,400... -> 2x,3x,4x...
        const rampageMultiplier = Math.max(1, Math.floor(wave / 100));
        
        // Shielder multiplier: wave 150,250,350... -> 2x,3x,4x...
        const shielderMultiplier = Math.max(1, Math.floor((wave - 50) / 100) + 1);

        if (this.type === 'fortress') {
            // Fortress Boss - appears every 50 waves in endless mode
            this.hp = baseHp * 150.0; // 10x normal boss
            this.speed = baseSpeed * 0.2; // Very slow
            this.radius = 40;
            this.color = '#880000';
            this.reward = Math.floor(baseReward * 100.0);
            this.isBoss = true;
            this.rotation = 0; // For rotation animation
        } else if (this.type === 'rampage') {
            // Rampage Enemy - appears wave 100+ in endless mode
            // wave 1-199: 1x, wave 200-299: 2x, wave 300-399: 3x, etc.
            this.hp = baseHp * 5.0 * rampageMultiplier;
            this.speed = baseSpeed; // Same speed as normal
            this.radius = 18; // Larger than normal
            this.color = '#ff6600';
            this.reward = Math.floor(baseReward * 5.0 * rampageMultiplier);
            this.pattern = Math.random(); // For pattern rendering
            // Random shape: circle(0), pentagon(5), triangle(3)
            const shapes = [0, 5, 3];
            this.rampageShape = shapes[Math.floor(Math.random() * shapes.length)];
        } else if (this.type === 'boss') {
            this.hp = baseHp * 15.0; // Very high HP
            this.speed = baseSpeed * 0.4; // Slow movement
            this.radius = 28; // Much larger
            this.color = '#ff0000';
            this.reward = Math.floor(baseReward * 30.0); // Big reward for boss
            this.isBoss = true;
        } else if (this.type === 'storm') {
            // Storm Boss - splits into 3 smaller storms when killed
            // splitLevel: 0 = original (100%), 1 = first split (75%), 2 = second split (50%), 3 = third split (25%)
            this.splitLevel = 0; // Initialize splitLevel (will be set when spawned from split)
            this.stormGroupId = ++stormGroupIdCounter; // Unique group ID for tracking storm family
            const splitMultipliers = [1.0, 0.75, 0.5, 0.25];
            const splitMultiplier = splitMultipliers[this.splitLevel] || 0.25;
            
            this.hp = baseHp * 30.0 * splitMultiplier; // 2x normal boss at full size
            this.speed = baseSpeed * 0.45; // Slightly faster than normal boss
            this.radius = 35 - (this.splitLevel * 7); // Shrinks with each split: 35, 28, 21, 14 (larger)
            this.color = '#8800ff'; // Purple color
            this.reward = Math.floor(baseReward * 30.0 * splitMultiplier);
            this.isBoss = true;
            this.canSplit = this.splitLevel < 3; // Can split up to 3 times
            this.rotation = 0; // For rotation animation
        } else if (this.type === 'fast') {
            this.hp = baseHp * 0.6 * waveMultiplier; // Apply multiplier
            this.speed = fastBaseSpeed * 1.8; // Cap at wave 30
            this.radius = 10;
            this.color = '#ffff00';
            this.reward = Math.floor(baseReward * 1.2 * waveMultiplier);
        } else if (this.type === 'tank') {
            this.hp = baseHp * 3.0 * waveMultiplier; // Apply multiplier
            this.speed = baseSpeed * 0.6;
            this.radius = 16;
            this.color = '#9900ff';
            this.reward = Math.floor(baseReward * 2.0 * waveMultiplier);
        } else if (this.type === 'shielder') {
            // wave 1-149: 1x, wave 150-249: 2x, wave 250-349: 3x, etc.
            this.hp = baseHp * 2.5 * shielderMultiplier;
            this.speed = baseSpeed * 0.7; // Slower than normal
            this.radius = 14;
            this.color = '#888888'; // Gray when shielded
            this.reward = Math.floor(baseReward * 2.5 * shielderMultiplier);
            // Initialize shield
            this.hasShield = true;
            this.shield = this.hp * 0.5; // Shield is 50% of HP
            this.maxShield = this.shield;
        } else if (this.type === 'decoy') {
            // Decoy - stationary, invincible (but takes damage), command-only
            this.hp = baseHp * 999; // Extremely high HP to appear invincible
            this.speed = 0; // Doesn't move
            this.radius = 15;
            this.color = '#00ffcc'; // Cyan color
            this.reward = 0; // No reward
            this.isDecoy = true; // Flag for special handling
        } else {
            this.hp = baseHp * waveMultiplier; // Apply multiplier for normal type
            this.speed = baseSpeed;
            this.radius = 12;
            this.color = '#ff3333';
            this.reward = Math.floor(baseReward * waveMultiplier);
        }

        this.maxHp = this.hp;
        
        // Store multiplier for spawn cost calculation
        if (this.type === 'normal' || this.type === 'fast' || this.type === 'tank') {
            this.spawnCost = waveMultiplier;
        } else if (this.type === 'rampage') {
            this.spawnCost = 5 * rampageMultiplier; // Base 5 slots * multiplier
        } else if (this.type === 'shielder') {
            this.spawnCost = 10 * shielderMultiplier; // Base 10 slots * multiplier
        } else {
            this.spawnCost = 1;
        }
        
        // Knockback animation properties
        this.knockbackActive = false;
        this.knockbackStartIndex = 0;
        this.knockbackTargetIndex = 0;
        this.knockbackProgress = 0;
        this.knockbackDuration = 30; // フレーム数
    }

    update() {
        if (!this.active) return;

        // Handle knockback animation
        if (this.knockbackActive) {
            this.knockbackProgress += dt;
            
            // イージング関数（最後に減速）
            const easeOutCubic = (t) => {
                return 1 - Math.pow(1 - t, 3);
            };
            
            const t = Math.min(1, this.knockbackProgress / this.knockbackDuration);
            const easedT = easeOutCubic(t);
            
            // 現在のpathIndex位置を計算（小数点付き）
            const currentFloatIndex = this.knockbackStartIndex - (this.knockbackStartIndex - this.knockbackTargetIndex) * easedT;
            const currentIndex = Math.floor(currentFloatIndex);
            const nextIndex = Math.min(currentIndex + 1, this.path.length - 1);
            const segmentProgress = currentFloatIndex - currentIndex;
            
            // 2つのポイント間を補間
            const p1 = this.path[currentIndex];
            const p2 = this.path[nextIndex];
            this.x = p1.x + (p2.x - p1.x) * segmentProgress;
            this.y = p1.y + (p2.y - p1.y) * segmentProgress;
            
            // アニメーション終了
            if (t >= 1) {
                this.knockbackActive = false;
                this.pathIndex = this.knockbackTargetIndex;
                this.x = this.path[this.pathIndex].x;
                this.y = this.path[this.pathIndex].y;
            }
            
            return; // ノックバック中は通常の移動をスキップ
        }

        // Apply burn damage
        if (this.burnDuration > 0) {
            this.burnDuration -= dt;
            if (this.burnDuration <= 0) this.burnDuration = 0;
            this.takeDamage(this.burnDamage * (dt / TARGET_FPS), null, false); // Don't show damage text here
            // Show burn damage text
            if (Math.floor(this.burnDuration) % 15 === 0) { // Show every 15 frames to avoid spam
                createDamageText(this.x, this.y - this.radius - 10, this.burnDamage, true);
            }
        }
        
        // Apply double burn damage (永続、死ぬまで継続)
        if (this.doubleBurnDamage > 0) {
            this.takeDamage(this.doubleBurnDamage * (dt / TARGET_FPS), null, false);
            this.doubleBurnTickCounter += dt;
            // Show double burn damage text
            if (Math.floor(this.doubleBurnTickCounter) % 15 === 0) { // Show every 15 frames to avoid spam
                createDamageText(this.x, this.y - this.radius - 10, this.doubleBurnDamage, true);
            }
        }

        // Update slow effect
        if (this.slowDuration > 0) {
            this.slowDuration -= dt;
            if (this.slowDuration <= 0) this.slowDuration = 0;
        }

        // Update stun effect
        if (this.stunDuration > 0) {
            this.stunDuration -= dt;
            if (this.stunDuration <= 0) this.stunDuration = 0;
            return; // Stunned enemies don't move
        }

        let target = this.path[this.pathIndex + 1];
        if (!target) return; 

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        // Calculate effective speed with slow
        let effectiveSpeed = this.speed * dt;
        if (this.slowDuration > 0) {
            effectiveSpeed *= (1 - this.slowAmount);
        }

        if (dist < effectiveSpeed) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            if (this.pathIndex >= this.path.length - 1) {
                this.reachBase();
            }
        } else {
            this.x += (dx / dist) * effectiveSpeed;
            this.y += (dy / dist) * effectiveSpeed;
        }
    }

    draw(ctx) {
        // Visual effect for stun (priority over other effects)
        if (this.stunDuration > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
        } else if (this.doubleBurnDamage > 0) {
            // Visual effect for double burn (延延焼 - より強い赤色)
            ctx.fillStyle = '#ff0000';
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#ff0000';
        } else if (this.burnDuration > 0) {
            // Visual effect for burn
            ctx.fillStyle = '#ff4400';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff4400';
        } else if (this.slowDuration > 0) {
            // Visual effect for freeze/slow - darker blue as stacks increase
            const freezeIntensity = this.freezeStacks > 0 ? this.freezeStacks / 3 : 0.5; // 0.5 for normal slow, up to 1.0 for max freeze
            const blueValue = Math.floor(170 - freezeIntensity * 100); // 170 -> 70 as stacks increase
            const lightValue = Math.floor(255 - freezeIntensity * 100); // 255 -> 155 as stacks increase
            ctx.fillStyle = `rgb(68, ${blueValue}, ${lightValue})`;
            ctx.shadowBlur = 15 + (this.freezeStacks * 5); // Stronger glow with more stacks
            ctx.shadowColor = `rgb(68, ${blueValue}, ${lightValue})`;
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        // Update rotation for fortress boss
        if (this.type === 'fortress') {
            this.rotation = (this.rotation || 0) + 0.02;
        }
        
        // Update rotation for storm boss
        if (this.type === 'storm') {
            this.rotation = (this.rotation || 0) + 0.03;
        }
        
        if (this.type === 'storm') {
            // Draw rotating diamond (square rotated 45 degrees) with hollow center and arrows
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Draw outer diamond with hollow center
            const holeSize = this.radius * 0.4;
            
            // Use path to create diamond with hole
            ctx.beginPath();
            // Outer diamond
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0);
            ctx.closePath();
            // Inner diamond (hole) - draw in reverse to create hole
            ctx.moveTo(0, -holeSize);
            ctx.lineTo(-holeSize, 0);
            ctx.lineTo(0, holeSize);
            ctx.lineTo(holeSize, 0);
            ctx.closePath();
            
            // Fill using evenodd rule to create hole
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill('evenodd');
            
            ctx.restore();
            
            // Draw floating arrows (outside rotation, like fortress arms)
            const arrowDistance = this.radius * 1.5;
            const arrowSize = this.radius * 0.6; // Increased from 0.4 to 0.6
            
            // Top arrow
            ctx.save();
            ctx.translate(this.x, this.y - arrowDistance);
            ctx.fillStyle = '#aa44ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#aa44ff';
            // Arrow pointing up (chevron/arrowhead shape)
            ctx.beginPath();
            ctx.moveTo(0, -arrowSize * 0.6); // Tip
            ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.4); // Left base
            ctx.lineTo(-arrowSize * 0.2, arrowSize * 0.4); // Left inner
            ctx.lineTo(0, 0); // Center
            ctx.lineTo(arrowSize * 0.2, arrowSize * 0.4); // Right inner
            ctx.lineTo(arrowSize * 0.5, arrowSize * 0.4); // Right base
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            
            // Bottom arrow
            ctx.save();
            ctx.translate(this.x, this.y + arrowDistance);
            ctx.fillStyle = '#aa44ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#aa44ff';
            // Arrow pointing down
            ctx.beginPath();
            ctx.moveTo(0, arrowSize * 0.6); // Tip
            ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.4); // Left base
            ctx.lineTo(-arrowSize * 0.2, -arrowSize * 0.4); // Left inner
            ctx.lineTo(0, 0); // Center
            ctx.lineTo(arrowSize * 0.2, -arrowSize * 0.4); // Right inner
            ctx.lineTo(arrowSize * 0.5, -arrowSize * 0.4); // Right base
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (this.type === 'fortress') {
            // Draw rotating hexagon with 3 protruding arms
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Draw hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const x = Math.cos(angle) * this.radius * 0.6;
                const y = Math.sin(angle) * this.radius * 0.6;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // 3 protruding arms (every other side)
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI / 3) * (i * 2);
                const armLength = this.radius;
                const armWidth = this.radius * 0.4;
                
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.rect(-armWidth / 2, this.radius * 0.6, armWidth, armLength - this.radius * 0.6);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, armLength, armWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            ctx.restore();
            
            // Reset shadow and fill style after fortress drawing
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        } else if (this.type === 'rampage') {
            // Draw base shape based on rampageShape
            if (this.rampageShape === 0) {
                // Circle
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.rampageShape === 5) {
                // Pentagon
                drawRegularPolygon(ctx, this.x, this.y, 5, this.radius);
            } else if (this.rampageShape === 3) {
                // Triangle
                drawRegularPolygon(ctx, this.x, this.y, 3, this.radius);
            }
            
            // Add pattern (stripes or spots) on top
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            const patternCount = 6;
            for (let i = 0; i < patternCount; i++) {
                const angle = (Math.PI * 2 / patternCount) * i + this.pattern * Math.PI * 2;
                const x = this.x + Math.cos(angle) * this.radius * 0.5;
                const y = this.y + Math.sin(angle) * this.radius * 0.5;
                ctx.beginPath();
                ctx.arc(x, y, this.radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'boss') {
            drawRegularPolygon(ctx, this.x, this.y, 8, this.radius);
        } else if (this.type === 'fast') {
            drawRegularPolygon(ctx, this.x, this.y, 3, this.radius);
        } else if (this.type === 'tank') {
            drawRegularPolygon(ctx, this.x, this.y, 5, this.radius);
        } else if (this.type === 'shielder') {
            // Update color based on shield status
            if (this.hasShield && this.shield > 0) {
                ctx.fillStyle = '#888888'; // Gray with shield
                this.color = '#888888';
            } else {
                ctx.fillStyle = '#00ff00'; // Green without shield
                this.color = '#00ff00';
            }
            drawRegularPolygon(ctx, this.x, this.y, 6, this.radius); // Hexagon
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;

        // Draw freeze stacks indicator
        if (this.freezeStacks > 0) {
            for (let i = 0; i < this.freezeStacks; i++) {
                ctx.fillStyle = '#00aaff';
                ctx.beginPath();
                ctx.arc(this.x - 10 + i * 10, this.y - this.radius - 18, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw laceration stacks indicator
        if (this.lacerationStacks > 0) {
            for (let i = 0; i < this.lacerationStacks; i++) {
                ctx.fillStyle = '#ff00aa';
                ctx.beginPath();
                ctx.arc(this.x - 10 + i * 10, this.y - this.radius - 28, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Don't draw HP bar for boss here (drawn at top of screen)
        // Only show HP bar if enemy has taken damage or has shield
        if (!this.isBoss && (this.hp < this.maxHp || this.hasShield)) {
            const hpPct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 12, this.y - this.radius - 8, 24, 4);
            ctx.fillStyle = this.getHpColor(hpPct);
            ctx.fillRect(this.x - 12, this.y - this.radius - 8, 24 * hpPct, 4);
            
            // Draw shield gauge on top of HP bar (semi-transparent white)
            if (this.hasShield && this.maxShield > 0) {
                const shieldPct = Math.max(0, this.shield / this.maxShield);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent white
                ctx.fillRect(this.x - 12, this.y - this.radius - 8, 24 * shieldPct, 4);
            }
            
            // Collect active debuff icons
            const debuffIcons = [];
            if (this.doubleBurnDamage > 0) debuffIcons.push({ emoji: '🔥🔥', color: '#ff0000' }); // 延延焼
            else if (this.burnDuration > 0) debuffIcons.push({ emoji: '🔥', color: '#ff4400' }); // 通常の延焼
            if (this.slowDuration > 0) debuffIcons.push({ emoji: '❄', color: '#44aaff' });
            if (this.stunDuration > 0) debuffIcons.push({ emoji: '⚡', color: '#ffff00' });
            
            // Draw debuff icons centered above HP bar
            if (debuffIcons.length > 0) {
                const iconSpacing = 14;
                const totalWidth = debuffIcons.length * iconSpacing - 4;
                let iconX = this.x - totalWidth / 2;
                
                ctx.font = 'bold 12px Arial';
                ctx.textBaseline = 'bottom';
                
                debuffIcons.forEach(icon => {
                    ctx.fillStyle = icon.color;
                    ctx.textAlign = 'center';
                    ctx.fillText(icon.emoji, iconX, this.y - this.radius - 10);
                    iconX += iconSpacing;
                });
            }
        }
    }

    getHpColor(pct) {
        if (pct > 0.6) return '#0f0';
        if (pct > 0.3) return '#ff0';
        return '#f00';
    }

    takeDamage(amt, sourceSpecial = null, showDamageText = true, isCrit = false, hasLaceration = false) {
        let actualDamage = amt;
        let shieldDamage = 0;
        let hpDamage = 0;
        
        // Check if enemy is frozen/slowed (for frost damage display)
        const isFrostDamage = (this.slowDuration > 0 || this.freezeStacks > 0) && getCommanderBonus('slow_bonus_damage') > 1;
        
        // Shielder logic
        if (this.hasShield && this.shield > 0) {
            // Shield is active - reduce damage
            let damageReduction = 3; // Normal: damage / 3
            
            // Laceration bypasses some shield and damages HP
            if (this.lacerationStacks > 0) {
                damageReduction = 4; // Laceration: damage / 4 to shield
                hpDamage = amt * 0.1; // 10% of damage to HP
                this.hp -= hpDamage;
                
                // Show HP damage (red)
                if (showDamageText) {
                    createDamageText(this.x, this.y - this.radius - 15, Math.floor(hpDamage), false, false, false, '#ff0000', false);
                }
            }
            
            shieldDamage = amt / damageReduction;
            this.shield -= shieldDamage;
            
            // Shield broken
            if (this.shield <= 0) {
                this.shield = 0;
                this.hasShield = false;
                // Visual feedback
                createExplosion(this.x, this.y, '#ffffff', 15);
            }
            
            // Show shield damage (gray) - use crit/laceration/frost effects if applicable
            if (showDamageText) {
                createDamageText(this.x, this.y - this.radius - 10, Math.floor(shieldDamage), false, isCrit, hasLaceration, '#888888', isFrostDamage);
            }
        } else {
            // No shield - take full damage
            this.hp -= amt;
            hpDamage = amt;
            
            // Show normal damage text with frost effect if applicable
            if (showDamageText) {
                createDamageText(this.x, this.y - this.radius - 10, Math.floor(amt), false, isCrit, hasLaceration, null, isFrostDamage);
            }
        }
        
        // Decoy never dies
        if (this.type === 'decoy') {
            return;
        }
        
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        const creditBonus = getSkillBonus('enemy_credits');
        money += Math.floor(this.reward * creditBonus);
        
        // Storm boss splits into 3 smaller storms
        if (this.type === 'storm' && this.canSplit) {
            const splitLevel = this.splitLevel + 1;
            
            // Calculate parent's current HP percentage
            const parentHpPercentage = this.hp / this.maxHp;
            
            // Create 3 smaller storms at current position
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 / 3) * i;
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;
                
                // Create new storm enemy
                const newStorm = new Enemy(this.path, 'storm');
                newStorm.splitLevel = splitLevel; // Set split level BEFORE hp calculation
                newStorm.stormGroupId = this.stormGroupId; // Inherit group ID
                
                // Recalculate stats based on splitLevel
                const baseHp = 30 + (wave * 15);
                const baseReward = 10 + Math.floor(wave * 1.5);
                const splitMultipliers = [1.0, 0.75, 0.5, 0.25];
                const splitMultiplier = splitMultipliers[splitLevel] || 0.25;
                
                const maxHpForSplit = baseHp * 30.0 * splitMultiplier;
                newStorm.maxHp = maxHpForSplit;
                newStorm.hp = maxHpForSplit * parentHpPercentage; // Apply parent's HP percentage
                newStorm.radius = 35 - (splitLevel * 7);
                newStorm.reward = Math.floor(baseReward * 30.0 * splitMultiplier);
                newStorm.canSplit = splitLevel < 3;
                
                // Set position slightly offset from death location
                const currentPathIndex = this.pathIndex;
                if (currentPathIndex < this.path.length) {
                    newStorm.pathIndex = currentPathIndex;
                    newStorm.x = this.x + offsetX;
                    newStorm.y = this.y + offsetY;
                }
                
                // Inherit some debuffs
                newStorm.slowDuration = this.slowDuration * 0.5;
                newStorm.slowAmount = this.slowAmount;
                newStorm.burnDuration = this.burnDuration * 0.5;
                newStorm.burnDamage = this.burnDamage;
                
                enemies.push(newStorm);
                totalWaveEnemies++;
            }
            
            // Purple particle effect for split (more visible)
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(this.x, this.y, '#cc44ff')); // Brighter purple
            }
            createExplosion(this.x, this.y, '#8800ff', 40);
            playSound('explosion');
            
            // Add normal score for split storms
            if (endlessMode) {
                endlessScore += 100; // Normal enemy score
            }
            
            // Skip normal die() processing for splitting storms
            updateUI();
            return;
        } else if (this.type === 'storm' && !this.canSplit) {
            // Count this kill for the storm group
            const currentCount = (stormGroupKillCount.get(this.stormGroupId) || 0) + 1;
            stormGroupKillCount.set(this.stormGroupId, currentCount);
            
            if (currentCount === 27) {
                // 27th smallest storm defeated - show boss explosion animation and heal
                playSound('boss_death');
                
                // Heal lives for 27th storm defeat
                lives += 5;
                createDamageText(this.x, this.y - this.radius - 20, '+5 LIVES');
                
                // Create massive multi-colored explosion (same as boss)
                createExplosion(this.x, this.y, '#8800ff', 100);
                createExplosion(this.x, this.y, '#aa44ff', 80);
                createExplosion(this.x, this.y, '#cc44ff', 60);
                createExplosion(this.x, this.y, '#ee66ff', 40);
                createExplosion(this.x, this.y, '#ffffff', 50);
                // Create elliptical shockwaves
                createEllipticalWaves(this.x, this.y);
                
                // Add bonus score for completing the group
                if (endlessMode) {
                    endlessScore += 1000; // Same as boss
                }
                
                // Clean up the counter for this group
                stormGroupKillCount.delete(this.stormGroupId);
            } else {
                // Not the 27th storm - just normal death effect
                createExplosion(this.x, this.y, this.color);
                playSound('enemyDestroy');
                
                // Add normal score
                if (endlessMode) {
                    endlessScore += 100; // Normal enemy score
                }
            }
            
            // Skip normal die() processing for all storms
            updateUI();
            return;
        }
        
        // Add to endless score (skip for storm - already handled above)
        if (endlessMode && this.type !== 'storm') {
            if (this.type === 'fortress') {
                endlessScore += 10000;
            } else if (this.type === 'boss') {
                endlessScore += 1000;
            } else if (this.type === 'rampage') {
                endlessScore += 500;
            } else {
                endlessScore += 100;
            }
            updateUI();
        }
        
        // Drop electronic chip (disabled in endless mode)
        if (!endlessMode) {
            const dropRate = CHIP_DROP_RATE + getSkillBonus('chip_rate');
            if (Math.random() < dropRate) {
                tempChipsThisGame++;
                updateUI();
            }
        }
        
        // Play enemy destroy sound
        playSound('enemyDestroy');
        
        // Boss defeated - heal 5 lives (but not for splitting storms)
        if (this.isBoss && !(this.type === 'storm' && this.canSplit)) {
            lives += 5;
            // Create massive multi-colored explosion
            createExplosion(this.x, this.y, '#ff0000', 100);
            createExplosion(this.x, this.y, '#ff6600', 80);
            createExplosion(this.x, this.y, '#ffff00', 60);
            createExplosion(this.x, this.y, '#00ff00', 40);
            createExplosion(this.x, this.y, '#ffffff', 50);
            // Create elliptical shockwaves
            createEllipticalWaves(this.x, this.y);
            // Show heal text
            createDamageText(this.x, this.y - this.radius - 20, '+5 LIVES');
        } else if (!(this.type === 'storm')) {
            createExplosion(this.x, this.y, this.color);
        }
        
        // Chain burn explosion if burning
        if (this.burnDuration > 0 && this.chainBurn) {
            const burnRadius = 70;
            for (let e of enemies) {
                if (!e.active || e === this) continue;
                let dx = e.x - this.x;
                let dy = e.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist <= burnRadius) {
                    e.burnDamage = this.burnDamage;
                    e.burnDuration = 60;
                    e.chainBurn = true;
                    createExplosion(e.x, e.y, '#ff4400', 5);
                }
            }
            createExplosion(this.x, this.y, '#ff4400', 25);
        }
        
        updateUI();
    }

    reachBase() {
        this.active = false;
        if (!debugMode) {
            lives--;
        }
        createExplosion(this.x, this.y, '#ffffff');
        
        // Screen shake and red flash when taking damage
        screenShakeDuration = 10; // frames
        screenShakeIntensity = 6;
        damageFlashAlpha = 0.2; // Start with 40% opacity
        
        updateUI();
        if (lives === 0) {
            // Base explosion when life reaches exactly 0 (only trigger once)
            const basePos = path[path.length - 1];
            if (basePos) {
                // Hide the base
                baseDestroyed = true;
                
                // Create massive multi-colored explosion at base
                createExplosion(basePos.x, basePos.y, '#ff0000', 120);
                createExplosion(basePos.x, basePos.y, '#ff6600', 100);
                createExplosion(basePos.x, basePos.y, '#ffaa00', 80);
                createExplosion(basePos.x, basePos.y, '#ffffff', 60);
                
                // Create elliptical waves (like boss death)
                createEllipticalWaves(basePos.x, basePos.y);
                
                // Intense screen shake
                screenShakeDuration = 30;
                screenShakeIntensity = 15;
                damageFlashAlpha = 0.6;
            }
            // Delay game over screen to let explosion play
            setTimeout(() => gameOver(), 1000);
        }
    }
}

function drawRegularPolygon(ctx, x, y, sides, radius) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        this.evolved = false;
        this.baseTypeOriginal = TOWER_TYPES[type].baseType || type;
        
        // Base Stats
        const base = TOWER_TYPES[type];
        this.baseDamage = base.damage;
        this.baseRange = base.range;
        this.baseCooldown = base.cooldown;
        this.baseCost = base.cost;
        this.color = base.color;
        this.name = base.name;
        this.special = base.special;

        // Current Stats (Level 1)
        this.damage = this.baseDamage;
        this.range = this.baseRange;
        this.cooldown = this.baseCooldown;

        this.lastShot = 0;
        this.angle = 0;
        this.placedMines = []; // Sweeperタワーが設置した地雷を追跡
        
        // Sol-Blaster specific properties
        if (this.type === 'sol-blaster') {
            this.flareTimer = 0; // フレア発射タイマー
            this.flareInterval = 180; // フレア発射間隔（約3秒）
            this.flareCount = 8; // 一度に発射するフレアの数
            this.expandingCircles = []; // 広がる円アニメーション
        }
        
        // Gear specific properties
        this.chainCount = 0; // 連鎖数
        this.rotationAngle = 0; // 歯車の回転角度
        this.rotationSpeed = 0; // 回転速度
        this.rotationDirection = 1; // 回転方向（1: 正回転, -1: 逆回転）
        
        // Gear-Third overclock/overheat system
        if (this.type === 'gear-third') {
            this.overclockGauge = 0; // 0-100
            this.overclockActive = false;
            this.overclockDuration = 0;
            this.overheatActive = false;
            this.overheatDuration = 0;
        }
    }

    getUpgradeCost() {
        // Cost increases with level
        const baseCost = Math.floor(this.baseCost * (0.8 + (this.level * 0.5)));
        // Apply Eiko's passive bonus
        const commanderBonus = getCommanderBonus('upgrade_cost');
        return Math.floor(baseCost * commanderBonus);
    }

    getSellPrice() {
        // Sell for 70% of total invested (rough approximation)
        let totalInvested = this.baseCost;
        for(let i=1; i<this.level; i++) {
            totalInvested += Math.floor(this.baseCost * (0.8 + (i * 0.5)));
        }
        return Math.floor(totalInvested * 0.7);
    }

    getNextStats() {
        // Range capped at level 10, then skill bonus applied
        const nextRangeLevelCap = Math.min(this.level + 1, 10);
        const rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        const damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
        
        let nextDamage = Math.floor(this.baseDamage * (1 + (this.level + 1) * 0.5) * damageBonus);
        
        // Gearタワーの場合、連鎖ボーナスを適用
        if (this.type === 'gear' || this.type === 'gear-second' || this.type === 'gear-third') {
            const chainDamageBonus = this.type === 'gear-third' ? 0.5 : (this.type === 'gear-second' ? 0.4 : 0.3);
            nextDamage = Math.floor(this.baseDamage * (1 + (this.level + 1) * 0.5) * damageBonus * (1 + this.chainCount * chainDamageBonus));
        }
        
        return {
            damage: nextDamage,
            range: Math.floor(this.baseRange * (1 + nextRangeLevelCap * 0.15) * rangeBonus)
        };
    }
    
    updateChainCount() {
        // Gearタワーの回転方向を決定（連鎖数はcalculateGearChainGroups()で計算済み）
        if (this.type !== 'gear' && this.type !== 'gear-second' && this.type !== 'gear-third') return;
        
        const minChainDist = 25;
        const maxChainDist = 45;
        
        // 最も近い連鎖相手を見つける（回転方向決定のため）
        let nearestChainedGear = null;
        let nearestDist = Infinity;
        
        for (let other of towers) {
            if (other === this || (other.type !== 'gear' && other.type !== 'gear-second' && other.type !== 'gear-third')) continue;
            
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist >= minChainDist && dist <= maxChainDist) {
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestChainedGear = other;
                }
            }
        }
        
        // 回転方向を決定：最も近い連鎖相手と逆回転
        if (nearestChainedGear) {
            this.rotationDirection = -nearestChainedGear.rotationDirection;
        } else {
            // 連鎖がない場合は正回転
            this.rotationDirection = 1;
        }
    }

    upgrade() {
        this.level++;
        // Calculate new stats
        // Damage: +50% per level base
        let damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
        this.damage = Math.floor(this.baseDamage * (1 + this.level * 0.5) * damageBonus);
        // Range: +15% per level base (capped at level 10, then skill bonus applied)
        const rangeLevelCap = Math.min(this.level, 10); // Cap at level 10
        let rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        this.range = Math.floor(this.baseRange * (1 + rangeLevelCap * 0.15) * rangeBonus);
        // Cooldown: -5% per level (capped at 50%)
        let cdReduc = Math.min(0.5, this.level * 0.05);
        this.cooldown = this.baseCooldown * (1 - cdReduc);
        
        // Gearタワーの場合、レベルアップ時に連鎖判定を更新してから連鎖ボーナスを適用
        if (this.type === 'gear' || this.type === 'gear-second' || this.type === 'gear-third') {
            calculateGearChainGroups();
            // 連鎖ボーナスを適用
            const chainDamageBonus = this.type === 'gear-third' ? 0.5 : (this.type === 'gear-second' ? 0.4 : 0.3);
            this.damage = Math.floor(this.baseDamage * (1 + this.level * 0.5) * damageBonus * (1 + this.chainCount * chainDamageBonus));
            
            const cooldownReduction = Math.min(this.chainCount * 0.1, 0.6);
            this.cooldown = this.baseCooldown * (1 - cdReduc) * (1 - cooldownReduction);
        }
        
        createExplosion(this.x, this.y, '#00ff00', 15);
    }

    canEvolve() {
        const currentType = TOWER_TYPES[this.type];
        
        // Rod tower special evolution levels (5, 15, 25, 70)
        if (this.baseTypeOriginal === 'rod') {
            // First evolution at level 5 (rod -> lightning-rod/warp-rod/necromancer)
            if (this.level >= 5 && !this.evolved && !currentType.isEvolution) {
                return true;
            }
            // Second evolution at level 15 (lightning-rod -> lightning-rod-ii)
            if (this.level >= 15 && this.evolved && !currentType.isSecondEvolution && currentType.isEvolution) {
                return true;
            }
            // Third evolution at level 25 (lightning-rod-ii -> lightning-spark/burn-lightning)
            if (this.level >= 25 && currentType.isSecondEvolution && !currentType.isThirdEvolution) {
                return true;
            }
            // Fourth evolution at level 70 (lightning-spark -> chain-spark)
            if (this.level >= 70 && currentType.isThirdEvolution && !currentType.isFourthEvolution) {
                return true;
            }
        }
        // Gear tower special evolution levels (10, 100)
        else if (this.baseTypeOriginal === 'gear') {
            // First evolution at level 10 (gear -> gear-second)
            if (this.level >= 10 && !this.evolved && !currentType.isEvolution) {
                return true;
            }
            // Second evolution at level 100 (gear-second -> gear-third)
            if (this.level >= 100 && currentType.isEvolution && !currentType.isSecondEvolution) {
                return true;
            }
        } else {
            // Standard tower evolution levels (10, 25, 70, 200)
            // First evolution at level 10
            if (this.level >= 10 && !this.evolved && !currentType.isEvolution) {
                return true;
            }
            // Second evolution at level 25
            if (this.level >= 25 && this.evolved && !currentType.isSecondEvolution) {
                return true;
            }
            // Third evolution at level 70
            if (this.level >= 70 && currentType.isSecondEvolution && !currentType.isThirdEvolution) {
                return true;
            }
            // Fourth evolution at level 200
            if (this.level >= 200 && currentType.isThirdEvolution && !currentType.isFourthEvolution) {
                return true;
            }
        }
        return false;
    }

    getEvolutionOptions() {
        const currentType = TOWER_TYPES[this.type];
        const options = [];
        
        // First evolution
        if (!currentType.isEvolution) {
            const baseType = this.baseTypeOriginal;
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isEvolution && !towerDef.isSecondEvolution && !towerDef.isThirdEvolution && !towerDef.isFourthEvolution && towerDef.baseType === baseType) {
                    // Check if required skill is unlocked (if any)
                    if (towerDef.requiredSkill) {
                        if (unlockedSkills.includes(towerDef.requiredSkill)) {
                            options.push({
                                key: key,
                                name: towerDef.name,
                                special: towerDef.special || 'none'
                            });
                        }
                    } else {
                        // No skill requirement, always available
                        options.push({
                            key: key,
                            name: towerDef.name,
                            special: towerDef.special || 'none'
                        });
                    }
                }
            }
        }
        // Second evolution
        else if (currentType.isEvolution && !currentType.isSecondEvolution) {
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isSecondEvolution && !towerDef.isThirdEvolution && !towerDef.isFourthEvolution && towerDef.evolvesFrom === this.type) {
                    options.push({
                        key: key,
                        name: towerDef.name,
                        special: towerDef.special || 'none'
                    });
                }
            }
        }
        // Third evolution
        else if (currentType.isSecondEvolution && !currentType.isThirdEvolution) {
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isThirdEvolution && !towerDef.isFourthEvolution && towerDef.evolvesFrom === this.type) {
                    // Check if required skill is unlocked (if any)
                    if (towerDef.requiredSkill) {
                        if (unlockedSkills.includes(towerDef.requiredSkill)) {
                            options.push({
                                key: key,
                                name: towerDef.name,
                                special: towerDef.special || 'none'
                            });
                        }
                    } else {
                        // No skill requirement, always available
                        options.push({
                            key: key,
                            name: towerDef.name,
                            special: towerDef.special || 'none'
                        });
                    }
                }
            }
        }
        // Fourth evolution
        else if (currentType.isThirdEvolution && !currentType.isFourthEvolution) {
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isFourthEvolution && towerDef.evolvesFrom === this.type) {
                    // Check if required skill is unlocked (if any)
                    if (towerDef.requiredSkill) {
                        if (unlockedSkills.includes(towerDef.requiredSkill)) {
                            options.push({
                                key: key,
                                name: towerDef.name,
                                special: towerDef.special || 'none'
                            });
                        }
                    } else {
                        // No skill requirement, always available
                        options.push({
                            key: key,
                            name: towerDef.name,
                            special: towerDef.special || 'none'
                        });
                    }
                }
            }
        }
        
        return options;
    }

    evolve(evolutionType) {
        const newDef = TOWER_TYPES[evolutionType];
        if (!newDef || !newDef.isEvolution) return;
        
        this.type = evolutionType;
        this.evolved = true;
        this.baseDamage = newDef.damage;
        this.baseRange = newDef.range;
        this.baseCooldown = newDef.cooldown;
        this.color = newDef.color;
        this.name = newDef.name;
        this.special = newDef.special;
        
        // Initialize Gear-Third overclock system when evolving to gear-third
        if (this.type === 'gear-third' && !this.overclockGauge) {
            this.overclockGauge = 0;
            this.overclockActive = false;
            this.overclockDuration = 0;
            this.overheatActive = false;
            this.overheatDuration = 0;
        }
        
        // Initialize Sol-Blaster flare system when evolving to sol-blaster
        if (this.type === 'sol-blaster' && !this.flareTimer) {
            this.flareTimer = 0;
            this.flareInterval = 180;
            this.flareCount = 8;
            this.expandingCircles = [];
        }
        
        // Recalculate stats at current level with skill bonuses
        let damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
        this.damage = Math.floor(this.baseDamage * (1 + this.level * 0.5) * damageBonus);
        // Range: capped at level 10, then skill bonus applied
        const rangeLevelCap = Math.min(this.level, 10);
        let rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        this.range = Math.floor(this.baseRange * (1 + rangeLevelCap * 0.15) * rangeBonus);
        let cdReduc = Math.min(0.5, this.level * 0.05);
        this.cooldown = this.baseCooldown * (1 - cdReduc);
        
        createExplosion(this.x, this.y, this.color, 30);
    }

    update(time, attackSpeedBonus = 1) {
        // Sol-Blaster: 広がる円の発射機能
        if (this.type === 'sol-blaster') {
            this.flareTimer += attackSpeedBonus; // Apply attack speed bonus
            if (this.flareTimer >= this.flareInterval) {
                this.flareTimer = 0;
                
                // 広がる円アニメーションを追加
                this.expandingCircles.push({
                    radius: 0,
                    opacity: 1,
                    maxRadius: 300,
                    x: this.x,
                    y: this.y,
                    damage: this.damage * 0.7,
                    hitEnemies: new Set() // 既にダメージを与えた敵を追跡
                });
                
                // エフェクト
                createExplosion(this.x, this.y, '#ffaa00', 20);
            }
            
            // 広がる円の更新と当たり判定
            this.expandingCircles = this.expandingCircles.filter(circle => {
                circle.radius += 0.67; // 6倍遅く
                circle.opacity -= 0.005; // opacityの減少も遅く（約10秒で消える）
                
                // 円と敵の当たり判定
                for (let enemy of enemies) {
                    if (!enemy.active || circle.hitEnemies.has(enemy)) continue;
                    
                    const dx = circle.x - enemy.x;
                    const dy = circle.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // 円の縁に当たったかチェック（円の半径付近）
                    const thickness = 15; // 円の当たり判定の厚さ
                    if (Math.abs(dist - circle.radius) < thickness) {
                        // ダメージを適用
                        const burnBonus = getSkillBonus('burn_damage');
                        const finalDamage = Math.floor(circle.damage * burnBonus);
                        enemy.takeDamage(finalDamage, 'burn', true);
                        
                        // 延延焼効果を適用（死ぬまで継続、延焼より高い継続ダメージ）
                        if (enemy.doubleBurnDamage === 0) {
                            enemy.doubleBurnDamage = Math.floor(finalDamage * 0.5 * burnBonus); // 延焼の0.3から0.5に増加
                        } else {
                            // 既に延延焼状態の場合、ダメージを更新（より高い方を採用）
                            enemy.doubleBurnDamage = Math.max(enemy.doubleBurnDamage, Math.floor(finalDamage * 0.5 * burnBonus));
                        }
                        
                        // エフェクト
                        createExplosion(enemy.x, enemy.y, '#ff0000', 12); // より大きく、より赤く
                        
                        // この敵に既にダメージを与えたことを記録
                        circle.hitEnemies.add(enemy);
                    }
                }
                
                return circle.opacity > 0 && circle.radius < circle.maxRadius;
            });
        }
        
        // Gear-Third overclock/overheat management
        if (this.type === 'gear-third') {
            // Overclock countdown
            if (this.overclockActive) {
                this.overclockDuration--;
                if (this.overclockDuration <= 0) {
                    this.overclockActive = false;
                    this.overheatActive = true;
                    this.overheatDuration = 300; // 5 seconds overheat
                }
            }
            
            // Overheat countdown
            if (this.overheatActive) {
                this.overheatDuration--;
                if (this.overheatDuration <= 0) {
                    this.overheatActive = false;
                    // Reset gauge when overheat ends
                    this.overclockGauge = 0;
                }
            }
        }
        
        // Gear specific: apply chain bonuses before targeting
        if (this.type === 'gear' || this.type === 'gear-second' || this.type === 'gear-third') {
            this.updateChainCount();
            // 連鎖数に応じてダメージと攻撃速度を増加
            const damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
            const rangeLevelCap = Math.min(this.level, 10);
            const rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
            
            // gear-third: 0.5, gear-second: 0.4, gear: 0.3
            const chainDamageBonus = this.type === 'gear-third' ? 0.5 : (this.type === 'gear-second' ? 0.4 : 0.3);
            let baseDamageMultiplier = 1 + this.level * 0.5;
            
            // Overclock: 2x damage
            if (this.type === 'gear-third' && this.overclockActive) {
                baseDamageMultiplier *= 2;
            }
            
            this.damage = Math.floor(this.baseDamage * baseDamageMultiplier * damageBonus * (1 + this.chainCount * chainDamageBonus));
            this.range = Math.floor(this.baseRange * (1 + rangeLevelCap * 0.15) * rangeBonus);
            
            const cooldownReduction = Math.min(this.chainCount * 0.1, 0.6); // 最大60%短縮
            let cdReduc = Math.min(0.5, this.level * 0.05);
            this.cooldown = this.baseCooldown * (1 - cdReduc) * (1 - cooldownReduction);
            
            // Gear-Third: Overclock 6x attack speed, Overheat 0.5x attack speed
            if (this.type === 'gear-third') {
                if (this.overclockActive) {
                    this.cooldown *= 1/6; // 6x speed
                } else if (this.overheatActive) {
                    this.cooldown *= 2; // 0.5x speed
                }
            }
            
            // 連鎖がない場合は攻撃しない
            if (this.chainCount === 0) return;
        }
        
        // Apply attack speed bonus to cooldown
        const effectiveCooldown = this.cooldown / attackSpeedBonus;
        if (time - this.lastShot < effectiveCooldown) return;

        let target = null;
        let minDist = Infinity;

        for (let e of enemies) {
            if (!e.active) continue;
            let dx = e.x - this.x;
            let dy = e.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= this.range && dist < minDist) {
                minDist = dist;
                target = e;
            }
        }

        if (target) {
            this.shoot(target);
            this.lastShot = time;
            // Rod towers and Sweeper (all evolutions) always face up (angle = 0)
            const rodTypes = ['rod', 'lightning-rod', 'warp-rod', 'necromancer', 'lightning-rod-ii', 'lightning-spark', 'chain-spark', 'burn-lightning'];
            const sweeperTypes = ['sweeper', 'big-sweeper', 'spike-sweeper', 'incendiary-sweeper'];
            if (!rodTypes.includes(this.type) && !sweeperTypes.includes(this.type)) {
                this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            }
        }
    }

    shoot(target) {
        // Gear-Third overclock gauge increase flag (increased when projectile hits)
        this.lastShotForGauge = true;
        
        // Mine layer for Sweeper and its evolutions
        if (this.special === 'mine-layer' || this.special === 'big-mine-layer' || this.special === 'spike-mine-layer' || this.special === 'incendiary-mine-layer') {
            // 敵の進路上のランダムな位置に地雷を設置（射程範囲内）
            const maxAttempts = 50; // 無限ループ防止
            let attempt = 0;
            let mineX, mineY;
            let validPosition = false;
            
            while (attempt < maxAttempts && !validPosition) {
                const pathSegments = path.length - 1;
                const randomSegment = Math.floor(Math.random() * pathSegments);
                const point1 = path[randomSegment];
                const point2 = path[randomSegment + 1];
                
                // セグメント上のランダムな位置
                const t = Math.random();
                mineX = point1.x + (point2.x - point1.x) * t;
                mineY = point1.y + (point2.y - point1.y) * t;
                
                // タワーからの距離をチェック
                const dx = mineX - this.x;
                const dy = mineY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.range) {
                    validPosition = true;
                }
                attempt++;
            }
            
            // 有効な位置が見つかった場合のみ地雷を設置
            if (validPosition) {
                // 特殊タイプを決定
                let specialType = null;
                if (this.special === 'big-mine-layer') specialType = 'big';
                else if (this.special === 'spike-mine-layer') specialType = 'spike';
                else if (this.special === 'incendiary-mine-layer') specialType = 'incendiary';
                
                const mine = new Mine(mineX, mineY, this.damage, this, specialType);
                mines.push(mine);
                this.placedMines.push(mine);
                
                // 50個を超えたら古いものを削除
                if (this.placedMines.length > 50) {
                    const oldMine = this.placedMines.shift(); // 最も古い地雷を取り除く
                    if (oldMine) {
                        oldMine.active = false;
                    }
                }
            }
            return;
        }
        
        // Lightning strike for rod towers
        if (this.special === 'lightning' || this.special === 'lightning-zone' || this.special === 'burn-lightning' || this.special === 'chain-lightning' || this.special === 'warp' || this.special === 'necromancy') {
            lightningStrikes.push(new LightningStrike(this.x, this.y, target, this.damage, this.special));
        } else if (this.special === 'spread') {
            // Shoot 5 projectiles in spread pattern
            for (let i = 0; i < 5; i++) {
                const angle = -0.4 + (i * 0.2);
                projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special, angle, this));
            }
        } else if (this.special === 'super-spread') {
            // Shoot 7 projectiles in spread pattern (Flugrl-TURRET)
            for (let i = 0; i < 7; i++) {
                const angle = -0.6 + (i * 0.2);
                projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special, angle, this));
            }
        } else if (this.special === 'machine-gun') {
            // Machine-TURRET: 高速連射（通常の発射物）
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, null, 0, this));
        } else if (this.special === 'splash' || this.special === 'giga-splash' || this.special === 'knockback-splash' || this.special === 'peta-splash') {
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special, 0, this));
        } else if (this.special === 'solar-flare') {
            // Sol-Blaster: 通常の発射物 + mega-chain-burn効果
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, 'mega-chain-burn', 0, this));
        } else {
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special, 0, this));
        }
    }

    draw(ctx, isSelected) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Draw Range if selected
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Selection ring
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Base
        ctx.fillStyle = '#222';
        ctx.fillRect(-15, -15, 30, 30);
        
        // Turret body
        ctx.rotate(this.angle);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Scale slightly with level (cap at level 10, or level 5 for gear)
        const maxScaleLevel = (this.type === 'gear' || this.type === 'gear-second' || this.type === 'gear-third') ? 5 : 10;
        const effectiveLevel = Math.min(this.level, maxScaleLevel);
        const scale = 1 + (effectiveLevel - 1) * 0.1;
        ctx.scale(scale, scale);

        if (this.type === 'turret' || this.type === 'dual-turret' || this.type === 'big-turret' || this.type === 'quadruple-turret' || this.type === 'machine-turret' || this.type === 'bugle-turret' || this.type === 'flugrl-turret' || this.type === 'giga-turret' || this.type === 'auger-turret' || this.type === 'peta-turret') {
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            
            if (this.type === 'dual-turret') {
                // Draw dual barrels
                ctx.fillRect(0, -6, 22, 5);
                ctx.fillRect(0, 1, 22, 5);
            } else if (this.type === 'quadruple-turret') {
                // Draw quad barrels
                ctx.fillRect(0, -8, 24, 4);
                ctx.fillRect(0, -3, 24, 4);
                ctx.fillRect(0, 2, 24, 4);
                ctx.fillRect(0, 7, 24, 4);
            } else if (this.type === 'machine-turret') {
                // Draw machine gun barrels (6 barrels) - centered
                ctx.fillRect(0, -8, 26, 3);
                ctx.fillRect(0, -4, 26, 3);
                ctx.fillRect(0, 0, 26, 3);
                ctx.fillRect(0, 4, 26, 3);
                ctx.fillRect(0, 8, 26, 3);
                ctx.fillRect(0, -12, 26, 3);
            } else if (this.type === 'bugle-turret') {
                // Draw wide spread barrel
                ctx.fillRect(0, -9, 26, 18);
                ctx.fillRect(20, -12, 6, 24);
            } else if (this.type === 'flugrl-turret') {
                // Draw wider spread barrel
                ctx.fillRect(0, -12, 28, 24);
                ctx.fillRect(22, -15, 8, 30);
            } else if (this.type === 'big-turret') {
                // Draw big cannon barrel
                ctx.fillRect(0, -7, 25, 14);
                // Add cannon tip
                ctx.fillRect(20, -5, 5, 10);
            } else if (this.type === 'giga-turret') {
                // Draw massive cannon barrel
                ctx.fillRect(0, -10, 28, 20);
                ctx.fillRect(23, -8, 7, 16);
            } else if (this.type === 'auger-turret') {
                // Draw auger cannon with spiral
                ctx.fillRect(0, -12, 30, 24);
                ctx.fillRect(25, -10, 8, 20);
                // Draw spiral effect
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(15, 0, 5 + i * 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (this.type === 'peta-turret') {
                // Draw super massive cannon
                ctx.fillRect(0, -14, 35, 28);
                ctx.fillRect(28, -12, 10, 24);
            } else {
                ctx.fillRect(0, -4, 20, 8);
            }
        } else if (this.type === 'sniper' || this.type === 'sniper-mr2' || this.type === 'large-sniper' || this.type === 'sniper-mr3' || this.type === 'laser' || this.type === 'giga-sniper' || this.type === 'missile-snipper') {
            ctx.fillRect(-10, -10, 20, 20);
            
            if (this.type === 'sniper-mr2') {
                // Longer, thicker barrel
                ctx.fillRect(0, -3, 35, 6);
            } else if (this.type === 'sniper-mr3') {
                // Advanced long barrel with details
                ctx.fillRect(0, -4, 40, 8);
                ctx.fillRect(35, -2, 5, 4);
            } else if (this.type === 'laser') {
                // Laser cannon
                ctx.fillRect(0, -5, 45, 10);
                ctx.fillRect(40, -3, 8, 6);
                // Draw laser beam indicator
                ctx.strokeStyle = '#ff00aa';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(48, 0);
                ctx.lineTo(60, 0);
                ctx.stroke();
            } else if (this.type === 'large-sniper') {
                // Wide barrel
                ctx.fillRect(0, -4, 32, 8);
            } else if (this.type === 'giga-sniper') {
                // Massive wide barrel
                ctx.fillRect(0, -5, 38, 10);
                ctx.fillRect(33, -3, 5, 6);
            } else if (this.type === 'missile-snipper') {
                // Missile launcher
                ctx.fillRect(0, -6, 42, 12);
                ctx.fillRect(36, -4, 6, 8);
                // Draw missile indicators
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(10, -4, 3, 8);
                ctx.fillRect(20, -4, 3, 8);
                ctx.fillRect(30, -4, 3, 8);
            } else {
                ctx.fillRect(0, -2, 30, 4);
            }
        } else if (this.type === 'blaster' || this.type === 'flame-blaster' || this.type === 'frost-blaster' || this.type === 'blast-blaster' || this.type === 'explosion-blaster' || this.type === 'sol-blaster' || this.type === 'blizzard-blaster' || this.type === 'iceage-blaster') {
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, 10);
            ctx.lineTo(-10, -10);
            ctx.fill();
            
            // Add element indicator
            if (this.type === 'flame-blaster') {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'blast-blaster') {
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                // Add explosion lines
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
                    ctx.stroke();
                }
            } else if (this.type === 'explosion-blaster') {
                ctx.fillStyle = '#ff5500';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                // Add bigger explosion lines
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i;
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                    ctx.stroke();
                }
            } else if (this.type === 'sol-blaster') {
                // 広がる円アニメーション（タワーの背後に描画）
                if (this.expandingCircles && this.expandingCircles.length > 0) {
                    this.expandingCircles.forEach(circle => {
                        ctx.strokeStyle = `rgba(255, 170, 0, ${circle.opacity})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // 内側の薄い円
                        ctx.strokeStyle = `rgba(255, 255, 0, ${circle.opacity * 0.5})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, circle.radius * 0.8, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                }
                
                // Draw sun-like core
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                // Add solar flare rays (rotating)
                const flareRotation = Date.now() * 0.002;
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI / 6) * i + flareRotation;
                    ctx.strokeStyle = '#ffaa00';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                    ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
                    ctx.stroke();
                }
                // Inner glow
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'frost-blaster') {
                ctx.fillStyle = '#00aaff';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'blizzard-blaster') {
                ctx.fillStyle = '#00ddff';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                // Add snowflake pattern
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
                    ctx.stroke();
                }
            } else if (this.type === 'iceage-blaster') {
                ctx.fillStyle = '#0099ee';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                // Add triple snowflake pattern
                for (let j = 0; j < 3; j++) {
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(angle) * (12 + j * 3), Math.sin(angle) * (12 + j * 3));
                        ctx.stroke();
                    }
                }
            }
        } else if (this.type === 'rod' || this.type === 'lightning-rod' || this.type === 'warp-rod' || this.type === 'necromancer' || this.type === 'lightning-rod-ii' || this.type === 'lightning-spark' || this.type === 'chain-spark' || this.type === 'burn-lightning') {
            // Draw lightning rod
            ctx.fillRect(-3, -15, 6, 30); // Vertical rod
            
            // Draw lightning bolt on top for evolved versions
            if (this.type !== 'rod') {
                // Use different colors for different types
                let boltColor = '#ffff00';
                if (this.type === 'warp-rod') boltColor = '#00ffff';
                else if (this.type === 'necromancer') boltColor = '#aa00ff';
                else if (this.type === 'chain-spark') boltColor = '#ffffcc';
                else if (this.type === 'burn-lightning') boltColor = '#ffaa00';
                
                ctx.fillStyle = boltColor;
                // Lightning bolt shape
                ctx.beginPath();
                ctx.moveTo(0, -20);
                ctx.lineTo(-5, -10);
                ctx.lineTo(0, -10);
                ctx.lineTo(-3, 0);
                ctx.lineTo(3, -15);
                ctx.lineTo(0, -15);
                ctx.lineTo(5, -25);
                ctx.closePath();
                ctx.fill();
                
                // Add glow for advanced versions
                if (this.type === 'lightning-rod-ii' || this.type === 'lightning-spark' || this.type === 'chain-spark' || this.type === 'burn-lightning') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = boltColor;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        } else if (this.type === 'gear') {
            // 連鎖数を計算
            this.updateChainCount();
            
            // 連鎖がある場合のみ回転
            if (this.chainCount > 0) {
                this.rotationSpeed = 0.02 + (this.chainCount * 0.01);
                this.rotationAngle += this.rotationSpeed * this.rotationDirection;
            }
            
            // 歯車を描画
            ctx.save();
            ctx.rotate(this.rotationAngle);
            
            const teeth = 10; // 歯の数
            const outerRadius = 16; // 外側の半径
            const innerRadius = 11; // 内側の半径
            const valleyRadius = 9; // 谷の半径（凹み部分）
            const toothWidth = 0.35; // 歯の幅（角度の割合）
            
            // 連鎖数に応じて色を変更
            if (this.chainCount === 0) {
                ctx.fillStyle = '#444444'; // 暗い灰色（動いていない）
            } else if (this.chainCount <= 2) {
                ctx.fillStyle = '#888888'; // 通常の灰色
            } else if (this.chainCount <= 4) {
                ctx.fillStyle = '#aaaaaa'; // 明るい灰色
            } else {
                ctx.fillStyle = '#cccccc'; // 非常に明るい灰色
                // 高連鎖時は光る
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffffff';
            }
            
            // 歯車の歯を描画（凹凸をはっきりと）
            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
                const baseAngle = (Math.PI * 2 * i) / teeth;
                const toothAngle = (Math.PI * 2 * toothWidth) / teeth;
                const valleyAngle = (Math.PI * 2 * (1 - toothWidth)) / teeth;
                
                // 歯の左側（立ち上がり）
                const a1 = baseAngle;
                ctx.lineTo(Math.cos(a1) * valleyRadius, Math.sin(a1) * valleyRadius);
                ctx.lineTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);
                
                // 歯の上部（平らな部分）
                const a2 = baseAngle + toothAngle;
                ctx.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
                
                // 歯の右側（下り）
                ctx.lineTo(Math.cos(a2) * valleyRadius, Math.sin(a2) * valleyRadius);
                
                // 谷の部分（凹み）
                const a3 = baseAngle + toothAngle + valleyAngle;
                ctx.lineTo(Math.cos(a3) * valleyRadius, Math.sin(a3) * valleyRadius);
            }
            ctx.closePath();
            ctx.fill();
            
            // 内側の円盤
            ctx.fillStyle = this.chainCount === 0 ? '#333333' : '#666666';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心の穴
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 歯車のボルト（装飾）
            ctx.fillStyle = '#222222';
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3;
                const x = Math.cos(angle) * 5;
                const y = Math.sin(angle) * 5;
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
        } else if (this.type === 'gear-second') {
            // 連鎖数を計算
            this.updateChainCount();
            
            // 連鎖がある場合のみ回転
            if (this.chainCount > 0) {
                this.rotationSpeed = 0.025 + (this.chainCount * 0.012); // gear-secondは少し速い
                this.rotationAngle += this.rotationSpeed * this.rotationDirection;
            }
            
            // 歯車を描画（gear-secondはより洗練された見た目）
            ctx.save();
            ctx.rotate(this.rotationAngle);
            
            const teeth = 12; // 歯の数が増加
            const outerRadius = 16; // 外側の半径
            const innerRadius = 11; // 内側の半径
            const valleyRadius = 9; // 谷の半径（凹み部分）
            const toothWidth = 0.35; // 歯の幅（角度の割合）
            
            // 連鎖数に応じて色を変更（gear-secondはより明るい）
            if (this.chainCount === 0) {
                ctx.fillStyle = '#666666'; // より明るい灰色
            } else if (this.chainCount <= 2) {
                ctx.fillStyle = '#aaaaaa'; // 明るい灰色
            } else if (this.chainCount <= 4) {
                ctx.fillStyle = '#cccccc'; // 非常に明るい灰色
            } else {
                ctx.fillStyle = '#dddddd'; // ほぼ白
                // 高連鎖時は強く光る
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffffff';
            }
            
            // 歯車の歯を描画（凹凸をはっきりと）
            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
                const baseAngle = (Math.PI * 2 * i) / teeth;
                const toothAngle = (Math.PI * 2 * toothWidth) / teeth;
                const valleyAngle = (Math.PI * 2 * (1 - toothWidth)) / teeth;
                
                // 歯の左側（立ち上がり）
                const a1 = baseAngle;
                ctx.lineTo(Math.cos(a1) * valleyRadius, Math.sin(a1) * valleyRadius);
                ctx.lineTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);
                
                // 歯の上部（平らな部分）
                const a2 = baseAngle + toothAngle;
                ctx.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
                
                // 歯の右側（下り）
                ctx.lineTo(Math.cos(a2) * valleyRadius, Math.sin(a2) * valleyRadius);
                
                // 谷の部分（凹み）
                const a3 = baseAngle + toothAngle + valleyAngle;
                ctx.lineTo(Math.cos(a3) * valleyRadius, Math.sin(a3) * valleyRadius);
            }
            ctx.closePath();
            ctx.fill();
            
            // 内側の円盤（より明るい）
            ctx.fillStyle = this.chainCount === 0 ? '#555555' : '#888888';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心の穴
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 歯車のボルト（装飾、4つに増加）
            ctx.fillStyle = '#333333';
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                const x = Math.cos(angle) * 5;
                const y = Math.sin(angle) * 5;
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
        } else if (this.type === 'gear-third') {
            // 連鎖数を計算
            this.updateChainCount();
            
            // オーバーヒート中は回転停止、それ以外は連鎖がある場合のみ回転
            if (!this.overheatActive && this.chainCount > 0) {
                this.rotationSpeed = 0.03 + (this.chainCount * 0.015);
                
                // オーバークロック中は回転速度2倍
                if (this.overclockActive) {
                    this.rotationSpeed *= 2;
                }
                
                this.rotationAngle += this.rotationSpeed * this.rotationDirection;
                // 小さい歯車は逆回転
                if (!this.smallGearAngle) this.smallGearAngle = 0;
                this.smallGearAngle -= this.rotationSpeed * this.rotationDirection * 1.5;
            }
            
            // 大きい歯車を描画
            ctx.save();
            ctx.rotate(this.rotationAngle);
            
            const bigTeeth = 14; // 大歯車の歯の数
            const bigOuterRadius = 18; // 大歯車の外側の半径
            const bigValleyRadius = 14; // 大歯車の谷の半径
            const toothWidth = 0.35; // 歯の幅（角度の割合）
            
            // オーバーヒート/オーバークロックによる色変更
            if (this.overheatActive) {
                // オーバーヒート: 灰色
                ctx.fillStyle = '#555555';
            } else if (this.overclockActive) {
                // オーバークロック: 黄色く発光
                if (this.overclockDuration > 30) {
                    ctx.fillStyle = '#ffff00'; // 黄色
                } else {
                    // 徐々に赤くなる（最後の30フレーム）
                    const redProgress = (30 - this.overclockDuration) / 30;
                    const r = Math.floor(255);
                    const g = Math.floor(255 * (1 - redProgress));
                    const b = 0;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                }
                // 強く光る
                ctx.shadowBlur = 30;
                ctx.shadowColor = ctx.fillStyle;
            } else {
                // 通常時: 連鎖数に応じて色を変更
                if (this.chainCount === 0) {
                    ctx.fillStyle = '#888888';
                } else if (this.chainCount <= 3) {
                    ctx.fillStyle = '#bbbbbb';
                } else if (this.chainCount <= 6) {
                    ctx.fillStyle = '#dddddd';
                } else {
                    ctx.fillStyle = '#eeeeee';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#ffffff';
                }
            }
            
            // 大歯車の歯を描画
            ctx.beginPath();
            for (let i = 0; i < bigTeeth; i++) {
                const baseAngle = (Math.PI * 2 * i) / bigTeeth;
                const toothAngle = (Math.PI * 2 * toothWidth) / bigTeeth;
                const valleyAngle = (Math.PI * 2 * (1 - toothWidth)) / bigTeeth;
                
                const a1 = baseAngle;
                ctx.lineTo(Math.cos(a1) * bigValleyRadius, Math.sin(a1) * bigValleyRadius);
                ctx.lineTo(Math.cos(a1) * bigOuterRadius, Math.sin(a1) * bigOuterRadius);
                
                const a2 = baseAngle + toothAngle;
                ctx.lineTo(Math.cos(a2) * bigOuterRadius, Math.sin(a2) * bigOuterRadius);
                ctx.lineTo(Math.cos(a2) * bigValleyRadius, Math.sin(a2) * bigValleyRadius);
                
                const a3 = baseAngle + toothAngle + valleyAngle;
                ctx.lineTo(Math.cos(a3) * bigValleyRadius, Math.sin(a3) * bigValleyRadius);
            }
            ctx.closePath();
            ctx.fill();
            
            // 大歯車の内側の円盤
            ctx.fillStyle = this.chainCount === 0 ? '#666666' : '#999999';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
            // 小さい歯車を描画（逆回転）
            ctx.save();
            ctx.rotate(this.smallGearAngle || 0);
            
            const smallTeeth = 8; // 小歯車の歯の数
            const smallOuterRadius = 11; // 小歯車の外側の半径
            const smallValleyRadius = 8; // 小歯車の谷の半径
            
            // 小歯車の色（大歯車と同じロジックで少し暗め）
            if (this.overheatActive) {
                ctx.fillStyle = '#444444';
            } else if (this.overclockActive) {
                if (this.overclockDuration > 30) {
                    ctx.fillStyle = '#dddd00'; // 黄色（少し暗め）
                } else {
                    const redProgress = (30 - this.overclockDuration) / 30;
                    const r = Math.floor(220);
                    const g = Math.floor(220 * (1 - redProgress));
                    const b = 0;
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                }
            } else {
                if (this.chainCount === 0) {
                    ctx.fillStyle = '#666666';
                } else if (this.chainCount <= 3) {
                    ctx.fillStyle = '#999999';
                } else if (this.chainCount <= 6) {
                    ctx.fillStyle = '#bbbbbb';
                } else {
                    ctx.fillStyle = '#cccccc';
                }
            }
            
            // 小歯車の歯を描画
            ctx.beginPath();
            for (let i = 0; i < smallTeeth; i++) {
                const baseAngle = (Math.PI * 2 * i) / smallTeeth;
                const toothAngle = (Math.PI * 2 * toothWidth) / smallTeeth;
                const valleyAngle = (Math.PI * 2 * (1 - toothWidth)) / smallTeeth;
                
                const a1 = baseAngle;
                ctx.lineTo(Math.cos(a1) * smallValleyRadius, Math.sin(a1) * smallValleyRadius);
                ctx.lineTo(Math.cos(a1) * smallOuterRadius, Math.sin(a1) * smallOuterRadius);
                
                const a2 = baseAngle + toothAngle;
                ctx.lineTo(Math.cos(a2) * smallOuterRadius, Math.sin(a2) * smallOuterRadius);
                ctx.lineTo(Math.cos(a2) * smallValleyRadius, Math.sin(a2) * smallValleyRadius);
                
                const a3 = baseAngle + toothAngle + valleyAngle;
                ctx.lineTo(Math.cos(a3) * smallValleyRadius, Math.sin(a3) * smallValleyRadius);
            }
            ctx.closePath();
            ctx.fill();
            
            // 小歯車の内側の円盤
            ctx.fillStyle = this.chainCount === 0 ? '#555555' : '#888888';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心の穴
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 中心のボルト（装飾）
            ctx.fillStyle = '#333333';
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                const x = Math.cos(angle) * 3.5;
                const y = Math.sin(angle) * 3.5;
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
        } else if (this.type === 'sweeper' || this.type === 'big-sweeper' || this.type === 'spike-sweeper' || this.type === 'incendiary-sweeper') {
            // Draw pentagon (五角形)
            const size = this.type === 'sweeper' ? 12 : (this.type === 'big-sweeper' ? 15 : 18);
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * size;
                const y = Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Add special indicators
            if (this.type === 'spike-sweeper') {
                // Draw spikes on pentagon
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    const extX = Math.cos(angle) * (size + 6);
                    const extY = Math.sin(angle) * (size + 6);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(extX, extY);
                    ctx.stroke();
                }
            } else if (this.type === 'incendiary-sweeper') {
                // Draw flame symbol
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(0, -8);
                ctx.bezierCurveTo(-4, -4, -6, 0, -3, 4);
                ctx.bezierCurveTo(-2, 6, 2, 6, 3, 4);
                ctx.bezierCurveTo(6, 0, 4, -4, 0, -8);
                ctx.fill();
            }
            
            // Draw mine symbol
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw warning lines
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                ctx.stroke();
            }
        }

        ctx.shadowBlur = 0;
        ctx.restore();

        // Level Indicator
        ctx.fillStyle = '#fff';
        ctx.font = '10px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${this.level}`, this.x, this.y + 25);
    }
}

class Projectile {
    constructor(x, y, target, damage, color, type, special, offsetAngle = 0, sourceTower = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 8;
        this.damage = damage;
        this.color = color;
        this.type = type;
        this.special = special;
        this.active = true;
        this.sourceTower = sourceTower;
        // サイズ調整
        if (special === 'peta-splash') this.radius = 18;
        else if (special === 'knockback-splash') this.radius = 14;
        else if (special === 'giga-splash') this.radius = 15;
        else if (special === 'splash') this.radius = 10;
        else if (special === 'spike') this.radius = 5; // スパイク弾は少し大きめ
        else this.radius = 4;
        this.hitEnemies = []; // For pierce effect
        
        // スパイク弾の場合は直線で飛ぶように設定（targetは速度ベクトルとして扱う）
        if (special === 'spike') {
            this.vx = target; // targetはvxとして渡される
            this.vy = damage; // damageの位置にvyが渡される
            this.damage = color; // colorの位置にdamageが渡される
            this.color = type; // typeの位置にcolorが渡される
            this.type = null;
            this.target = null;
            this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy); // 速度を計算
        } else {
            let dx = target.x - x;
            let dy = target.y - y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            // Calculate base angle to target
            const baseAngle = Math.atan2(dy, dx);
            // Apply offset angle (for spread shots)
            const finalAngle = baseAngle + offsetAngle;
            this.vx = Math.cos(finalAngle) * this.speed;
            this.vy = Math.sin(finalAngle) * this.speed;
        }
    }

    update() {
        if (this.type === 'sniper' || this.type === 'sniper-mr2' || this.type === 'sniper-mr3' || this.type === 'laser' || this.type === 'large-sniper' || this.type === 'giga-sniper' || this.type === 'missile-snipper') {
            if (this.target && this.target.active) {
                // Laser - hits all enemies
                if (this.special === 'laser') {
                    for (let e of enemies) {
                        if (!e.active) continue;
                        this.applyDamageAndEffects(e);
                    }
                }
                // Laceration - applies laceration status
                else if (this.special === 'laceration') {
                    const startX = this.x;
                    const startY = this.y;
                    const endX = this.target.x;
                    const endY = this.target.y;
                    
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const extendX = endX + (dx / length) * 250;
                    const extendY = endY + (dy / length) * 250;
                    
                    const hitboxSize = 18;
                    
                    for (let e of enemies) {
                        if (!e.active) continue;
                        
                        const dist = this.pointToLineDistance(e.x, e.y, startX, startY, extendX, extendY);
                        if (dist < e.radius + hitboxSize) {
                            this.applyDamageAndEffects(e);
                        }
                    }
                }
                // Pierce effect for large-sniper and giga-sniper
                else if (this.special === 'pierce' || this.special === 'giga-pierce') {
                    const startX = this.x;
                    const startY = this.y;
                    const endX = this.target.x;
                    const endY = this.target.y;
                    
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const extendX = endX + (dx / length) * 200; // Extended range for giga
                    const extendY = endY + (dy / length) * 200;
                    
                    const hitboxSize = (this.special === 'giga-pierce') ? 15 : 8;
                    
                    for (let e of enemies) {
                        if (!e.active) continue;
                        
                        const dist = this.pointToLineDistance(e.x, e.y, startX, startY, extendX, extendY);
                        if (dist < e.radius + hitboxSize) {
                            this.applyDamageAndEffects(e);
                        }
                    }
                } else {
                    this.applyDamageAndEffects(this.target);
                }
                
                this.beam = {sx: this.x, sy: this.y, ex: this.target.x, ey: this.target.y};
            }
            this.active = false;
            return;
        }

        // Pierce projectile continues through enemies
        if (this.special === 'pierce') {
            for (let e of enemies) {
                if (!e.active || this.hitEnemies.includes(e)) continue;
                
                let dx = e.x - this.x;
                let dy = e.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < e.radius + this.radius) {
                    this.applyDamageAndEffects(e);
                    this.hitEnemies.push(e);
                }
            }
            
            // Deactivate if out of bounds
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
            }
        } else if (this.special === 'spike') {
            // スパイク弾は最大2回まで貫通して直進する
            // 敵との衝突判定
            for (let e of enemies) {
                if (!e.active || this.hitEnemies.includes(e)) continue;
                
                let dx = e.x - this.x;
                let dy = e.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < e.radius + this.radius) {
                    this.applyDamageAndEffects(e);
                    this.hitEnemies.push(e); // 同じ敵に複数回当たらないように記録
                    
                    // 2回貫通したら消滅
                    if (this.hitEnemies.length >= 2) {
                        this.active = false;
                        break;
                    }
                }
            }
            
            // 画面外に出たら非アクティブ化
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
            }
        } else if (this.special === 'spread' || this.special === 'super-spread') {
            // Spread projectiles don't track - they fly straight
            // Check collision with any enemy
            for (let e of enemies) {
                if (!e.active) continue;
                
                let dx = e.x - this.x;
                let dy = e.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < e.radius + this.radius) {
                    this.applyDamageAndEffects(e);
                    this.active = false;
                    break;
                }
            }
            
            // Deactivate if out of bounds
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
            }
        } else if (this.target && this.target.active) {
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            const effectiveSpeed = this.speed * dt;
            if (dist < effectiveSpeed) {
                // Splash damage variants
                if (this.special === 'splash' || this.special === 'giga-splash' || this.special === 'knockback-splash' || this.special === 'peta-splash') {
                    let splashRadius = 60;
                    if (this.special === 'giga-splash') splashRadius = 90;
                    if (this.special === 'knockback-splash') splashRadius = 100;
                    if (this.special === 'peta-splash') splashRadius = 120;
                    
                    const targetX = this.target.x;
                    const targetY = this.target.y;
                    
                    // Damage all enemies in splash radius
                    for (let e of enemies) {
                        if (!e.active) continue;
                        
                        let dx = e.x - targetX;
                        let dy = e.y - targetY;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist <= splashRadius) {
                            this.applyDamageAndEffects(e);
                            
                            // Knockback effect for Auger-TURRET
                            if (this.special === 'knockback-splash' && dist > 0) {
                                // 敵を後ろに押し戻す（pathの逆方向）- アニメーション付き
                                if (e.pathIndex > 0 && !e.knockbackActive) {
                                    e.knockbackStartIndex = e.pathIndex;
                                    e.knockbackTargetIndex = Math.max(0, e.pathIndex - 10);
                                    e.knockbackProgress = 0;
                                    e.knockbackActive = true;
                                }
                            }
                        }
                    }
                    
                    const particleCount = this.special === 'peta-splash' ? 40 : (this.special === 'knockback-splash' ? 35 : (this.special === 'giga-splash' ? 30 : 20));
                    createExplosion(targetX, targetY, this.color, particleCount);
                } else {
                    this.applyDamageAndEffects(this.target);
                    createExplosion(this.x, this.y, this.color, 3);
                }
                this.active = false;
            } else {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            }
        } else {
            // Target is dead or inactive - create burst effect and deactivate
            createExplosion(this.x, this.y, this.color, 8);
            this.active = false;
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    applyDamageAndEffects(enemy) {
        // Gear-Third overclock gauge increase (only when not overheating)
        if (this.sourceTower && this.sourceTower.type === 'gear-third' && !this.sourceTower.overheatActive) {
            this.sourceTower.overclockGauge = Math.min(100, this.sourceTower.overclockGauge + 5);
            
            // Activate overclock when gauge is full
            if (this.sourceTower.overclockGauge >= 100 && !this.sourceTower.overclockActive) {
                this.sourceTower.overclockActive = true;
                this.sourceTower.overclockDuration = 180; // 3 seconds
                this.sourceTower.overclockGauge = 0; // Reset gauge
            }
        }
        
        // Calculate critical hit
        const baseCritRate = getSkillBonus('crit_rate');
        const critRate = baseCritRate + getActiveSkillBonus('crit_rate'); // Add Benix active
        const isCrit = Math.random() < critRate;
        const critMultiplier = isCrit ? (2 + getActiveSkillBonus('crit_damage')) : 1; // Add Benix active crit damage
        let finalDamage = this.damage * critMultiplier;
        
        // Apply Reika's passive: Bonus damage to slowed/frozen enemies
        if (enemy.slowDuration > 0 || enemy.freezeStacks > 0) {
            finalDamage *= getCommanderBonus('slow_bonus_damage');
        }
        
        // Apply laceration bonus damage
        const hasLaceration = enemy.lacerationStacks > 0;
        if (hasLaceration) {
            const lacerationBonus = getSkillBonus('laceration_damage');
            finalDamage += this.damage * 0.3 * enemy.lacerationStacks * lacerationBonus; // +30% per stack (with skill bonus)
        }
        
        // Let takeDamage handle the damage text display (for shield mechanics)
        enemy.takeDamage(finalDamage, null, true, isCrit, hasLaceration);
        
        // Apply burn effect
        if (this.special === 'burn') {
            const burnBonus = getSkillBonus('burn_damage');
            const durationBonus = getCommanderBonus('debuff_duration');
            enemy.burnDamage = Math.floor(this.damage * 0.1 * burnBonus);
            enemy.burnDuration = 60 + durationBonus;
            createExplosion(enemy.x, enemy.y, '#ff4400', 5);
        }
        
        // Shielder immunity check - immune to burn, slow, freeze, stun while shield is active
        // Note: Laceration still works on shielder
        const shielderImmune = (enemy.type === 'shielder' && enemy.hasShield && enemy.shield > 0);
        
        // Chain burn - enhanced burn
        if (this.special === 'chain-burn') {
            if (!shielderImmune) {
                const burnBonus = getSkillBonus('burn_damage');
                const durationBonus = getCommanderBonus('debuff_duration');
                enemy.burnDamage = Math.floor(this.damage * 0.15 * burnBonus); // 15% burn damage
                enemy.burnDuration = 90 + durationBonus; // Longer duration
                enemy.chainBurn = true;
                createExplosion(enemy.x, enemy.y, '#ff2200', 8);
            }
        }
        
        // Mega chain burn - even more burn damage
        if (this.special === 'mega-chain-burn') {
            if (!shielderImmune) {
                const burnBonus = getSkillBonus('burn_damage');
                const durationBonus = getCommanderBonus('debuff_duration');
                enemy.burnDamage = Math.floor(this.damage * 0.2 * burnBonus); // 20% burn damage
                enemy.burnDuration = 120 + durationBonus; // Even longer duration
                enemy.chainBurn = true;
                createExplosion(enemy.x, enemy.y, '#ff1100', 12);
            }
        }
        
        // Laceration - applies stacks (Missile-SNIPPER) - WORKS ON SHIELDER!
        if (this.special === 'laceration') {
            enemy.lacerationStacks = Math.min(enemy.lacerationStacks + 1, 5); // Max 5 stacks
            createExplosion(enemy.x, enemy.y, '#ff88ff', 8);
        }
        
        // Apply slow effect
        if (this.special === 'slow') {
            if (!shielderImmune) {
                const wasNotFrozen = enemy.slowDuration <= 0; // Check if enemy was not frozen
                enemy.slowAmount = 0.5;
                enemy.slowDuration = 120;
                if (wasNotFrozen) playSound('ice'); // Play ice sound only if newly frozen
                createExplosion(enemy.x, enemy.y, '#44aaff', 5);
            }
        }
        
        // Freeze zone
        if (this.special === 'freeze-zone') {
            if (!shielderImmune) {
                const wasNotFrozen = enemy.slowDuration <= 0; // Check if enemy was not frozen
                enemy.slowAmount = 0.4;
                const freezeDurationBonus = getSkillBonus('freeze_duration');
                enemy.slowDuration = Math.floor(60 * freezeDurationBonus);
                if (wasNotFrozen) playSound('ice'); // Play ice sound only if newly frozen
                freezeZones.push(new FreezeZone(enemy.x, enemy.y));
                createExplosion(enemy.x, enemy.y, '#0099ff', 10);
            }
        }
        
        // Stack freeze - can stack up to 3 times
        if (this.special === 'stack-freeze') {
            if (!shielderImmune) {
                enemy.freezeStacks = Math.min(enemy.freezeStacks + 1, 3); // Max 3 stacks
                enemy.slowAmount = 0.2 * enemy.freezeStacks; // +20% per stack
                const freezeDurationBonus = getSkillBonus('freeze_duration');
                // Duration increases with stacks: 90 -> 120 -> 150 frames
                const baseDuration = 90 + (enemy.freezeStacks - 1) * 30;
                enemy.slowDuration = Math.floor(baseDuration * freezeDurationBonus);
                playSound('ice');
                freezeZones.push(new FreezeZone(enemy.x, enemy.y));
                createExplosion(enemy.x, enemy.y, '#0088ee', 15);
            }
        }
        
        // Lightning effect - chance to stun
        if (this.special === 'lightning') {
            if (!shielderImmune) {
                if (Math.random() < 0.3) { // 30% chance to stun
                    enemy.stunDuration = 60; // 1 second stun
                    createExplosion(enemy.x, enemy.y, '#ffff00', 10);
                } else {
                    createExplosion(enemy.x, enemy.y, '#ffff00', 5);
                }
            }
        }
        
        // Lightning zone - creates stun zone
        if (this.special === 'lightning-zone') {
            if (!shielderImmune) {
                stunZones.push(new StunZone(enemy.x, enemy.y));
                createExplosion(enemy.x, enemy.y, '#ffff00', 15);
            }
        }
        
        // Burn-Lightning - stun chance + burn
        if (this.special === 'burn-lightning') {
            if (!shielderImmune) {
                // 30% chance to stun
                if (Math.random() < 0.3) {
                    enemy.stunDuration = 60; // 1 second stun
                }
                // Always apply burn
                const burnBonus = getSkillBonus('burn_damage');
                enemy.burnDamage = Math.floor(this.damage * 0.12 * burnBonus); // 12% burn damage
                enemy.burnDuration = 60;
                // Visual effect - mix of yellow and orange
                createExplosion(enemy.x, enemy.y, '#ffaa00', 12);
                createExplosion(enemy.x, enemy.y, '#ffff00', 8);
            }
        }
        
        if (!this.special || this.special === 'none') {
            createExplosion(enemy.x, enemy.y, this.color, 5);
        }
    }

    draw(ctx) {
        if (this.beam) {
            ctx.beginPath();
            ctx.moveTo(this.beam.sx, this.beam.sy);
            ctx.lineTo(this.beam.ex, this.beam.ey);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.min(8, 2 + (this.damage / 50)); // Cap beam width at 8
            ctx.stroke();
            return;
        }

        // スパイク弾の描画（シンプルな矢じり型）
        if (this.special === 'spike') {
            ctx.save();
            ctx.translate(this.x, this.y);
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);
            
            // シンプルな矢じり型
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(18, 0);  // 先端
            ctx.lineTo(-8, -6); // 左下
            ctx.lineTo(-4, 0);  // 中間点
            ctx.lineTo(-8, 6);  // 右下
            ctx.closePath();
            ctx.fill();
            
            // 白い縁取り
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

function createExplosion(x, y, color, count=10) {
    // Reduce particle count based on quality settings
    let particleCount = count;
    if (qualitySettings.effects === 'low') {
        particleCount = Math.ceil(count * 0.3); // 30% of particles
    } else if (qualitySettings.graphics === 'low') {
        particleCount = Math.ceil(count * 0.5); // 50% of particles
    } else if (qualitySettings.graphics === 'medium') {
        particleCount = Math.ceil(count * 0.7); // 70% of particles
    }
    
    // Further reduce on mobile devices
    if (isMobileDevice) {
        particleCount = Math.ceil(particleCount * 0.5); // 50% reduction on mobile
    }
    
    // Limit total particles for performance
    const maxParticles = qualitySettings.graphics === 'low' ? 100 : qualitySettings.graphics === 'medium' ? 300 : 500;
    if (particles.length >= maxParticles) {
        return; // Skip creating more particles
    }
    
    for(let i=0; i<particleCount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Elliptical Shockwave for boss defeat
class EllipticalWave {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radiusX = 0;
        this.radiusY = 0;
        this.maxRadiusX = 450;
        this.maxRadiusY = 180;
        this.angle = angle; // Rotation angle
        this.life = 1.0;
        this.progress = 0; // 0 to 1 for easing calculations
    }

    // Ease-out function for expansion
    easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    // Ease-in function for fade
    easeInQuad(t) {
        return t * t;
    }

    update() {
        this.progress += 0.015 * dt;
        
        if (this.progress >= 1.0) {
            this.life = 0;
            return;
        }
        
        // Apply ease-out to expansion
        const easedProgress = this.easeOutQuad(this.progress);
        this.radiusX = this.maxRadiusX * easedProgress;
        this.radiusY = this.maxRadiusY * easedProgress;
        
        // Apply ease-in to fade (reverse: 1 -> 0)
        const fadeProgress = 1 - this.progress;
        this.life = this.easeInQuad(fadeProgress);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw outer ellipse
        ctx.strokeStyle = `rgba(255, 0, 0, ${this.life * 0.8})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner ellipse
        ctx.strokeStyle = `rgba(255, 200, 0, ${this.life * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radiusX * 0.7, this.radiusY * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

let ellipticalWaves = [];

function createEllipticalWaves(x, y) {
    // Reduce waves on mobile for better performance
    if (isMobileDevice) {
        // Create 2 elliptical waves (cross pattern)
        ellipticalWaves.push(new EllipticalWave(x, y, 0)); // Horizontal
        ellipticalWaves.push(new EllipticalWave(x, y, Math.PI / 2)); // Vertical
    } else {
        // Create 4 elliptical waves at different angles (cross pattern)
        ellipticalWaves.push(new EllipticalWave(x, y, 0)); // Horizontal
        ellipticalWaves.push(new EllipticalWave(x, y, Math.PI / 4)); // 45 degrees
        ellipticalWaves.push(new EllipticalWave(x, y, Math.PI / 2)); // Vertical
        ellipticalWaves.push(new EllipticalWave(x, y, 3 * Math.PI / 4)); // 135 degrees
    }
}

// Damage Text Class
class DamageText {
    constructor(x, y, damage, isBurn = false, isCrit = false, isLaceration = false, customColor = null, isFrostDamage = false) {
        this.x = x;
        this.y = y;
        this.isText = typeof damage === 'string';
        this.damage = this.isText ? damage : Math.floor(damage);
        this.life = 1.0;
        this.vy = -1.5; // Float upward
        this.vx = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
        this.isBurn = isBurn;
        this.isCrit = isCrit;
        this.isLaceration = isLaceration;
        this.customColor = customColor; // Custom color (e.g., for shield damage)
        this.isFrostDamage = isFrostDamage; // 凍結・スロー時のダメージ
    }

    update() {
        this.y += this.vy * dt;
        this.x += this.vx * dt;
        this.life -= 0.02 * dt;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Set default font first
        let fontSize = 14;
        let fontWeight = 'bold';
        
        // Determine font size based on damage type
        if (this.isText) {
            fontSize = 16;
        } else if (this.isCrit) {
            fontSize = 18;
        } else if (this.isLaceration) {
            fontSize = 16;
        }
        
        ctx.font = `${fontWeight} ${fontSize}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        if (this.customColor) {
            // Custom color (e.g., shield damage)
            ctx.fillStyle = this.customColor;
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        } else if (this.isText) {
            // Special text (like +5 LIVES)
            ctx.fillStyle = '#00ff00';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        } else if (this.isCrit) {
            // Critical hit - purple and larger
            ctx.fillStyle = '#ff00ff';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        } else if (this.isLaceration) {
            // Laceration damage - pink
            ctx.fillStyle = '#ff00aa';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        } else if (this.isFrostDamage) {
            // Frost damage (slow/frozen) - blue with snowflake
            const text = this.damage + ' ❄️';
            ctx.fillStyle = '#00aaff';
            ctx.strokeText(text, this.x, this.y);
            ctx.fillText(text, this.x, this.y);
        } else if (this.isBurn) {
            // Burn damage with fire icon
            const text = this.damage + ' 🔥';
            ctx.fillStyle = '#ff6600';
            ctx.strokeText(text, this.x, this.y);
            ctx.fillText(text, this.x, this.y);
        } else {
            // Normal damage
            ctx.fillStyle = '#ffffff';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        }
        
        ctx.restore();
    }
}

function createDamageText(x, y, damage, isBurn = false, isCrit = false, isLaceration = false, customColor = null, isFrostDamage = false) {
    damageTexts.push(new DamageText(x, y, damage, isBurn, isCrit, isLaceration, customColor, isFrostDamage));
    
    // Track damage for DPS calculation (only if damage is a number)
    if (typeof damage === 'number') {
        totalDamageDealt += damage;
    }
}

// Zombie Class (ネクロマンサーで生成されたゾンビ)
class Zombie {
    constructor(x, y, path, pathIndex, damage, radius) {
        this.x = x;
        this.y = y;
        this.path = path;
        this.pathIndex = pathIndex;
        this.damage = damage;
        this.radius = radius;
        this.speed = 1.0; // ゾンビの速度
        this.active = true;
        this.color = '#8800ff';
        this.reachedBase = false;
    }

    update() {
        if (!this.active) return;

        // パスに沿って逆方向に移動
        if (this.pathIndex > 0) {
            const targetPos = this.path[this.pathIndex - 1];
            let dx = targetPos.x - this.x;
            let dy = targetPos.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < this.speed * dt) {
                // 次のポイントに到達
                this.x = targetPos.x;
                this.y = targetPos.y;
                this.pathIndex--;
                
                if (this.pathIndex <= 0) {
                    // ベースに到達（スタート地点）
                    this.reachedBase = true;
                    this.active = false;
                    createExplosion(this.x, this.y, this.color, 20);
                }
            } else {
                // ターゲットポイントに向かって移動
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        } else {
            // pathIndex = 0に到達
            this.reachedBase = true;
            this.active = false;
        }

        // 敵との接触判定（ダメージのみ、消滅しない）
        for (let enemy of enemies) {
            if (!enemy.active) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < this.radius + enemy.radius) {
                // 敵にダメージ（1フレームに1回のみダメージを与えるため、フラグを使用）
                if (!enemy.hitByZombie) {
                    enemy.hp -= this.damage;
                    createDamageText(enemy.x, enemy.y, this.damage);
                    if (enemy.hp <= 0) {
                        enemy.active = false;
                    }
                    enemy.hitByZombie = true;
                    // 短時間後にフラグをリセット
                    setTimeout(() => {
                        if (enemy) enemy.hitByZombie = false;
                    }, 100);
                }
                // ゾンビは消滅しない
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // ゾンビの形（ぼろぼろの円形）
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // ゾンビマーク（ぼろぼろ感を出す）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            const x = this.x + Math.cos(angle) * this.radius * 0.6;
            const y = this.y + Math.sin(angle) * this.radius * 0.6;
            ctx.strokeRect(x - 2, y - 2, 4, 4);
        }

        ctx.restore();
    }
}

// Warp Effect Class（ワープのアニメーション）
class WarpEffect {
    constructor(startX, startY, endX, endY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.progress = 0;
        this.active = true;
        this.rings = [];
        
        // 複数のリングを生成
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                radius: 10 + i * 15,
                alpha: 1.0 - i * 0.2
            });
        }
    }

    update() {
        this.progress += 0.05 * dt;
        
        if (this.progress >= 1.0) {
            this.active = false;
        }

        // リングのアニメーション
        for (let ring of this.rings) {
            ring.radius += 2 * dt;
            ring.alpha -= 0.02 * dt;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // スタート地点のワープエフェクト
        for (let ring of this.rings) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${ring.alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.startX, this.startY, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // エンド地点のワープエフェクト
        for (let ring of this.rings) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${ring.alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.endX, this.endY, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // スタートとエンドを繋ぐライン
        const alpha = Math.max(0, 1.0 - this.progress);
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }
}

// Mine Class
class Mine {
    constructor(x, y, damage, tower, specialType = null) {
        // Animation properties
        this.targetX = x;
        this.targetY = y;
        this.x = tower.x; // Start from tower position
        this.y = tower.y;
        this.animationProgress = 0; // 0 to 1
        this.animationDuration = 0.5; // 0.5 seconds
        this.isAnimating = true;
        
        this.damage = damage;
        this.tower = tower;
        this.specialType = specialType; // 'spike' or 'incendiary'
        this.radius = 8;
        this.active = true;
        this.pulseAngle = Math.random() * Math.PI * 2; // ランダムな開始角度
        this.rotation = Math.random() * Math.PI * 2; // 地雷の傾き（ランダム）
        this.triggerRadius = 15; // 起爆範囲
        
        // 進化に応じて爆発範囲を調整
        if (specialType === 'spike' || specialType === 'incendiary') {
            this.explosionRadius = 90; // big-sweeper以降は爆発範囲が広い
            this.radius = 10; // 地雷自体も少し大きく
        } else if (specialType === 'big') {
            this.explosionRadius = 75; // big-sweeperは中程度
            this.radius = 9;
        } else {
            this.explosionRadius = 60; // 通常のsweeper
        }
    }

    update() {
        this.pulseAngle += 0.05 * dt;
        
        // Animation update (easeOutQuart)
        if (this.isAnimating) {
            this.animationProgress += (dt / 60) / this.animationDuration;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
                this.x = this.targetX;
                this.y = this.targetY;
            } else {
                // easeOutQuart: 1 - (1-t)^4
                const t = this.animationProgress;
                const eased = 1 - Math.pow(1 - t, 4);
                this.x = this.tower.x + (this.targetX - this.tower.x) * eased;
                this.y = this.tower.y + (this.targetY - this.tower.y) * eased;
            }
            // Don't check collision during animation
            return;
        }
        
        // 敵との衝突判定
        for (let enemy of enemies) {
            if (!enemy.active) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.triggerRadius + enemy.radius) {
                this.explode();
                return;
            }
        }
    }

    explode() {
        if (!this.active) return;
        this.active = false;

        // 爆発エフェクトの色を進化に応じて変更
        let particleColor = '#ff8800';
        if (this.specialType === 'spike') particleColor = '#ff9900';
        if (this.specialType === 'incendiary') particleColor = '#ff4400';
        
        // 爆発エフェクト
        const particleCount = this.specialType ? 20 : 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            particles.push(new Particle(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                particleColor,
                this.specialType ? 10 : 8
            ));
        }

        // Spike-Sweeper: とげを周りにまき散らす
        if (this.specialType === 'spike') {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + this.rotation; // 地雷の傾きを加算
                const spikeSpeed = 6 + Math.random() * 2;
                const vx = Math.cos(angle) * spikeSpeed;
                const vy = Math.sin(angle) * spikeSpeed;
                
                // スパイク専用のProjectile生成
                // 引数: (x, y, target, damage, color, type, special, offsetAngle)
                // spikeの場合: target=vx, damage=vy, color=actualDamage, type=actualColor, special='spike'
                const spike = new Projectile(
                    this.x,                 // x
                    this.y,                 // y
                    vx,                     // target (実際はvx)
                    vy,                     // damage (実際はvy)
                    this.damage * 0.5,      // color (実際はdamage)
                    '#ffaa00',              // type (実際はcolor)
                    'spike',                // special
                    0                       // offsetAngle
                );
                projectiles.push(spike);
            }
        }

        // 爆発範囲内の敵にダメージ
        for (let enemy of enemies) {
            if (!enemy.active) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.explosionRadius) {
                // Let takeDamage handle damage text display
                enemy.takeDamage(this.damage, null, true, false, false);
                
                // Incendiary-Sweeper: 延焼状態を付与 (doesn't work on shielded enemies)
                if (this.specialType === 'incendiary') {
                    const shielderImmune = (enemy.type === 'shielder' && enemy.hasShield && enemy.shield > 0);
                    
                    if (!shielderImmune) {
                        const burnBonus = getSkillBonus('burn_damage');
                        if (!enemy.isBurning) {
                            enemy.isBurning = true;
                            enemy.burnDuration = 180; // 3秒間燃焼
                            enemy.burnDamage = Math.floor(this.damage * 0.15 * burnBonus); // 15% burn damage
                        } else {
                            // すでに燃焼中なら持続時間をリセット
                            enemy.burnDuration = Math.max(enemy.burnDuration, 180);
                            enemy.burnDamage = Math.max(enemy.burnDamage, Math.floor(this.damage * 0.15 * burnBonus));
                        }
                    }
                }
            }
        }

        playSound('enemyDestroy');
    }

    draw(ctx) {
        if (!this.active) return;

        // Calculate scale based on animation progress
        let scale = 1;
        if (this.isAnimating) {
            // Start at 0.3, end at 1.0 (easeOutQuart)
            const t = this.animationProgress;
            const eased = 1 - Math.pow(1 - t, 4);
            scale = 0.3 + (0.7 * eased);
        }

        ctx.save();
        
        // パルスエフェクト
        const pulse = Math.sin(this.pulseAngle) * 0.3 + 0.7;
        
        // 外側の警告円（進化形に応じて色を変更）
        let warningColor = 'rgba(255, 136, 0, ';
        if (this.specialType === 'spike') warningColor = 'rgba(255, 153, 0, ';
        if (this.specialType === 'incendiary') warningColor = 'rgba(255, 68, 0, ';
        
        ctx.strokeStyle = warningColor + (pulse * 0.5) + ')';
        ctx.lineWidth = 2 * scale; // Scale line width
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.triggerRadius * scale, 0, Math.PI * 2); // Scale radius
        ctx.stroke();
        
        // 地雷本体の回転を適用
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(scale, scale); // Apply scale to body
        
        // 地雷本体（五角形）の色を進化形に応じて変更
        if (this.specialType === 'spike') {
            ctx.fillStyle = '#ff9900';
            ctx.strokeStyle = '#cc6600';
        } else if (this.specialType === 'incendiary') {
            ctx.fillStyle = '#ff4400';
            ctx.strokeStyle = '#cc2200';
        } else if (this.specialType === 'big') {
            ctx.fillStyle = '#ffbb00';
            ctx.strokeStyle = '#cc8800';
        } else {
            ctx.fillStyle = '#ffcc00';
            ctx.strokeStyle = '#cc9900';
        }
        
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * this.radius; // this.xを削除
            const y = Math.sin(angle) * this.radius; // this.yを削除
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Spike-Sweeper: とげを描画
        if (this.specialType === 'spike') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * this.radius; // this.xを削除
                const y = Math.sin(angle) * this.radius; // this.yを削除
                const extX = Math.cos(angle) * (this.radius + 4); // this.xを削除
                const extY = Math.sin(angle) * (this.radius + 4); // this.yを削除
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(extX, extY);
                ctx.stroke();
            }
        }
        
        // Incendiary-Sweeper: 炎のパルスエフェクト
        if (this.specialType === 'incendiary') {
            ctx.strokeStyle = `rgba(255, 100, 0, ${pulse * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2); // this.x, this.yを(0, 0)に変更
            ctx.stroke();
        }
        
        // 中心の点
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2); // this.x, this.yを(0, 0)に変更
        ctx.fill();
        
        ctx.restore();
    }
}


// Freeze Zone Class
class FreezeZone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 80;
        this.duration = 300; // 5 seconds
        this.slowAmount = 0.6; // 60% slow
    }

    update() {
        this.duration -= dt;
        if (this.duration <= 0) this.duration = 0;
        
        // Apply slow to enemies in range (except shielded enemies)
        for (let e of enemies) {
            if (!e.active) continue;
            
            // Shielder immunity check
            const shielderImmune = (e.type === 'shielder' && e.hasShield && e.shield > 0);
            if (shielderImmune) continue;
            
            let dx = e.x - this.x;
            let dy = e.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= this.radius) {
                const wasNotFrozen = e.slowDuration <= 0; // Check if enemy was not frozen
                e.slowAmount = this.slowAmount;
                e.slowDuration = Math.max(e.slowDuration, 30);
                if (wasNotFrozen) playSound('ice'); // Play ice sound only if newly frozen
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.3 * (this.duration / 300);
        ctx.fillStyle = '#0099ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.6 * (this.duration / 300);
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

// Stun Zone Class
class StunZone {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 60; // Medium range
        this.duration = 120; // 2 seconds
        this.stunChance = 0.5; // 50% chance per frame
    }

    update() {
        this.duration -= dt;
        if (this.duration <= 0) this.duration = 0;
        
        // Apply stun chance to enemies in range (except shielded enemies)
        for (let e of enemies) {
            if (!e.active || e.stunDuration > 0) continue;
            
            // Shielder immunity check
            const shielderImmune = (e.type === 'shielder' && e.hasShield && e.shield > 0);
            if (shielderImmune) continue;
            
            let dx = e.x - this.x;
            let dy = e.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= this.radius && Math.random() < (this.stunChance / 60) * dt) { // Per-frame chance adjusted by dt
                e.stunDuration = 45; // 0.75 second stun
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.4 * (this.duration / 120);
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.7 * (this.duration / 120);
        ctx.strokeStyle = '#ffff88';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw lightning bolts
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + (Date.now() / 100);
            const x = this.x + Math.cos(angle) * this.radius * 0.7;
            const y = this.y + Math.sin(angle) * this.radius * 0.7;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class LightningStrike {
    constructor(x, y, target, damage, special) {
        this.startX = x;
        this.startY = y;
        this.target = target;
        this.damage = damage;
        this.special = special;
        this.active = true;
        
        // Check for surge activation
        const surgeChance = getSkillBonus('surge_chance');
        this.isSurge = surgeChance > 0 && Math.random() < surgeChance;
        
        // Surge multiplies damage and stun chance
        if (this.isSurge) {
            this.damage *= 1.5; // 1.5x damage
            this.stunChance = 0.6; // 60% stun chance (vs 30% normal)
        } else {
            this.stunChance = 0.3; // 30% normal stun chance
        }
        
        // Phase 1: Lightning rises from tower to top of screen
        this.phase = 1;
        this.riseY = y;
        this.riseSpeed = 15; // Speed going up
        
        // Phase 2: Lightning strikes down on enemy
        this.strikeY = -50; // Start from above screen
        this.strikeSpeed = 20; // Speed going down
    }

    update() {
        if (this.phase === 1) {
            // Rise phase
            this.riseY -= this.riseSpeed * dt;
            if (this.riseY <= -50) {
                // Switch to strike phase
                this.phase = 2;
            }
        } else if (this.phase === 2) {
            // Strike phase
            if (!this.target || !this.target.active) {
                this.active = false;
                return;
            }
            
            this.strikeY += this.strikeSpeed * dt;
            
            // Check if lightning reached target
            if (this.strikeY >= this.target.y) {
                // Apply damage
                this.applyDamage();
                this.active = false;
                
                // Create explosion effect
                createExplosion(this.target.x, this.target.y, '#ffff00', 15);
            }
        }
    }

    applyDamage() {
        if (!this.target || !this.target.active) return;
        
        // Gear-Third overclock gauge increase (only when not overheating)
        if (this.sourceTower && this.sourceTower.type === 'gear-third' && !this.sourceTower.overheatActive) {
            this.sourceTower.overclockGauge = Math.min(100, this.sourceTower.overclockGauge + 5);
            
            // Activate overclock when gauge is full
            if (this.sourceTower.overclockGauge >= 100 && !this.sourceTower.overclockActive) {
                this.sourceTower.overclockActive = true;
                this.sourceTower.overclockDuration = 180; // 3 seconds
                this.sourceTower.overclockGauge = 0; // Reset gauge
            }
        }
        
        // Store enemy info before applying damage (for necromancy)
        const enemyWillDie = (this.target.hp - this.damage) <= 0;
        const enemyX = this.target.x;
        const enemyY = this.target.y;
        const enemyPath = this.target.path;
        const enemyPathIndex = this.target.pathIndex;
        const enemyRadius = this.target.radius;
        
        this.target.hp -= this.damage;
        createDamageText(this.target.x, this.target.y, this.damage);
        
        // Apply stun effect for lightning
        if (this.special === 'lightning') {
            if (Math.random() < this.stunChance) { // Use surge-modified stun chance
                this.target.stunDuration = 60; // 1 second stun
            }
        } else if (this.special === 'lightning-zone') {
            // Create stun zone
            stunZones.push(new StunZone(this.target.x, this.target.y));
        } else if (this.special === 'burn-lightning') {
            // Use surge-modified stun chance
            if (Math.random() < this.stunChance) {
                this.target.stunDuration = 60; // 1 second stun
            }
            // Always apply burn
            const burnBonus = getSkillBonus('burn_damage');
            this.target.burnDamage = Math.floor(this.damage * 0.12 * burnBonus); // 12% burn damage
            this.target.burnDuration = 60;
            // Visual effect - mix of yellow and orange
            createExplosion(this.target.x, this.target.y, '#ffaa00', 12);
            createExplosion(this.target.x, this.target.y, '#ffff00', 8);
        } else if (this.special === 'warp') {
            // Warp enemy backwards on path (chance-based) - doesn't work on shielded enemies
            const shielderImmune = (this.target.type === 'shielder' && this.target.hasShield && this.target.shield > 0);
            
            if (!shielderImmune) {
                const warpChance = getSkillBonus('warp_chance');
                if (Math.random() < warpChance && this.target.pathIndex > 0) {
                    const oldX = this.target.x;
                    const oldY = this.target.y;
                    this.target.pathIndex = Math.max(0, this.target.pathIndex - 3);
                    const newPos = this.target.path[this.target.pathIndex];
                    this.target.x = newPos.x;
                    this.target.y = newPos.y;
                    // ワープエフェクトを追加
                    warpEffects.push(new WarpEffect(oldX, oldY, newPos.x, newPos.y));
                    // Play warp sound
                    playSound("warp");
                }
            }
            createExplosion(this.target.x, this.target.y, '#00ffff', 15);
        } else if (this.special === 'necromancy') {
            // 敵が死んだらゾンビとして蘇らせる
            if (enemyWillDie) {
                // ゾンビを生成（逆方向に移動し、敵にダメージを与える）
                zombies.push(new Zombie(
                    enemyX, 
                    enemyY, 
                    enemyPath, 
                    enemyPathIndex, 
                    this.damage * 0.5, // ゾンビのダメージ
                    enemyRadius
                ));
                createDamageText(enemyX, enemyY, 'ZOMBIE!', false, false);
            }
            createExplosion(this.target.x, this.target.y, '#aa00ff', 12);
        } else if (this.special === 'chain-lightning') {
            // Chain to nearby enemies
            stunZones.push(new StunZone(this.target.x, this.target.y));
            
            // Find nearby enemies and damage them
            for (let e of enemies) {
                if (!e.active || e === this.target) continue;
                let dx = e.x - this.target.x;
                let dy = e.y - this.target.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist <= 100) { // 100px radius
                    e.hp -= this.damage * 0.5; // 50% damage to chained enemies
                    createDamageText(e.x, e.y, Math.floor(this.damage * 0.5));
                    if (Math.random() < 0.3) {
                        e.stunDuration = 45; // 0.75 second stun
                    }
                    createExplosion(e.x, e.y, '#ffffcc', 8);
                }
            }
        }
        
        if (this.target.hp <= 0) {
            this.target.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Special color for different rod types
        let color = '#ffff00'; // Default yellow
        if (this.special === 'warp') {
            color = '#00ffff'; // Cyan for warp
        } else if (this.special === 'necromancy') {
            color = '#aa00ff'; // Purple for necromancy
        } else if (this.special === 'chain-lightning') {
            color = '#ffffcc'; // Light yellow for chain
        } else if (this.special === 'burn-lightning') {
            color = '#ffaa00'; // Orange-yellow for burn
        } else if (this.isSurge) {
            color = '#ff00ff'; // Purple for surge
        }
        
        const lineWidth = this.isSurge ? 7 : 4;
        const shadowBlur = this.isSurge ? 25 : 15;
        
        if (this.phase === 1) {
            // Draw lightning rising from tower
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = color;
            
            ctx.beginPath();
            // Draw jagged lightning from tower to current rise position
            const segments = 8;
            const segmentHeight = (this.startY - this.riseY) / segments;
            let currentX = this.startX;
            let currentY = this.startY;
            
            ctx.moveTo(currentX, currentY);
            for (let i = 0; i < segments; i++) {
                currentY -= segmentHeight;
                currentX += (Math.random() - 0.5) * 15;
                ctx.lineTo(currentX, currentY);
            }
            ctx.stroke();
        } else if (this.phase === 2 && this.target && this.target.active) {
            // Draw lightning striking down on target
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth + 1;
            ctx.shadowBlur = shadowBlur + 5;
            ctx.shadowColor = color;
            
            ctx.beginPath();
            // Draw jagged lightning from top to current strike position
            const segments = 10;
            const segmentHeight = (this.strikeY - (-50)) / segments;
            let currentX = this.target.x;
            let currentY = -50;
            
            ctx.moveTo(currentX, currentY);
            for (let i = 0; i < segments; i++) {
                currentY += segmentHeight;
                currentX += (Math.random() - 0.5) * 20;
                ctx.lineTo(currentX, currentY);
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Solar Flare class for Sol-Blaster
class SolarFlare {
    constructor(x, y, angle, damage) {
        this.centerX = x;
        this.centerY = y;
        this.x = x;
        this.y = y;
        this.baseAngle = angle; // 基本方向
        this.spiralAngle = 0; // 螺旋角度
        this.damage = damage;
        this.speed = 0.8; // 速度を遅く
        this.spiralSpeed = 0.15; // 螺旋の回転速度
        this.distanceFromCenter = 0; // 中心からの距離
        this.radius = 15;
        this.life = 120; // フレアの生存時間（約2秒）
        this.active = true;
        this.color = '#ffaa00';
        this.glowIntensity = 1.0;
    }

    update() {
        // 円を描きながら外へ移動
        this.spiralAngle += this.spiralSpeed;
        this.distanceFromCenter += this.speed;
        
        // 螺旋半径（距離に応じて大きくなる）
        const spiralRadius = Math.min(this.distanceFromCenter * 0.5, 50);
        
        // 基本方向 + 螺旋運動
        this.x = this.centerX + Math.cos(this.baseAngle) * this.distanceFromCenter + Math.cos(this.spiralAngle) * spiralRadius;
        this.y = this.centerY + Math.sin(this.baseAngle) * this.distanceFromCenter + Math.sin(this.spiralAngle) * spiralRadius;
        
        // Decay life
        this.life--;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        
        // Update glow intensity (pulsing effect)
        this.glowIntensity = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        
        // Check collision with enemies
        for (let enemy of enemies) {
            if (!enemy.active) continue;
            
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.radius + enemy.radius) {
                // Apply damage
                const burnBonus = getSkillBonus('burn_damage');
                const finalDamage = Math.floor(this.damage * burnBonus);
                enemy.takeDamage(finalDamage, 'burn', true);
                
                // Apply burn effect (強化された延焼)
                if (!enemy.isBurning) {
                    enemy.isBurning = true;
                    enemy.burnDuration = 180; // 3秒
                    enemy.burnDamage = Math.floor(finalDamage * 0.3 * burnBonus); // Sol-Blasterの延焼は強力
                }
                
                // Create explosion
                createExplosion(enemy.x, enemy.y, '#ff6600', 10);
                
                // Deactivate flare after hit
                this.active = false;
                break;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        gradient.addColorStop(0, `rgba(255, 170, 0, ${this.glowIntensity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${this.glowIntensity * 0.4})`);
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core
        ctx.shadowBlur = 20 * this.glowIntensity;
        ctx.shadowColor = '#ffaa00';
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// --- Main Loop ---

// Calculate chain groups for all gear towers
function calculateGearChainGroups() {
    const gearTowers = towers.filter(t => t.type === 'gear' || t.type === 'gear-second' || t.type === 'gear-third');
    if (gearTowers.length === 0) return;
    
    const minChainDist = 25;
    const maxChainDist = 45;
    
    // Build adjacency map
    const adjacency = new Map();
    for (let i = 0; i < gearTowers.length; i++) {
        adjacency.set(gearTowers[i], []);
    }
    
    // Find all connections
    for (let i = 0; i < gearTowers.length; i++) {
        for (let j = i + 1; j < gearTowers.length; j++) {
            const dx = gearTowers[i].x - gearTowers[j].x;
            const dy = gearTowers[i].y - gearTowers[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist >= minChainDist && dist <= maxChainDist) {
                adjacency.get(gearTowers[i]).push(gearTowers[j]);
                adjacency.get(gearTowers[j]).push(gearTowers[i]);
            }
        }
    }
    
    // Find connected components using BFS
    const visited = new Set();
    
    for (let tower of gearTowers) {
        if (visited.has(tower)) continue;
        
        // BFS to find all towers in this group
        const group = [];
        const queue = [tower];
        visited.add(tower);
        
        while (queue.length > 0) {
            const current = queue.shift();
            group.push(current);
            
            for (let neighbor of adjacency.get(current)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        // Set chain count for all towers in this group
        const groupSize = group.length;
        
        // Calculate bonus for Gear-Third towers (count total Gear-Third connections in group)
        let gearThirdBonus = 0;
        const gearThirdInGroup = group.filter(t => t.type === 'gear-third');
        if (gearThirdInGroup.length > 0) {
            // Count total Gear-Third to Gear-Third connections in this group
            const connectionSet = new Set();
            for (let t of gearThirdInGroup) {
                const connections = adjacency.get(t).filter(neighbor => neighbor.type === 'gear-third');
                for (let conn of connections) {
                    // Use sorted pair to avoid counting same connection twice
                    const pair = [t, conn].sort((a, b) => towers.indexOf(a) - towers.indexOf(b));
                    connectionSet.add(`${towers.indexOf(pair[0])}-${towers.indexOf(pair[1])}`);
                }
            }
            gearThirdBonus = connectionSet.size * 2;
        }
        
        // Apply the same chain count to all towers in the group
        const baseChainCount = groupSize + gearThirdBonus;
        for (let t of group) {
            // Apply chain count limit based on tower type
            const skillBonus = t.type === 'gear' ? getSkillBonus('gear_chain_limit') : 0; // Get bonus only for first form
            const maxChainCount = t.type === 'gear-third' ? 100 : (t.type === 'gear-second' ? 50 : (15 + skillBonus));
            t.chainCount = Math.min(baseChainCount, maxChainCount);
        }
    }
}

function gameLoop(timestamp) {
    // FPS limiting
    if (qualitySettings.fpsLimit > 0) {
        const targetFrameTime = 1000 / qualitySettings.fpsLimit;
        if (timestamp - lastFrameTime < targetFrameTime) {
            animationFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        lastFrameTime = timestamp;
    }
    
    // Calculate FPS
    if (lastTime > 0) {
        const delta = timestamp - lastTime;
        if (delta > 0) {
            const fps = Math.round(1000 / delta);
            currentFPS = fps;
            
            // Track min/max FPS
            fpsHistory.push(fps);
            if (fpsHistory.length > 60) fpsHistory.shift(); // Keep last 60 frames
            
            if (fpsHistory.length >= 10) {
                minFPS = Math.min(...fpsHistory);
                maxFPS = Math.max(...fpsHistory);
            }
        }
    }
    
    // Check if we should stop the loop (only when no effects are active)
    const hasActiveEffects = screenShakeDuration > 0 || damageFlashAlpha > 0 || particles.length > 0;
    
    if (!gameActive && !hasActiveEffects) {
        return; // Only stop if game is over AND no visual effects are playing
    }
    
    // Skip game logic if paused, but continue animation loop
    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Calculate delta time multiplier (1.0 = 60 FPS, 2.0 = 30 FPS, 0.5 = 120 FPS)
    dt = (deltaTime / 1000) * TARGET_FPS;

    // Update dash animation
    dashOffset = (dashOffset + 0.5 * dt) % 15;

    // Calculate gear chain groups
    calculateGearChainGroups();

    // Update screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (screenShakeDuration > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        screenShakeDuration -= dt;
        if (screenShakeDuration <= 0) screenShakeDuration = 0;
    }
    
    // Update damage flash (fade out)
    if (damageFlashAlpha > 0) {
        damageFlashAlpha -= 0.03 * dt; // Fade out speed
        if (damageFlashAlpha < 0) damageFlashAlpha = 0;
    }
    
    // Update commander active skill timers
    if (selectedCommander && gameActive) {
        // Update active skill duration
        if (activeSkillDuration > 0) {
            activeSkillDuration -= dt;
            if (activeSkillDuration <= 0) {
                activeSkillDuration = 0;
                activeSkillActive = false;
                // Start cooldown after effect ends
                const commander = commanders[selectedCommander];
                activeSkillCooldown = commander.activeSkill.cooldown;
                
                // Reset whiteout time for all enemies when effect ends
                if (selectedCommander === 'reika') {
                    for (let enemy of enemies) {
                        if (enemy.active) {
                            enemy.whiteoutTime = 0;
                        }
                    }
                }
            }
            
            // Apply continuous skill effects
            applyCommanderActiveSkillEffects();
        }
        
        // Update cooldown
        if (activeSkillCooldown > 0) {
            activeSkillCooldown -= dt;
            if (activeSkillCooldown <= 0) {
                activeSkillCooldown = 0;
            }
        }
        
        // Update skill button display
        updateSkillButtonDisplay();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply camera offset, zoom, and screen shake
    ctx.save();
    ctx.translate(cameraOffsetX + shakeX, cameraOffsetY + shakeY);
    ctx.scale(zoomLevel, zoomLevel);

    drawMap(ctx);

    // Draw placement preview
    if (selectedTowerType && !tempTowerType) {
        let info = TOWER_TYPES[selectedTowerType];
        
        // Apply grid snap to preview position
        const { x: previewX, y: previewY } = snapToGrid(mouseX, mouseY);
        
        const canPlace = canPlaceTower(previewX, previewY);
        const cost = getGearTowerCost(selectedTowerType);
        const hasEnoughMoney = money >= cost;
        
        // Determine color based on placement validity
        let previewColor;
        if (!hasEnoughMoney) {
            previewColor = 'rgba(128, 128, 128, 0.3)'; // Gray if not enough money
        } else if (canPlace) {
            previewColor = 'rgba(255, 255, 255, 0.3)'; // White if placeable
        } else {
            previewColor = 'rgba(255, 0, 0, 0.5)'; // Red if not placeable
        }
        
        ctx.beginPath();
        ctx.strokeStyle = previewColor;
        ctx.fillStyle = canPlace && hasEnoughMoney ? 'rgba(255, 255, 255, 0.1)' : (hasEnoughMoney ? 'rgba(255, 0, 0, 0.2)' : 'rgba(128, 128, 128, 0.1)');
        ctx.arc(previewX, previewY, info.range, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = canPlace && hasEnoughMoney ? info.color : (hasEnoughMoney ? '#ff0000' : '#888888');
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(previewX, previewY, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    if (gameActive && waveActive && enemiesToSpawn > 0) {
        if (timestamp - spawnTimer > spawnInterval) {
            let possibleTypes = ['normal'];
            if (wave >= 2) possibleTypes.push('fast');
            if (wave >= 4) possibleTypes.push('tank');
            
            // Endless mode: Add rampage enemies from wave 100
            if (endlessMode && wave >= 100) {
                possibleTypes.push('rampage');
            }
            
            // Endless mode: Add shielder enemies from wave 50 (10 slots)
            if (endlessMode && wave >= 50) {
                possibleTypes.push('shielder');
            }
            
            let type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            
            // Calculate spawn cost based on wave and enemy type
            let spawnCost = 1;
            if (type === 'normal' || type === 'fast' || type === 'tank') {
                spawnCost = Math.max(1, Math.floor((wave - 1) / 100) + 1);
            } else if (type === 'rampage') {
                const rampageMultiplier = Math.max(1, Math.floor(wave / 100));
                spawnCost = 5 * rampageMultiplier;
            } else if (type === 'shielder') {
                const shielderMultiplier = Math.max(1, Math.floor((wave - 50) / 100) + 1);
                spawnCost = 10 * shielderMultiplier;
            }
            
            // Check if we have enough spawn slots
            if (enemiesToSpawn >= spawnCost) {
                enemies.push(new Enemy(path, type));
                enemiesToSpawn -= spawnCost;
            } else if (type === 'shielder' || type === 'rampage') {
                // Not enough slots for shielder/rampage, try spawning normal instead
                type = 'normal';
                spawnCost = Math.max(1, Math.floor((wave - 1) / 100) + 1);
                if (enemiesToSpawn >= spawnCost) {
                    enemies.push(new Enemy(path, type));
                    enemiesToSpawn -= spawnCost;
                }
            }
            spawnTimer = timestamp;
        }
    }
    
    // Check if we need to spawn boss (separate check to avoid blocking wave completion)
    // Calculate threshold based on wave multiplier to handle high-wave scenarios
    const maxMultiplier = Math.max(
        Math.max(1, Math.floor((wave - 1) / 100) + 1), // normal/fast/tank multiplier
        Math.max(1, Math.floor(wave / 100)), // rampage multiplier (base 5 slots)
        Math.max(1, Math.floor((wave - 50) / 100) + 1) // shielder multiplier (base 10 slots)
    );
    const spawnThreshold = maxMultiplier * 10; // Maximum possible spawn cost
    
    if (waveActive && enemiesToSpawn <= spawnThreshold && !bossSpawned && !fortressBossSpawned) {
        // In endless mode, spawn fortress boss every 50 waves
        if (endlessMode && wave % 50 === 0) {
            enemies.push(new Enemy(path, 'fortress'));
            fortressBossSpawned = true;
            totalWaveEnemies++;
            enemiesToSpawn = 0; // Reset remaining spawns
            
            // Trigger boss appearance effects
            bossShockwaveRadius = 0;
            bossShockwaveActive = true;
            screenShakeDuration = 30;
            screenShakeIntensity = 12;
        } else if (wave % 10 === 0) {
            // Boss wave: 70% normal boss, 30% storm boss
            const bossType = Math.random() < 0.7 ? 'boss' : 'storm';
            enemies.push(new Enemy(path, bossType));
            bossSpawned = true;
            totalWaveEnemies++;
            enemiesToSpawn = 0; // Reset remaining spawns
            
            // Trigger boss appearance shockwave
            bossShockwaveRadius = 0;
            bossShockwaveActive = true;
            
            // Trigger screen shake
            screenShakeDuration = 20;
            screenShakeIntensity = 8;
        } else {
            // No boss for this wave, mark as spawned to allow wave completion
            bossSpawned = true;
            enemiesToSpawn = 0; // Reset remaining spawns
        }
    }
    
    // Check for wave completion
    if (gameActive && waveActive && enemiesToSpawn <= 0 && enemies.length === 0) {
        waveActive = false;
        bossSpawned = false;
        fortressBossSpawned = false;
        wave++;
        
        // Add wave completion score in endless mode
        if (endlessMode) {
            endlessScore += wave * 50;
        }
        
        // Check for stage clear (wave 20 completed) - not in endless mode
        if (!endlessMode && wave > 20) {
            // Delay stage clear screen to let final wave celebration play
            if (!document.getElementById('stage-clear-screen').classList.contains('hidden')) {
                // Already showing clear screen, skip
            } else {
                setTimeout(() => stageClear(), 1000);
            }
        } else {
            updateUI();
            document.getElementById('nextWaveBtn').disabled = false;
            document.getElementById('nextWaveBtn').classList.remove('opacity-50');
            money += 50 + (wave * 10);
            updateUI();
            
            // Auto wave mode: automatically start next wave
            if (autoWaveMode) {
                setTimeout(() => {
                    if (!waveActive && gameActive) {
                        startWave();
                    }
                }, 2000); // 2 second delay before auto-starting next wave
            }
        }
    }

    // Update Progress Bar
    if (gameActive && waveActive && totalWaveEnemies > 0) {
        // Remaining work = unspawned + alive
        const remaining = enemiesToSpawn + enemies.length;
        const progress = 1 - (remaining / totalWaveEnemies);
        // Ensure 0 to 100%
        const pct = Math.min(100, Math.max(0, progress * 100));
        document.getElementById('waveProgressBar').style.width = `${pct}%`;
    } else if (!waveActive) {
        document.getElementById('waveProgressBar').style.width = '100%';
    }

    // Draw freeze zones and lightning strikes FIRST (background effects)
    freezeZones = freezeZones.filter(z => z.duration > 0);
    freezeZones.forEach(z => {
        z.update();
        z.draw(ctx);
    });

    lightningStrikes = lightningStrikes.filter(ls => ls.active);
    lightningStrikes.forEach(ls => {
        ls.update();
        ls.draw(ctx);
    });

    stunZones = stunZones.filter(z => z.duration > 0);
    stunZones.forEach(z => {
        z.update();
        z.draw(ctx);
    });

    towers.forEach(t => {
        // Apply Eiko's active skill: Attack speed +100%
        const attackSpeedBonus = 1 + getActiveSkillBonus('attack_speed');
        t.update(timestamp, attackSpeedBonus);
        // Pass true if this tower is the selected one
        t.draw(ctx, t === selectedTowerInstance);
    });

    // Update and draw enemies (skip logic updates if game is over)
    // Optimize enemy filtering - remove inactive enemies in place
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].active) {
            enemies.splice(i, 1);
        }
    }
    
    // Only sort if graphics quality is not low (sorting is expensive)
    if (qualitySettings.graphics !== 'low') {
        enemies.sort((a,b) => a.y - b.y);
    }
    
    for (let i = 0; i < enemies.length; i++) {
        if (gameActive) enemies[i].update();
        enemies[i].draw(ctx);
    }

    // Update and draw projectiles (skip logic updates if game is over)
    // Optimize projectile filtering
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!projectiles[i].active) {
            projectiles.splice(i, 1);
        }
    }
    for (let i = 0; i < projectiles.length; i++) {
        if (gameActive) projectiles[i].update();
        projectiles[i].draw(ctx);
    }

    // Always update and draw particles (visual effects continue)
    // Limit particle count for performance
    const maxParticles = isMobileDevice ? 50 : (qualitySettings.graphics === 'low' ? 100 : qualitySettings.graphics === 'medium' ? 300 : 500);
    if (particles.length > maxParticles) {
        particles = particles.slice(-maxParticles); // Keep only the most recent particles
    }
    // Optimize particle filtering
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Draw particles - skip some in low quality mode or on mobile
    const particleStep = (qualitySettings.graphics === 'low' || isMobileDevice) ? 2 : 1;
    for (let i = 0; i < particles.length; i += particleStep) {
        particles[i].update();
        particles[i].draw(ctx);
    }

    damageTexts = damageTexts.filter(d => d.life > 0);
    damageTexts.forEach(d => {
        d.update();
        d.draw(ctx);
    });

    // Update and draw solar flares
    solarFlares = solarFlares.filter(f => f.active);
    solarFlares.forEach(f => {
        if (gameActive) f.update();
        f.draw(ctx);
    });

    // Update and draw zombies
    zombies = zombies.filter(z => z.active);
    zombies.forEach(z => {
        if (gameActive) z.update();
        z.draw(ctx);
    });

    // Update and draw warp effects
    warpEffects = warpEffects.filter(w => w.active);
    warpEffects.forEach(w => {
        w.update();
        w.draw(ctx);
    });

    // Update and draw mines
    mines = mines.filter(m => m.active);
    mines.forEach(m => {
        if (gameActive) m.update();
        m.draw(ctx);
    });

    // Update and draw elliptical waves
    ellipticalWaves = ellipticalWaves.filter(w => w.life > 0);
    ellipticalWaves.forEach(w => {
        w.update();
        w.draw(ctx);
    });

    // Draw boss shockwave effect
    if (bossShockwaveActive) {
        const boss = enemies.find(e => e.isBoss && e.active);
        if (boss) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${1 - (bossShockwaveRadius / 300)})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, bossShockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = `rgba(255, 100, 0, ${1 - (bossShockwaveRadius / 300)})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, bossShockwaveRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            bossShockwaveRadius += 8;
            if (bossShockwaveRadius > 300) {
                bossShockwaveActive = false;
            }
        } else {
            bossShockwaveActive = false;
        }
    }

    // Draw temporary tower with confirmation buttons (draw last so it's on top)
    if ((tempTowerType && tempTowerX !== null && tempTowerY !== null) || (tempTowerType && showPreviewWithShift)) {
        // Use mouse position if only preview mode
        const previewX = (tempTowerX !== null) ? tempTowerX : mouseX;
        const previewY = (tempTowerY !== null) ? tempTowerY : mouseY;
        const isPreviewOnly = showPreviewWithShift && tempTowerX === null;
        let info = TOWER_TYPES[tempTowerType];
        const canPlace = canPlaceTower(previewX, previewY);
        const cost = getGearTowerCost(tempTowerType);
        const hasEnoughMoney = money >= cost;
        const canConfirm = canPlace && hasEnoughMoney && !isPreviewOnly;
        
        // Draw range preview
        ctx.beginPath();
        ctx.strokeStyle = canConfirm ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = canConfirm ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        ctx.arc(previewX, previewY, info.range, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Draw temporary tower
        ctx.fillStyle = canConfirm ? info.color : '#888888';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(previewX, previewY, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw confirmation buttons (only when not preview-only mode)
        if (!isPreviewOnly) {
            const buttonSize = 30;
            const buttonY = previewY + 35;
            
            // Confirm button (✓)
            ctx.fillStyle = canConfirm ? '#00ff00' : '#444444';
            ctx.strokeStyle = canConfirm ? '#00ff00' : '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(previewX - 20, buttonY, buttonSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = canConfirm ? '#000000' : '#333333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(previewX - 27, buttonY);
            ctx.lineTo(previewX - 22, buttonY + 5);
            ctx.lineTo(previewX - 13, buttonY - 5);
            ctx.stroke();
        
            // Cancel button (×)
            ctx.fillStyle = '#ff0000';
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(previewX + 20, buttonY, buttonSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(previewX + 15, buttonY - 5);
            ctx.lineTo(previewX + 25, buttonY + 5);
            ctx.moveTo(previewX + 25, buttonY - 5);
            ctx.lineTo(previewX + 15, buttonY + 5);
            ctx.stroke();
        }
    }

    // Restore camera transform
    ctx.restore();

    // Draw boss HP bar at top of screen (fixed position, not affected by camera)
    const boss = enemies.find(e => e.isBoss && e.active);
    if (boss) {
        drawBossHPBar(ctx, boss);
    }
    
    // Draw damage flash overlay (full screen red flash)
    if (damageFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageFlashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update FPS counter HTML element
    const fpsCounter = document.getElementById('fps-counter');
    const debugInfo = document.getElementById('debug-info');
    
    if (fpsCounter) {
        if (qualitySettings.showFPS && fpsHistory.length > 0) {
            fpsCounter.textContent = `FPS ${currentFPS} [↑${maxFPS} ↓${minFPS}]`;
            fpsCounter.style.display = 'block';
        } else {
            fpsCounter.style.display = 'none';
        }
    }
    
    // Update debug info (separate from FPS)
    if (debugInfo) {
        if (debugMode) {
            // Calculate DPS every second
            if (timestamp - lastDPSUpdateTime >= 1000) {
                currentDPS = totalDamageDealt;
                totalDamageDealt = 0;
                lastDPSUpdateTime = timestamp;
            }
            
            const objectInfo = `E:${enemies.filter(e => e.active).length} ` +
                `T:${towers.length} ` +
                `P:${projectiles.filter(p => p.active).length} ` +
                `M:${mines.filter(m => m.active).length} ` +
                `Pa:${particles.length} ` +
                `DPS:${currentDPS}`;
            debugInfo.textContent = objectInfo;
            debugInfo.style.display = 'block';
        } else {
            debugInfo.style.display = 'none';
        }
    }
    
    // Update upgrade panel dynamically if a tower is selected
    if (selectedTowerInstance) {
        updateUpgradePanel();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function drawMap(ctx) {
    const stageShape = stageFieldShapes[currentStage];
    
    // Draw field boundary (only in placement mode)
    if (selectedTowerType || (tempTowerType && tempTowerX !== null && tempTowerY !== null)) {
        // Check if hovering outside field
        let isOutsideField;
        if (stageShape && stageShape.customPlayableZones) {
            isOutsideField = true;
            for (let zone of stageShape.customPlayableZones) {
                if (mouseX >= zone.x && mouseX <= zone.x + zone.width &&
                    mouseY >= zone.y && mouseY <= zone.y + zone.height) {
                    isOutsideField = false;
                    break;
                }
            }
        } else {
            isOutsideField = mouseX < FIELD_MARGIN || mouseX > FIELD_WIDTH + FIELD_MARGIN ||
                           mouseY < FIELD_MARGIN || mouseY > FIELD_HEIGHT + FIELD_MARGIN;
        }
        
        // Set opacity based on hover state
        const opacity = isOutsideField ? 0.8 : 0.3;
        ctx.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -dashOffset; // Animate the dash
        
        // Draw custom field shape or default rectangle
        // NOTE: 赤破線枠
        if (stageShape && stageShape.customPlayableZones) {
            // Draw as a connected path for Stage 2 (L-shape)
            if (currentStage === 3) { 
                ctx.beginPath();
                ctx.moveTo(50, 50);
                ctx.lineTo(1250, 50);
                ctx.lineTo(1250, 850);
                ctx.lineTo(50, 850);
                ctx.lineTo(50, 50); // Close shape
                ctx.stroke();
            } else
            if (currentStage === 2) {
                ctx.beginPath();
                // Start from bottom-left of protrusion
                ctx.moveTo(FIELD_MARGIN, FIELD_HEIGHT + FIELD_MARGIN);
                ctx.lineTo(FIELD_MARGIN, FIELD_HEIGHT - FIELD_HEIGHT + FIELD_MARGIN);
                ctx.lineTo(FIELD_WIDTH + FIELD_MARGIN, FIELD_MARGIN);
                ctx.lineTo(FIELD_WIDTH + FIELD_MARGIN, FIELD_HEIGHT - FIELD_MARGIN * 3);
                ctx.lineTo(FIELD_MARGIN + FIELD_MARGIN * 5 - 10, FIELD_HEIGHT - FIELD_MARGIN * 3);
                ctx.lineTo(FIELD_MARGIN + FIELD_MARGIN * 5 - 10, FIELD_HEIGHT + FIELD_MARGIN);
                ctx.lineTo(FIELD_MARGIN, FIELD_HEIGHT + FIELD_MARGIN);
                ctx.stroke();
            } else {
                // Default: draw each zone separately
                for (let zone of stageShape.customPlayableZones) {
                    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
                }
            }
        } else {
            ctx.strokeRect(FIELD_MARGIN, FIELD_MARGIN, FIELD_WIDTH, FIELD_HEIGHT);
        }
        
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }
    
    // Draw playable area background
    ctx.fillStyle = 'rgba(0, 50, 100, 0.1)';
    if (stageShape && stageShape.customPlayableZones) {
        for (let zone of stageShape.customPlayableZones) {
            ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        }
    } else {
        ctx.fillRect(FIELD_MARGIN, FIELD_MARGIN, FIELD_WIDTH, FIELD_HEIGHT);
    }
    
    // Draw grid if enabled and in placement mode, or when pasting with Shift+Space
    const shouldShowGrid = (gridSnapEnabled && selectedTowerType) || showGridWhilePasting;
    if (shouldShowGrid) {
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.2)';
        ctx.lineWidth = 1;
        
        if (stageShape && stageShape.customPlayableZones) {
            // Draw grid for each custom zone
            for (let zone of stageShape.customPlayableZones) {
                // Vertical lines
                for (let x = zone.x; x <= zone.x + zone.width; x += GRID_SIZE) {
                    ctx.beginPath();
                    ctx.moveTo(x, zone.y);
                    ctx.lineTo(x, zone.y + zone.height);
                    ctx.stroke();
                }
                // Horizontal lines
                for (let y = zone.y; y <= zone.y + zone.height; y += GRID_SIZE) {
                    ctx.beginPath();
                    ctx.moveTo(zone.x, y);
                    ctx.lineTo(zone.x + zone.width, y);
                    ctx.stroke();
                }
            }
        } else {
            // Vertical lines
            for (let x = FIELD_MARGIN; x <= FIELD_WIDTH + FIELD_MARGIN; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, FIELD_MARGIN);
                ctx.lineTo(x, FIELD_HEIGHT + FIELD_MARGIN);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = FIELD_MARGIN; y <= FIELD_HEIGHT + FIELD_MARGIN; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(FIELD_MARGIN, y);
                ctx.lineTo(FIELD_WIDTH + FIELD_MARGIN, y);
                ctx.stroke();
            }
        }
    }
    
    if (path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111122';
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0088aa';
        ctx.stroke();
    }

    if (path.length > 0 && !baseDestroyed) {
        let end = path[path.length - 1];
        ctx.fillStyle = '#4488ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0088ff';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 25, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BASE', end.x, end.y);
        ctx.shadowBlur = 0;
        
        let start = path[0];
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 15, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawBossHPBar(ctx, boss) {
    const barWidth = 400;
    const barHeight = 30;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 80; // Below the top stats bar
    
    const hpPct = Math.max(0, boss.hp / boss.maxHp);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 10, barY - 10, barWidth + 20, barHeight + 20);
    
    // HP bar background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // HP bar fill with gradient
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * hpPct, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#ff6666');
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
    
    // Border
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Boss text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('⚠ BOSS ⚠', barX + barWidth / 2, barY + barHeight / 2);
    ctx.fillText('⚠ BOSS ⚠', barX + barWidth / 2, barY + barHeight / 2);
    
    // HP text
    ctx.font = 'bold 12px Orbitron';
    ctx.fillStyle = '#ffff00';
    const hpText = `${Math.floor(boss.hp)} / ${Math.floor(boss.maxHp)}`;
    ctx.strokeText(hpText, barX + barWidth / 2, barY + barHeight + 15);
    ctx.fillText(hpText, barX + barWidth / 2, barY + barHeight + 15);
    
    // Draw debuff icons to the right of the boss bar
    const iconSize = 20;
    const iconSpacing = 25;
    let iconX = barX + barWidth + 20; // Start to the right of the bar
    const iconY = barY + barHeight / 2;
    
    // Burn icon
    if (boss.burnDuration > 0) {
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', iconX, iconY);
        iconX += iconSpacing;
    }
    
    // Freeze icon
    if (boss.slowDuration > 0) {
        ctx.fillStyle = '#44aaff';
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', iconX, iconY);
        iconX += iconSpacing;
    }
    
    // Stun icon
    if (boss.stunDuration > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', iconX, iconY);
    }
}

// --- Input & UI ---

function selectTowerToBuild(type) {
    // If we select a build tool, deselect any map tower
    selectedTowerInstance = null;
    updateUpgradePanel();
    
    if (selectedTowerType === type) {
        selectedTowerType = null;
    } else {
        selectedTowerType = type;
        playSound('select'); // Play sound when selecting build mode
    }
    updateTowerButtons();
}

// Get dynamic cost for gear towers based on number already placed
function getGearTowerCost(towerType) {
    if (towerType !== 'gear' && towerType !== 'gear-second' && towerType !== 'gear-third') {
        return TOWER_TYPES[towerType].cost;
    }
    
    // Count existing gear towers
    const gearCount = towers.filter(t => t.type === 'gear' || t.type === 'gear-second' || t.type === 'gear-third').length;
    const baseCost = TOWER_TYPES[towerType].cost;
    
    // Cost increases by base cost for each gear tower
    return baseCost + (baseCost * gearCount);
}

function updateTowerButtons() {
    ['turret', 'sniper', 'blaster', 'sweeper', 'rod', 'gear'].forEach(t => {
        const btn = document.getElementById(`btn-${t}`);
        if (!btn) return;
        
        // RODは解放されるまで非表示
        if (t === 'rod') {
            if (!unlockedSkills.includes('unlock_rod')) {
                btn.style.display = 'none';
                return;
            } else {
                btn.style.display = 'flex';
            }
        }
        
        // Sweeperは解放されるまで非表示
        if (t === 'sweeper') {
            if (!unlockedSkills.includes('minesweeper')) {
                btn.style.display = 'none';
                return;
            } else {
                btn.style.display = 'flex';
            }
        }
        
        // Gearは解放されるまで非表示
        if (t === 'gear') {
            if (!unlockedSkills.includes('unlock_gear') && !unlockedSkills.includes('self_generation')) {
                btn.style.display = 'none';
                return;
            } else {
                btn.style.display = 'flex';
            }
        }
        
        const cost = getGearTowerCost(t);
        
        // Update gear cost display
        if (t === 'gear') {
            const costElement = document.getElementById('gear-cost');
            if (costElement) {
                costElement.textContent = `$${cost}`;
            }
        }
        
        if (selectedTowerType === t) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
        
        if (!debugMode && money < cost) {
            btn.classList.add('disabled');
        } else {
            btn.classList.remove('disabled');
        }
    });
}

function updateUI() {
    document.getElementById('waveDisplay').innerText = wave;
    document.getElementById('livesDisplay').innerText = debugMode ? '∞' : lives;
    document.getElementById('moneyDisplay').innerText = debugMode ? '∞' : money;
    
    // Show score in endless mode
    if (endlessMode) {
        const scoreElement = document.getElementById('endlessScoreDisplay');
        if (scoreElement) {
            scoreElement.innerText = endlessScore;
        }
    }
    
    const chipDisplayElement = document.getElementById('chipDisplay');
    if (chipDisplayElement) {
        chipDisplayElement.innerText = tempChipsThisGame; // Show temporary chips during game
    }
    
    // Debug: Show copied tower info
    if (debugMode && copiedTowerData) {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo && debugInfo.style.display === 'block') {
            const copiedInfo = ` | COPY: ${copiedTowerData.type} Lv.${copiedTowerData.level}`;
            if (!debugInfo.textContent.includes('COPY:')) {
                debugInfo.textContent += copiedInfo;
            }
        }
    }
    
    updateTowerButtons();
    updateUpgradePanel();
}

// Upgrade Logic
function updateUpgradePanel() {
    const panel = document.getElementById('upgradePanel');
    if (!selectedTowerInstance) {
        panel.classList.add('hidden');
        hideEvolutionPanel();
        return;
    }

    panel.classList.remove('hidden');
    const t = selectedTowerInstance;
    const next = t.getNextStats();
    const cost = t.getUpgradeCost();
    const sell = t.getSellPrice();

    document.getElementById('upgTitle').innerText = `${t.name} (Lv.${t.level})`;
    document.getElementById('upgDmg').innerText = t.damage;
    document.getElementById('upgNextDmg').innerText = next.damage;
    document.getElementById('upgRng').innerText = t.range;
    document.getElementById('upgNextRng').innerText = next.range;
    document.getElementById('upgCost').innerText = cost;
    document.getElementById('sellPrice').innerText = sell;
    
    // Gear tower: show chain count
    const chainInfo = document.getElementById('upgChainInfo');
    if (t.type === 'gear' || t.type === 'gear-second' || t.type === 'gear-third') {
        const chainCount = t.chainCount || 0;
        const skillBonus = t.type === 'gear' ? getSkillBonus('gear_chain_limit') : 0; // Get bonus only for first form
        const maxChain = t.type === 'gear-third' ? 100 : (t.type === 'gear-second' ? 50 : (15 + skillBonus));
        document.getElementById('upgChain').innerText = `${chainCount} / ${maxChain}`;
        chainInfo.classList.remove('hidden');
    } else {
        chainInfo.classList.add('hidden');
    }
    
    // Gear-Third: show overclock gauge
    const overclockGauge = document.getElementById('upgOverclockGauge');
    if (t.type === 'gear-third') {
        const gauge = t.overclockGauge || 0;
        const statusText = document.getElementById('upgOverclockStatus');
        const valueText = document.getElementById('upgOverclockValue');
        const bar = document.getElementById('upgOverclockBar');
        
        if (t.overheatActive) {
            statusText.innerText = 'OVERHEAT';
            statusText.style.color = '#ff4444';
            const overheatProgress = Math.floor((t.overheatDuration / 300) * 100);
            valueText.innerText = overheatProgress;
            bar.style.background = '#ff4444';
            bar.style.width = overheatProgress + '%';
        } else if (t.overclockActive) {
            statusText.innerText = 'OVERCLOCK!';
            statusText.style.color = '#ffff00';
            const overclockProgress = Math.floor((t.overclockDuration / 180) * 100);
            valueText.innerText = overclockProgress;
            bar.style.background = 'linear-gradient(90deg, #ffaa00, #ffff00)';
            bar.style.width = overclockProgress + '%';
        } else {
            statusText.innerText = 'OVERCLOCK';
            statusText.style.color = '#ffff00';
            valueText.innerText = gauge;
            bar.style.background = 'linear-gradient(90deg, #ffaa00, #ffff00)';
            bar.style.width = gauge + '%';
        }
        
        overclockGauge.classList.remove('hidden');
    } else {
        overclockGauge.classList.add('hidden');
    }

    const btn = document.getElementById('btnUpgrade');
    if (debugMode || money >= cost) {
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }

    // Show evolve button if tower can evolve
    const evolveBtn = document.getElementById('btnEvolve');
    if (t.canEvolve()) {
        evolveBtn.classList.remove('hidden');
    } else {
        evolveBtn.classList.add('hidden');
    }
}

window.showEvolutionPanel = function() {
    if (!selectedTowerInstance || !selectedTowerInstance.canEvolve()) return;
    
    const panel = document.getElementById('evolutionPanel');
    const optionsDiv = document.getElementById('evolutionOptions');
    
    // Clear previous options
    optionsDiv.innerHTML = '';
    
    // Get evolution options
    const options = selectedTowerInstance.getEvolutionOptions();
    
    // Create buttons for each option
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'evolution-btn';
        
        let specialText = '';
        if (opt.special === 'rapid-fire') specialText = '高速連射';
        else if (opt.special === 'hyper-rapid-fire') specialText = '超高速連射';
        else if (opt.special === 'spread') specialText = '拡散';
        else if (opt.special === 'splash') specialText = '範囲攻撃';
        else if (opt.special === 'giga-splash') specialText = '超範囲';
        else if (opt.special === 'burn') specialText = '延焼';
        else if (opt.special === 'chain-burn') specialText = '連鎖延焼';
        else if (opt.special === 'slow') specialText = '減速';
        else if (opt.special === 'freeze-zone') specialText = '氷結領域';
        else if (opt.special === 'pierce') specialText = '貫通';
        else if (opt.special === 'giga-pierce') specialText = '超貫通';
        else if (opt.special === 'lightning') specialText = '招雷';
        else if (opt.special === 'lightning-zone') specialText = '雷撃領域';
        else if (opt.special === 'burn-lightning') specialText = '雷焼';
        else if (opt.special === 'none') specialText = '高性能';
        
        btn.innerHTML = `${opt.name}${specialText ? `<span class="special-tag">${specialText}</span>` : ''}`;
        btn.onclick = () => evolveSelectedTower(opt.key);
        
        optionsDiv.appendChild(btn);
    });
    
    panel.classList.remove('hidden');
};

window.hideEvolutionPanel = function() {
    document.getElementById('evolutionPanel').classList.add('hidden');
};

window.evolveSelectedTower = function(evolutionType) {
    if (!selectedTowerInstance) return;
    
    selectedTowerInstance.evolve(evolutionType);
    hideEvolutionPanel();
    updateUI();
};

window.upgradeSelectedTower = function() {
    if (!selectedTowerInstance) return;
    const cost = selectedTowerInstance.getUpgradeCost();
    if (debugMode || money >= cost) {
        if (!debugMode) {
            money -= cost;
        }
        selectedTowerInstance.upgrade();
        updateUI();
    }
};

// Long press upgrade logic
let upgradeHoldInterval = null;
let upgradeHoldTimeout = null;
let isUpgrading = false; // Prevent overlapping upgrades

window.startUpgradeHold = function() {
    // Prevent starting if already upgrading
    if (isUpgrading) return;
    isUpgrading = true;
    
    // Clear any existing timers
    stopUpgradeHold();
    
    // Initial upgrade
    upgradeSelectedTower();
    
    // Start continuous upgrade after delay
    upgradeHoldTimeout = setTimeout(() => {
        upgradeHoldInterval = setInterval(() => {
            upgradeSelectedTower();
        }, 100); // Upgrade every 100ms while holding
    }, 300); // Start after 300ms hold
};

window.stopUpgradeHold = function() {
    isUpgrading = false;
    
    if (upgradeHoldTimeout) {
        clearTimeout(upgradeHoldTimeout);
        upgradeHoldTimeout = null;
    }
    if (upgradeHoldInterval) {
        clearInterval(upgradeHoldInterval);
        upgradeHoldInterval = null;
    }
};

window.sellSelectedTower = function() {
    if (!selectedTowerInstance) return;
    const towerX = selectedTowerInstance.x;
    const towerY = selectedTowerInstance.y;
    money += selectedTowerInstance.getSellPrice();
    // Remove tower
    towers = towers.filter(t => t !== selectedTowerInstance);
    selectedTowerInstance = null;
    createExplosion(towerX, towerY, '#ffffff'); // Visual feedback
    updateUI();
};

function gameOver() {
    // Don't immediately stop the game - let effects finish
    // gameActive will be set to false after showing the screen
    
    // Stop BGM
    bgm.pause();
    bgm.currentTime = 0;
    
    // Handle endless mode score
    if (endlessMode) {
        if (endlessScore > endlessBestScore) {
            endlessBestScore = endlessScore;
            localStorage.setItem('endlessBestScore', endlessBestScore);
        }
        document.getElementById('finalWave').innerText = `Wave ${wave} | Score: ${endlessScore}`;
        const bestElement = document.getElementById('bestScore');
        if (bestElement) {
            bestElement.style.display = 'block';
            bestElement.innerText = `Best Score: ${endlessBestScore}`;
        }
    } else {
        // Hide best score in normal mode
        const bestElement = document.getElementById('bestScore');
        if (bestElement) {
            bestElement.style.display = 'none';
        }
        // Add temporary chips to permanent storage
        electronicChips += tempChipsThisGame;
        saveSkillTree(); // Save to localStorage
        document.getElementById('finalWave').innerText = wave;
    }
    
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('upgradePanel').classList.add('hidden');
    
    // Set gameActive to false to stop game logic
    gameActive = false;
}

function stageClear() {
    // Don't immediately stop the game - let effects finish
    // gameActive will be set to false after showing the screen
    
    // Stop BGM
    bgm.pause();
    bgm.currentTime = 0;
    
    // Add temporary chips to permanent storage
    electronicChips += tempChipsThisGame;
    
    // Mark current stage as cleared
    const currentStageObj = stages.find(s => s.id === currentStage);
    if (currentStageObj) {
        currentStageObj.cleared = true;
    }
    
    // Unlock next stage
    const currentStageIndex = stages.findIndex(s => s.id === currentStage);
    if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
        stages[currentStageIndex + 1].unlocked = true;
        currentStage = stages[currentStageIndex + 1].id;
    }
    
    // Save progress
    saveStageProgress();
    saveSkillTree();
    
    document.getElementById('clearWave').innerText = 20;
    document.getElementById('stage-clear-screen').classList.remove('hidden');
    document.getElementById('upgradePanel').classList.add('hidden');
    
    // Set gameActive to false to stop game logic
    gameActive = false;
}

function backToStageMapFromClear() {
    document.getElementById('stage-clear-screen').classList.add('hidden');
    
    // Hide canvas and UI
    document.getElementById('gameCanvas').classList.remove('active');
    document.getElementById('uiLayer').classList.remove('active');
    
    showStageMap();
}

// Interaction
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    if (isDragging) {
        const dx = rawX - dragStartX;
        const dy = rawY - dragStartY;
        cameraOffsetX += dx;
        cameraOffsetY += dy;
        dragStartX = rawX;
        dragStartY = rawY;
    } else {
        // Apply camera offset and zoom to get world coordinates
        mouseX = (rawX - cameraOffsetX) / zoomLevel;
        mouseY = (rawY - cameraOffsetY) / zoomLevel;
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Right click or middle click for dragging
    if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        isDragging = true;
        dragStartX = rawX;
        dragStartY = rawY;
    } else if (e.button === 0) {
        // Left click for tower placement/selection
        handleInteraction(e.clientX, e.clientY);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2 || e.button === 1) {
        isDragging = false;
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent context menu on right click
});

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseXBeforeZoom = (e.clientX - rect.left - cameraOffsetX) / zoomLevel;
    const mouseYBeforeZoom = (e.clientY - rect.top - cameraOffsetY) / zoomLevel;
    
    // Zoom in or out
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * zoomFactor));
    
    // Adjust camera offset to zoom towards mouse position
    const mouseXAfterZoom = (e.clientX - rect.left - cameraOffsetX) / newZoom;
    const mouseYAfterZoom = (e.clientY - rect.top - cameraOffsetY) / newZoom;
    
    cameraOffsetX += (mouseXAfterZoom - mouseXBeforeZoom) * newZoom;
    cameraOffsetY += (mouseYAfterZoom - mouseYBeforeZoom) * newZoom;
    
    zoomLevel = newZoom;
}, {passive: false});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
        // Two finger for pinch zoom
        isDragging = true;
        isSwiping = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        lastTouchX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        lastTouchY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
        
        // Calculate initial pinch distance
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
        // Record touch start position and time
        const rect = canvas.getBoundingClientRect();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = false;
    }
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && isDragging) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const rect = canvas.getBoundingClientRect();
        const currentX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const currentY = (touch1.clientY + touch2.clientY) / 2 - rect.top;
        
        // Calculate current pinch distance for zoom
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentPinchDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (initialPinchDistance > 0) {
            // Pinch zoom
            const zoomFactor = currentPinchDistance / initialPinchDistance;
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * zoomFactor));
            
            // Adjust camera offset to zoom towards pinch center
            const pinchCenterX = (currentX - cameraOffsetX) / zoomLevel;
            const pinchCenterY = (currentY - cameraOffsetY) / zoomLevel;
            
            cameraOffsetX = currentX - pinchCenterX * newZoom;
            cameraOffsetY = currentY - pinchCenterY * newZoom;
            
            zoomLevel = newZoom;
            initialPinchDistance = currentPinchDistance;
        }
        
        // Pan
        const panDx = currentX - lastTouchX;
        const panDy = currentY - lastTouchY;
        cameraOffsetX += panDx;
        cameraOffsetY += panDy;
        
        lastTouchX = currentX;
        lastTouchY = currentY;
    } else if (e.touches.length === 1 && selectedTowerType && !tempTowerType) {
        // Single finger swipe to preview tower placement (hover mode)
        const rect = canvas.getBoundingClientRect();
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const distance = Math.hypot(currentX - touchStartX, currentY - touchStartY);
        
        if (distance > 5) {
            isSwiping = true;
            // Update mouse position for preview (apply zoom and grid snap)
            const worldX = ((currentX - rect.left) - cameraOffsetX) / zoomLevel;
            const worldY = ((currentY - rect.top) - cameraOffsetY) / zoomLevel;
            const { x: snappedX, y: snappedY } = snapToGrid(worldX, worldY);
            mouseX = snappedX;
            mouseY = snappedY;
        }
    }
}, {passive: false});

canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        if (isDragging) {
            // Was dragging, just reset
            isDragging = false;
        } else if (e.changedTouches.length === 1) {
            const rect = canvas.getBoundingClientRect();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - touchStartTime;
            const touchDistance = Math.hypot(touchEndX - touchStartX, touchEndY - touchStartY);
            
            // Check if tapping on confirmation buttons
            if (tempTowerType && tempTowerX !== null && tempTowerY !== null) {
                // Apply camera offset and zoom to get world coordinates
                const worldX = (touchEndX - rect.left - cameraOffsetX) / zoomLevel;
                const worldY = (touchEndY - rect.top - cameraOffsetY) / zoomLevel;
                const buttonY = tempTowerY + 35;
                
                // Check confirm button (left)
                const confirmDist = Math.hypot(worldX - (tempTowerX - 20), worldY - buttonY);
                if (confirmDist < 15) {
                    confirmTempTower();
                    isSwiping = false;
                    return;
                }
                
                // Check cancel button (right)
                const cancelDist = Math.hypot(worldX - (tempTowerX + 20), worldY - buttonY);
                if (cancelDist < 15) {
                    cancelTempTower();
                    isSwiping = false;
                    return;
                }
            }
            
            // If was swiping and released, create temp tower at current position
            if (isSwiping && selectedTowerType) {
                tempTowerX = mouseX;
                tempTowerY = mouseY;
                tempTowerType = selectedTowerType;
                isSwiping = false;
                return;
            }
            
            // Single tap (not swipe) - only trigger if it was a short tap and didn't move much
            if (!isSwiping && touchDuration < 500 && touchDistance < 10) {
                handleTouchInteraction(touchEndX, touchEndY);
            }
        }
        isSwiping = false;
    }
});

// Keyboard events for grid and preview toggle while pasting
window.addEventListener('keydown', (e) => {
    if (tempTowerType) {
        // Shift key for preview
        if (e.key === 'Shift') {
            showPreviewWithShift = true;
        }
        // Shift+Space for grid
        if (e.code === 'Space' && e.shiftKey) {
            e.preventDefault();
            showGridWhilePasting = true;
        }
    }
});

window.addEventListener('keyup', (e) => {
    // Reset on either Shift or Space release
    if (e.key === 'Shift') {
        showPreviewWithShift = false;
        showGridWhilePasting = false;
    }
    if (e.code === 'Space') {
        showGridWhilePasting = false;
    }
});

function confirmTempTower() {
    if (!tempTowerType || tempTowerX === null || tempTowerY === null) return;
    
    const cost = getGearTowerCost(tempTowerType);
    if ((debugMode || money >= cost) && canPlaceTower(tempTowerX, tempTowerY)) {
        towers.push(new Tower(tempTowerX, tempTowerY, tempTowerType));
        if (!debugMode) {
            money -= cost;
        }
        createExplosion(tempTowerX, tempTowerY, '#00ff00', 10);
        updateUI();
    } else {
        createExplosion(tempTowerX, tempTowerY, '#ff0000', 5);
    }
    
    // Clear temporary placement
    tempTowerX = null;
    tempTowerY = null;
    tempTowerType = null;
    showGridWhilePasting = false;
}

function cancelTempTower() {
    createExplosion(tempTowerX, tempTowerY, '#ffff00', 5);
    tempTowerX = null;
    tempTowerY = null;
    tempTowerType = null;
    showGridWhilePasting = false;
}

function handleTouchInteraction(clientX, clientY) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const rawClickX = clientX - rect.left;
    const rawClickY = clientY - rect.top;
    // Apply camera offset and zoom to get world coordinates
    const clickX = (rawClickX - cameraOffsetX) / zoomLevel;
    const clickY = (rawClickY - cameraOffsetY) / zoomLevel;

    // If in tower placement mode, create temporary tower
    if (selectedTowerType) {
        // Apply grid snap if enabled
        const { x: snappedX, y: snappedY } = snapToGrid(clickX, clickY);
        tempTowerX = snappedX;
        tempTowerY = snappedY;
        tempTowerType = selectedTowerType;
        mouseX = snappedX;
        mouseY = snappedY;
        return;
    }

    // Otherwise, handle normal selection
    let clickedTower = null;
    for(let t of towers) {
        let dist = Math.hypot(t.x - clickX, t.y - clickY);
        if (dist < 20) {
            clickedTower = t;
            break;
        }
    }

    if (clickedTower) {
        selectedTowerInstance = clickedTower;
        playSound('select'); // Play sound when selecting tower
        updateUI();
        return;
    }

    // Deselect tower if clicking empty space
    if (selectedTowerInstance) {
        selectedTowerInstance = null;
        updateUI();
    }
}

function handleInteraction(clientX, clientY) {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const rawClickX = clientX - rect.left;
    const rawClickY = clientY - rect.top;
    // Apply camera offset and zoom to get world coordinates
    const clickX = (rawClickX - cameraOffsetX) / zoomLevel;
    const clickY = (rawClickY - cameraOffsetY) / zoomLevel;
    mouseX = clickX;
    mouseY = clickY;

    // 1. Try to select existing tower
    let clickedTower = null;
    for(let t of towers) {
        let dist = Math.hypot(t.x - clickX, t.y - clickY);
        if (dist < 20) { // Click radius
            clickedTower = t;
            break;
        }
    }

    if (clickedTower) {
        // If we are in build mode, maybe we want to cancel build mode?
        // Or prioritize selection. Let's prioritize selection.
        selectedTowerType = null; // Cancel build
        selectedTowerInstance = clickedTower;
        playSound('select'); // Play sound when selecting tower
        
        // Debug feature: Ctrl/Cmd + Click to copy tower (only in debug mode)
        if (debugMode && (event.ctrlKey || event.metaKey)) {
            copiedTowerData = {
                type: clickedTower.type,
                level: clickedTower.level
            };
            console.log(`Tower copied: ${clickedTower.type} (Level ${clickedTower.level})`);
            // Visual feedback
            createExplosion(clickedTower.x, clickedTower.y, '#00ffff', 15);
        }
        
        updateUI();
        return;
    }

    // 2. If no tower clicked
    if (selectedTowerType) {
        // Try to place tower
        placeTower();
    } else if (debugMode && copiedTowerData && event.shiftKey) {
        // Debug feature: Shift + Click to paste copied tower
        const towerType = copiedTowerData.type;
        const targetLevel = copiedTowerData.level;
        
        // Check if placement is valid
        if (!canPlaceTower(clickX, clickY)) {
            console.log('Cannot paste tower here - invalid position');
            return;
        }
        
        // Place base tower (free for debug)
        const newTower = new Tower(clickX, clickY, towerType);
        towers.push(newTower);
        
        // Level up to target level
        for (let i = 1; i < targetLevel; i++) {
            newTower.upgrade();
        }
        
        console.log(`Tower pasted: ${towerType} (Level ${targetLevel})`);
        createExplosion(clickX, clickY, '#00ff00', 20);
        playSound('select');
        updateUI();
    } else {
        // Deselect tower if clicking empty space
        if (selectedTowerInstance) {
            selectedTowerInstance = null;
            updateUI();
        }
    }
}

function canPlaceTower(x, y) {
    // Custom field shape check
    const stageShape = stageFieldShapes[currentStage];
    
    if (stageShape && stageShape.customPlayableZones) {
        // Check if point is in any of the custom playable zones
        let inPlayableZone = false;
        for (let zone of stageShape.customPlayableZones) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                inPlayableZone = true;
                break;
            }
        }
        if (!inPlayableZone) return false;
    } else {
        // Default rectangular field boundary check
        if (x < FIELD_MARGIN || x > FIELD_WIDTH + FIELD_MARGIN || 
            y < FIELD_MARGIN || y > FIELD_HEIGHT + FIELD_MARGIN) {
            return false;
        }
    }
    
    // Collision Check with towers
    for(let t of towers) {
        let dist = Math.hypot(t.x - x, t.y - y);
        if (dist < 30) return false; 
    }
    
    // Path Collision
    for(let i=0; i<path.length-1; i++) {
        let p1 = path[i];
        let p2 = path[i+1];
        
        let A = x - p1.x;
        let B = y - p1.y;
        let C = p2.x - p1.x;
        let D = p2.y - p1.y;

        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) { xx = p1.x; yy = p1.y; }
        else if (param > 1) { xx = p2.x; yy = p2.y; }
        else { xx = p1.x + param * C; yy = p1.y + param * D; }

        let dx = x - xx;
        let dy = y - yy;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
            return false;
        }
    }
    
    return true;
}

function snapToGrid(x, y) {
    if (!gridSnapEnabled) return { x, y };
    
    // Snap to nearest grid point
    const snappedX = Math.round((x - FIELD_MARGIN) / GRID_SIZE) * GRID_SIZE + FIELD_MARGIN;
    const snappedY = Math.round((y - FIELD_MARGIN) / GRID_SIZE) * GRID_SIZE + FIELD_MARGIN;
    
    return { x: snappedX, y: snappedY };
}

function placeTower() {
    if (!selectedTowerType) return;
    if (!gameActive) return;

    const cost = getGearTowerCost(selectedTowerType);
    if (!debugMode && money < cost) return;

    // Apply grid snap if enabled
    const { x: placeX, y: placeY } = snapToGrid(mouseX, mouseY);

    if (!canPlaceTower(placeX, placeY)) {
        createExplosion(placeX, placeY, '#ff0000', 5);
        return;
    }

    towers.push(new Tower(placeX, placeY, selectedTowerType));
    money -= cost;
    createExplosion(placeX, placeY, '#ffffff', 5);
    updateUI();
    // Keep selectedTowerType for multi-build or clear it? 
    // Let's keep it for convenience.
}

// Skill Tree Canvas Drawing
let skillCanvas = null;
let skillCtx = null;
let skillTreeOffsetX = 0;
let skillTreeOffsetY = 0;
let skillTreeZoom = 1.0;
let skillTreeDragging = false;
let skillTreeLastMouseX = 0;
let skillTreeLastMouseY = 0;
let skillTreeDragStartX = 0;
let skillTreeDragStartY = 0;
let skillTreeHasDragged = false;
let skillTreeAnimationId = null;
let skillNodeImages = {}; // Store loaded images for skill nodes

// Preload skill node images
function preloadSkillImages() {
    Object.keys(skillTree).forEach(skillId => {
        const skill = skillTree[skillId];
        if (skill.image) {
            const img = new Image();
            img.src = skill.image;
            skillNodeImages[skillId] = img;
        }
    });
}

function initSkillCanvas() {
    skillCanvas = document.getElementById('skill-canvas');
    if (!skillCanvas) return;
    
    const container = skillCanvas.parentElement;
    const width = container.clientWidth || container.offsetWidth;
    const height = container.clientHeight || container.offsetHeight;
    
    if (width === 0 || height === 0) {
        setTimeout(initSkillCanvas, 100);
        return;
    }
    
    // Set canvas resolution to match display size
    skillCanvas.width = width;
    skillCanvas.height = height;
    skillCtx = skillCanvas.getContext('2d');
    
    drawSkillTree();
    
    // Add event handlers
    skillCanvas.removeEventListener('click', handleSkillCanvasClick);
    skillCanvas.addEventListener('click', handleSkillCanvasClick);
    
    skillCanvas.removeEventListener('mousedown', handleSkillTreeMouseDown);
    skillCanvas.addEventListener('mousedown', handleSkillTreeMouseDown);
    
    skillCanvas.removeEventListener('mousemove', handleSkillTreeMouseMove);
    skillCanvas.addEventListener('mousemove', handleSkillTreeMouseMove);
    
    skillCanvas.removeEventListener('mouseup', handleSkillTreeMouseUp);
    skillCanvas.addEventListener('mouseup', handleSkillTreeMouseUp);
    
    skillCanvas.removeEventListener('mouseleave', handleSkillTreeMouseUp);
    skillCanvas.addEventListener('mouseleave', handleSkillTreeMouseUp);
    
    skillCanvas.removeEventListener('wheel', handleSkillTreeWheel);
    skillCanvas.addEventListener('wheel', handleSkillTreeWheel);
    
    // Touch events for mobile
    skillCanvas.removeEventListener('touchstart', handleSkillTreeTouchStart);
    skillCanvas.addEventListener('touchstart', handleSkillTreeTouchStart);
    
    skillCanvas.removeEventListener('touchmove', handleSkillTreeTouchMove);
    skillCanvas.addEventListener('touchmove', handleSkillTreeTouchMove);
    
    skillCanvas.removeEventListener('touchend', handleSkillTreeTouchEnd);
    skillCanvas.addEventListener('touchend', handleSkillTreeTouchEnd);
    
    // Start animation loop
    startSkillTreeAnimation();
}

function startSkillTreeAnimation() {
    if (skillTreeAnimationId) return; // Already running
    
    function animate() {
        drawSkillTree();
        skillTreeAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

function stopSkillTreeAnimation() {
    if (skillTreeAnimationId) {
        cancelAnimationFrame(skillTreeAnimationId);
        skillTreeAnimationId = null;
    }
}

function drawSkillTree() {
    if (!skillCtx) return;
    
    // Clear canvas
    skillCtx.clearRect(0, 0, skillCanvas.width, skillCanvas.height);
    
    const visibleSkills = getVisibleSkills();
    
    if (visibleSkills.length === 0) {
        skillCtx.fillStyle = '#ffffff';
        skillCtx.font = '20px Orbitron';
        skillCtx.textAlign = 'center';
        skillCtx.fillText('スキルがありません', skillCanvas.width / 2, skillCanvas.height / 2);
        return;
    }
    
    // NOTE: スキルツリーの位置
    const positions = {
        'terraforming2': { x: 0.5, y: -0.3 }, // テラフォーミング2
        'terraforming': { x: 0.5, y: -0.1 }, // テラフォーミング
        'base_upgrade2': { x: 0.5, y: 0.1 }, // ベース改造（base_upgradeの上）
        'base_upgrade': { x: 0.5, y: 0.3 }, // ベース強化（initial_creditsの上）
        // TURRET branch (left)
        'turret_damage': { x: 0.3, y: 0.5 },
        'turret_range': { x: 0.1, y: 0.5 },
        'quantity_over_quality': { x: -0.3, y: 0.3 }, // 量産型
        'bullet_hardening': { x: -0.5, y: 0.3 }, // 弾丸硬化
        'rapid_fire': { x: -0.7, y: 0.3 }, // 連射
        // SNIPER branch (top-left)
        'sniper_damage': { x: 0.3, y: 0.3 },
        'sniper_range': { x: 0.1, y: 0.3 },
        'mass': { x: -0.3, y: 0.5 }, // 質量
        'sharpness_or_hardness': { x: -0.5, y: 0.5 }, // 鋭さor硬さ
        'tile_break': { x: -0.7, y: 0.5 }, // 瓦割り(裂傷)
        // BLASTER branch (bottom-left)
        'blaster_damage': { x: 0.3, y: 0.7 },
        'blaster_range': { x: 0.1, y: 0.7 },
        'burn_damage': { x: -0.1, y: 0.9 }, // 延焼ダメージ
        'freeze_duration': { x: 0.1, y: 0.9 }, // 氷結持続時間
        'hotfix': { x: -0.3, y: 0.7 }, // ホットフィックス
        'bang': { x: -0.5, y: 0.7 }, // バン！
        'inferno': { x: -0.3, y: 1.1 }, // インフェルノ
        // SWEEPER branch
        'minesweeper': { x: 0.7, y: -0.1 }, // sweeper解放
        // GEAR brabch
        'self_generation': { x: 0.7, y: -0.3 }, // 自己発電
        'durability_improvement': { x: 0.9, y: -0.3 }, // 耐久性向上
        // All tower damage (center-left, requires all 3 range skills)
        'all_tower_damage': { x: -0.1, y: 0.5 },　//全タワー強化
        'ultimate_power2': { x: -0.9, y: 0.5 }, //全タワー強化2
        'ultimate_power': { x: 0.3, y: -0.1 }, //進化開放
        // weekness branch (top)
        'weak_point_analysis': { x: 0.3, y: 0.1 }, // 弱点解析
        'vulnerability': { x: 0.1, y: 0.1 }, // 脆弱性
        'ai_analysis': { x: -0.1, y: 0.1 }, // AI解析
        // ROD branch (bottom)
        'unlock_rod': { x: 0.5, y: 0.7 }, //rod解放
        'rod_damage': { x: 0.3, y: 0.9 },
        'rod_range': { x: 0.1, y: 1.1 },
        'voltage_transformer': { x: 0.44, y: 0.9 }, //変電圧
        'cross_specialization': { x: 0.57, y: 0.9 }, // 専門外
        'obey': { x: 0.7, y: 0.9 }, // 服従せよ
        'magician': { x: 0.9, y: 0.9 }, // ワープ
        'quantum_transfer': { x: 1.1, y: 1.1 }, // 量子転送
        // Credits branch (right)
        'initial_credits': { x: 0.5, y: 0.5 }, //資金追加
        'initial_credits2': { x: 0.7, y: 0.5 },
        'initial_credits3': { x: 0.9, y: 0.6 }, 
        'initial_credits4': { x: 0.7, y: 0.7 },
        'enemy_credits': { x: 1.1, y: 0.5 }, // 敵クレジット獲得量
        'economics': { x: 1.3, y: 0.4 }, // 敵クレジット獲得量
        'chip_rate': { x: 0.9, y: 0.4 }, // チップ獲得率
    };
    
    // Apply camera transform
    skillCtx.save();
    skillCtx.translate(skillCanvas.width / 2 + skillTreeOffsetX, skillCanvas.height / 2 + skillTreeOffsetY);
    skillCtx.scale(skillTreeZoom, skillTreeZoom);
    
    const centerX = 0;
    const centerY = 0;
    const nodeSize = 80; // 正方形のサイズ
    const spacing = 200;
    
    // Draw connections first (they will be behind nodes)
    skillCtx.lineWidth = 3;
    
    // Calculate glow pulse for unlocked connections
    const time = Date.now();
    const glowPulse = Math.sin(time * 0.003) * 0.3 + 0.7; // Oscillates between 0.4 and 1.0
    
    visibleSkills.forEach(skillId => {
        const skill = skillTree[skillId];
        const pos = positions[skillId];
        if (!pos) return;
        
        const x1 = centerX + (pos.x - 0.5) * spacing * 4;
        const y1 = centerY + (pos.y - 0.5) * spacing * 4;
        
        const currentUnlocked = unlockedSkills.includes(skillId);
        
        skill.unlocks.forEach(nextId => {
            if (!visibleSkills.includes(nextId)) return;
            const nextPos = positions[nextId];
            if (!nextPos) return;
            
            const x2 = centerX + (nextPos.x - 0.5) * spacing * 4;
            const y2 = centerY + (nextPos.y - 0.5) * spacing * 4;
            
            const nextSkillUnlocked = unlockedSkills.includes(nextId);
            const nextSkillCanUnlock = canUnlockSkill(nextId);
            
            // 両方解放済み = cyan with glow
            // 解放済み→開放可能 = 灰色
            // それ以外 = 灰色
            if (currentUnlocked && nextSkillUnlocked) {
                // Draw glowing effect with shadow
                skillCtx.shadowBlur = 15 * glowPulse;
                skillCtx.shadowColor = '#00ffff';
                skillCtx.strokeStyle = `rgba(0, 255, 255, ${0.6 * glowPulse})`;
                skillCtx.lineWidth = 4;
            } else {
                skillCtx.shadowBlur = 0;
                skillCtx.strokeStyle = 'rgba(100, 100, 120, 0.4)';
                skillCtx.lineWidth = 3;
            }
            
            skillCtx.beginPath();
            skillCtx.moveTo(x1, y1);
            skillCtx.lineTo(x2, y2);
            skillCtx.stroke();
        });
    });
    
    // Reset shadow for nodes
    skillCtx.shadowBlur = 0;
    
    // Draw nodes
    visibleSkills.forEach(skillId => {
        const skill = skillTree[skillId];
        const pos = positions[skillId];
        if (!pos) return;
        
        const x = centerX + (pos.x - 0.5) * spacing * 4;
        const y = centerY + (pos.y - 0.5) * spacing * 4;
        
        const isUnlocked = unlockedSkills.includes(skillId);
        const canUnlock = canUnlockSkill(skillId);
        const isSpecial = skill.special; // Check if this is a special skill
        const isBetter = skill.better; // Check if this is a better skill
        const isEpic = skill.epic; // Check if this is an epic skill
        
        skillCtx.beginPath();
        
        if (isSpecial) {
            // Draw hexagon for special skills
            const hexRadius = nodeSize / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
                const hx = x + hexRadius * Math.cos(angle);
                const hy = y + hexRadius * Math.sin(angle);
                if (i === 0) {
                    skillCtx.moveTo(hx, hy);
                } else {
                    skillCtx.lineTo(hx, hy);
                }
            }
            skillCtx.closePath();
            
            // Blue color for special skills
            if (isUnlocked) {
                skillCtx.shadowBlur = 0;
                skillCtx.fillStyle = 'rgba(0, 150, 255, 0.9)';
                skillCtx.strokeStyle = '#0099ff';
            } else if (canUnlock) {
                // Gray with glow for unlockable
                skillCtx.shadowBlur = 20 * glowPulse;
                skillCtx.shadowColor = '#00aaff';
                skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)';
                skillCtx.strokeStyle = `rgba(0, 170, 255, ${0.8 * glowPulse})`;
            } else {
                skillCtx.shadowBlur = 0;
                skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)'; // Gray for locked
                skillCtx.strokeStyle = '#666666';
            }
        } else {
            // 角丸正方形 for normal skills
            const halfSize = nodeSize / 2;
            const cornerRadius = 15;
            
            skillCtx.moveTo(x - halfSize + cornerRadius, y - halfSize);
            skillCtx.lineTo(x + halfSize - cornerRadius, y - halfSize);
            skillCtx.quadraticCurveTo(x + halfSize, y - halfSize, x + halfSize, y - halfSize + cornerRadius);
            skillCtx.lineTo(x + halfSize, y + halfSize - cornerRadius);
            skillCtx.quadraticCurveTo(x + halfSize, y + halfSize, x + halfSize - cornerRadius, y + halfSize);
            skillCtx.lineTo(x - halfSize + cornerRadius, y + halfSize);
            skillCtx.quadraticCurveTo(x - halfSize, y + halfSize, x - halfSize, y + halfSize - cornerRadius);
            skillCtx.lineTo(x - halfSize, y - halfSize + cornerRadius);
            skillCtx.quadraticCurveTo(x - halfSize, y - halfSize, x - halfSize + cornerRadius, y - halfSize);
            skillCtx.closePath();
            
            if (isUnlocked) {
                skillCtx.shadowBlur = 0;
                if (isEpic) {
                    // Epic nodes are purple when unlocked
                    skillCtx.fillStyle = 'rgba(150, 0, 255, 0.8)';
                    skillCtx.strokeStyle = '#9900ff';
                } else if (isBetter) {
                    // Better nodes are blue when unlocked
                    skillCtx.fillStyle = 'rgba(0, 150, 255, 0.8)';
                    skillCtx.strokeStyle = '#0099ff';
                } else {
                    // Normal nodes are green when unlocked
                    skillCtx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                    skillCtx.strokeStyle = '#00ff00';
                }
            } else if (canUnlock) {
                // Gray with glow for unlockable (different glow colors)
                if (isEpic) {
                    skillCtx.shadowBlur = 20 * glowPulse;
                    skillCtx.shadowColor = '#9900ff';
                    skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)';
                    skillCtx.strokeStyle = `rgba(153, 0, 255, ${0.8 * glowPulse})`;
                } else if (isBetter) {
                    skillCtx.shadowBlur = 20 * glowPulse;
                    skillCtx.shadowColor = '#0099ff';
                    skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)';
                    skillCtx.strokeStyle = `rgba(0, 153, 255, ${0.8 * glowPulse})`;
                } else {
                    skillCtx.shadowBlur = 20 * glowPulse;
                    skillCtx.shadowColor = '#00ff00';
                    skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)';
                    skillCtx.strokeStyle = `rgba(0, 255, 0, ${0.8 * glowPulse})`;
                }
            } else {
                skillCtx.shadowBlur = 0;
                // All locked nodes are gray
                skillCtx.fillStyle = 'rgba(80, 80, 80, 0.6)';
                skillCtx.strokeStyle = '#666666';
            }
        }
        
        skillCtx.lineWidth = 3;
        skillCtx.fill();
        skillCtx.stroke();
        
        // Draw image or icon
        const img = skillNodeImages[skillId];
        if (img && img.complete && img.naturalWidth > 0) {
            // Draw image centered in the node
            const imgSize = nodeSize * 0.6; // 60% of node size
            skillCtx.save();
            skillCtx.globalAlpha = isUnlocked ? 1.0 : (canUnlock ? 0.9 : 0.5);
            skillCtx.drawImage(img, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize);
            skillCtx.restore();
        } else {
            // Fallback to text icon
            skillCtx.font = '36px Arial';
            skillCtx.textAlign = 'center';
            skillCtx.textBaseline = 'middle';
            skillCtx.fillStyle = '#ffffff';
            skillCtx.fillText(skill.icon, x, y);
        }
        
        // Store position for click detection (in world space)
        skill.renderX = x;
        skill.renderY = y;
        skill.renderSize = nodeSize;
    });
    
    skillCtx.restore();
}

function handleSkillCanvasClick(e) {
    // Don't trigger click if we actually dragged
    if (skillTreeHasDragged) {
        skillTreeHasDragged = false;
        return;
    }
    
    const rect = skillCanvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldX = (screenX - skillCanvas.width / 2 - skillTreeOffsetX) / skillTreeZoom;
    const worldY = (screenY - skillCanvas.height / 2 - skillTreeOffsetY) / skillTreeZoom;
    
    const visibleSkills = getVisibleSkills();
    
    for (let skillId of visibleSkills) {
        const skill = skillTree[skillId];
        if (!skill.renderX && skill.renderX !== 0) continue; // 0 is valid
        
        const halfSize = skill.renderSize / 2;
        const inBounds = worldX >= skill.renderX - halfSize && 
                        worldX <= skill.renderX + halfSize &&
                        worldY >= skill.renderY - halfSize && 
                        worldY <= skill.renderY + halfSize;
        
        if (inBounds) {
            showSkillPopup(skillId);
            break;
        }
    }
}

function showSkillPopup(skillId) {
    const skill = skillTree[skillId];
    const isUnlocked = unlockedSkills.includes(skillId);
    const canUnlock = canUnlockSkill(skillId);
    
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: 'Orbitron', sans-serif;
    `;
    
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: linear-gradient(135deg, #1a1a3e 0%, #0a0a1a 100%);
        border: 3px solid ${isUnlocked ? '#00ff00' : canUnlock ? '#00aaff' : '#666666'};
        border-radius: 15px;
        padding: 30px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 0 40px ${isUnlocked ? 'rgba(0, 255, 0, 0.4)' : canUnlock ? 'rgba(0, 170, 255, 0.4)' : 'rgba(100, 100, 100, 0.3)'};
    `;
    
    popup.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">${skill.icon}</div>
        <h3 style="color: #fff; font-size: 20px; margin-bottom: 10px;">${skill.name}</h3>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 20px;">${skill.description}</p>
        ${!isUnlocked ? `<div style="color: #ffaa00; font-size: 16px; margin-bottom: 20px;">💎 コスト: ${skill.cost}</div>` : ''}
        ${isUnlocked ? '<div style="color: #00ff00; font-size: 16px; margin-bottom: 20px;">✓ 解放済み</div>' : ''}
        <div style="display: flex; gap: 10px; justify-content: center;">
            ${canUnlock ? `<button id="unlock-btn" style="
                background: linear-gradient(45deg, #0088ff, #0055cc);
                border: 2px solid #00aaff;
                color: white;
                padding: 12px 30px;
                font-size: 16px;
                font-weight: 700;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                transition: all 0.2s;
            ">解放する</button>` : ''}
            <button id="close-btn" style="
                background: linear-gradient(45deg, #555, #333);
                border: 2px solid #666;
                color: white;
                padding: 12px 30px;
                font-size: 16px;
                font-weight: 700;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                transition: all 0.2s;
            ">閉じる</button>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Close button handler
    document.getElementById('close-btn').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    // Unlock button handler
    if (canUnlock) {
        const unlockBtn = document.getElementById('unlock-btn');
        unlockBtn.addEventListener('mouseenter', () => {
            unlockBtn.style.background = 'linear-gradient(45deg, #00aaff, #0077ee)';
            unlockBtn.style.boxShadow = '0 0 20px rgba(0, 170, 255, 0.5)';
        });
        unlockBtn.addEventListener('mouseleave', () => {
            unlockBtn.style.background = 'linear-gradient(45deg, #0088ff, #0055cc)';
            unlockBtn.style.boxShadow = 'none';
        });
        unlockBtn.addEventListener('click', () => {
            if (unlockSkill(skillId)) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

// Skill Tree Input Handlers
function handleSkillTreeMouseDown(e) {
    skillTreeDragging = true;
    skillTreeLastMouseX = e.clientX;
    skillTreeLastMouseY = e.clientY;
    skillTreeDragStartX = e.clientX;
    skillTreeDragStartY = e.clientY;
    skillTreeHasDragged = false;
}

function handleSkillTreeMouseMove(e) {
    if (!skillTreeDragging) return;
    
    const dx = e.clientX - skillTreeLastMouseX;
    const dy = e.clientY - skillTreeLastMouseY;
    
    // Check if actually dragged (moved more than 5 pixels)
    const totalDx = e.clientX - skillTreeDragStartX;
    const totalDy = e.clientY - skillTreeDragStartY;
    const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    
    if (distance > 5) {
        skillTreeHasDragged = true;
    }
    
    skillTreeOffsetX += dx;
    skillTreeOffsetY += dy;
    
    skillTreeLastMouseX = e.clientX;
    skillTreeLastMouseY = e.clientY;
    
    drawSkillTree();
}

function handleSkillTreeMouseUp(e) {
    skillTreeDragging = false;
}

function handleSkillTreeWheel(e) {
    e.preventDefault();
    
    const rect = skillCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(2.0, skillTreeZoom * zoomFactor));
    
    // Zoom towards mouse position
    const worldX = (mouseX - skillCanvas.width / 2 - skillTreeOffsetX) / skillTreeZoom;
    const worldY = (mouseY - skillCanvas.height / 2 - skillTreeOffsetY) / skillTreeZoom;
    
    skillTreeZoom = newZoom;
    
    skillTreeOffsetX = mouseX - skillCanvas.width / 2 - worldX * skillTreeZoom;
    skillTreeOffsetY = mouseY - skillCanvas.height / 2 - worldY * skillTreeZoom;
    
    drawSkillTree();
}

let skillTreeTouchDistance = 0;
let skillTreeTouchCenterX = 0;
let skillTreeTouchCenterY = 0;

function handleSkillTreeTouchStart(e) {
    if (e.touches.length === 1) {
        skillTreeDragging = true;
        skillTreeLastMouseX = e.touches[0].clientX;
        skillTreeLastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        e.preventDefault();
        skillTreeDragging = false;
        
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        skillTreeTouchDistance = Math.sqrt(dx * dx + dy * dy);
        
        skillTreeTouchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        skillTreeTouchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
}

function handleSkillTreeTouchMove(e) {
    if (e.touches.length === 1 && skillTreeDragging) {
        const dx = e.touches[0].clientX - skillTreeLastMouseX;
        const dy = e.touches[0].clientY - skillTreeLastMouseY;
        
        skillTreeOffsetX += dx;
        skillTreeOffsetY += dy;
        
        skillTreeLastMouseX = e.touches[0].clientX;
        skillTreeLastMouseY = e.touches[0].clientY;
        
        drawSkillTree();
    } else if (e.touches.length === 2) {
        e.preventDefault();
        
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        
        const newCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const newCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        if (skillTreeTouchDistance > 0) {
            const zoomFactor = newDistance / skillTreeTouchDistance;
            const newZoom = Math.max(0.2, Math.min(2.0, skillTreeZoom * zoomFactor));
            
            const rect = skillCanvas.getBoundingClientRect();
            const mouseX = newCenterX - rect.left;
            const mouseY = newCenterY - rect.top;
            
            const worldX = (mouseX - skillCanvas.width / 2 - skillTreeOffsetX) / skillTreeZoom;
            const worldY = (mouseY - skillCanvas.height / 2 - skillTreeOffsetY) / skillTreeZoom;
            
            skillTreeZoom = newZoom;
            
            skillTreeOffsetX = mouseX - skillCanvas.width / 2 - worldX * skillTreeZoom;
            skillTreeOffsetY = mouseY - skillCanvas.height / 2 - worldY * skillTreeZoom;
        }
        
        skillTreeTouchDistance = newDistance;
        skillTreeTouchCenterX = newCenterX;
        skillTreeTouchCenterY = newCenterY;
        
        drawSkillTree();
    }
}

function handleSkillTreeTouchEnd(e) {
    if (e.touches.length < 2) {
        skillTreeTouchDistance = 0;
    }
    if (e.touches.length === 0) {
        skillTreeDragging = false;
    }
}

// Tower Button Drag for Mobile
let towerDragStartX = 0;
let towerDragStartY = 0;
let isDraggingTower = false;
let draggedTowerType = null;

function setupTowerButtonDrag() {
    ['turret', 'sniper', 'blaster', 'rod'].forEach(type => {
        const btn = document.getElementById(`btn-${type}`);
        if (!btn) return;
        
        btn.addEventListener('touchstart', (e) => {
            towerDragStartX = e.touches[0].clientX;
            towerDragStartY = e.touches[0].clientY;
            isDraggingTower = false;
            draggedTowerType = type;
        });
        
        btn.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const dx = e.touches[0].clientX - towerDragStartX;
            const dy = e.touches[0].clientY - towerDragStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If dragged more than 20px, enter drag mode
            if (distance > 20 && !isDraggingTower) {
                // Check if player has enough money before entering drag mode
                const cost = TOWER_TYPES[draggedTowerType].cost;
                if (money < cost) {
                    // Add shake animation
                    btn.classList.add('insufficient-funds');
                    setTimeout(() => {
                        btn.classList.remove('insufficient-funds');
                    }, 500);
                    draggedTowerType = null;
                    return;
                }
                
                isDraggingTower = true;
                
                // Clear temporary tower if exists
                if (tempTowerType) {
                    tempTowerX = null;
                    tempTowerY = null;
                    tempTowerType = null;
                }
                
                selectedTowerType = draggedTowerType;
                updateTowerButtons();
                
                // Update mouse position for preview
                const rect = canvas.getBoundingClientRect();
                const worldX = ((e.touches[0].clientX - rect.left) - cameraOffsetX) / zoomLevel;
                const worldY = ((e.touches[0].clientY - rect.top) - cameraOffsetY) / zoomLevel;
                const { x: snappedX, y: snappedY } = snapToGrid(worldX, worldY);
                mouseX = snappedX;
                mouseY = snappedY;
            } else if (isDraggingTower) {
                // Continue updating preview position
                const rect = canvas.getBoundingClientRect();
                const worldX = ((e.touches[0].clientX - rect.left) - cameraOffsetX) / zoomLevel;
                const worldY = ((e.touches[0].clientY - rect.top) - cameraOffsetY) / zoomLevel;
                const { x: snappedX, y: snappedY } = snapToGrid(worldX, worldY);
                mouseX = snappedX;
                mouseY = snappedY;
            }
        }, { passive: false });
        
        btn.addEventListener('touchend', (e) => {
            if (isDraggingTower) {
                // Place tower at dragged position
                const rect = canvas.getBoundingClientRect();
                const worldX = ((e.changedTouches[0].clientX - rect.left) - cameraOffsetX) / zoomLevel;
                const worldY = ((e.changedTouches[0].clientY - rect.top) - cameraOffsetY) / zoomLevel;
                const { x: snappedX, y: snappedY } = snapToGrid(worldX, worldY);
                
                tempTowerX = snappedX;
                tempTowerY = snappedY;
                tempTowerType = draggedTowerType;
                mouseX = snappedX;
                mouseY = snappedY;
                
                // Clear selection mode after drag placement
                selectedTowerType = null;
                updateTowerButtons();
            }
            isDraggingTower = false;
            draggedTowerType = null;
        });
    });
}

// =============================
// Title Screen Animation
// =============================
const titleCanvas = document.getElementById('title-canvas');
const titleCtx = titleCanvas ? titleCanvas.getContext('2d') : null;
let titlePaths = [];
let titleTowers = [];
let titleEnemies = [];

function initTitleAnimation() {
    if (!titleCanvas) {
        console.log('Title canvas not found');
        return;
    }
    
    // Set canvas size to viewport
    titleCanvas.width = window.innerWidth;
    titleCanvas.height = window.innerHeight;
    
    console.log('Title canvas initialized:', titleCanvas.width, 'x', titleCanvas.height);
    
    // Generate 3-5 random paths
    const pathCount = 3 + Math.floor(Math.random() * 3);
    titlePaths = [];
    
    for (let i = 0; i < pathCount; i++) {
        const startY = 100 + Math.random() * (titleCanvas.height - 200);
        const endY = 100 + Math.random() * (titleCanvas.height - 200);
        const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 200;
        
        titlePaths.push({
            startX: 0,
            startY: startY,
            midX: titleCanvas.width / 2,
            midY: midY,
            endX: titleCanvas.width,
            endY: endY,
            color: `hsla(${180 + Math.random() * 60}, 100%, 50%, 0.3)`
        });
    }
    
    // Place random towers near paths
    titleTowers = [];
    const towerCount = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < towerCount; i++) {
        const pathIndex = Math.floor(Math.random() * titlePaths.length);
        const path = titlePaths[pathIndex];
        const t = Math.random();
        
        // Quadratic bezier curve point
        const x = (1 - t) * (1 - t) * path.startX + 
                  2 * (1 - t) * t * path.midX + 
                  t * t * path.endX;
        const y = (1 - t) * (1 - t) * path.startY + 
                  2 * (1 - t) * t * path.midY + 
                  t * t * path.endY;
        
        // Offset from path
        const offsetDist = 60 + Math.random() * 80;
        const offsetAngle = Math.random() * Math.PI * 2;
        
        const towerTypes = ['turret', 'sniper', 'blaster', 'rod'];
        const type = towerTypes[Math.floor(Math.random() * towerTypes.length)];
        
        titleTowers.push({
            x: x + Math.cos(offsetAngle) * offsetDist,
            y: y + Math.sin(offsetAngle) * offsetDist,
            type: type,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            size: 20 + Math.random() * 10,
            glowPhase: Math.random() * Math.PI * 2
        });
    }
    
    // Spawn enemies on paths
    titleEnemies = [];
    for (let i = 0; i < 10; i++) {
        spawnTitleEnemy();
    }
    
    animateTitleScreen();
}

function spawnTitleEnemy() {
    if (titlePaths.length === 0) return;
    
    const pathIndex = Math.floor(Math.random() * titlePaths.length);
    titleEnemies.push({
        pathIndex: pathIndex,
        progress: -0.1 - Math.random() * 0.3,
        speed: 0.001 + Math.random() * 0.001,
        size: 8 + Math.random() * 6,
        hue: 0 + Math.random() * 60
    });
}

function animateTitleScreen() {
    if (!titleAnimationActive || !titleCanvas || !titleCtx) return;
    
    titleCtx.clearRect(0, 0, titleCanvas.width, titleCanvas.height);
    
    // Draw paths
    titlePaths.forEach(path => {
        titleCtx.strokeStyle = path.color;
        titleCtx.lineWidth = 3;
        titleCtx.setLineDash([10, 10]);
        titleCtx.beginPath();
        titleCtx.moveTo(path.startX, path.startY);
        titleCtx.quadraticCurveTo(path.midX, path.midY, path.endX, path.endY);
        titleCtx.stroke();
        titleCtx.setLineDash([]);
    });
    
    // Draw towers
    titleTowers.forEach(tower => {
        tower.rotation += tower.rotationSpeed;
        tower.glowPhase += 0.05;
        
        const glowIntensity = 0.5 + Math.sin(tower.glowPhase) * 0.3;
        
        titleCtx.save();
        titleCtx.translate(tower.x, tower.y);
        titleCtx.rotate(tower.rotation);
        
        // Tower body
        let color;
        switch (tower.type) {
            case 'turret':
                color = '#00ffff';
                break;
            case 'sniper':
                color = '#ff00ff';
                break;
            case 'blaster':
                color = '#ffff00';
                break;
            case 'rod':
                color = '#ff0080';
                break;
        }
        
        titleCtx.shadowBlur = 20 * glowIntensity;
        titleCtx.shadowColor = color;
        titleCtx.fillStyle = color;
        titleCtx.globalAlpha = 0.8;
        
        titleCtx.fillRect(-tower.size / 2, -tower.size / 2, tower.size, tower.size);
        
        titleCtx.restore();
    });
    
    // Update and draw enemies
    titleEnemies.forEach((enemy, index) => {
        enemy.progress += enemy.speed * (dt || 1);
        
        if (enemy.progress > 1.1) {
            titleEnemies.splice(index, 1);
            spawnTitleEnemy();
            return;
        }
        
        const path = titlePaths[enemy.pathIndex];
        const t = enemy.progress;
        
        if (t < 0 || t > 1) return;
        
        const x = (1 - t) * (1 - t) * path.startX + 
                  2 * (1 - t) * t * path.midX + 
                  t * t * path.endX;
        const y = (1 - t) * (1 - t) * path.startY + 
                  2 * (1 - t) * t * path.midY + 
                  t * t * path.endY;
        
        const color = `hsl(${enemy.hue}, 100%, 50%)`;
        
        titleCtx.shadowBlur = 15;
        titleCtx.shadowColor = color;
        titleCtx.fillStyle = color;
        titleCtx.globalAlpha = 0.8;
        titleCtx.beginPath();
        titleCtx.arc(x, y, enemy.size, 0, Math.PI * 2);
        titleCtx.fill();
    });
    
    titleCtx.globalAlpha = 1;
    titleCtx.shadowBlur = 0;
    
    requestAnimationFrame(animateTitleScreen);
}

window.addEventListener('resize', () => {
    if (titleCanvas && titleAnimationActive) {
        titleCanvas.width = window.innerWidth;
        titleCanvas.height = window.innerHeight;
    }
});

// Detect device and update start prompt text
function updateStartPromptText() {
    const startPrompt = document.getElementById('start-prompt');
    if (startPrompt) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                        ('ontouchstart' in window) || 
                        (navigator.maxTouchPoints > 0);
        startPrompt.textContent = isMobile ? 'Tap to Start' : 'Click to Start';
    }
}

// Init
resizeCanvas();
loadSkillTree();
loadStageProgress();
loadCommanderData();
loadSettings();
updateUI();
setupTowerButtonDrag();
updateStartPromptText();
preloadSkillImages(); // Preload skill node images

// Initialize title animation after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTitleAnimation();
        updateStartPromptText();
        initDebugUI();
        loadEndlessBestScore();
        loadSettings(); // Load quality settings
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        initTitleAnimation();
        updateStartPromptText();
        initDebugUI();
        loadEndlessBestScore();
        loadSettings(); // Load quality settings
    }, 100);
}

function loadEndlessBestScore() {
    const saved = localStorage.getItem('endlessBestScore');
    if (saved) {
        endlessBestScore = parseInt(saved);
    }
}

// ============================
// Debug Command System
// ============================

function setupCommandInput() {
    // Create command input overlay
    const commandOverlay = document.createElement('div');
    commandOverlay.id = 'command-input-overlay';
    commandOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const commandInput = document.createElement('input');
    commandInput.id = 'command-input';
    commandInput.type = 'text';
    commandInput.placeholder = 'Enter command (e.g., /summon fortress 1 100)';
    commandInput.style.cssText = `
        width: 600px;
        padding: 15px;
        font-size: 18px;
        font-family: 'Orbitron', monospace;
        background: #111;
        color: #0f0;
        border: 2px solid #0f0;
        border-radius: 5px;
        outline: none;
    `;
    
    // Create autocomplete suggestions list
    const suggestList = document.createElement('div');
    suggestList.id = 'command-suggestions';
    suggestList.style.cssText = `
        position: absolute;
        top: calc(50% + 30px);
        width: 600px;
        max-height: 200px;
        overflow-y: auto;
        background: #111;
        border: 2px solid #0f0;
        border-top: none;
        border-radius: 0 0 5px 5px;
        display: none;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
    `;
    
    commandOverlay.appendChild(commandInput);
    commandOverlay.appendChild(suggestList);
    document.body.appendChild(commandOverlay);
    
    // Input event for autocomplete
    commandInput.addEventListener('input', (e) => {
        updateAutoComplete(commandInput.value, suggestList);
    });
    
    // Tab key for autocomplete selection
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && suggestList.style.display !== 'none') {
            e.preventDefault();
            const firstSuggestion = suggestList.querySelector('.suggestion');
            if (firstSuggestion) {
                commandInput.value = firstSuggestion.textContent;
                suggestList.style.display = 'none';
            }
        }
    });
    
    // Key event listener for / key
    document.addEventListener('keydown', (e) => {
        // Open command input with / key (only in debug mode)
        if (e.key === '/' && debugMode && !commandInputActive) {
            e.preventDefault();
            commandInputActive = true;
            commandOverlay.style.display = 'flex';
            commandInput.value = '/';
            commandInput.focus();
            suggestList.style.display = 'none';
            return;
        }
        
        // Close command input with Escape
        if (e.key === 'Escape' && commandInputActive) {
            commandInputActive = false;
            commandOverlay.style.display = 'none';
            commandInput.value = '';
            suggestList.style.display = 'none';
            return;
        }
        
        // Execute command with Enter
        if (e.key === 'Enter' && commandInputActive) {
            const command = commandInput.value.trim();
            executeCommand(command);
            commandInputActive = false;
            commandOverlay.style.display = 'none';
            commandInput.value = '';
            suggestList.style.display = 'none';
            return;
        }
    });
}

function executeCommand(command) {
    if (!command.startsWith('/')) {
        console.log('Commands must start with /');
        return;
    }
    
    const parts = command.substring(1).split(' ');
    const cmd = parts[0];
    
    if (cmd === 'summon') {
        // /summon <enemy名> <数> <wave強さ>
        if (parts.length < 4) {
            console.log('Usage: /summon <enemy_type> <count> <wave_strength>');
            console.log('Example: /summon fortress 1 100');
            console.log('Available types: normal, fast, tank, rampage, boss, storm, fortress, shielder');
            return;
        }
        
        const enemyType = parts[1];
        const count = parseInt(parts[2]);
        const waveStrength = parseInt(parts[3]);
        
        if (isNaN(count) || isNaN(waveStrength)) {
            console.log('Count and wave strength must be numbers');
            return;
        }
        
        if (count < 1 || count > 100) {
            console.log('Count must be between 1 and 100');
            return;
        }
        
        summonEnemies(enemyType, count, waveStrength);
    } else if (cmd === 'clear') {
        // /clear <対象>
        if (parts.length < 2) {
            console.log('Usage: /clear <target>');
            console.log('Example: /clear tower, /clear enemy');
            console.log('Available targets: tower, enemy');
            return;
        }
        
        const target = parts[1].toLowerCase();
        clearTarget(target);
    } else if (cmd === 'setwave') {
        // /setwave <wave数>
        if (parts.length < 2) {
            console.log('Usage: /setwave <wave_number>');
            console.log('Example: /setwave 50');
            return;
        }
        
        const waveNumber = parseInt(parts[1]);
        
        if (isNaN(waveNumber)) {
            console.log('Wave number must be a number');
            return;
        }
        
        if (waveNumber < 1) {
            console.log('Wave number must be at least 1');
            return;
        }
        
        wave = waveNumber;
        console.log(`✅ Wave set to ${wave}`);
        
        // Update UI
        updateUI();
        
        // Visual feedback
        createExplosion(canvas.width / 2, canvas.height / 2, '#00ff00', 20);
    } else {
        console.log(`Unknown command: ${cmd}`);
        console.log('Available commands:');
        console.log('  /summon <enemy_type> <count> <wave_strength>');
        console.log('  /clear <target>');
        console.log('  /setwave <wave_number>');
    }
}

function updateAutoComplete(input, suggestList) {
    const commands = [
        '/summon normal <count> <wave>',
        '/summon fast <count> <wave>',
        '/summon tank <count> <wave>',
        '/summon rampage <count> <wave>',
        '/summon boss <count> <wave>',
        '/summon storm <count> <wave>',
        '/summon fortress <count> <wave>',
        '/summon shielder <count> <wave>',
        '/clear tower',
        '/clear enemy',
        '/setwave <wave>'
    ];
    
    const filtered = commands.filter(cmd => cmd.startsWith(input));
    
    if (filtered.length === 0 || input === '' || input === '/') {
        suggestList.style.display = 'none';
        return;
    }
    
    suggestList.innerHTML = '';
    filtered.forEach(cmd => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = cmd;
        div.style.cssText = `
            padding: 8px 15px;
            color: #0f0;
            cursor: pointer;
            transition: background 0.1s;
        `;
        div.addEventListener('mouseenter', () => {
            div.style.background = 'rgba(0, 255, 0, 0.2)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.background = 'transparent';
        });
        div.addEventListener('click', () => {
            document.getElementById('command-input').value = cmd;
            suggestList.style.display = 'none';
            document.getElementById('command-input').focus();
        });
        suggestList.appendChild(div);
    });
    
    suggestList.style.display = 'block';
}

function clearTarget(target) {
    if (target === 'tower' || target === 'towers') {
        const count = towers.length;
        towers = [];
        console.log(`✅ Cleared ${count} tower(s)`);
        
        // Visual feedback - red explosion at each tower position before clearing
        for (let i = 0; i < Math.min(count, 20); i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            createExplosion(x, y, '#ff0000', 15);
        }
    } else if (target === 'enemy' || target === 'enemies') {
        const count = enemies.length;
        // Create explosion at each enemy position
        enemies.forEach(enemy => {
            createExplosion(enemy.x, enemy.y, '#ff0000', 10);
        });
        enemies = [];
        zombies = []; // Clear zombies too
        console.log(`✅ Cleared ${count} enemy(ies)`);
    } else {
        console.log(`Invalid target: ${target}`);
        console.log('Valid targets: tower, enemy');
    }
}

function summonEnemies(enemyType, count, waveStrength) {
    // Validate enemy type
    const validTypes = ['normal', 'fast', 'tank', 'rampage', 'boss', 'fortress', 'shielder', 'decoy', 'storm'];
    if (!validTypes.includes(enemyType)) {
        console.log(`Invalid enemy type: ${enemyType}`);
        console.log(`Valid types: ${validTypes.join(', ')}`);
        return;
    }
    
    // Temporarily set wave to the specified strength
    const originalWave = wave;
    wave = waveStrength;
    
    // Spawn enemies with delay (150ms interval)
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            enemies.push(new Enemy(path, enemyType));
            
            // Visual feedback for each spawn
            if (path.length > 0) {
                const spawnPoint = path[0];
                createExplosion(spawnPoint.x, spawnPoint.y, '#0f0', 20);
            }
        }, i * 150);
    }
    
    // Restore original wave after all spawns
    setTimeout(() => {
        wave = originalWave;
    }, count * 150 + 100);
    
    console.log(`✅ Summoning ${count} ${enemyType}(s) with wave ${waveStrength} strength (0.15s interval)`);
}