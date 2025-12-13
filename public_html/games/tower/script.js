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

// Endless Mode
let endlessMode = false;
let endlessScore = 0;
let endlessBestScore = 0;
let fortressBossSpawned = false;

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

// Sound Effects
const sounds = {
    select: new Audio('src/se/select.wav'),
    enemyDestroy: new Audio('src/se/enemyDestroy.wav'),
    ice: new Audio('src/se/ice.mp3')
};

// BGM
const bgm = new Audio('src/bgm/SuperBall.mp3');
bgm.volume = 0.25; // 75% volume
bgm.loop = true; // Loop playback

// Set volume levels
sounds.enemyDestroy.volume = 0.75; // 50% volume

// Play sound function with error handling (supports simultaneous playback)
function playSound(soundName) {
    try {
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

// Custom field shapes for each stage
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
const skillTree = {
    'base_upgrade2': {
        id: 'base_upgrade2',
        name: 'ベース改造',
        description: '初期ライフ+5',
        cost: 25,
        icon: '🏯',
        image: 'img/tree/base.PNG',
        requires: ['unlock_rod', 'enemy_credits', 'all_tower_damage'],
        unlocks: [/* cross_specialization, initial_credits4 */ 'weak_point_analysis'],
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
        unlocks: ['rod_damage', 'base_upgrade2', 'cross_specialization', 'voltage_transformer', /* base_upgrade2 */],
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
        unlocks: [],
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
        unlocks: [],
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
        unlocks: [/* base_upgrade2 */],
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
        unlocks: [/* cross_specialization */],
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
    }
};

// Get skill tree bonus multipliers
function getSkillBonus(type, towerBaseType = null) {
    let bonus = 1.0;
    if (type === 'damage') {
        if (towerBaseType === 'turret' && unlockedSkills.includes('turret_damage')) bonus *= 1.05;
        if (towerBaseType === 'sniper' && unlockedSkills.includes('sniper_damage')) bonus *= 1.05;
        if (towerBaseType === 'blaster' && unlockedSkills.includes('blaster_damage')) bonus *= 1.05;
        if (towerBaseType === 'rod' && unlockedSkills.includes('rod_damage')) bonus *= 1.05;
        // All tower damage bonus (applies to all types)
        if (unlockedSkills.includes('all_tower_damage')) bonus *= 1.10;
    } else if (type === 'range') {
        if (towerBaseType === 'turret' && unlockedSkills.includes('turret_range')) bonus *= 1.01;
        if (towerBaseType === 'sniper' && unlockedSkills.includes('sniper_range')) bonus *= 1.01;
        if (towerBaseType === 'blaster' && unlockedSkills.includes('blaster_range')) bonus *= 1.01;
        if (towerBaseType === 'rod' && unlockedSkills.includes('rod_range')) bonus *= 1.01;
    } else if (type === 'chip_rate') {
        if (unlockedSkills.includes('chip_rate')) bonus = 0.1; // Add 10% to base drop rate
    } else if (type === 'enemy_credits') {
        if (unlockedSkills.includes('enemy_credits')) bonus *= 1.20; // +20% credits from enemies
    } else if (type === 'freeze_duration') {
        if (unlockedSkills.includes('freeze_duration')) bonus *= 1.50; // +50% freeze duration
    } else if (type === 'burn_damage') {
        if (unlockedSkills.includes('burn_damage')) bonus *= 1.50; // +50% burn damage
    } else if (type === 'crit_rate') {
        let critRate = 0.0; // Base 0%
        if (unlockedSkills.includes('weak_point_analysis')) critRate += 0.01; // +1%
        return critRate;
    } else if (type === 'surge_chance') {
        let surgeChance = 0.0; // Base 0%
        if (unlockedSkills.includes('voltage_transformer')) surgeChance += 0.10; // +10%
        return surgeChance;
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

function generatePath() {
    // Generate path based on current stage
    if (currentStage === 2) {
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
    localStorage.removeItem('neon_defense_tutorial_seen');
    
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

// Show options (placeholder)
function showOptions() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('options-screen').classList.remove('hidden');
    
    // Update checkbox state
    const gridCheckbox = document.getElementById('gridSnapCheckbox');
    if (gridCheckbox) {
        gridCheckbox.checked = gridSnapEnabled;
    }
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
    const savedGridSnap = localStorage.getItem('neon_defense_grid_snap');
    if (savedGridSnap !== null) {
        gridSnapEnabled = savedGridSnap === 'true';
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
        // Resume BGM
        bgm.play().catch(e => console.log('BGM play failed:', e));
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
    
    resetGameVars();
    generatePath(); // Generate fixed path once at game start
    resizeCanvas();
    gameActive = true;
    lastTime = 0; // Reset animation timestamp
    updateUI();
    
    // Start BGM
    bgm.currentTime = 0;
    bgm.play().catch(e => console.log('BGM play failed:', e));
    
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
    
    let startLives = 20;
    if (unlockedSkills.includes('base_upgrade')) {
        startLives += 5;
    }
    if (unlockedSkills.includes('base_upgrade2')) {
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
        unlockedStages: stages.filter(s => s.unlocked).map(s => s.id)
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

const stages = [
    { id: 1, name: 'STAGE 1', x: 1, y: 6, unlocked: true, description: '初期ステージ' },
    { id: 2, name: 'STAGE 2', x: 5, y: 5, unlocked: false, description: 'なんかのステージ' },
    // { id: 3, name: 'STAGE 3', x: 9, y: 4, unlocked: false, description: '上級ステージ' },
    // { id: 4, name: 'STAGE 4', x: 13, y: 3, unlocked: false, description: 'エキスパート' },
    // { id: 5, name: 'STAGE 5', x: 17, y: 2, unlocked: false, description: '最終ステージ' },
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
            if (selectedStage === stage.id) {
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
    enemiesToSpawn = 5 + Math.floor(wave * 2.5);
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
        this.slowAmount = 0;
        this.slowDuration = 0;
        this.stunDuration = 0; // Stun effect
        this.isBoss = false;
        this.chainBurn = false;

        const baseHp = 30 + (wave * 15);
        // Cap speed increase at wave 50
        const effectiveWave = Math.min(wave, 50);
        const baseSpeed = 1.5 + (effectiveWave * 0.1);
        // Cap fast enemy speed at wave 30
        const fastEffectiveWave = Math.min(wave, 30);
        const fastBaseSpeed = 1.5 + (fastEffectiveWave * 0.1);
        const baseReward = 10 + Math.floor(wave * 1.5); // Increased reward with wave progression

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
            this.hp = baseHp * 5.0; // 5x normal
            this.speed = baseSpeed; // Same speed as normal
            this.radius = 18; // Larger than normal
            this.color = '#ff6600';
            this.reward = Math.floor(baseReward * 5.0);
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
        } else if (this.type === 'fast') {
            this.hp = baseHp * 0.6;
            this.speed = fastBaseSpeed * 1.8; // Cap at wave 30
            this.radius = 10;
            this.color = '#ffff00';
            this.reward = Math.floor(baseReward * 1.2);
        } else if (this.type === 'tank') {
            this.hp = baseHp * 3.0;
            this.speed = baseSpeed * 0.6;
            this.radius = 16;
            this.color = '#9900ff';
            this.reward = Math.floor(baseReward * 2.0);
        } else {
            this.hp = baseHp;
            this.speed = baseSpeed;
            this.radius = 12;
            this.color = '#ff3333';
            this.reward = baseReward;
        }

        this.maxHp = this.hp;
    }

    update() {
        if (!this.active) return;

        // Apply burn damage
        if (this.burnDuration > 0) {
            this.burnDuration--;
            this.takeDamage(this.burnDamage);
            // Show burn damage text
            if (this.burnDuration % 15 === 0) { // Show every 15 frames to avoid spam
                createDamageText(this.x, this.y - this.radius - 10, this.burnDamage, true);
            }
        }

        // Update slow effect
        if (this.slowDuration > 0) {
            this.slowDuration--;
        }

        // Update stun effect
        if (this.stunDuration > 0) {
            this.stunDuration--;
            return; // Stunned enemies don't move
        }

        let target = this.path[this.pathIndex + 1];
        if (!target) return; 

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        // Calculate effective speed with slow
        let effectiveSpeed = this.speed;
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
        } else if (this.burnDuration > 0) {
            // Visual effect for burn
            ctx.fillStyle = '#ff4400';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff4400';
        } else if (this.slowDuration > 0) {
            // Visual effect for slow
            ctx.fillStyle = '#44aaff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#44aaff';
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        // Update rotation for fortress boss
        if (this.type === 'fortress') {
            this.rotation = (this.rotation || 0) + 0.02;
        }
        
        if (this.type === 'fortress') {
            // Draw rotating hexagon with 3 protruding arms
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            
            // Main hexagon
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
                ctx.fillRect(-armWidth / 2, this.radius * 0.6, armWidth, armLength - this.radius * 0.6);
                ctx.beginPath();
                ctx.arc(0, armLength, armWidth / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            ctx.restore();
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
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;

        // Don't draw HP bar for boss here (drawn at top of screen)
        // Only show HP bar if enemy has taken damage
        if (!this.isBoss && this.hp < this.maxHp) {
            const hpPct = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 12, this.y - this.radius - 8, 24, 4);
            ctx.fillStyle = this.getHpColor(hpPct);
            ctx.fillRect(this.x - 12, this.y - this.radius - 8, 24 * hpPct, 4);
            
            // Collect active debuff icons
            const debuffIcons = [];
            if (this.burnDuration > 0) debuffIcons.push({ emoji: '🔥', color: '#ff4400' });
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

    takeDamage(amt) {
        this.hp -= amt;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        const creditBonus = getSkillBonus('enemy_credits');
        money += Math.floor(this.reward * creditBonus);
        
        // Add to endless score
        if (endlessMode) {
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
        
        // Boss defeated - heal 5 lives
        if (this.isBoss) {
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
        } else {
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
    }

    getUpgradeCost() {
        // Cost increases with level
        return Math.floor(this.baseCost * (0.8 + (this.level * 0.5)));
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
        const nextRangeLevelCap = Math.min(this.level, 9);
        const rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        return {
            damage: Math.floor(this.baseDamage * (1 + this.level * 0.5)),
            range: Math.floor(this.baseRange * (1 + nextRangeLevelCap * 0.15) * rangeBonus)
        };
    }

    upgrade() {
        this.level++;
        // Calculate new stats
        // Damage: +50% per level base
        let damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
        this.damage = Math.floor(this.baseDamage * (1 + (this.level-1) * 0.5) * damageBonus);
        // Range: +15% per level base (capped at level 10, then skill bonus applied)
        const rangeLevelCap = Math.min(this.level - 1, 9); // Cap at level 10 (index 9)
        let rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        this.range = Math.floor(this.baseRange * (1 + rangeLevelCap * 0.15) * rangeBonus);
        // Cooldown: -5% per level (capped at 50%)
        let cdReduc = Math.min(0.5, (this.level-1) * 0.05);
        this.cooldown = this.baseCooldown * (1 - cdReduc);
        
        createExplosion(this.x, this.y, '#00ff00', 15);
    }

    canEvolve() {
        const currentType = TOWER_TYPES[this.type];
        
        // Rod tower special evolution levels (5, 15, 25)
        if (this.baseTypeOriginal === 'rod') {
            // First evolution at level 5 (rod -> lightning-rod)
            if (this.level >= 5 && !this.evolved && !currentType.isEvolution) {
                return true;
            }
            // Second evolution at level 15 (lightning-rod -> lightning-rod-ii)
            if (this.level >= 15 && this.evolved && !currentType.isSecondEvolution && currentType.isEvolution) {
                return true;
            }
            // Third evolution at level 25 (lightning-rod-ii -> lightning-spark)
            if (this.level >= 25 && currentType.isSecondEvolution && !currentType.isThirdEvolution) {
                return true;
            }
        } else {
            // Standard tower evolution levels (10, 25)
            // First evolution at level 10
            if (this.level >= 10 && !this.evolved && !currentType.isEvolution) {
                return true;
            }
            // Second evolution at level 25
            if (this.level >= 25 && this.evolved && !currentType.isSecondEvolution) {
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
                if (towerDef.isEvolution && !towerDef.isSecondEvolution && !towerDef.isThirdEvolution && towerDef.baseType === baseType) {
                    options.push({
                        key: key,
                        name: towerDef.name,
                        special: towerDef.special || 'none'
                    });
                }
            }
        }
        // Second evolution
        else if (currentType.isEvolution && !currentType.isSecondEvolution) {
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isSecondEvolution && !towerDef.isThirdEvolution && towerDef.evolvesFrom === this.type) {
                    options.push({
                        key: key,
                        name: towerDef.name,
                        special: towerDef.special || 'none'
                    });
                }
            }
        }
        // Third evolution (for rod tower)
        else if (currentType.isSecondEvolution && !currentType.isThirdEvolution) {
            for (let key in TOWER_TYPES) {
                const towerDef = TOWER_TYPES[key];
                if (towerDef.isThirdEvolution && towerDef.evolvesFrom === this.type) {
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
        
        // Recalculate stats at current level with skill bonuses
        let damageBonus = getSkillBonus('damage', this.baseTypeOriginal);
        this.damage = Math.floor(this.baseDamage * (1 + (this.level-1) * 0.5) * damageBonus);
        // Range: capped at level 10, then skill bonus applied
        const rangeLevelCap = Math.min(this.level - 1, 9);
        let rangeBonus = getSkillBonus('range', this.baseTypeOriginal);
        this.range = Math.floor(this.baseRange * (1 + rangeLevelCap * 0.15) * rangeBonus);
        let cdReduc = Math.min(0.5, (this.level-1) * 0.05);
        this.cooldown = this.baseCooldown * (1 - cdReduc);
        
        createExplosion(this.x, this.y, this.color, 30);
    }

    update(time) {
        if (time - this.lastShot < this.cooldown) return;

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
            // Rod towers always face up (angle = 0)
            if (this.type !== 'rod' && this.type !== 'lightning-rod' && this.type !== 'lightning-rod-ii' && this.type !== 'lightning-spark' && this.type !== 'burn-lightning') {
                this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            }
        }
    }

    shoot(target) {
        // Lightning strike for rod towers
        if (this.special === 'lightning' || this.special === 'lightning-zone' || this.special === 'burn-lightning') {
            lightningStrikes.push(new LightningStrike(this.x, this.y, target, this.damage, this.special));
        } else if (this.special === 'spread') {
            // Shoot 5 projectiles in spread pattern
            for (let i = 0; i < 5; i++) {
                const angle = -0.4 + (i * 0.2);
                projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special, angle));
            }
        } else if (this.special === 'splash' || this.special === 'giga-splash') {
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special));
        } else {
            projectiles.push(new Projectile(this.x, this.y, target, this.damage, this.color, this.type, this.special));
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

        // Scale slightly with level (cap at level 10)
        const effectiveLevel = Math.min(this.level, 10);
        const scale = 1 + (effectiveLevel - 1) * 0.1;
        ctx.scale(scale, scale);

        if (this.type === 'turret' || this.type === 'dual-turret' || this.type === 'big-turret' || this.type === 'quadruple-turret' || this.type === 'bugle-turret' || this.type === 'giga-turret') {
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
            } else if (this.type === 'bugle-turret') {
                // Draw wide spread barrel
                ctx.fillRect(0, -9, 26, 18);
                ctx.fillRect(20, -12, 6, 24);
            } else if (this.type === 'big-turret') {
                // Draw big cannon barrel
                ctx.fillRect(0, -7, 25, 14);
                // Add cannon tip
                ctx.fillRect(20, -5, 5, 10);
            } else if (this.type === 'giga-turret') {
                // Draw massive cannon barrel
                ctx.fillRect(0, -10, 28, 20);
                ctx.fillRect(23, -8, 7, 16);
            } else {
                ctx.fillRect(0, -4, 20, 8);
            }
        } else if (this.type === 'sniper' || this.type === 'sniper-mr2' || this.type === 'large-sniper' || this.type === 'sniper-mr3' || this.type === 'giga-sniper') {
            ctx.fillRect(-10, -10, 20, 20);
            
            if (this.type === 'sniper-mr2') {
                // Longer, thicker barrel
                ctx.fillRect(0, -3, 35, 6);
            } else if (this.type === 'sniper-mr3') {
                // Advanced long barrel with details
                ctx.fillRect(0, -4, 40, 8);
                ctx.fillRect(35, -2, 5, 4);
            } else if (this.type === 'large-sniper') {
                // Wide barrel
                ctx.fillRect(0, -4, 32, 8);
            } else if (this.type === 'giga-sniper') {
                // Massive wide barrel
                ctx.fillRect(0, -5, 38, 10);
                ctx.fillRect(33, -3, 5, 6);
            } else {
                ctx.fillRect(0, -2, 30, 4);
            }
        } else if (this.type === 'blaster' || this.type === 'flame-blaster' || this.type === 'frost-blaster' || this.type === 'blast-blaster' || this.type === 'blizzard-blaster') {
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
            }
        } else if (this.type === 'rod' || this.type === 'lightning-rod' || this.type === 'lightning-rod-ii' || this.type === 'lightning-spark' || this.type === 'burn-lightning') {
            // Draw lightning rod
            ctx.fillRect(-3, -15, 6, 30); // Vertical rod
            
            // Draw lightning bolt on top for evolved versions
            if (this.type !== 'rod') {
                // Use orange-yellow for burn-lightning, yellow for others
                ctx.fillStyle = this.type === 'burn-lightning' ? '#ffaa00' : '#ffff00';
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
                if (this.type === 'lightning-rod-ii' || this.type === 'lightning-spark' || this.type === 'burn-lightning') {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = this.type === 'burn-lightning' ? '#ffaa00' : '#ffff00';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
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
    constructor(x, y, target, damage, color, type, special, offsetAngle = 0) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 8;
        this.damage = damage;
        this.color = color;
        this.type = type;
        this.special = special;
        this.active = true;
        this.radius = (special === 'splash') ? 10 : (special === 'giga-splash') ? 15 : 4;
        this.hitEnemies = []; // For pierce effect
        
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

    update() {
        if (this.type === 'sniper' || this.type === 'sniper-mr2' || this.type === 'sniper-mr3' || this.type === 'large-sniper' || this.type === 'giga-sniper') {
            if (this.target && this.target.active) {
                // Pierce effect for large-sniper and giga-sniper
                if (this.special === 'pierce' || this.special === 'giga-pierce') {
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
        } else if (this.special === 'spread') {
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

            if (dist < this.speed) {
                // Splash damage for big-turret and giga-turret
                if (this.special === 'splash' || this.special === 'giga-splash') {
                    const splashRadius = (this.special === 'giga-splash') ? 90 : 60;
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
                        }
                    }
                    
                    createExplosion(targetX, targetY, this.color, (this.special === 'giga-splash') ? 30 : 20);
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

        this.x += this.vx;
        this.y += this.vy;
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
        // Calculate critical hit
        const critRate = getSkillBonus('crit_rate');
        const isCrit = Math.random() < critRate;
        const finalDamage = isCrit ? this.damage * 2 : this.damage;
        
        enemy.takeDamage(finalDamage);
        
        // Show damage text
        createDamageText(enemy.x, enemy.y - enemy.radius - 10, finalDamage, false, isCrit);
        
        // Apply burn effect
        if (this.special === 'burn') {
            const burnBonus = getSkillBonus('burn_damage');
            enemy.burnDamage = Math.floor(this.damage * 0.1 * burnBonus);
            enemy.burnDuration = 60;
            createExplosion(enemy.x, enemy.y, '#ff4400', 5);
        }
        
        // Chain burn - enhanced burn
        if (this.special === 'chain-burn') {
            const burnBonus = getSkillBonus('burn_damage');
            enemy.burnDamage = Math.floor(this.damage * 0.15 * burnBonus); // 15% burn damage
            enemy.burnDuration = 90; // Longer duration
            enemy.chainBurn = true;
            createExplosion(enemy.x, enemy.y, '#ff2200', 8);
        }
        
        // Apply slow effect
        if (this.special === 'slow') {
            const wasNotFrozen = enemy.slowDuration <= 0; // Check if enemy was not frozen
            enemy.slowAmount = 0.5;
            enemy.slowDuration = 120;
            if (wasNotFrozen) playSound('ice'); // Play ice sound only if newly frozen
            createExplosion(enemy.x, enemy.y, '#44aaff', 5);
        }
        
        // Freeze zone
        if (this.special === 'freeze-zone') {
            const wasNotFrozen = enemy.slowDuration <= 0; // Check if enemy was not frozen
            enemy.slowAmount = 0.4;
            const freezeDurationBonus = getSkillBonus('freeze_duration');
            enemy.slowDuration = Math.floor(60 * freezeDurationBonus);
            if (wasNotFrozen) playSound('ice'); // Play ice sound only if newly frozen
            freezeZones.push(new FreezeZone(enemy.x, enemy.y));
            createExplosion(enemy.x, enemy.y, '#0099ff', 10);
        }
        
        // Lightning effect - chance to stun
        if (this.special === 'lightning') {
            if (Math.random() < 0.3) { // 30% chance to stun
                enemy.stunDuration = 60; // 1 second stun
                createExplosion(enemy.x, enemy.y, '#ffff00', 10);
            } else {
                createExplosion(enemy.x, enemy.y, '#ffff00', 5);
            }
        }
        
        // Lightning zone - creates stun zone
        if (this.special === 'lightning-zone') {
            stunZones.push(new StunZone(enemy.x, enemy.y));
            createExplosion(enemy.x, enemy.y, '#ffff00', 15);
        }
        
        // Burn-Lightning - stun chance + burn
        if (this.special === 'burn-lightning') {
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
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

function createExplosion(x, y, color, count=10) {
    for(let i=0; i<count; i++) {
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
        this.progress += 0.015;
        
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
    // Create 4 elliptical waves at different angles (cross pattern)
    ellipticalWaves.push(new EllipticalWave(x, y, 0)); // Horizontal
    ellipticalWaves.push(new EllipticalWave(x, y, Math.PI / 4)); // 45 degrees
    ellipticalWaves.push(new EllipticalWave(x, y, Math.PI / 2)); // Vertical
    ellipticalWaves.push(new EllipticalWave(x, y, 3 * Math.PI / 4)); // 135 degrees
}

// Damage Text Class
class DamageText {
    constructor(x, y, damage, isBurn = false, isCrit = false) {
        this.x = x;
        this.y = y;
        this.isText = typeof damage === 'string';
        this.damage = this.isText ? damage : Math.floor(damage);
        this.life = 1.0;
        this.vy = -1.5; // Float upward
        this.vx = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
        this.isBurn = isBurn;
        this.isCrit = isCrit;
    }

    update() {
        this.y += this.vy;
        this.x += this.vx;
        this.life -= 0.02;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        if (this.isText) {
            // Special text (like +5 LIVES)
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 16px Orbitron';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
        } else if (this.isCrit) {
            // Critical hit - purple and larger
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 18px Orbitron';
            ctx.strokeText(this.damage, this.x, this.y);
            ctx.fillText(this.damage, this.x, this.y);
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

function createDamageText(x, y, damage, isBurn = false, isCrit = false) {
    damageTexts.push(new DamageText(x, y, damage, isBurn, isCrit));
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
        this.duration--;
        
        // Apply slow to enemies in range
        for (let e of enemies) {
            if (!e.active) continue;
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
        this.duration--;
        
        // Apply stun chance to enemies in range
        for (let e of enemies) {
            if (!e.active || e.stunDuration > 0) continue;
            let dx = e.x - this.x;
            let dy = e.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist <= this.radius && Math.random() < this.stunChance / 60) { // Per-frame chance
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
        const surgeChance = getSkillBonus('surge_chance') + 1;
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
            this.riseY -= this.riseSpeed;
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
            
            this.strikeY += this.strikeSpeed;
            
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
        }
        
        if (this.target.hp <= 0) {
            this.target.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Surge effects - brighter and thicker
        const color = this.isSurge ? '#ff00ff' : '#ffff00'; // Purple for surge
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

// --- Main Loop ---

function gameLoop(timestamp) {
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

    let dt = timestamp - lastTime;
    lastTime = timestamp;

    // Update dash animation
    dashOffset = (dashOffset + 0.5) % 15;

    // Update screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (screenShakeDuration > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        screenShakeDuration--;
    }
    
    // Update damage flash (fade out)
    if (damageFlashAlpha > 0) {
        damageFlashAlpha -= 0.03; // Fade out speed
        if (damageFlashAlpha < 0) damageFlashAlpha = 0;
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
        const cost = TOWER_TYPES[selectedTowerType].cost;
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
            
            let type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            
            // Rampage enemies take 5 spawn slots
            if (type === 'rampage') {
                if (enemiesToSpawn >= 5) {
                    enemies.push(new Enemy(path, type));
                    enemiesToSpawn -= 5;
                } else {
                    // Not enough slots, spawn normal instead
                    type = 'normal';
                    enemies.push(new Enemy(path, type));
                    enemiesToSpawn--;
                }
            } else {
                enemies.push(new Enemy(path, type));
                enemiesToSpawn--;
            }
            spawnTimer = timestamp;
        }
    }
    
    // Check if we need to spawn boss (separate check to avoid blocking wave completion)
    if (waveActive && enemiesToSpawn === 0 && !bossSpawned && !fortressBossSpawned) {
        // In endless mode, spawn fortress boss every 50 waves
        if (endlessMode && wave % 50 === 0) {
            enemies.push(new Enemy(path, 'fortress'));
            fortressBossSpawned = true;
            totalWaveEnemies++;
            
            // Trigger boss appearance effects
            bossShockwaveRadius = 0;
            bossShockwaveActive = true;
            screenShakeDuration = 30;
            screenShakeIntensity = 12;
        } else if (wave % 10 === 0) {
            // Normal boss at wave 10, 20, 30, etc.
            enemies.push(new Enemy(path, 'boss'));
            bossSpawned = true;
            totalWaveEnemies++;
            
            // Trigger boss appearance shockwave
            bossShockwaveRadius = 0;
            bossShockwaveActive = true;
            
            // Trigger screen shake
            screenShakeDuration = 20;
            screenShakeIntensity = 8;
        } else {
            // No boss for this wave, mark as spawned to allow wave completion
            bossSpawned = true;
        }
    }
    
    // Check for wave completion
    if (gameActive && waveActive && enemiesToSpawn === 0 && enemies.length === 0) {
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

    towers.forEach(t => {
        t.update(timestamp);
        // Pass true if this tower is the selected one
        t.draw(ctx, t === selectedTowerInstance);
    });

    // Update and draw enemies (skip logic updates if game is over)
    enemies = enemies.filter(e => e.active);
    enemies.sort((a,b) => a.y - b.y);
    enemies.forEach(e => {
        if (gameActive) e.update();
        e.draw(ctx);
    });

    // Update and draw projectiles (skip logic updates if game is over)
    projectiles = projectiles.filter(p => p.active);
    projectiles.forEach(p => {
        if (gameActive) p.update();
        p.draw(ctx);
    });

    // Always update and draw particles (visual effects continue)
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    damageTexts = damageTexts.filter(d => d.life > 0);
    damageTexts.forEach(d => {
        d.update();
        d.draw(ctx);
    });

    freezeZones = freezeZones.filter(z => z.duration > 0);
    freezeZones.forEach(z => {
        z.update();
        z.draw(ctx);
    });

    stunZones = stunZones.filter(z => z.duration > 0);
    stunZones.forEach(z => {
        z.update();
        z.draw(ctx);
    });

    lightningStrikes = lightningStrikes.filter(ls => ls.active);
    lightningStrikes.forEach(ls => {
        ls.update();
        ls.draw(ctx);
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
    if (tempTowerType && tempTowerX !== null && tempTowerY !== null) {
        let info = TOWER_TYPES[tempTowerType];
        const canPlace = canPlaceTower(tempTowerX, tempTowerY);
        const cost = TOWER_TYPES[tempTowerType].cost;
        const hasEnoughMoney = money >= cost;
        const canConfirm = canPlace && hasEnoughMoney;
        
        // Draw range preview
        ctx.beginPath();
        ctx.strokeStyle = canConfirm ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = canConfirm ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        ctx.arc(tempTowerX, tempTowerY, info.range, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Draw temporary tower
        ctx.fillStyle = canConfirm ? info.color : '#888888';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(tempTowerX, tempTowerY, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Draw confirmation buttons
        const buttonSize = 30;
        const buttonY = tempTowerY + 35;
        
        // Confirm button (✓)
        ctx.fillStyle = canConfirm ? '#00ff00' : '#444444';
        ctx.strokeStyle = canConfirm ? '#00ff00' : '#666666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tempTowerX - 20, buttonY, buttonSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = canConfirm ? '#000000' : '#333333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tempTowerX - 27, buttonY);
        ctx.lineTo(tempTowerX - 22, buttonY + 5);
        ctx.lineTo(tempTowerX - 13, buttonY - 5);
        ctx.stroke();
        
        // Cancel button (×)
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tempTowerX + 20, buttonY, buttonSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tempTowerX + 15, buttonY - 5);
        ctx.lineTo(tempTowerX + 25, buttonY + 5);
        ctx.moveTo(tempTowerX + 25, buttonY - 5);
        ctx.lineTo(tempTowerX + 15, buttonY + 5);
        ctx.stroke();
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
        if (stageShape && stageShape.customPlayableZones) {
            // Draw as a connected path for Stage 2 (L-shape)
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
    
    // Draw grid if enabled and in placement mode
    if (gridSnapEnabled && selectedTowerType) {
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

function updateTowerButtons() {
    ['turret', 'sniper', 'blaster', 'rod'].forEach(t => {
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
        
        const cost = TOWER_TYPES[t].cost;
        
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

window.startUpgradeHold = function() {
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

function confirmTempTower() {
    if (!tempTowerType || tempTowerX === null || tempTowerY === null) return;
    
    const cost = TOWER_TYPES[tempTowerType].cost;
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
}

function cancelTempTower() {
    createExplosion(tempTowerX, tempTowerY, '#ffff00', 5);
    tempTowerX = null;
    tempTowerY = null;
    tempTowerType = null;
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
        updateUI();
        return;
    }

    // 2. If no tower clicked
    if (selectedTowerType) {
        // Try to place tower
        placeTower();
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

    const cost = TOWER_TYPES[selectedTowerType].cost;
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
    
    const positions = {
        'base_upgrade2': { x: 0.5, y: 0.1 }, // ベース改造（base_upgradeの上）
        'base_upgrade': { x: 0.5, y: 0.3 }, // ベース強化（initial_creditsの上）
        'initial_credits': { x: 0.5, y: 0.5 },
        // TURRET branch (left)
        'turret_damage': { x: 0.3, y: 0.5 },
        'turret_range': { x: 0.1, y: 0.5 },
        // SNIPER branch (top-left)
        'sniper_damage': { x: 0.3, y: 0.3 },
        'sniper_range': { x: 0.1, y: 0.3 },
        // BLASTER branch (bottom-left)
        'blaster_damage': { x: 0.3, y: 0.7 },
        'blaster_range': { x: 0.1, y: 0.7 },
        'burn_damage': { x: -0.1, y: 0.9 }, // 延焼ダメージ
        'freeze_duration': { x: 0.1, y: 0.9 }, // 氷結持続時間
        // All tower damage (center-left, requires all 3 range skills)
        'all_tower_damage': { x: -0.1, y: 0.5 },
        'weak_point_analysis': { x: 0.3, y: 0.1 }, // 弱点解析
        // ROD branch (bottom)
        'unlock_rod': { x: 0.5, y: 0.7 },
        'rod_damage': { x: 0.3, y: 0.9 },
        'rod_range': { x: 0.1, y: 1.1 },
        'voltage_transformer': { x: 0.5, y: 0.9 },
        'cross_specialization': { x: 0.7, y: 0.9 }, // 専門外
        // Credits branch (right)
        'initial_credits2': { x: 0.7, y: 0.5 },
        'chip_rate': { x: 0.9, y: 0.4 },
        'initial_credits3': { x: 0.9, y: 0.6 },
        'initial_credits4': { x: 0.7, y: 0.7 },
        'enemy_credits': { x: 1.1, y: 0.5 } // 敵クレジット獲得量
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
                if (isBetter) {
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
                if (isBetter) {
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
    const newZoom = Math.max(0.5, Math.min(2.0, skillTreeZoom * zoomFactor));
    
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
            const newZoom = Math.max(0.5, Math.min(2.0, skillTreeZoom * zoomFactor));
            
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
let titleAnimationActive = true;
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
        enemy.progress += enemy.speed;
        
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
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        initTitleAnimation();
        updateStartPromptText();
        initDebugUI();
        loadEndlessBestScore();
    }, 100);
}

function loadEndlessBestScore() {
    const saved = localStorage.getItem('endlessBestScore');
    if (saved) {
        endlessBestScore = parseInt(saved);
    }
}
