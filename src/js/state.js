/**
 * Infinity Merge Tower v3.0 - Game State
 * 게임 상태 관리
 */

// 영구 저장 상태
const GameState = {
    // 자원
    gold: 100,
    gems: 0,

    // 진행 상태
    currentStage: 1,
    currentWave: 1,
    bestStage: 1,

    // 히어로 상태 (클래스별)
    heroes: {
        warrior: { unlocked: true, mergeGrid: Array(9).fill(null) },
        axe: { unlocked: false, mergeGrid: Array(9).fill(null) },
        archer: { unlocked: false, mergeGrid: Array(9).fill(null) },
        mage: { unlocked: false, mergeGrid: Array(9).fill(null) },
        assassin: { unlocked: false, mergeGrid: Array(9).fill(null) },
    },

    // 업그레이드 레벨
    upgrades: {
        attack: 0,
        attackSpeed: 0,
        moveSpeed: 0,
        critChance: 0,
        critDamage: 0,
        goldBonus: 0,
    },

    // 통계
    totalKills: 0,
    totalBossKills: 0,
    totalMerges: 0,
    totalGoldEarned: 0,
    playTime: 0,

    // 업적
    achievementsUnlocked: [],

    // 소환 비용
    summonCost: CONFIG.SUMMON_COST_BASE,

    // 설정
    autoMergeEnabled: false,
    soundEnabled: true,

    // 일일 보상
    lastDailyReward: null,
    dailyRewardStreak: 0,

    // 저장 시간
    savedAt: null,
};

// 런타임 상태 (저장하지 않음)
const RuntimeState = {
    // 캔버스
    canvas: null,
    ctx: null,
    canvasWidth: 0,
    canvasHeight: 0,
    centerX: 0,
    centerY: 0,

    // 동적 반경 (화면 크기에 따라 조절)
    dynamicCenterRadius: 120,
    dynamicSpawnRadius: 250,

    // 게임 루프
    lastTime: 0,
    gameSpeed: 1,
    isPaused: false,

    // 히어로 런타임 상태
    heroInstances: [],  // 실제 움직이는 히어로 객체들

    // 전투 시스템
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    damageNumbers: [],

    // 웨이브 시스템
    waveEnemiesSpawned: 0,
    waveEnemiesKilled: 0,
    spawnTimer: 0,
    isBossWave: false,
    bossActive: false,
    bossTimer: 0,

    // DPS 계산
    damageDealt: 0,
    dpsUpdateTimer: 0,
    currentDPS: 0,

    // UI 상태
    selectedHeroClass: 'warrior',  // 현재 선택된 클래스 (머지 탭용)
    currentModal: null,
    draggedItem: null,
    draggedIndex: null,

    // 자동 머지 타이머
    autoMergeTimer: 0,

    // 스킬 쿨다운
    skillCooldowns: {},
};

/**
 * 히어로 인스턴스 생성
 */
function createHeroInstance(classId, index) {
    const heroClass = HERO_CLASSES[classId];
    if (!heroClass) return null;

    // 원형 배치 각도 계산
    const unlockedHeroes = getUnlockedHeroIds();
    const angleStep = (Math.PI * 2) / Math.max(unlockedHeroes.length, 1);
    const angle = angleStep * index;

    // 동적 반경 사용
    const radius = RuntimeState.dynamicCenterRadius || CONFIG.CANVAS_CENTER_RADIUS;

    return {
        classId: classId,
        class: heroClass,

        // 위치 (원형 배치)
        x: RuntimeState.centerX + Math.cos(angle) * radius * 0.5,
        y: RuntimeState.centerY + Math.sin(angle) * radius * 0.5,

        // 이동
        targetX: 0,
        targetY: 0,
        moveAngle: angle,
        wanderTimer: Math.random() * 2000,

        // 전투
        lastAttackTime: 0,
        currentTarget: null,
        attackCooldown: 0,

        // 스킬
        skillCooldown: 0,
        skillActive: false,

        // 스탯 (머지 아이템 + 업그레이드 반영)
        stats: calculateHeroStats(classId),
    };
}

/**
 * 히어로 스탯 계산 (머지 아이템 + 업그레이드 반영)
 */
function calculateHeroStats(classId) {
    const heroClass = HERO_CLASSES[classId];
    const heroState = GameState.heroes[classId];

    // 기본 스탯
    let attack = heroClass.baseAtk;
    let atkSpeed = heroClass.atkSpeed;
    let moveSpeed = heroClass.moveSpeed;
    let range = heroClass.range;
    let critChance = 0.05;
    let critDamage = 1.5;

    // 머지 아이템 보너스
    if (heroState && heroState.mergeGrid) {
        heroState.mergeGrid.forEach(item => {
            if (item) {
                const itemType = MERGE_ITEM_TYPES.find(t => t.id === item.typeId);
                if (itemType) {
                    const value = itemType.baseValue * item.level;
                    switch (itemType.statType) {
                        case 'attack': attack += value; break;
                        case 'defense': break; // 미래 확장용
                        case 'speed': atkSpeed += value; break;
                        case 'crit': critChance += value; break;
                        case 'hp': break; // 미래 확장용
                    }
                }
            }
        });
    }

    // 업그레이드 보너스
    const upgrades = GameState.upgrades;
    attack *= (1 + upgrades.attack * 0.05);
    atkSpeed *= (1 + upgrades.attackSpeed * 0.03);
    moveSpeed *= (1 + upgrades.moveSpeed * 0.02);
    critChance += upgrades.critChance * 0.01;
    critDamage += upgrades.critDamage * 0.1;

    return {
        attack,
        atkSpeed,
        moveSpeed,
        range,
        critChance,
        critDamage,
        attackType: heroClass.attackType,
    };
}

