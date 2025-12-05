/**
 * Infinity Merge Tower v3.0 - Retention Features
 * 1. 일일 보상 시스템
 * 2. 오프라인 보상 강화
 * 3. 미니 퀘스트/미션
 * 4. 럭키 드로우/가챠
 * 5. 히어로 스킬
 * 6. 도전 모드
 * 7. 수집 요소
 */

// ============================================================
// 1. 일일 보상 시스템
// ============================================================

const DAILY_REWARDS = [
    { day: 1, rewards: { gold: 500, gems: 5 }, name: '1일차' },
    { day: 2, rewards: { gold: 800, gems: 8 }, name: '2일차' },
    { day: 3, rewards: { gold: 1200, gems: 12 }, name: '3일차' },
    { day: 4, rewards: { gold: 1500, gems: 15 }, name: '4일차' },
    { day: 5, rewards: { gold: 2000, gems: 20 }, name: '5일차' },
    { day: 6, rewards: { gold: 2500, gems: 25 }, name: '6일차' },
    { day: 7, rewards: { gold: 5000, gems: 50, item: 3 }, name: '7일차 (보너스!)' },
];

function checkDailyReward() {
    const now = new Date();
    const today = now.toDateString();

    if (GameState.lastDailyReward === today) {
        return null; // 이미 받음
    }

    // 연속 출석 체크
    if (GameState.lastDailyReward) {
        const lastDate = new Date(GameState.lastDailyReward);
        const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // 연속 출석 끊김
            GameState.dailyRewardStreak = 0;
        }
    }

    return true; // 보상 받을 수 있음
}

function claimDailyReward() {
    const canClaim = checkDailyReward();
    if (!canClaim) {
        showToast('이미 오늘의 보상을 받았습니다!');
        return false;
    }

    const streak = (GameState.dailyRewardStreak % 7);
    const reward = DAILY_REWARDS[streak];

    // 보상 지급
    GameState.gold += reward.rewards.gold;
    GameState.gems += reward.rewards.gems;

    if (reward.rewards.item) {
        // 보너스 아이템 지급
        const heroState = GameState.heroes[RuntimeState.selectedHeroClass];
        if (heroState && heroState.unlocked) {
            const emptyIndex = heroState.mergeGrid.findIndex(s => s === null);
            if (emptyIndex !== -1) {
                const randomType = MERGE_ITEM_TYPES[Math.floor(Math.random() * MERGE_ITEM_TYPES.length)];
                heroState.mergeGrid[emptyIndex] = {
                    typeId: randomType.id,
                    level: reward.rewards.item,
                };
                recalculateAllHeroStats();
            }
        }
    }

    GameState.dailyRewardStreak++;
    GameState.lastDailyReward = new Date().toDateString();

    showToast(`${reward.name} 보상: +${reward.rewards.gold}💰 +${reward.rewards.gems}💎`);
    playSound('reward');
    updateUI();
    saveGame();

    return true;
}

function renderDailyReward() {
    const container = document.getElementById('daily-reward-items');
    if (!container) return;

    const currentStreak = GameState.dailyRewardStreak % 7;
    const canClaim = checkDailyReward();
    let html = '<div class="daily-rewards-grid">';

    DAILY_REWARDS.forEach((reward, index) => {
        const isClaimed = index < currentStreak || (index === currentStreak && !canClaim);
        const isCurrent = index === currentStreak && canClaim;
        const isLocked = index > currentStreak;

        let statusClass = '';
        if (isClaimed) statusClass = 'claimed';
        else if (isCurrent) statusClass = 'current';
        else if (isLocked) statusClass = 'locked';

        html += `
            <div class="daily-reward-item ${statusClass}">
                <div class="daily-day">${reward.name}</div>
                <div class="daily-rewards-content">
                    <div>💰 ${reward.rewards.gold}</div>
                    <div>💎 ${reward.rewards.gems}</div>
                    ${reward.rewards.item ? `<div>📦 Lv.${reward.rewards.item}</div>` : ''}
                </div>
                <div class="daily-status">
                    ${isClaimed ? '✅' : (isCurrent ? '받기' : '🔒')}
                </div>
            </div>
        `;
    });

    html += '</div>';

    if (canClaim) {
        html += `<button class="claim-daily-btn" onclick="claimDailyReward(); renderDailyReward();">🎁 오늘의 보상 받기!</button>`;
    } else {
        html += `<div class="daily-claimed-msg">✅ 오늘의 보상을 이미 받았습니다!</div>`;
    }

    container.innerHTML = html;
}

