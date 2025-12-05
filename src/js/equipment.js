/**
 * Infinity Merge Tower - Equipment System
 * 장비 시스템을 관리합니다.
 */

/**
 * 랜덤 등급 결정
 * @returns {string} - 등급 ID
 */
function getRandomRarity() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [rarityId, rarity] of Object.entries(EQUIPMENT_RARITIES)) {
        cumulative += rarity.dropRate;
        if (rand < cumulative) {
            return rarityId;
        }
    }
    return 'common';
}

/**
 * 랜덤 장비 생성
 * @param {string} slotType - 장비 슬롯 타입 (weapon, armor, accessory)
 * @param {string} [forceRarity] - 강제 등급 (옵션)
 * @returns {Object} - 생성된 장비
 */
function generateEquipment(slotType, forceRarity = null) {
    const equipType = EQUIPMENT_TYPES[slotType];
    if (!equipType) return null;

    const rarity = forceRarity || getRandomRarity();
    const rarityInfo = EQUIPMENT_RARITIES[rarity];
    const itemTemplate = equipType.items[Math.floor(Math.random() * equipType.items.length)];

    const equipment = {
        id: `${itemTemplate.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: itemTemplate.id,
        slot: slotType,
        name: itemTemplate.name,
        emoji: itemTemplate.emoji,
        rarity: rarity,
        level: 1,
        stats: {}
    };

    // 기본 스탯 설정
    if (slotType === 'weapon') {
        equipment.stats.attack = Math.floor(itemTemplate.baseAtk * rarityInfo.statMult);
    } else if (slotType === 'armor') {
        equipment.stats.defense = Math.floor(itemTemplate.baseDef * rarityInfo.statMult);
    } else if (slotType === 'accessory') {
        equipment.stats.bonusType = itemTemplate.bonusType;
        equipment.stats.bonusValue = itemTemplate.bonusValue * rarityInfo.statMult;
    }

    return equipment;
}

/**
 * 장비 강화
 * @param {string} equipmentId - 장비 ID
 * @returns {Object} - { success, message, equipment }
 */
function enhanceEquipment(equipmentId) {
    const equipment = findEquipmentById(equipmentId);
    if (!equipment) {
        return { success: false, message: '장비를 찾을 수 없습니다.' };
    }

    if (equipment.level >= CONFIG.EQUIPMENT_MAX_LEVEL) {
        return { success: false, message: '최대 레벨입니다!' };
    }

    const cost = getEnhanceCost(equipment);
    if (GameState.gold < cost) {
        return { success: false, message: '골드가 부족합니다!' };
    }

    // 강화 성공 확률 (레벨이 높을수록 낮아짐)
    const successRate = Math.max(0.3, 1 - (equipment.level * 0.08));
    const success = Math.random() < successRate;

    GameState.gold -= cost;

    if (success) {
        equipment.level++;
        updateEquipmentStats(equipment);
        return { success: true, message: `강화 성공! +${equipment.level}`, equipment };
    } else {
        return { success: false, message: '강화 실패...', equipment };
    }
}

/**
 * 강화 비용 계산
 * @param {Object} equipment
 * @returns {number}
 */
function getEnhanceCost(equipment) {
    const rarityMult = {
        common: 1,
        uncommon: 1.5,
        rare: 2,
        epic: 3,
        legendary: 5
    };
    const mult = rarityMult[equipment.rarity] || 1;
    return Math.floor(
        CONFIG.EQUIPMENT_ENHANCE_COST_BASE *
        Math.pow(CONFIG.EQUIPMENT_ENHANCE_COST_MULT, equipment.level - 1) *
        mult
    );
}

/**
 * 장비 스탯 업데이트 (레벨업 시)
 * @param {Object} equipment
 */
function updateEquipmentStats(equipment) {
    const rarityInfo = EQUIPMENT_RARITIES[equipment.rarity];
    const equipType = EQUIPMENT_TYPES[equipment.slot];
    const itemTemplate = equipType.items.find(i => i.id === equipment.templateId);

    if (!itemTemplate) return;

    const levelMult = 1 + (equipment.level - 1) * 0.15;

    if (equipment.slot === 'weapon') {
        equipment.stats.attack = Math.floor(itemTemplate.baseAtk * rarityInfo.statMult * levelMult);
    } else if (equipment.slot === 'armor') {
        equipment.stats.defense = Math.floor(itemTemplate.baseDef * rarityInfo.statMult * levelMult);
    } else if (equipment.slot === 'accessory') {
        equipment.stats.bonusValue = itemTemplate.bonusValue * rarityInfo.statMult * levelMult;
    }
}

/**
 * 인벤토리에서 장비 찾기
 * @param {string} equipmentId
 * @returns {Object|null}
 */
function findEquipmentById(equipmentId) {
    return GameState.equipmentInventory.find(e => e.id === equipmentId);
}

/**
 * 장비 장착
 * @param {number} unitIndex - 유닛 그리드 인덱스
 * @param {string} equipmentId - 장비 ID
 * @param {string} slot - 장착 슬롯
 * @returns {Object} - { success, message }
 */
function equipItem(unitIndex, equipmentId, slot) {
    const unit = GameState.grid[unitIndex];
    if (!unit) {
        return { success: false, message: '유닛을 찾을 수 없습니다.' };
    }

    const equipment = findEquipmentById(equipmentId);
    if (!equipment) {
        return { success: false, message: '장비를 찾을 수 없습니다.' };
    }

    if (equipment.slot !== slot) {
        return { success: false, message: '해당 슬롯에 장착할 수 없습니다.' };
    }

    // 기존 장비 해제
    if (unit.equipment && unit.equipment[slot]) {
        unequipItem(unitIndex, slot);
    }

    // 장착
    if (!unit.equipment) {
        unit.equipment = {};
    }
    unit.equipment[slot] = equipment;

    // 인벤토리에서 제거
    const index = GameState.equipmentInventory.indexOf(equipment);
    if (index > -1) {
        GameState.equipmentInventory.splice(index, 1);
    }

    return { success: true, message: `${equipment.name} 장착!` };
}

/**
 * 장비 해제
 * @param {number} unitIndex
 * @param {string} slot
 * @returns {Object}
 */
function unequipItem(unitIndex, slot) {
    const unit = GameState.grid[unitIndex];
    if (!unit || !unit.equipment || !unit.equipment[slot]) {
        return { success: false, message: '장착된 장비가 없습니다.' };
    }

    const equipment = unit.equipment[slot];
    GameState.equipmentInventory.push(equipment);
    delete unit.equipment[slot];

    return { success: true, message: `${equipment.name} 해제!` };
}

/**
 * 장비 판매
 * @param {string} equipmentId
 * @returns {Object}
 */
function sellEquipment(equipmentId) {
    const index = GameState.equipmentInventory.findIndex(e => e.id === equipmentId);
    if (index === -1) {
        return { success: false, message: '장비를 찾을 수 없습니다.' };
    }

    const equipment = GameState.equipmentInventory[index];
    const sellPrice = calculateSellPrice(equipment);

    GameState.equipmentInventory.splice(index, 1);
    GameState.gold += sellPrice;

    return { success: true, message: `${sellPrice} 골드 획득!`, gold: sellPrice };
}

/**
 * 판매 가격 계산
 * @param {Object} equipment
 * @returns {number}
 */
function calculateSellPrice(equipment) {
    const rarityMult = {
        common: 10,
        uncommon: 25,
        rare: 50,
        epic: 100,
        legendary: 250
    };
    return Math.floor(rarityMult[equipment.rarity] * equipment.level);
}

/**
 * 유닛의 장비 보너스 계산
 * @param {Object} unit
 * @returns {Object} - { attack, defense, speed, critChance, gold, elementDamage }
 */
function calculateEquipmentBonus(unit) {
    const bonus = {
        attack: 0,
        defense: 0,
        speed: 0,
        critChance: 0,
        gold: 0,
        elementDamage: 0
    };

    if (!unit || !unit.equipment) return bonus;

    Object.values(unit.equipment).forEach(equip => {
        if (!equip || !equip.stats) return;

        if (equip.slot === 'weapon') {
            bonus.attack += equip.stats.attack || 0;
        } else if (equip.slot === 'armor') {
            bonus.defense += equip.stats.defense || 0;
        } else if (equip.slot === 'accessory' && equip.stats.bonusType) {
            const type = equip.stats.bonusType;
            const value = equip.stats.bonusValue || 0;

            switch (type) {
                case 'attack':
                    bonus.attack += value;
                    break;
                case 'speed':
                    bonus.speed += value;
                    break;
                case 'critChance':
                    bonus.critChance += value;
                    break;
                case 'gold':
                    bonus.gold += value;
                    break;
                case 'elementDamage':
                    bonus.elementDamage += value;
                    break;
            }
        }
    });

    return bonus;
}

/**
 * 적 처치 시 장비 드랍 체크
 * @param {Object} enemy
 * @returns {Object|null} - 드랍된 장비 또는 null
 */
function checkEquipmentDrop(enemy) {
    // 기본 드랍률 2%, 보스는 20%, 엘리트는 10%
    let dropRate = 0.02;
    if (enemy.isBoss) dropRate = 0.2;
    else if (enemy.isElite) dropRate = 0.1;

    if (Math.random() > dropRate) return null;

    // 랜덤 슬롯 선택
    const slots = CONFIG.EQUIPMENT_SLOTS;
    const slot = slots[Math.floor(Math.random() * slots.length)];

    // 보스는 더 높은 등급 확률
    let equipment;
    if (enemy.isBoss && Math.random() < 0.3) {
        equipment = generateEquipment(slot, 'epic');
    } else if (enemy.isBoss && Math.random() < 0.5) {
        equipment = generateEquipment(slot, 'rare');
    } else {
        equipment = generateEquipment(slot);
    }

    if (equipment) {
        GameState.equipmentInventory.push(equipment);
        return equipment;
    }

    return null;
}

/**
 * 장비 등급 색상 가져오기
 * @param {string} rarity
 * @returns {string}
 */
function getRarityColor(rarity) {
    return EQUIPMENT_RARITIES[rarity]?.color || '#ffffff';
}

/**
 * 장비 등급 이름 가져오기
 * @param {string} rarity
 * @returns {string}
 */
function getRarityName(rarity) {
    return EQUIPMENT_RARITIES[rarity]?.name || '알 수 없음';
}

/**
 * 인벤토리 정렬
 * @param {string} sortBy - 'rarity', 'level', 'slot'
 */
function sortInventory(sortBy = 'rarity') {
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

    GameState.equipmentInventory.sort((a, b) => {
        if (sortBy === 'rarity') {
            return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        } else if (sortBy === 'level') {
            return b.level - a.level;
        } else if (sortBy === 'slot') {
            return a.slot.localeCompare(b.slot);
        }
        return 0;
    });
}

/**
 * 전체 장비 보너스 합산 (모든 유닛)
 * @returns {Object}
 */
function getTotalEquipmentBonus() {
    const total = {
        attack: 0,
        defense: 0,
        speed: 0,
        critChance: 0,
        gold: 0,
        elementDamage: 0
    };

    GameState.grid.forEach(unit => {
        if (unit) {
            const bonus = calculateEquipmentBonus(unit);
            Object.keys(total).forEach(key => {
                total[key] += bonus[key];
            });
        }
    });

    return total;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRandomRarity,
        generateEquipment,
        enhanceEquipment,
        getEnhanceCost,
        updateEquipmentStats,
        findEquipmentById,
        equipItem,
        unequipItem,
        sellEquipment,
        calculateSellPrice,
        calculateEquipmentBonus,
        checkEquipmentDrop,
        getRarityColor,
        getRarityName,
        sortInventory,
        getTotalEquipmentBonus
    };
}
