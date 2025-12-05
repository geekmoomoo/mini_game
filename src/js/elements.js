/**
 * Infinity Merge Tower - Element System
 * 속성 상성 시스템을 관리합니다.
 */

/**
 * 속성 상성에 따른 데미지 배율 계산
 * @param {string} attackerElement - 공격자 속성
 * @param {string} defenderElement - 방어자 속성
 * @returns {Object} - { multiplier: number, advantage: 'strong' | 'weak' | 'neutral' }
 */
function calculateElementMultiplier(attackerElement, defenderElement) {
    if (!attackerElement || !defenderElement) {
        return { multiplier: 1, advantage: 'neutral' };
    }

    const attackerInfo = CONFIG.ELEMENTS[attackerElement];
    const defenderInfo = CONFIG.ELEMENTS[defenderElement];

    if (!attackerInfo || !defenderInfo) {
        return { multiplier: 1, advantage: 'neutral' };
    }

    // 공격자가 방어자에 대해 강함
    if (attackerInfo.strong === defenderElement) {
        return {
            multiplier: CONFIG.ELEMENT_ADVANTAGE,
            advantage: 'strong'
        };
    }

    // 공격자가 방어자에 대해 약함
    if (attackerInfo.weak === defenderElement) {
        return {
            multiplier: CONFIG.ELEMENT_DISADVANTAGE,
            advantage: 'weak'
        };
    }

    return { multiplier: 1, advantage: 'neutral' };
}

/**
 * 속성 정보 가져오기
 * @param {string} elementId - 속성 ID
 * @returns {Object|null} - 속성 정보
 */
function getElementInfo(elementId) {
    return CONFIG.ELEMENTS[elementId] || null;
}

/**
 * 랜덤 속성 가져오기
 * @returns {string} - 속성 ID
 */
function getRandomElement() {
    const elements = Object.keys(CONFIG.ELEMENTS);
    return elements[Math.floor(Math.random() * elements.length)];
}

/**
 * 속성 이모지 가져오기
 * @param {string} elementId - 속성 ID
 * @returns {string} - 속성 이모지
 */
function getElementEmoji(elementId) {
    const element = CONFIG.ELEMENTS[elementId];
    return element ? element.emoji : '';
}

/**
 * 속성 색상 가져오기
 * @param {string} elementId - 속성 ID
 * @returns {string} - 속성 색상
 */
function getElementColor(elementId) {
    const element = CONFIG.ELEMENTS[elementId];
    return element ? element.color : '#ffffff';
}

/**
 * 속성 이름 가져오기
 * @param {string} elementId - 속성 ID
 * @returns {string} - 속성 이름
 */
function getElementName(elementId) {
    const element = CONFIG.ELEMENTS[elementId];
    return element ? element.name : '없음';
}

/**
 * 상성 관계 텍스트 가져오기
 * @param {string} elementId - 속성 ID
 * @returns {Object} - { strongAgainst: string, weakAgainst: string }
 */
function getElementRelations(elementId) {
    const element = CONFIG.ELEMENTS[elementId];
    if (!element) {
        return { strongAgainst: '없음', weakAgainst: '없음' };
    }

    const strongElement = CONFIG.ELEMENTS[element.strong];
    const weakElement = CONFIG.ELEMENTS[element.weak];

    return {
        strongAgainst: strongElement ? strongElement.name : '없음',
        weakAgainst: weakElement ? weakElement.name : '없음'
    };
}

/**
 * 속성 상성 UI 텍스트 생성
 * @param {string} attackerElement - 공격자 속성
 * @param {string} defenderElement - 방어자 속성
 * @returns {Object} - { text: string, color: string }
 */
function getElementAdvantageText(attackerElement, defenderElement) {
    const result = calculateElementMultiplier(attackerElement, defenderElement);

    switch (result.advantage) {
        case 'strong':
            return { text: '효과적!', color: '#4ecdc4', emoji: '💪' };
        case 'weak':
            return { text: '효과 감소', color: '#e94560', emoji: '💔' };
        default:
            return { text: '', color: '', emoji: '' };
    }
}

/**
 * 보스에게 가장 효과적인 속성 찾기
 * @param {string} bossElement - 보스 속성
 * @returns {Object} - { elementId: string, element: Object }
 */
function getBestElementAgainstBoss(bossElement) {
    for (const [elementId, element] of Object.entries(CONFIG.ELEMENTS)) {
        if (element.strong === bossElement) {
            return { elementId, element };
        }
    }
    return null;
}

/**
 * 그리드에서 특정 속성 유닛 수 카운트
 * @param {string} elementId - 속성 ID
 * @returns {number} - 해당 속성 유닛 수
 */
function countUnitsWithElement(elementId) {
    let count = 0;
    GameState.grid.forEach(unit => {
        if (unit && unit.type.element === elementId) {
            count++;
        }
    });
    return count;
}

/**
 * 속성 다양성 보너스 계산
 * 다양한 속성을 가진 유닛이 많을수록 보너스
 * @returns {number} - 보너스 배율 (1.0 ~ 1.3)
 */
function calculateElementDiversityBonus() {
    const elementCounts = {};
    let totalUnits = 0;

    GameState.grid.forEach(unit => {
        if (unit) {
            const element = unit.type.element;
            elementCounts[element] = (elementCounts[element] || 0) + 1;
            totalUnits++;
        }
    });

    if (totalUnits === 0) return 1.0;

    const uniqueElements = Object.keys(elementCounts).length;
    const maxElements = Object.keys(CONFIG.ELEMENTS).length;

    // 모든 속성을 가지면 최대 30% 보너스
    return 1 + (uniqueElements / maxElements) * 0.3;
}

/**
 * 속성 시너지 체크
 * 같은 속성 유닛이 3개 이상이면 보너스
 * @returns {Array} - 활성화된 시너지 목록
 */
function checkElementSynergies() {
    const synergies = [];
    const elementCounts = {};

    GameState.grid.forEach(unit => {
        if (unit) {
            const element = unit.type.element;
            elementCounts[element] = (elementCounts[element] || 0) + 1;
        }
    });

    for (const [elementId, count] of Object.entries(elementCounts)) {
        if (count >= 3) {
            const element = CONFIG.ELEMENTS[elementId];
            synergies.push({
                elementId,
                name: element.name,
                emoji: element.emoji,
                count,
                bonus: Math.min(count * 0.05, 0.25) // 최대 25% 보너스
            });
        }
    }

    return synergies;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateElementMultiplier,
        getElementInfo,
        getRandomElement,
        getElementEmoji,
        getElementColor,
        getElementName,
        getElementRelations,
        getElementAdvantageText,
        getBestElementAgainstBoss,
        countUnitsWithElement,
        calculateElementDiversityBonus,
        checkElementSynergies
    };
}
