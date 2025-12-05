/**
 * Infinity Merge Tower - Endless Tower System
 * 무한 타워 모드를 관리합니다.
 */

/**
 * 무한 타워 잠금 해제 여부 체크
 * @returns {boolean}
 */
function isTowerUnlocked() {
    return GameState.highestStage >= CONFIG.TOWER_UNLOCK_STAGE;
}

/**
 * 무한 타워 모드 시작
 */
function startTowerMode() {
    if (!isTowerUnlocked()) {
        showToast(`스테이지 ${CONFIG.TOWER_UNLOCK_STAGE} 도달 후 해금됩니다!`);
        return false;
    }

    RuntimeState.inTowerMode = true;
    RuntimeState.isBossBattle = false;
    RuntimeState.isFarmingMode = false;

    // 현재 층에서 시작
    prepareTowerFloor(GameState.towerFloor);

    return true;
}

/**
 * 무한 타워 모드 종료
 */
function exitTowerMode() {
    RuntimeState.inTowerMode = false;
    RuntimeState.enemies = [];
    RuntimeState.projectiles = [];

    // 일반 모드로 복귀
    RuntimeState.waveEnemiesKilled = 0;
    RuntimeState.waveEnemiesTotal = CONFIG.BASE_WAVE_ENEMIES;
}

/**
 * 타워 층 준비
 * @param {number} floor - 층 번호
 */
function prepareTowerFloor(floor) {
    RuntimeState.enemies = [];
    RuntimeState.projectiles = [];
    RuntimeState.towerEnemiesRemaining = calculateTowerEnemyCount(floor);
    RuntimeState.waveEnemiesKilled = 0;
    RuntimeState.waveEnemiesTotal = RuntimeState.towerEnemiesRemaining;

    // 층 시작 알림
    showToast(`🗼 ${floor}층 시작!`);
}

/**
 * 층별 적 수 계산
 * @param {number} floor - 층 번호
 * @returns {number}
 */
function calculateTowerEnemyCount(floor) {
    // 기본 5마리 + 층당 0.5마리 (10층마다 추가 5마리)
    return Math.floor(5 + floor * 0.5 + Math.floor(floor / 10) * 5);
}

/**
 * 층별 적 체력 계산
 * @param {number} floor - 층 번호
 * @returns {number}
 */
function calculateTowerEnemyHP(floor) {
    // 층이 올라갈수록 기하급수적으로 증가
    return Math.floor(100 * Math.pow(1.15, floor - 1));
}

/**
 * 층별 적 골드 보상 계산
 * @param {number} floor - 층 번호
 * @returns {number}
 */
function calculateTowerEnemyGold(floor) {
    return Math.floor(10 + floor * 3);
}

/**
 * 타워 적 스폰
 * @param {number} floor - 현재 층
 */
function spawnTowerEnemy(floor) {
    if (RuntimeState.towerEnemiesRemaining <= 0) return;
    if (RuntimeState.enemies.length >= 10) return; // 최대 10마리

    const hp = calculateTowerEnemyHP(floor);
    const goldReward = calculateTowerEnemyGold(floor);

    // 10층마다 엘리트 적 등장
    const isElite = floor % 10 === 0 && RuntimeState.towerEnemiesRemaining === 1;

    // 5층마다 보스 등장
    const isBoss = floor % 5 === 0 && RuntimeState.towerEnemiesRemaining === 1;

    let enemy = {
        x: RuntimeState.canvas.width + 50,
        y: 80 + Math.random() * (RuntimeState.canvas.height - 160),
        hp: hp,
        maxHp: hp,
        speed: 0.3 + Math.random() * 0.2,
        size: 30,
        goldReward: goldReward,
        isBoss: false,
        isElite: false,
        element: getRandomElement()
    };

    if (isBoss) {
        const bossIndex = Math.floor(floor / 5) % BOSS_TYPES.length;
        const bossType = BOSS_TYPES[bossIndex];

        enemy.hp = hp * 10;
        enemy.maxHp = enemy.hp;
        enemy.size = 60;
        enemy.goldReward = goldReward * 10;
        enemy.isBoss = true;
        enemy.emoji = bossType.emoji;
        enemy.name = `${floor}층 ${bossType.name}`;
        enemy.color = bossType.color;
        enemy.element = bossType.element;
        enemy.speed = 0.15;
    } else if (isElite) {
        enemy.hp = hp * 3;
        enemy.maxHp = enemy.hp;
        enemy.size = 45;
        enemy.goldReward = goldReward * 3;
        enemy.isElite = true;
    }

    RuntimeState.enemies.push(enemy);
    RuntimeState.towerEnemiesRemaining--;
}

/**
 * 타워 층 클리어 체크
 * @returns {boolean}
 */
function checkTowerFloorCleared() {
    return RuntimeState.towerEnemiesRemaining <= 0 && RuntimeState.enemies.length === 0;
}

/**
 * 다음 층으로 이동
 */
