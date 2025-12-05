/**
 * Infinity Merge Tower - Skill System
 * 유닛 스킬 시스템을 관리합니다.
 */

/**
 * 스킬 쿨다운 키 생성
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @returns {string} - 쿨다운 키
 */
function getSkillCooldownKey(unitIndex) {
    return `unit_${unitIndex}`;
}

/**
 * 스킬 사용 가능 여부 체크
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @returns {boolean}
 */
function isSkillReady(unitIndex) {
    const key = getSkillCooldownKey(unitIndex);
    return !RuntimeState.skillCooldowns[key] || RuntimeState.skillCooldowns[key] <= 0;
}

/**
 * 스킬 쿨다운 시작
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @param {number} cooldown - 쿨다운 시간 (ms)
 */
function startSkillCooldown(unitIndex, cooldown) {
    const key = getSkillCooldownKey(unitIndex);
    RuntimeState.skillCooldowns[key] = cooldown;
}

/**
 * 스킬 잔여 쿨다운 가져오기
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @returns {number} - 남은 쿨다운 (ms)
 */
function getSkillCooldownRemaining(unitIndex) {
    const key = getSkillCooldownKey(unitIndex);
    return RuntimeState.skillCooldowns[key] || 0;
}

/**
 * 스킬 발동
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @param {Object} unit - 유닛 객체
 * @returns {Object|null} - 스킬 효과 또는 null
 */
function activateSkill(unitIndex, unit) {
    if (!unit || !unit.type.skill) return null;
    if (!isSkillReady(unitIndex)) return null;

    const skill = unit.type.skill;
    const effect = skill.effect;
    const cooldownMs = skill.cooldown * 1000;

    // 쿨다운 시작
    startSkillCooldown(unitIndex, cooldownMs);

    // 스킬 효과 처리
    const result = processSkillEffect(unit, effect);

    // 스킬 발동 시각 효과를 위한 정보 반환
    return {
        skillName: skill.name,
        skillDesc: skill.desc,
        unitIndex,
        effect: result
    };
}

/**
 * 스킬 효과 처리
 * @param {Object} unit - 유닛 객체
 * @param {Object} effect - 스킬 효과 정보
 * @returns {Object} - 처리 결과
 */
function processSkillEffect(unit, effect) {
    switch (effect.type) {
        case 'damage_boost':
            // 다음 공격 데미지 증가
            return {
                type: 'damage_boost',
                value: effect.value,
                remainingHits: effect.duration
            };

        case 'speed_boost':
            // 공격속도 증가
            GameState.activeSkillEffects.push({
                type: 'speed_boost',
                unitId: unit.type.id,
                value: effect.value,
                remainingTime: effect.duration
            });
            return { type: 'speed_boost', duration: effect.duration };

        case 'aoe_damage':
            // 모든 적에게 피해
            const aoeDamage = calculateUnitDamage(unit) * effect.value;
            RuntimeState.enemies.forEach(enemy => {
                enemy.hp -= aoeDamage;
                GameState.totalDamage += aoeDamage;
            });
            return { type: 'aoe_damage', damage: aoeDamage };

        case 'team_buff':
            // 팀 전체 버프
            GameState.teamBuffs.push({
                type: 'team_buff',
                value: effect.value,
                remainingTime: effect.duration
            });
            return { type: 'team_buff', value: effect.value, duration: effect.duration };

        case 'chain_damage':
            // 연쇄 피해
            const chainDamage = calculateUnitDamage(unit) * effect.value;
            const targets = RuntimeState.enemies.slice(0, effect.targets);
            targets.forEach(enemy => {
                enemy.hp -= chainDamage;
                GameState.totalDamage += chainDamage;
            });
            return { type: 'chain_damage', damage: chainDamage, targetCount: targets.length };

        case 'guaranteed_crit':
            // 확정 크리티컬
            return {
                type: 'guaranteed_crit',
                remainingHits: effect.duration
            };

        case 'gold_boost':
            // 골드 획득량 증가
            GameState.goldBuffActive = true;
            GameState.goldBuffEndTime = Date.now() + effect.duration;
            return { type: 'gold_boost', duration: effect.duration };

        case 'berserk':
            // 광분 (공격력 & 공격속도 증가)
            GameState.activeSkillEffects.push({
                type: 'berserk_damage',
                unitId: unit.type.id,
                value: effect.damageValue,
                remainingTime: effect.duration
            });
            GameState.activeSkillEffects.push({
                type: 'berserk_speed',
                unitId: unit.type.id,
                value: effect.speedValue,
                remainingTime: effect.duration
            });
            return { type: 'berserk', duration: effect.duration };

        default:
            return null;
    }
}

/**
 * 유닛 데미지 계산 (스킬용)
 * @param {Object} unit - 유닛 객체
 * @returns {number} - 데미지
 */
function calculateUnitDamage(unit) {
    const baseAtk = unit.type.baseAtk;
    const levelMultiplier = Math.pow(2, unit.level - 1);
    const upgradeBonus = 1 + GameState.upgrades.attackBonus * CONFIG.UPGRADES.attackBonus.effect;
    const teamBonus = 1 + getTeamAttackBonus();

    return baseAtk * levelMultiplier * upgradeBonus * teamBonus;
}

/**
 * 유닛의 현재 공격속도 배율 가져오기
 * @param {Object} unit - 유닛 객체
 * @returns {number} - 공격속도 배율
 */