// ============================================================
// 3. 미니 퀘스트/미션 시스템
// ============================================================

const DAILY_QUESTS = [
    { id: 'kill_50', name: '적 처치', desc: '적 50마리 처치', target: 50, type: 'kills', reward: { gold: 500, gems: 5 } },
    { id: 'boss_1', name: '보스 사냥', desc: '보스 1마리 처치', target: 1, type: 'bossKills', reward: { gold: 1000, gems: 10 } },
    { id: 'merge_10', name: '머지 마스터', desc: '10회 머지', target: 10, type: 'merges', reward: { gold: 300, gems: 3 } },
    { id: 'summon_5', name: '소환사', desc: '5회 소환', target: 5, type: 'summons', reward: { gold: 200, gems: 2 } },
    { id: 'stage_clear', name: '스테이지 클리어', desc: '스테이지 1개 클리어', target: 1, type: 'stageClears', reward: { gold: 800, gems: 8 } },
];

const WEEKLY_QUESTS = [
    { id: 'kill_500', name: '학살자', desc: '적 500마리 처치', target: 500, type: 'kills', reward: { gold: 5000, gems: 50 } },
    { id: 'boss_10', name: '보스 헌터', desc: '보스 10마리 처치', target: 10, type: 'bossKills', reward: { gold: 10000, gems: 100 } },
    { id: 'merge_100', name: '머지 장인', desc: '100회 머지', target: 100, type: 'merges', reward: { gold: 3000, gems: 30 } },
    { id: 'play_60', name: '열정 플레이어', desc: '60분 플레이', target: 60, type: 'playMinutes', reward: { gold: 2000, gems: 20 } },
];

function initQuestState() {
    if (!GameState.questProgress) {
        GameState.questProgress = {
            daily: {},
            weekly: {},
            lastDailyReset: null,
            lastWeeklyReset: null,
        };
    }

    // 일일 퀘스트 리셋 체크
    const today = new Date().toDateString();
    if (GameState.questProgress.lastDailyReset !== today) {
        GameState.questProgress.daily = {};
        GameState.questProgress.lastDailyReset = today;

        // 일일 통계 초기화
        if (!GameState.dailyStats) GameState.dailyStats = {};
        GameState.dailyStats = {
            kills: 0,
            bossKills: 0,
            merges: 0,
            summons: 0,
            stageClears: 0,
        };
    }

    // 주간 퀘스트 리셋 체크 (월요일 기준)
    const now = new Date();
    const weekStart = getWeekStart(now);
    if (GameState.questProgress.lastWeeklyReset !== weekStart) {
        GameState.questProgress.weekly = {};
        GameState.questProgress.lastWeeklyReset = weekStart;

        // 주간 통계 초기화
        if (!GameState.weeklyStats) GameState.weeklyStats = {};
        GameState.weeklyStats = {
            kills: 0,
            bossKills: 0,
            merges: 0,
            playMinutes: 0,
        };
    }
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toDateString();
}

function updateQuestProgress(type, amount = 1) {
    if (!GameState.dailyStats) initQuestState();

    if (GameState.dailyStats[type] !== undefined) {
        GameState.dailyStats[type] += amount;
    }
    if (GameState.weeklyStats && GameState.weeklyStats[type] !== undefined) {
        GameState.weeklyStats[type] += amount;
    }
}

function getQuestProgress(quest, isWeekly = false) {
    const stats = isWeekly ? GameState.weeklyStats : GameState.dailyStats;
    if (!stats) return 0;
    return stats[quest.type] || 0;
}

function isQuestCompleted(quest, isWeekly = false) {
    const progress = getQuestProgress(quest, isWeekly);
    return progress >= quest.target;
}

function isQuestClaimed(quest, isWeekly = false) {
    const claimed = isWeekly ? GameState.questProgress.weekly : GameState.questProgress.daily;
    return claimed[quest.id] === true;
}

