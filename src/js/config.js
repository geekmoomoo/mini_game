/**
 * Infinity Merge Tower v3.0 - Configuration
 * 5 클래스 기반 서바이벌 머지 게임
 */

const CONFIG = {
    // 게임 기본 설정
    CANVAS_CENTER_RADIUS: 120,  // 영웅들이 움직이는 원의 반지름
    ENEMY_SPAWN_RADIUS: 250,    // 적 스폰 거리

    // 웨이브 설정
    ENEMIES_PER_WAVE: 10,
    WAVE_SPAWN_INTERVAL: 1500,
    ENEMY_BASE_HP: 50,
    ENEMY_HP_SCALING: 1.15,
    ENEMY_BASE_SPEED: 30,

    // 보스 설정
    BOSS_WAVE_INTERVAL: 5,
    BOSS_HP_MULTIPLIER: 10,
    BOSS_SIZE_MULTIPLIER: 1.5,
    BOSS_TIME_LIMIT: 60,

    // 머지 설정
    MERGE_SLOTS_PER_CLASS: 9,   // 3x3 그리드
    SUMMON_COST_BASE: 10,
    SUMMON_COST_MULTIPLIER: 1.08,

    // 보상 설정
    GOLD_PER_ENEMY: 5,
    GOLD_SCALING: 1.05,
    GEM_DROP_CHANCE: 0.02,
    BOSS_GEM_REWARD: 10,

    // 게임 속도
    GAME_SPEEDS: [1, 2, 3],
    DEFAULT_GAME_SPEED: 1,
    AUTO_MERGE_INTERVAL: 2000,

    // 클래스 해금 스테이지
    CLASS_UNLOCK_STAGES: {
        warrior: 1,     // 시작부터
        axe: 5,         // 스테이지 5
        archer: 10,     // 스테이지 10
        mage: 15,       // 스테이지 15
        assassin: 20    // 스테이지 20
    },

    // 장비 시스템
    EQUIPMENT_MAX_LEVEL: 10,
    EQUIPMENT_ENHANCE_COST_BASE: 100,
    EQUIPMENT_ENHANCE_COST_MULT: 1.5,
};

// 5개 히어로 클래스 정의
const HERO_CLASSES = {
    warrior: {
        id: 'warrior',
        name: '검사',
        emoji: '🗡️',
        color: '#e74c3c',
        baseAtk: 15,
        atkSpeed: 1.0,
        range: 50,          // 근접
        attackType: 'melee',
        moveSpeed: 80,
        description: '균형 잡힌 근접 전사',
        unlockStage: 1,
        skill: {
            name: '회전 베기',
            description: '주변 모든 적에게 피해',
            cooldown: 10,
            effect: 'spin_attack'
        }
    },
    axe: {
        id: 'axe',
        name: '도끼병',
        emoji: '🪓',
        color: '#e67e22',
        baseAtk: 25,
        atkSpeed: 0.7,
        range: 60,          // 근접
        attackType: 'melee',
        moveSpeed: 60,
        description: '느리지만 강력한 공격',
        unlockStage: 5,
        skill: {
            name: '강타',
            description: '다음 공격 3배 피해',
            cooldown: 12,
            effect: 'power_strike'
        }
    },
    archer: {
        id: 'archer',
        name: '궁수',
        emoji: '🏹',
        color: '#27ae60',
        baseAtk: 12,
        atkSpeed: 1.3,
        range: 180,         // 원거리
        attackType: 'ranged',
        moveSpeed: 90,
        description: '빠른 원거리 공격',
        unlockStage: 10,
        skill: {
            name: '다중 사격',
            description: '3명의 적 동시 공격',
            cooldown: 8,
            effect: 'multi_shot'
        }
    },
    mage: {
        id: 'mage',
        name: '마법사',
        emoji: '🪄',
        color: '#9b59b6',
        baseAtk: 20,
        atkSpeed: 0.8,
        range: 200,         // 원거리
        attackType: 'ranged',
        moveSpeed: 70,
        description: '강력한 범위 마법',
        unlockStage: 15,
        skill: {
            name: '메테오',
            description: '범위 내 모든 적 피해',
            cooldown: 15,
            effect: 'meteor'
        }
    },
    assassin: {
        id: 'assassin',
        name: '암살자',
        emoji: '🔪',
        color: '#2c3e50',
        baseAtk: 30,
        atkSpeed: 1.5,
        range: 40,          // 근접
        attackType: 'melee',
        moveSpeed: 120,
        description: '빠른 이동과 치명타',
        unlockStage: 20,
        skill: {
            name: '그림자 일격',
            description: '순간이동 후 치명타',
            cooldown: 6,
            effect: 'shadow_strike'
        }
    }
};

// 머지 아이템 타입 (클래스별 장착)
const MERGE_ITEM_TYPES = [
    { id: 'sword_gem', name: '검의 보석', emoji: '💎', statType: 'attack', baseValue: 5 },
    { id: 'shield_gem', name: '방패의 보석', emoji: '🛡️', statType: 'defense', baseValue: 3 },
    { id: 'speed_gem', name: '신속의 보석', emoji: '⚡', statType: 'speed', baseValue: 0.05 },
    { id: 'crit_gem', name: '치명의 보석', emoji: '💀', statType: 'crit', baseValue: 0.02 },
    { id: 'life_gem', name: '생명의 보석', emoji: '❤️', statType: 'hp', baseValue: 10 },
];