function getUnitSpeedMultiplier(unit) {
    let multiplier = 1 + GameState.upgrades.attackSpeed * CONFIG.UPGRADES.attackSpeed.effect;

    // 활성 스킬 효과 적용
    GameState.activeSkillEffects.forEach(effect => {
        if (effect.unitId === unit.type.id) {
            if (effect.type === 'speed_boost' || effect.type === 'berserk_speed') {
                multiplier *= effect.value;
            }
        }
    });

    return multiplier;
}

/**
 * 유닛의 현재 공격력 배율 가져오기
 * @param {Object} unit - 유닛 객체
 * @returns {number} - 공격력 배율
 */
function getUnitDamageMultiplier(unit) {
    let multiplier = 1;

    // 활성 스킬 효과 적용
    GameState.activeSkillEffects.forEach(effect => {
        if (effect.unitId === unit.type.id) {
            if (effect.type === 'berserk_damage') {
                multiplier *= effect.value;
            }
        }
    });

    return multiplier;
}

/**
 * 확정 크리티컬 체크
 * @param {Object} unit - 유닛 객체
 * @returns {boolean}
 */
function hasGuaranteedCrit(unit) {
    for (const effect of GameState.activeSkillEffects) {
        if (effect.unitId === unit.type.id && effect.type === 'guaranteed_crit') {
            if (effect.remainingHits > 0) {
                effect.remainingHits--;
                if (effect.remainingHits <= 0) {
                    const index = GameState.activeSkillEffects.indexOf(effect);
                    GameState.activeSkillEffects.splice(index, 1);
                }
                return true;
            }
        }
    }
    return false;
}

/**
 * 데미지 부스트 체크 및 적용
 * @param {Object} unit - 유닛 객체
 * @returns {number} - 데미지 배율
 */
function consumeDamageBoost(unit) {
    for (let i = GameState.activeSkillEffects.length - 1; i >= 0; i--) {
        const effect = GameState.activeSkillEffects[i];
        if (effect.unitId === unit.type.id && effect.type === 'damage_boost') {
            if (effect.remainingHits > 0) {
                effect.remainingHits--;
                const boost = effect.value;
                if (effect.remainingHits <= 0) {
                    GameState.activeSkillEffects.splice(i, 1);
                }
                return boost;
            }
        }
    }
    return 1;
}

/**
 * 자동 스킬 발동 (AI)
 * 조건에 따라 자동으로 스킬 발동
 */
function autoActivateSkills() {
    GameState.grid.forEach((unit, index) => {
        if (!unit || !unit.type.skill) return;
        if (!isSkillReady(index)) return;

        const skill = unit.type.skill;

        // 자동 발동 조건
        let shouldActivate = false;

        switch (skill.effect.type) {
            case 'aoe_damage':
            case 'chain_damage':
                // 적이 5마리 이상일 때 발동
                shouldActivate = RuntimeState.enemies.length >= 5;
                break;

            case 'team_buff':
                // 보스전에서 발동
                shouldActivate = RuntimeState.isBossBattle;
                break;

            case 'gold_boost':
                // 보스전이 아닐 때 발동
                shouldActivate = !RuntimeState.isBossBattle && RuntimeState.enemies.length > 0;
                break;

            case 'damage_boost':
            case 'guaranteed_crit':
            case 'berserk':
                // 보스전에서 발동
                shouldActivate = RuntimeState.isBossBattle;
                break;

            case 'speed_boost':
                // 적이 많을 때 발동
                shouldActivate = RuntimeState.enemies.length >= 3;
                break;

            default:
                shouldActivate = RuntimeState.enemies.length > 0;
        }

        if (shouldActivate) {
            const result = activateSkill(index, unit);
            if (result) {
                // 스킬 발동 이펙트 표시
                showSkillEffect(index, result);
            }
        }
    });
}

/**
 * 스킬 발동 이펙트 표시
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @param {Object} skillResult - 스킬 발동 결과
 */
function showSkillEffect(unitIndex, skillResult) {
    const slot = document.querySelectorAll('.grid-slot')[unitIndex];
    if (!slot) return;

    // 스킬 이펙트 요소 생성
    const effect = document.createElement('div');
    effect.className = 'skill-effect';
    effect.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%)';
    slot.appendChild(effect);
    setTimeout(() => effect.remove(), 500);

    // 스킬 이름 표시
    showToast(`⚡ ${skillResult.skillName}!`);
}

/**
 * 모든 스킬 쿨다운 초기화
 */
function resetAllSkillCooldowns() {
    RuntimeState.skillCooldowns = {};
    GameState.activeSkillEffects = [];
    GameState.teamBuffs = [];
}

/**
 * 스킬 정보 표시용 텍스트 생성
 * @param {Object} skill - 스킬 정보
 * @returns {Object} - { name, desc, cooldown }
 */
function getSkillDisplayInfo(skill) {
    if (!skill) return null;

    return {
        name: skill.name,
        desc: skill.desc,
        cooldown: `${skill.cooldown}초`,
        typeText: skill.type === 'active' ? '액티브' : '패시브'
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSkillCooldownKey,
        isSkillReady,
        startSkillCooldown,
        getSkillCooldownRemaining,
        activateSkill,
        processSkillEffect,
        calculateUnitDamage,
        getUnitSpeedMultiplier,
        getUnitDamageMultiplier,
        hasGuaranteedCrit,
        consumeDamageBoost,
        autoActivateSkills,
        showSkillEffect,
        resetAllSkillCooldowns,
        getSkillDisplayInfo
    };
}