/**
 * 해금된 히어로 ID 목록
 */
function getUnlockedHeroIds() {
    return Object.keys(GameState.heroes).filter(id => GameState.heroes[id].unlocked);
}

/**
 * 히어로 해금 체크 및 해금
 */
function checkAndUnlockHeroes() {
    const stage = GameState.currentStage;
    let newUnlocks = [];

    Object.entries(HERO_CLASSES).forEach(([id, heroClass]) => {
        if (!GameState.heroes[id].unlocked && stage >= heroClass.unlockStage) {
            GameState.heroes[id].unlocked = true;
            newUnlocks.push(heroClass);
        }
    });

    return newUnlocks;
}

/**
 * 히어로 인스턴스들 초기화
 */
function initHeroInstances() {
    RuntimeState.heroInstances = [];
    const unlockedIds = getUnlockedHeroIds();

    unlockedIds.forEach((id, index) => {
        const hero = createHeroInstance(id, index);
        if (hero) {
            RuntimeState.heroInstances.push(hero);
        }
    });
}

/**
 * 모든 히어로 스탯 재계산
 */
function recalculateAllHeroStats() {
    RuntimeState.heroInstances.forEach(hero => {
        hero.stats = calculateHeroStats(hero.classId);
    });
}

/**
 * 게임 상태 초기화
 */
function initGameState() {
    // 캔버스 중심 좌표 설정
    if (RuntimeState.canvas) {
        RuntimeState.canvasWidth = RuntimeState.canvas.width;
        RuntimeState.canvasHeight = RuntimeState.canvas.height;
        RuntimeState.centerX = RuntimeState.canvasWidth / 2;
        RuntimeState.centerY = RuntimeState.canvasHeight / 2;
    }

    // 히어로 인스턴스 초기화
    initHeroInstances();

    // 스킬 쿨다운 초기화
    Object.keys(HERO_CLASSES).forEach(id => {
        RuntimeState.skillCooldowns[id] = 0;
    });

    console.log('Game state initialized');
}

/**
 * 게임 상태 리셋
 */
function resetGameState() {
    GameState.gold = 100;
    GameState.gems = 0;
    GameState.currentStage = 1;
    GameState.currentWave = 1;
    GameState.bestStage = 1;

    // 히어로 상태 리셋
    Object.keys(GameState.heroes).forEach(id => {
        GameState.heroes[id] = {
            unlocked: id === 'warrior',
            mergeGrid: Array(9).fill(null),
        };
    });

    // 업그레이드 리셋
    Object.keys(GameState.upgrades).forEach(key => {
        GameState.upgrades[key] = 0;
    });

    // 통계 리셋
    GameState.totalKills = 0;
    GameState.totalBossKills = 0;
    GameState.totalMerges = 0;
    GameState.totalGoldEarned = 0;
    GameState.playTime = 0;

    GameState.achievementsUnlocked = [];
    GameState.summonCost = CONFIG.SUMMON_COST_BASE;

    // 런타임 상태 리셋
    RuntimeState.enemies = [];
    RuntimeState.projectiles = [];
    RuntimeState.particles = [];
    RuntimeState.waveEnemiesSpawned = 0;
    RuntimeState.waveEnemiesKilled = 0;

    initHeroInstances();
}

/**
 * 업적 체크
 */
function checkAchievements() {
    const newAchievements = [];

    ACHIEVEMENTS.forEach(achievement => {
        if (GameState.achievementsUnlocked.includes(achievement.id)) return;

        let unlocked = false;
        const condition = achievement.condition;

        switch (condition.type) {
            case 'kills':
                unlocked = GameState.totalKills >= condition.value;
                break;
            case 'stage':
                unlocked = GameState.bestStage >= condition.value;
                break;
            case 'classes':
                unlocked = getUnlockedHeroIds().length >= condition.value;
                break;
            case 'merges':
                unlocked = GameState.totalMerges >= condition.value;
                break;
            case 'bossKills':
                unlocked = GameState.totalBossKills >= condition.value;
                break;
        }

        if (unlocked) {
            GameState.achievementsUnlocked.push(achievement.id);
            GameState.gems += achievement.reward.gems || 0;
            newAchievements.push(achievement);
        }
    });

    return newAchievements;
}

/**
 * 골드 보너스 계산
 */
function getGoldBonus() {
    return 1 + (GameState.upgrades.goldBonus * 0.05);
}