function claimQuestReward(questId, isWeekly = false) {
    const quests = isWeekly ? WEEKLY_QUESTS : DAILY_QUESTS;
    const quest = quests.find(q => q.id === questId);

    if (!quest) return;
    if (!isQuestCompleted(quest, isWeekly)) {
        showToast('퀘스트를 먼저 완료하세요!');
        return;
    }
    if (isQuestClaimed(quest, isWeekly)) {
        showToast('이미 보상을 받았습니다!');
        return;
    }

    // 보상 지급
    GameState.gold += quest.reward.gold;
    GameState.gems += quest.reward.gems;

    // 클레임 표시
    if (isWeekly) {
        GameState.questProgress.weekly[questId] = true;
    } else {
        GameState.questProgress.daily[questId] = true;
    }

    showToast(`퀘스트 완료! +${quest.reward.gold}💰 +${quest.reward.gems}💎`);
    playSound('reward');
    updateUI();
    renderQuests();
    saveGame();
}

function renderQuests() {
    const container = document.getElementById('quest-items');
    if (!container) return;

    initQuestState();

    let html = '<div class="quest-section"><h3>📋 일일 퀘스트</h3>';

    DAILY_QUESTS.forEach(quest => {
        const progress = getQuestProgress(quest, false);
        const completed = isQuestCompleted(quest, false);
        const claimed = isQuestClaimed(quest, false);
        const percent = Math.min(100, (progress / quest.target) * 100);

        html += `
            <div class="quest-item ${claimed ? 'claimed' : (completed ? 'completed' : '')}">
                <div class="quest-info">
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-desc">${quest.desc}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="quest-progress-text">${progress} / ${quest.target}</div>
                </div>
                <div class="quest-reward">
                    <div>💰 ${quest.reward.gold}</div>
                    <div>💎 ${quest.reward.gems}</div>
                    ${claimed ? '<div class="claimed-badge">✅</div>' :
                      (completed ? `<button class="claim-quest-btn" onclick="claimQuestReward('${quest.id}', false)">받기</button>` : '')}
                </div>
            </div>
        `;
    });

    html += '</div><div class="quest-section"><h3>📋 주간 퀘스트</h3>';

    WEEKLY_QUESTS.forEach(quest => {
        const progress = getQuestProgress(quest, true);
        const completed = isQuestCompleted(quest, true);
        const claimed = isQuestClaimed(quest, true);
        const percent = Math.min(100, (progress / quest.target) * 100);

        html += `
            <div class="quest-item ${claimed ? 'claimed' : (completed ? 'completed' : '')}">
                <div class="quest-info">
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-desc">${quest.desc}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="quest-progress-text">${progress} / ${quest.target}</div>
                </div>
                <div class="quest-reward">
                    <div>💰 ${quest.reward.gold}</div>
                    <div>💎 ${quest.reward.gems}</div>
                    ${claimed ? '<div class="claimed-badge">✅</div>' :
                      (completed ? `<button class="claim-quest-btn" onclick="claimQuestReward('${quest.id}', true)">받기</button>` : '')}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
// 4. 럭키 드로우/가챠 시스템 (보스 드랍 박스)
// ============================================================

const LOOT_BOX_TYPES = [
    {
        id: 'common_box',
        name: '일반 상자',
        emoji: '📦',
        color: '#95a5a6',
        drops: [
            { type: 'gold', min: 100, max: 500, chance: 0.6 },
            { type: 'item', level: 1, chance: 0.35 },
            { type: 'gems', min: 1, max: 3, chance: 0.05 },
        ]
    },
    {
        id: 'rare_box',
        name: '희귀 상자',
        emoji: '🎁',
        color: '#3498db',
        drops: [
            { type: 'gold', min: 500, max: 2000, chance: 0.4 },
            { type: 'item', level: 2, levelMax: 3, chance: 0.45 },
            { type: 'gems', min: 5, max: 15, chance: 0.15 },
        ]
    },
    {
        id: 'epic_box',
        name: '에픽 상자',
        emoji: '🎀',
        color: '#9b59b6',
        drops: [
            { type: 'gold', min: 2000, max: 5000, chance: 0.3 },
            { type: 'item', level: 3, levelMax: 5, chance: 0.5 },
            { type: 'gems', min: 15, max: 30, chance: 0.2 },
        ]
    },
    {
        id: 'legendary_box',
        name: '전설 상자',
        emoji: '👑',
        color: '#f39c12',
        drops: [
            { type: 'gold', min: 5000, max: 15000, chance: 0.2 },
            { type: 'item', level: 5, levelMax: 7, chance: 0.55 },
            { type: 'gems', min: 30, max: 100, chance: 0.25 },
        ]
    },
];

function initLootBoxes() {
    if (!GameState.lootBoxes) {
        GameState.lootBoxes = {
            common_box: 0,
            rare_box: 0,
            epic_box: 0,
            legendary_box: 0,
        };
    }
}

function addLootBox(boxId, count = 1) {
    initLootBoxes();
    if (GameState.lootBoxes[boxId] !== undefined) {
        GameState.lootBoxes[boxId] += count;
    }
}

function getBossDropBox(isBoss) {
    if (!isBoss) {
        // 일반 적: 1% 확률로 일반 상자 (너무 높으면 상자 넘침)
        if (Math.random() < 0.01) {
            addLootBox('common_box');
            return 'common_box';
        }
        return null;
    }

    // 보스: 등급별 상자 드랍
    const roll = Math.random();
    if (roll < 0.5) {
        addLootBox('rare_box');
        return 'rare_box';
    } else if (roll < 0.8) {
        addLootBox('epic_box');
        return 'epic_box';
    } else {
        addLootBox('legendary_box');
        return 'legendary_box';
    }
}

function openLootBox(boxId) {
    initLootBoxes();

    if (GameState.lootBoxes[boxId] <= 0) {
        showToast('상자가 없습니다!');
        return null;
    }

    const boxType = LOOT_BOX_TYPES.find(b => b.id === boxId);
    if (!boxType) return null;

    GameState.lootBoxes[boxId]--;

    // 드랍 결정
    const roll = Math.random();
    let cumulative = 0;
    let selectedDrop = boxType.drops[0];

    for (const drop of boxType.drops) {
        cumulative += drop.chance;
        if (roll < cumulative) {
            selectedDrop = drop;
            break;
        }
    }

    let reward = { type: selectedDrop.type };

    switch (selectedDrop.type) {
        case 'gold':
            reward.amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
            GameState.gold += reward.amount;
            showToast(`${boxType.emoji} +${reward.amount}💰 획득!`);
            break;

        case 'gems':
            reward.amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
            GameState.gems += reward.amount;
            showToast(`${boxType.emoji} +${reward.amount}💎 획득!`);
            break;

        case 'item':
            const level = selectedDrop.levelMax ?
                Math.floor(Math.random() * (selectedDrop.levelMax - selectedDrop.level + 1)) + selectedDrop.level :
                selectedDrop.level;

            const heroState = GameState.heroes[RuntimeState.selectedHeroClass];
            if (heroState && heroState.unlocked) {
                const emptyIndex = heroState.mergeGrid.findIndex(s => s === null);
                if (emptyIndex !== -1) {
                    const randomType = MERGE_ITEM_TYPES[Math.floor(Math.random() * MERGE_ITEM_TYPES.length)];
                    heroState.mergeGrid[emptyIndex] = {
                        typeId: randomType.id,
                        level: level,
                    };
                    recalculateAllHeroStats();
                    renderMergeGrid();
                    reward.itemName = randomType.name;
                    reward.level = level;
                    showToast(`${boxType.emoji} Lv.${level} ${randomType.name} 획득!`);
                } else {
                    // 슬롯 없으면 골드로 대체
                    const goldCompensation = level * 500;
                    GameState.gold += goldCompensation;
                    showToast(`슬롯 부족! +${goldCompensation}💰 대신 획득`);
                }
            }
            break;
    }

    playSound('reward');
    updateUI();
    renderLootBoxes();
    saveGame();

    return reward;
}

function renderLootBoxes() {
    const container = document.getElementById('lootbox-items');
    if (!container) return;

    initLootBoxes();

    let html = '<div class="lootbox-grid">';

    LOOT_BOX_TYPES.forEach(box => {
        const count = GameState.lootBoxes[box.id] || 0;

        html += `
            <div class="lootbox-item" style="border-color: ${box.color}">
                <div class="lootbox-emoji">${box.emoji}</div>
                <div class="lootbox-name">${box.name}</div>
                <div class="lootbox-count">x${count}</div>
                <button class="open-box-btn"
                        onclick="openLootBox('${box.id}')"
                        ${count <= 0 ? 'disabled' : ''}>
                    열기
                </button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
// 5. 히어로 스킬 시스템
// ============================================================

function activateSkill(heroId) {
    const heroClass = HERO_CLASSES[heroId];
    if (!heroClass || !heroClass.skill) return false;

    const cooldown = RuntimeState.skillCooldowns[heroId] || 0;
    if (cooldown > 0) {
        showToast(`스킬 쿨다운: ${Math.ceil(cooldown / 1000)}초`);
        return false;
    }

    const hero = RuntimeState.heroInstances.find(h => h.classId === heroId);
    if (!hero) return false;

    // 스킬 효과 적용
    switch (heroClass.skill.effect) {
        case 'spin_attack':
            // 회전 베기: 주변 모든 적에게 피해
            performSpinAttack(hero);
            break;

        case 'power_strike':
            // 강타: 다음 공격 3배 피해
            hero.powerStrikeActive = true;
            hero.powerStrikeMultiplier = 3;
            showToast(`${heroClass.skill.name} 활성화!`);
            break;

        case 'multi_shot':
            // 다중 사격: 3명의 적 동시 공격
            performMultiShot(hero);
            break;

        case 'meteor':
            // 메테오: 범위 내 모든 적 피해
            performMeteor(hero);
            break;

        case 'shadow_strike':
            // 그림자 일격: 순간이동 후 치명타
            performShadowStrike(hero);
            break;
    }

    // 쿨다운 설정
    RuntimeState.skillCooldowns[heroId] = heroClass.skill.cooldown * 1000;

    playSound('skill');
    return true;
}

function performSpinAttack(hero) {
    const damage = hero.stats.attack * 2;
    const range = 100;

    RuntimeState.enemies.forEach(enemy => {
        const dx = enemy.x - hero.x;
        const dy = enemy.y - hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= range) {
            dealDamage(enemy, damage, false, hero);
        }
    });

    // 시각 효과
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        RuntimeState.particles.push({
            x: hero.x + Math.cos(angle) * 30,
            y: hero.y + Math.sin(angle) * 30,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            size: 6,
            color: hero.class.color,
            alpha: 1,
            life: 400,
        });
    }

    showToast('회전 베기!');
}

function performMultiShot(hero) {
    // 가장 가까운 3명의 적 찾기
    const targets = [...RuntimeState.enemies]
        .map(e => ({
            enemy: e,
            dist: Math.sqrt((e.x - hero.x) ** 2 + (e.y - hero.y) ** 2)
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

    targets.forEach(({ enemy }) => {
        createProjectile(hero, enemy, hero.stats.attack * 1.5, false);
    });

    showToast('다중 사격!');
}

function performMeteor(hero) {
    // 화면 중앙에 메테오
    const meteorX = RuntimeState.centerX;
    const meteorY = RuntimeState.centerY;
    const damage = hero.stats.attack * 5;
    const range = 120;

    // 범위 내 모든 적에게 피해
    RuntimeState.enemies.forEach(enemy => {
        const dx = enemy.x - meteorX;
        const dy = enemy.y - meteorY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= range) {
            dealDamage(enemy, damage, false, hero);
        }
    });

    // 시각 효과
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * range;
        RuntimeState.particles.push({
            x: meteorX + Math.cos(angle) * r,
            y: meteorY + Math.sin(angle) * r,
            vx: (Math.random() - 0.5) * 100,
            vy: -50 - Math.random() * 100,
            size: 5 + Math.random() * 5,
            color: '#ff6b35',
            alpha: 1,
            life: 600,
        });
    }

    showToast('메테오!');
}

function performShadowStrike(hero) {
    // 가장 가까운 적에게 순간이동
    let closestEnemy = null;
    let closestDist = Infinity;

    RuntimeState.enemies.forEach(enemy => {
        const dx = enemy.x - hero.x;
        const dy = enemy.y - hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
        }
    });

    if (closestEnemy) {
        // 순간이동 시각 효과 (출발점)
        for (let i = 0; i < 5; i++) {
            RuntimeState.particles.push({
                x: hero.x,
                y: hero.y,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                size: 4,
                color: '#2c3e50',
                alpha: 1,
                life: 300,
            });
        }

        // 순간이동
        hero.x = closestEnemy.x + 30;
        hero.y = closestEnemy.y;

        // 치명타 공격
        const damage = hero.stats.attack * hero.stats.critDamage * 2;
        dealDamage(closestEnemy, damage, true, hero);

        showToast('그림자 일격!');
    }
}

function updateSkillCooldowns(deltaTime) {
    Object.keys(RuntimeState.skillCooldowns).forEach(heroId => {
        if (RuntimeState.skillCooldowns[heroId] > 0) {
            RuntimeState.skillCooldowns[heroId] -= deltaTime;
        }
    });
}

function renderSkillButtons() {
    const container = document.getElementById('skill-buttons');
    if (!container) return;

    let html = '';

    getUnlockedHeroIds().forEach(heroId => {
        const heroClass = HERO_CLASSES[heroId];
        if (!heroClass.skill) return;

        const cooldown = RuntimeState.skillCooldowns[heroId] || 0;
        const isReady = cooldown <= 0;
        const cooldownSec = Math.ceil(cooldown / 1000);

        html += `
            <button class="skill-btn ${isReady ? '' : 'cooldown'}"
                    onclick="activateSkill('${heroId}')"
                    title="${heroClass.skill.name}: ${heroClass.skill.description}"
                    style="border-color: ${heroClass.color}">
                <span class="skill-emoji">${heroClass.emoji}</span>
                ${isReady ? '' : `<span class="skill-cooldown">${cooldownSec}s</span>`}
            </button>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// 6. 도전 모드 (무한 타워)
// ============================================================

const CHALLENGE_MODES = {
    infiniteTower: {
        id: 'infiniteTower',
        name: '무한 타워',
        desc: '끝없는 층을 올라가세요!',
        emoji: '🗼',
    },
    timeAttack: {
        id: 'timeAttack',
        name: '타임 어택',
        desc: '3분 안에 최대한 처치하세요!',
        emoji: '⏱️',
        duration: 180,
    },
    survivalMode: {
        id: 'survivalMode',
        name: '서바이벌',
        desc: '체력이 있는 한 버티세요!',
        emoji: '❤️',
    },
};

function initChallengeState() {
    if (!GameState.challenges) {
        GameState.challenges = {
            infiniteTower: { bestFloor: 0 },
            timeAttack: { bestKills: 0 },
            survivalMode: { bestTime: 0 },
        };
    }

    if (!RuntimeState.challengeMode) {
        RuntimeState.challengeMode = null;
        RuntimeState.challengeData = null;
    }
}

function startChallenge(modeId) {
    initChallengeState();

    const mode = CHALLENGE_MODES[modeId];
    if (!mode) return;

    RuntimeState.challengeMode = modeId;

    switch (modeId) {
        case 'infiniteTower':
            RuntimeState.challengeData = {
                floor: 1,
                enemiesKilled: 0,
                enemiesPerFloor: 5,
            };
            break;

        case 'timeAttack':
            RuntimeState.challengeData = {
                timeLeft: mode.duration * 1000,
                kills: 0,
            };
            break;

        case 'survivalMode':
            RuntimeState.challengeData = {
                hp: 100,
                maxHp: 100,
                time: 0,
            };
            break;
    }

    // 전투 상태 리셋
    RuntimeState.enemies = [];
    RuntimeState.projectiles = [];
    RuntimeState.waveEnemiesSpawned = 0;
    RuntimeState.waveEnemiesKilled = 0;

    closeModal('challenge-modal');
    showToast(`${mode.emoji} ${mode.name} 시작!`);
}

function updateChallenge(deltaTime) {
    if (!RuntimeState.challengeMode) return;

    const data = RuntimeState.challengeData;

    switch (RuntimeState.challengeMode) {
        case 'infiniteTower':
            if (data.enemiesKilled >= data.enemiesPerFloor) {
                data.floor++;
                data.enemiesKilled = 0;
                data.enemiesPerFloor = Math.min(20, 5 + data.floor);
                showToast(`🗼 ${data.floor}층 도달!`);
            }
            break;

        case 'timeAttack':
            data.timeLeft -= deltaTime;
            if (data.timeLeft <= 0) {
                endChallenge();
            }
            break;

        case 'survivalMode':
            data.time += deltaTime;
            // 적이 중앙에 도달하면 체력 감소
            RuntimeState.enemies.forEach(enemy => {
                const dx = RuntimeState.centerX - enemy.x;
                const dy = RuntimeState.centerY - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 30) {
                    data.hp -= 10;
                    RuntimeState.enemies.splice(RuntimeState.enemies.indexOf(enemy), 1);
                    RuntimeState.waveEnemiesKilled++;
                }
            });

            if (data.hp <= 0) {
                endChallenge();
            }
            break;
    }
}

function endChallenge() {
    if (!RuntimeState.challengeMode) return;

    initChallengeState();

    const modeId = RuntimeState.challengeMode;
    const data = RuntimeState.challengeData;
    let score = 0;
    let reward = { gold: 0, gems: 0 };

    switch (modeId) {
        case 'infiniteTower':
            score = data.floor;
            if (score > GameState.challenges.infiniteTower.bestFloor) {
                GameState.challenges.infiniteTower.bestFloor = score;
            }
            reward.gold = score * 100;
            reward.gems = Math.floor(score / 5);
            break;

        case 'timeAttack':
            score = data.kills;
            if (score > GameState.challenges.timeAttack.bestKills) {
                GameState.challenges.timeAttack.bestKills = score;
            }
            reward.gold = score * 50;
            reward.gems = Math.floor(score / 10);
            break;

        case 'survivalMode':
            score = Math.floor(data.time / 1000);
            if (score > GameState.challenges.survivalMode.bestTime) {
                GameState.challenges.survivalMode.bestTime = score;
            }
            reward.gold = score * 20;
            reward.gems = Math.floor(score / 30);
            break;
    }

    // 보상 지급
    GameState.gold += reward.gold;
    GameState.gems += reward.gems;

    showToast(`도전 종료! 점수: ${score} | +${reward.gold}💰 +${reward.gems}💎`);

    RuntimeState.challengeMode = null;
    RuntimeState.challengeData = null;

    // 일반 게임 상태로 복구
    RuntimeState.enemies = [];
    RuntimeState.projectiles = [];
    RuntimeState.waveEnemiesSpawned = 0;
    RuntimeState.waveEnemiesKilled = 0;

    updateUI();
    saveGame();
}

function renderChallenges() {
    const container = document.getElementById('challenge-items');
    if (!container) return;

    initChallengeState();

    let html = '';

    Object.values(CHALLENGE_MODES).forEach(mode => {
        const best = GameState.challenges[mode.id];
        let bestText = '';

        switch (mode.id) {
            case 'infiniteTower':
                bestText = `최고 층: ${best.bestFloor}`;
                break;
            case 'timeAttack':
                bestText = `최고 처치: ${best.bestKills}`;
                break;
            case 'survivalMode':
                bestText = `최고 시간: ${best.bestTime}초`;
                break;
        }

        html += `
            <div class="challenge-item">
                <div class="challenge-info">
                    <div class="challenge-name">${mode.emoji} ${mode.name}</div>
                    <div class="challenge-desc">${mode.desc}</div>
                    <div class="challenge-best">${bestText}</div>
                </div>
                <button class="start-challenge-btn" onclick="startChallenge('${mode.id}')">
                    시작
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// 7. 수집 요소 (몬스터 도감)
// ============================================================

function initCodex() {
    if (!GameState.codex) {
        GameState.codex = {
            enemies: {},
            bosses: {},
        };
    }
}

function discoverEnemy(enemyType, isBoss = false) {
    initCodex();

    const collection = isBoss ? GameState.codex.bosses : GameState.codex.enemies;
    const id = enemyType.id;

    if (!collection[id]) {
        collection[id] = {
            discovered: true,
            killCount: 0,
            firstSeen: Date.now(),
        };

        // 첫 발견 보상
        GameState.gems += isBoss ? 10 : 2;
        showToast(`📖 새로운 ${isBoss ? '보스' : '몬스터'} 발견: ${enemyType.name}!`);
    }

    collection[id].killCount++;
}

function getCodexProgress() {
    initCodex();

    const totalEnemies = ENEMY_TYPES.length;
    const totalBosses = BOSS_TYPES.length;
    const discoveredEnemies = Object.keys(GameState.codex.enemies).length;
    const discoveredBosses = Object.keys(GameState.codex.bosses).length;

    return {
        enemies: { discovered: discoveredEnemies, total: totalEnemies },
        bosses: { discovered: discoveredBosses, total: totalBosses },
        totalPercent: Math.floor(((discoveredEnemies + discoveredBosses) / (totalEnemies + totalBosses)) * 100),
    };
}

function renderCodex() {
    const container = document.getElementById('codex-items');
    if (!container) return;

    initCodex();

    const progress = getCodexProgress();

    let html = `
        <div class="codex-progress">
            <div class="codex-progress-bar">
                <div class="codex-progress-fill" style="width: ${progress.totalPercent}%"></div>
            </div>
            <div class="codex-progress-text">도감 완성도: ${progress.totalPercent}%</div>
        </div>
    `;

    html += '<div class="codex-section"><h3>👹 몬스터</h3><div class="codex-grid">';

    ENEMY_TYPES.forEach(enemy => {
        const discovered = GameState.codex.enemies[enemy.id];

        html += `
            <div class="codex-item ${discovered ? 'discovered' : 'unknown'}">
                <div class="codex-emoji">${discovered ? enemy.emoji : '❓'}</div>
                <div class="codex-name">${discovered ? enemy.name : '???'}</div>
                ${discovered ? `<div class="codex-kills">처치: ${discovered.killCount}</div>` : ''}
            </div>
        `;
    });

    html += '</div></div>';

    html += '<div class="codex-section"><h3>👑 보스</h3><div class="codex-grid">';

    BOSS_TYPES.forEach(boss => {
        const discovered = GameState.codex.bosses[boss.id];

        html += `
            <div class="codex-item ${discovered ? 'discovered' : 'unknown'}">
                <div class="codex-emoji">${discovered ? boss.emoji : '❓'}</div>
                <div class="codex-name">${discovered ? boss.name : '???'}</div>
                ${discovered ? `<div class="codex-kills">처치: ${discovered.killCount}</div>` : ''}
            </div>
        `;
    });

    html += '</div></div>';

    container.innerHTML = html;
}

// ============================================================
// 2. 오프라인 보상 강화 (storage.js 대체 함수)
// ============================================================

function calculateEnhancedOfflineRewards(savedAt) {
    const now = Date.now();
    const offlineTime = (now - savedAt) / 1000;  // 초

    // 최대 12시간 (확장)
    const maxOfflineTime = 12 * 60 * 60;
    const effectiveTime = Math.min(offlineTime, maxOfflineTime);

    if (effectiveTime < 60) return;  // 1분 미만은 무시

    // 오프라인 골드 = 분당 (스테이지 * 15 + DPS 기반 보너스)
    const goldPerMinute = GameState.currentStage * 15 + Math.floor(RuntimeState.currentDPS * 0.1);
    const offlineGold = Math.floor(goldPerMinute * (effectiveTime / 60));

    // 오프라인 젬 (시간당 1~3개)
    const offlineGems = Math.floor((effectiveTime / 3600) * (1 + Math.random() * 2));

    // 오프라인 적 처치 (시뮬레이션)
    const offlineKills = Math.floor(effectiveTime / 10);  // 10초당 1마리

    // 상자 드랍 (낮은 확률)
    let boxDropped = null;
    if (effectiveTime > 1800 && Math.random() < 0.3) {  // 30분 이상이면 30% 확률
        addLootBox('common_box');
        boxDropped = 'common_box';
    }

    if (offlineGold > 0 || offlineGems > 0) {
        GameState.gold += offlineGold;
        GameState.gems += offlineGems;
        GameState.totalKills += offlineKills;

        // 퀘스트 진행도 업데이트
        updateQuestProgress('kills', offlineKills);

        setTimeout(() => {
            let message = `오프라인 보상:\n+${formatNumber(offlineGold)}💰`;
            if (offlineGems > 0) message += ` +${offlineGems}💎`;
            if (offlineKills > 0) message += `\n${offlineKills}마리 처치`;
            if (boxDropped) message += `\n📦 상자 획득!`;
            showToast(message);
        }, 1500);
    }
}

// 초기화 함수
function initRetentionFeatures() {
    initQuestState();
    initLootBoxes();
    initChallengeState();
    initCodex();

    // 일일 보상 체크
    if (checkDailyReward()) {
        setTimeout(() => {
            showToast('🎁 일일 보상을 받으세요!');
        }, 2000);
    }
}
