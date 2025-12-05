/**
 * Infinity Merge Tower v3.0 - Storage System
 * 저장/로드 시스템
 */

const STORAGE_KEY = 'infinity_merge_tower_v3';
const BACKUP_KEY = 'infinity_merge_tower_v3_backup';

/**
 * 게임 저장
 */
function saveGame() {
    try {
        const saveData = {
            // 자원
            gold: GameState.gold,
            gems: GameState.gems,

            // 진행
            currentStage: GameState.currentStage,
            currentWave: GameState.currentWave,
            bestStage: GameState.bestStage,

            // 히어로
            heroes: GameState.heroes,

            // 업그레이드
            upgrades: GameState.upgrades,

            // 통계
            totalKills: GameState.totalKills,
            totalBossKills: GameState.totalBossKills,
            totalMerges: GameState.totalMerges,
            totalGoldEarned: GameState.totalGoldEarned,
            playTime: GameState.playTime,

            // 업적
            achievementsUnlocked: GameState.achievementsUnlocked,

            // 소환 비용
            summonCost: GameState.summonCost,

            // 설정
            autoMergeEnabled: GameState.autoMergeEnabled,
            soundEnabled: GameState.soundEnabled,

            // 일일 보상
            lastDailyReward: GameState.lastDailyReward,
            dailyRewardStreak: GameState.dailyRewardStreak,

            // 퀘스트 시스템
            questProgress: GameState.questProgress,
            dailyStats: GameState.dailyStats,
            weeklyStats: GameState.weeklyStats,

            // 상자 시스템
            lootBoxes: GameState.lootBoxes,

            // 도전 모드
            challenges: GameState.challenges,

            // 도감
            codex: GameState.codex,

            // 메타
            savedAt: Date.now(),
            version: '3.1.0'
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));

        // 백업 (5분마다)
        const lastBackup = localStorage.getItem(BACKUP_KEY + '_time');
        if (!lastBackup || Date.now() - parseInt(lastBackup) > 300000) {
            localStorage.setItem(BACKUP_KEY, JSON.stringify(saveData));
            localStorage.setItem(BACKUP_KEY + '_time', Date.now().toString());
        }

        return true;
    } catch (error) {
        console.error('Save failed:', error);
        return false;
    }
}

/**
 * 게임 로드
 */
function loadGame() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return false;

        const data = JSON.parse(savedData);

        // 자원
        GameState.gold = data.gold || 100;
        GameState.gems = data.gems || 0;

        // 진행
        GameState.currentStage = data.currentStage || 1;
        GameState.currentWave = data.currentWave || 1;
        GameState.bestStage = data.bestStage || 1;

        // 히어로
        if (data.heroes) {
            Object.keys(HERO_CLASSES).forEach(id => {
                if (data.heroes[id]) {
                    GameState.heroes[id] = {
                        unlocked: data.heroes[id].unlocked || (id === 'warrior'),
                        mergeGrid: data.heroes[id].mergeGrid || Array(9).fill(null),
                    };
                }
            });
        }

        // 업그레이드
        if (data.upgrades) {
            Object.keys(data.upgrades).forEach(key => {
                GameState.upgrades[key] = data.upgrades[key] || 0;
            });
        }

        // 통계
        GameState.totalKills = data.totalKills || 0;
        GameState.totalBossKills = data.totalBossKills || 0;
        GameState.totalMerges = data.totalMerges || 0;
        GameState.totalGoldEarned = data.totalGoldEarned || 0;
        GameState.playTime = data.playTime || 0;

        // 업적
        GameState.achievementsUnlocked = data.achievementsUnlocked || [];

        // 소환 비용
        GameState.summonCost = data.summonCost || CONFIG.SUMMON_COST_BASE;

        // 설정
        GameState.autoMergeEnabled = data.autoMergeEnabled || false;
        GameState.soundEnabled = data.soundEnabled !== false;

        // 일일 보상
        GameState.lastDailyReward = data.lastDailyReward || null;
        GameState.dailyRewardStreak = data.dailyRewardStreak || 0;

        // 퀘스트 시스템
        GameState.questProgress = data.questProgress || null;
        GameState.dailyStats = data.dailyStats || null;
        GameState.weeklyStats = data.weeklyStats || null;

        // 상자 시스템
        GameState.lootBoxes = data.lootBoxes || null;

        // 도전 모드
        GameState.challenges = data.challenges || null;

        // 도감
        GameState.codex = data.codex || null;

        // 오프라인 보상 (강화 버전 사용)
        if (data.savedAt) {
            if (typeof calculateEnhancedOfflineRewards === 'function') {
                calculateEnhancedOfflineRewards(data.savedAt);
            } else {
                calculateOfflineRewards(data.savedAt);
            }
        }

        console.log('Game loaded successfully');
        return true;
    } catch (error) {
        console.error('Load failed:', error);
        return false;
    }
}

/**
 * 오프라인 보상 계산
 */
function calculateOfflineRewards(savedAt) {
    const now = Date.now();
    const offlineTime = (now - savedAt) / 1000;  // 초

    // 최대 8시간 (28800초)
    const maxOfflineTime = 8 * 60 * 60;
    const effectiveTime = Math.min(offlineTime, maxOfflineTime);

    if (effectiveTime < 60) return;  // 1분 미만은 무시

    // 오프라인 골드 = 분당 스테이지 * 10
    const goldPerMinute = GameState.currentStage * 10;
    const offlineGold = Math.floor(goldPerMinute * (effectiveTime / 60));

    if (offlineGold > 0) {
        GameState.gold += offlineGold;

        setTimeout(() => {
            showToast(`오프라인 보상: +${formatNumber(offlineGold)} 골드`);
        }, 1500);
    }
}

/**
 * 게임 데이터 리셋
 */
function resetGameData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_KEY + '_time');
    resetGameState();
}

/**
 * 백업에서 복원
 */
function restoreFromBackup() {
    try {
        const backupData = localStorage.getItem(BACKUP_KEY);
        if (!backupData) {
            showToast('백업 데이터가 없습니다');
            return false;
        }

        localStorage.setItem(STORAGE_KEY, backupData);
        location.reload();
        return true;
    } catch (error) {
        console.error('Restore failed:', error);
        return false;
    }
}