function advanceToNextFloor() {
    const currentFloor = GameState.towerFloor;

    // 층 클리어 보상
    const rewards = calculateFloorRewards(currentFloor);
    GameState.gold += rewards.gold;
    GameState.gems += rewards.gems;

    // 보상 표시
    let rewardText = `💰 ${rewards.gold}`;
    if (rewards.gems > 0) {
        rewardText += ` 💎 ${rewards.gems}`;
    }
    if (rewards.milestone) {
        rewardText += ` (${rewards.milestone} 보너스!)`;
    }
    showToast(`🗼 ${currentFloor}층 클리어! ${rewardText}`);

    // 층 증가
    GameState.towerFloor++;
    if (GameState.towerFloor > GameState.towerHighestFloor) {
        GameState.towerHighestFloor = GameState.towerFloor;
    }

    // 업적 체크
    checkAchievements();

    // 다음 층 준비
    prepareTowerFloor(GameState.towerFloor);

    // 저장
    saveGame();
}

/**
 * 층 클리어 보상 계산
 * @param {number} floor - 클리어한 층
 * @returns {Object} - { gold, gems, milestone }
 */
function calculateFloorRewards(floor) {
    let gold = TOWER_REWARDS.perFloor.gold * floor;
    let gems = TOWER_REWARDS.perFloor.gems;
    let milestone = null;

    // 50층 마일스톤
    if (floor % 50 === 0) {
        gold += TOWER_REWARDS.milestone50.gold;
        gems += TOWER_REWARDS.milestone50.gems;
        milestone = '50층';
    }
    // 10층 마일스톤
    else if (floor % 10 === 0) {
        gold += TOWER_REWARDS.milestone10.gold;
        gems += TOWER_REWARDS.milestone10.gems;
        milestone = '10층';
    }

    return { gold, gems, milestone };
}

/**
 * 타워 층 정보 표시
 * @returns {Object}
 */
function getTowerFloorInfo() {
    const floor = GameState.towerFloor;
    return {
        floor,
        highestFloor: GameState.towerHighestFloor,
        enemyCount: calculateTowerEnemyCount(floor),
        enemyHP: calculateTowerEnemyHP(floor),
        rewards: calculateFloorRewards(floor),
        isBossFloor: floor % 5 === 0,
        isEliteFloor: floor % 10 === 0
    };
}

/**
 * 타워 리더보드용 정보
 * @returns {Object}
 */
function getTowerStats() {
    return {
        currentFloor: GameState.towerFloor,
        highestFloor: GameState.towerHighestFloor,
        totalRewardsEarned: calculateTotalTowerRewards()
    };
}

/**
 * 총 타워 보상 계산
 * @returns {Object}
 */
function calculateTotalTowerRewards() {
    let totalGold = 0;
    let totalGems = 0;

    for (let floor = 1; floor < GameState.towerHighestFloor; floor++) {
        const rewards = calculateFloorRewards(floor);
        totalGold += rewards.gold;
        totalGems += rewards.gems;
    }

    return { gold: totalGold, gems: totalGems };
}

/**
 * 타워 진행도 초기화 (테스트용)
 */
function resetTowerProgress() {
    GameState.towerFloor = 1;
    GameState.towerHighestFloor = 1;
    GameState.towerRewardsClaimed = {};
}

/**
 * 타워 모드 업데이트 (게임 루프에서 호출)
 * @param {number} deltaTime
 */
function updateTowerMode(deltaTime) {
    if (!RuntimeState.inTowerMode) return;

    // 적 스폰
    RuntimeState.spawnTimer += deltaTime;
    if (RuntimeState.spawnTimer >= 1500 && RuntimeState.towerEnemiesRemaining > 0) {
        RuntimeState.spawnTimer = 0;
        spawnTowerEnemy(GameState.towerFloor);
    }

    // 층 클리어 체크
    if (checkTowerFloorCleared()) {
        advanceToNextFloor();
    }
}

/**
 * 타워 UI 렌더링 정보
 * @returns {Object}
 */
function getTowerUIInfo() {
    const info = getTowerFloorInfo();
    const progress = RuntimeState.waveEnemiesKilled / RuntimeState.waveEnemiesTotal;

    return {
        ...info,
        progress: Math.min(progress * 100, 100),
        enemiesRemaining: RuntimeState.towerEnemiesRemaining + RuntimeState.enemies.length,
        totalEnemies: RuntimeState.waveEnemiesTotal
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isTowerUnlocked,
        startTowerMode,
        exitTowerMode,
        prepareTowerFloor,
        calculateTowerEnemyCount,
        calculateTowerEnemyHP,
        calculateTowerEnemyGold,
        spawnTowerEnemy,
        checkTowerFloorCleared,
        advanceToNextFloor,
        calculateFloorRewards,
        getTowerFloorInfo,
        getTowerStats,
        calculateTotalTowerRewards,
        resetTowerProgress,
        updateTowerMode,
        getTowerUIInfo
    };
}