// 적 타입 정의
const ENEMY_TYPES = [
    { id: 'slime', name: '슬라임', emoji: '🟢', hpMult: 1.0, speedMult: 1.0, color: '#2ecc71' },
    { id: 'goblin', name: '고블린', emoji: '👺', hpMult: 1.2, speedMult: 1.1, color: '#e67e22' },
    { id: 'skeleton', name: '스켈레톤', emoji: '💀', hpMult: 0.8, speedMult: 1.3, color: '#ecf0f1' },
    { id: 'orc', name: '오크', emoji: '👹', hpMult: 1.5, speedMult: 0.8, color: '#27ae60' },
    { id: 'demon', name: '데몬', emoji: '😈', hpMult: 2.0, speedMult: 0.9, color: '#8e44ad' },
];

// 보스 타입 정의
const BOSS_TYPES = [
    { id: 'boss_slime', name: '킹 슬라임', emoji: '👑', color: '#2ecc71', specialAttack: 'split' },
    { id: 'boss_orc', name: '오크 대장', emoji: '🔱', color: '#c0392b', specialAttack: 'rage' },
    { id: 'boss_dragon', name: '드래곤', emoji: '🐉', color: '#9b59b6', specialAttack: 'breath' },
    { id: 'boss_demon', name: '마왕', emoji: '👿', color: '#2c3e50', specialAttack: 'summon' },
];

// 업그레이드 정의
const UPGRADES = [
    { id: 'attack', name: '공격력', icon: '⚔️', baseBonus: 0.05, baseCost: 100, costMult: 1.5 },
    { id: 'attackSpeed', name: '공격속도', icon: '⚡', baseBonus: 0.03, baseCost: 150, costMult: 1.6 },
    { id: 'moveSpeed', name: '이동속도', icon: '👟', baseBonus: 0.02, baseCost: 120, costMult: 1.4 },
    { id: 'critChance', name: '치명타 확률', icon: '💀', baseBonus: 0.01, baseCost: 200, costMult: 1.7 },
    { id: 'critDamage', name: '치명타 피해', icon: '💥', baseBonus: 0.1, baseCost: 180, costMult: 1.6 },
    { id: 'goldBonus', name: '골드 보너스', icon: '💰', baseBonus: 0.05, baseCost: 250, costMult: 1.8 },
];

// 업적 정의
const ACHIEVEMENTS = [
    { id: 'first_kill', name: '첫 처치', desc: '적 1마리 처치', condition: { type: 'kills', value: 1 }, reward: { gems: 5 } },
    { id: 'killer_100', name: '백인대장', desc: '적 100마리 처치', condition: { type: 'kills', value: 100 }, reward: { gems: 20 } },
    { id: 'killer_1000', name: '천인대장', desc: '적 1000마리 처치', condition: { type: 'kills', value: 1000 }, reward: { gems: 50 } },
    { id: 'stage_10', name: '도전자', desc: '스테이지 10 도달', condition: { type: 'stage', value: 10 }, reward: { gems: 30 } },
    { id: 'stage_50', name: '정복자', desc: '스테이지 50 도달', condition: { type: 'stage', value: 50 }, reward: { gems: 100 } },
    { id: 'unlock_all', name: '완전체', desc: '모든 클래스 해금', condition: { type: 'classes', value: 5 }, reward: { gems: 200 } },
    { id: 'merge_50', name: '머지 마스터', desc: '50회 머지', condition: { type: 'merges', value: 50 }, reward: { gems: 25 } },
    { id: 'boss_first', name: '보스 슬레이어', desc: '첫 보스 처치', condition: { type: 'bossKills', value: 1 }, reward: { gems: 15 } },
    { id: 'boss_10', name: '보스 헌터', desc: '보스 10마리 처치', condition: { type: 'bossKills', value: 10 }, reward: { gems: 50 } },
];

// 상점 아이템
const SHOP_ITEMS = [
    { id: 'gold_pack', name: '💰 골드 팩', desc: '골드 1000 획득', cost: { gems: 10 }, reward: { gold: 1000 } },
    { id: 'mega_gold', name: '💰 메가 골드', desc: '골드 5000 획득', cost: { gems: 40 }, reward: { gold: 5000 } },
    { id: 'random_item', name: '🎁 랜덤 아이템', desc: 'Lv.3 머지 아이템', cost: { gems: 30 }, reward: { item: 3 } },
    { id: 'legendary_item', name: '⭐ 전설 아이템', desc: 'Lv.5 머지 아이템', cost: { gems: 80 }, reward: { item: 5 } },
    { id: 'skill_reset', name: '⚡ 스킬 초기화', desc: '모든 스킬 쿨다운 리셋', cost: { gems: 20 }, reward: { skillReset: true } },
];

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, HERO_CLASSES, MERGE_ITEM_TYPES, ENEMY_TYPES, BOSS_TYPES, UPGRADES, ACHIEVEMENTS, SHOP_ITEMS };
}
