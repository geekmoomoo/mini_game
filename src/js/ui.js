/**
 * Infinity Merge Tower v3.0 - UI System
 * 렌더링 및 UI 관리
 */

/**
 * 사이드 메뉴 토글
 */
function toggleSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('side-menu-overlay');

    if (sideMenu && overlay) {
        sideMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

/**
 * 렌더링 메인
 */
function render() {
    const ctx = RuntimeState.ctx;
    const canvas = RuntimeState.canvas;

    // 클리어
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 중앙 영역 표시
    drawArena(ctx);

    // 적 렌더링
    renderEnemies(ctx);

    // 히어로 렌더링
    renderHeroes(ctx);

    // 투사체 렌더링
    renderProjectiles(ctx);

    // 파티클 렌더링
    renderParticles(ctx);

    // 데미지 숫자
    renderDamageNumbers(ctx);

    // 플로팅 텍스트
    renderFloatingTexts(ctx);
}

/**
 * 전투 영역 그리기
 */
function drawArena(ctx) {
    const cx = RuntimeState.centerX;
    const cy = RuntimeState.centerY;
    const spawnRadius = RuntimeState.dynamicSpawnRadius || CONFIG.ENEMY_SPAWN_RADIUS;
    const centerRadius = RuntimeState.dynamicCenterRadius || CONFIG.CANVAS_CENTER_RADIUS;

    // 외곽 원 (적 스폰 범위)
    ctx.beginPath();
    ctx.arc(cx, cy, spawnRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 중앙 원 (히어로 영역)
    ctx.beginPath();
    ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 중심점
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
}

/**
 * 히어로 렌더링
 */
function renderHeroes(ctx) {
    // 화면 크기에 따른 히어로 크기 조절
    const minDim = Math.min(RuntimeState.canvasWidth, RuntimeState.canvasHeight);
    const heroSize = Math.max(12, Math.min(20, minDim * 0.06));
    const fontSize = Math.max(12, Math.min(20, minDim * 0.055));

    RuntimeState.heroInstances.forEach(hero => {
        const heroClass = hero.class;

        // 공격 범위 표시 (선택된 히어로만)
        if (RuntimeState.selectedHeroClass === hero.classId) {
            // 동적 사거리 (화면 비율에 맞춤)
            const scaledRange = hero.stats.range * (minDim / 400);
            ctx.beginPath();
            ctx.arc(hero.x, hero.y, scaledRange, 0, Math.PI * 2);
            ctx.strokeStyle = `${heroClass.color}40`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 히어로 원
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, heroSize, 0, Math.PI * 2);
        ctx.fillStyle = heroClass.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 히어로 이모지
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(heroClass.emoji, hero.x, hero.y);

        // 이름 태그
        ctx.font = `${Math.max(8, fontSize * 0.5)}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.fillText(heroClass.name, hero.x, hero.y + heroSize + 10);
    });
}

/**
 * 적 렌더링
 */
function renderEnemies(ctx) {
    // 화면 크기에 따른 적 크기 조절
    const minDim = Math.min(RuntimeState.canvasWidth, RuntimeState.canvasHeight);
    const sizeScale = Math.max(0.5, minDim / 400);

    RuntimeState.enemies.forEach(enemy => {
        const scaledSize = enemy.size * sizeScale;

        // 적 원
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, scaledSize, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();

        if (enemy.isBoss) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 이모지
        ctx.font = `${scaledSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, enemy.x, enemy.y);

        // HP 바
        const hpBarWidth = scaledSize * 2;
        const hpBarHeight = Math.max(3, 4 * sizeScale);
        const hpPercent = enemy.hp / enemy.maxHp;

        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - scaledSize - 8, hpBarWidth, hpBarHeight);

        ctx.fillStyle = enemy.isBoss ? '#ffd700' : '#4ecdc4';
        ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - scaledSize - 8, hpBarWidth * hpPercent, hpBarHeight);
    });
}

/**
 * 투사체 렌더링
 */
function renderProjectiles(ctx) {
    RuntimeState.projectiles.forEach(proj => {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fillStyle = proj.color;
        ctx.fill();

        // 트레일 효과
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x - proj.vx * 0.05, proj.y - proj.vy * 0.05);
        ctx.strokeStyle = `${proj.color}80`;
        ctx.lineWidth = proj.size * 0.5;
        ctx.stroke();
    });
}

/**
 * 파티클 렌더링
 */
function renderParticles(ctx) {
    RuntimeState.particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

/**
 * 데미지 숫자 렌더링
 */
function renderDamageNumbers(ctx) {
    RuntimeState.damageNumbers.forEach(d => {
        ctx.globalAlpha = d.alpha;
        ctx.font = d.isCrit ? 'bold 18px Arial' : '14px Arial';
        ctx.fillStyle = d.isCrit ? '#ffd700' : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(d.damage, d.x, d.y);
    });
    ctx.globalAlpha = 1;
}

/**
 * 플로팅 텍스트 렌더링
 */
function renderFloatingTexts(ctx) {
    RuntimeState.floatingTexts.forEach(t => {
        ctx.globalAlpha = t.alpha;
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
}

/**
 * UI 업데이트
 */
function updateUI() {
    // 자원 표시
    document.getElementById('gold-amount').textContent = formatNumber(GameState.gold);
    document.getElementById('gem-amount').textContent = formatNumber(GameState.gems);
    document.getElementById('current-stage').textContent = GameState.currentStage;
    document.getElementById('dps-display').textContent = `DPS: ${formatNumber(RuntimeState.currentDPS)}`;
    document.getElementById('best-stage').textContent = `Best: Stage ${GameState.bestStage}`;

    // 웨이브 진행
    const waveProgress = (RuntimeState.waveEnemiesKilled / CONFIG.ENEMIES_PER_WAVE) * 100;
    const waveProgressBar = document.getElementById('wave-progress-bar');
    if (waveProgressBar) {
        waveProgressBar.style.width = `${waveProgress}%`;
    }
    const waveText = document.getElementById('wave-text');
    if (waveText) {
        waveText.textContent = `Wave ${GameState.currentWave} - ${RuntimeState.waveEnemiesKilled}/${CONFIG.ENEMIES_PER_WAVE}`;
    }

    // 보스 타이머
    const bossTimer = document.getElementById('boss-timer');
    if (bossTimer) {
        if (RuntimeState.bossActive) {
            bossTimer.classList.add('active');
            const timeLeft = Math.ceil(RuntimeState.bossTimer / 1000);
            document.getElementById('boss-time-left').textContent = timeLeft;
            if (timeLeft <= 10) {
                bossTimer.classList.add('warning');
            } else {
                bossTimer.classList.remove('warning');
            }
        } else {
            bossTimer.classList.remove('active');
            bossTimer.classList.remove('warning');
        }
    }

    // 소환 비용
    document.getElementById('summon-cost').textContent = `💰 ${formatNumber(GameState.summonCost)}`;

    // 선택된 히어로 정보
    updateSelectedHeroInfo();
}

/**
 * 선택된 히어로 정보 업데이트
 */
function updateSelectedHeroInfo() {
    const heroId = RuntimeState.selectedHeroClass;
    const heroClass = HERO_CLASSES[heroId];
    const stats = calculateHeroStats(heroId);

    const heroEmoji = document.getElementById('hero-emoji');
    const heroName = document.getElementById('hero-name');
    const heroAttack = document.getElementById('hero-attack');

    if (heroEmoji) heroEmoji.textContent = heroClass.emoji;
    if (heroName) heroName.textContent = heroClass.name;
    if (heroAttack) heroAttack.textContent = `ATK: ${stats.attack.toFixed(1)} | SPD: ${stats.atkSpeed.toFixed(2)}`;
}

/**
 * 히어로 탭 렌더링
 */
function renderHeroTabs() {
    const container = document.getElementById('hero-tabs');
    if (!container) return;

    let html = '';

    Object.entries(HERO_CLASSES).forEach(([id, heroClass]) => {
        const isUnlocked = GameState.heroes[id].unlocked;
        const isSelected = RuntimeState.selectedHeroClass === id;

        if (isUnlocked) {
            html += `
                <div class="hero-tab ${id} ${isSelected ? 'active' : ''}"
                     onclick="selectHeroTab('${id}')">
                    <span class="hero-tab-emoji">${heroClass.emoji}</span>
                    <span class="hero-tab-name">${heroClass.name}</span>
                </div>
            `;
        } else {
            html += `
                <div class="hero-tab ${id} locked">
                    <span class="hero-tab-emoji">🔒</span>
                    <span class="hero-tab-name">Stage ${heroClass.unlockStage}</span>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

/**
 * 히어로 탭 선택
 */
function selectHeroTab(classId) {
    RuntimeState.selectedHeroClass = classId;
    renderHeroTabs();
    renderMergeGrid();
    playSound('click');
}

/**
 * 머지 그리드 렌더링
 */
function renderMergeGrid() {
    const container = document.getElementById('merge-grid');
    if (!container) return;

    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];
    const heroClass = HERO_CLASSES[heroId];

    if (!heroState || !heroState.unlocked) {
        container.innerHTML = '<div class="merge-locked">히어로를 해금하세요!</div>';
        return;
    }

    let html = '';

    for (let i = 0; i < CONFIG.MERGE_SLOTS_PER_CLASS; i++) {
        const item = heroState.mergeGrid[i];
        const isSelected = RuntimeState.draggedIndex === i;

        if (item) {
            const itemType = MERGE_ITEM_TYPES.find(t => t.id === item.typeId);
            const levelClass = `merge-item-lv${Math.min(item.level, 10)}`;
            const sellPrice = getSellPrice(item.level);
            html += `
                <div class="grid-slot ${isSelected ? 'selected' : ''}"
                     data-index="${i}"
                     draggable="true"
                     ondragstart="handleDragStart(event)"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     ondrop="handleDrop(event)"
                     onclick="handleSlotClick(${i})">
                    <div class="merge-item ${levelClass}">
                        <span class="merge-item-emoji">${itemType?.emoji || '?'}</span>
                        <span class="merge-item-level">Lv.${item.level}</span>
                        <button class="sell-btn"
                                data-index="${i}"
                                ontouchstart="startSellTimer(event, ${i})"
                                ontouchend="cancelSellTimer(event)"
                                ontouchcancel="cancelSellTimer(event)"
                                onmousedown="startSellTimer(event, ${i})"
                                onmouseup="cancelSellTimer(event)"
                                onmouseleave="cancelSellTimer(event)"
                                title="길게 눌러서 판매 (${sellPrice}골드)">💰</button>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="grid-slot"
                     data-index="${i}"
                     ondragover="handleDragOver(event)"
                     ondragleave="handleDragLeave(event)"
                     ondrop="handleDrop(event)"
                     onclick="handleSlotClick(${i})">
                </div>
            `;
        }
    }

    container.innerHTML = html;

    // 선택된 히어로 정보 업데이트
    updateSelectedHeroInfo();
}

/**
 * 히어로 스탯 표시 (선택적)
 */
function renderHeroStats(heroId) {
    const container = document.getElementById('selected-hero-stats');
    if (!container) return;

    const stats = calculateHeroStats(heroId);

    container.innerHTML = `
        <div>ATK: ${stats.attack.toFixed(1)}</div>
        <div>SPD: ${stats.atkSpeed.toFixed(2)}</div>
        <div>RNG: ${stats.range}</div>
        <div>CRIT: ${(stats.critChance * 100).toFixed(0)}%</div>
    `;
}

/**
 * 아이템 소환
 */
function summonItem() {
    if (GameState.gold < GameState.summonCost) {
        showToast('골드가 부족합니다!');
        playSound('error');
        return;
    }

    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];

    if (!heroState || !heroState.unlocked) {
        showToast('먼저 히어로를 해금하세요!');
        playSound('error');
        return;
    }

    // 빈 슬롯 찾기
    const emptyIndex = heroState.mergeGrid.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
        showToast('슬롯이 가득 찼습니다!');
        playSound('error');
        return;
    }

    // 비용 지불
    GameState.gold -= GameState.summonCost;

    // 랜덤 아이템 생성
    const randomType = MERGE_ITEM_TYPES[Math.floor(Math.random() * MERGE_ITEM_TYPES.length)];
    heroState.mergeGrid[emptyIndex] = {
        typeId: randomType.id,
        level: 1,
    };

    // 비용 증가
    GameState.summonCost = Math.floor(GameState.summonCost * CONFIG.SUMMON_COST_MULTIPLIER);

    // 스탯 재계산
    recalculateAllHeroStats();

    // 퀘스트 진행도 업데이트
    updateQuestProgress('summons', 1);

    renderMergeGrid();
    updateUI();
    playSound('summon');
}

/**
 * 드래그 시작
 */
function handleDragStart(e) {
    RuntimeState.draggedIndex = parseInt(e.target.dataset.index);
    e.target.style.opacity = '0.5';
}

/**
 * 드래그 오버
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

/**
 * 드래그 리브
 */
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

/**
 * 드롭
 */
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const targetIndex = parseInt(e.currentTarget.dataset.index);
    const fromIndex = RuntimeState.draggedIndex;

    if (fromIndex === null || fromIndex === targetIndex) return;

    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];
    const fromItem = heroState.mergeGrid[fromIndex];
    const toItem = heroState.mergeGrid[targetIndex];

    // 머지 가능 체크
    if (fromItem && toItem &&
        fromItem.typeId === toItem.typeId &&
        fromItem.level === toItem.level) {
        // 머지!
        heroState.mergeGrid[targetIndex] = {
            typeId: fromItem.typeId,
            level: fromItem.level + 1,
        };
        heroState.mergeGrid[fromIndex] = null;
        GameState.totalMerges++;
        updateQuestProgress('merges', 1);
        playSound('merge');
        showToast(`Lv.${fromItem.level + 1} 아이템!`);
    } else {
        // 위치 교환
        heroState.mergeGrid[targetIndex] = fromItem;
        heroState.mergeGrid[fromIndex] = toItem;
        playSound('move');
    }

    RuntimeState.draggedIndex = null;
    recalculateAllHeroStats();
    renderMergeGrid();
}

/**
 * 아이템 판매 가격 계산
 * Lv.1 = 5골드, Lv.2 = 15골드, Lv.3 = 35골드... (머지 가치 반영)
 * 공식: 5 * (2^level - 1) → 머지에 들어간 소환 비용의 약 50% 회수
 */
function getSellPrice(level) {
    // Lv.1 = 5, Lv.2 = 15, Lv.3 = 35, Lv.4 = 75, Lv.5 = 155...
    return Math.floor(5 * (Math.pow(2, level) - 1));
}

/**
 * 롱프레스 판매 타이머
 */
let sellTimer = null;
let sellTargetIndex = null;

function startSellTimer(event, index) {
    event.preventDefault();
    event.stopPropagation();

    sellTargetIndex = index;

    // 버튼에 시각적 피드백 추가
    const btn = event.target;
    btn.classList.add('pressing');

    sellTimer = setTimeout(() => {
        sellItem(index);
        btn.classList.remove('pressing');
        sellTimer = null;
        sellTargetIndex = null;
    }, 500); // 0.5초 길게 누르면 판매
}

function cancelSellTimer(event) {
    event.preventDefault();
    event.stopPropagation();

    if (sellTimer) {
        clearTimeout(sellTimer);
        sellTimer = null;
        sellTargetIndex = null;
    }

    // 시각적 피드백 제거
    const btn = event.target;
    btn.classList.remove('pressing');
}

/**
 * 아이템 판매
 */
function sellItem(index) {
    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];
    const item = heroState.mergeGrid[index];

    if (!item) return;

    const itemType = MERGE_ITEM_TYPES.find(t => t.id === item.typeId);
    const sellPrice = getSellPrice(item.level);

    heroState.mergeGrid[index] = null;
    GameState.gold += sellPrice;

    recalculateAllHeroStats();
    renderMergeGrid();
    updateUI();
    playSound('purchase');
    showToast(`${itemType?.name || '아이템'} 판매: +${sellPrice}💰`);
}

/**
 * 슬롯 클릭 (터치용)
 */
function handleSlotClick(index) {
    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];

    if (RuntimeState.draggedIndex === null) {
        if (heroState.mergeGrid[index]) {
            RuntimeState.draggedIndex = index;
            renderMergeGrid();
            document.querySelectorAll('.merge-slot')[index]?.classList.add('selected');
        }
    } else {
        const fromIndex = RuntimeState.draggedIndex;
        const fromItem = heroState.mergeGrid[fromIndex];
        const toItem = heroState.mergeGrid[index];

        if (fromIndex === index) {
            RuntimeState.draggedIndex = null;
            renderMergeGrid();
            return;
        }

        // 머지 가능 체크
        if (fromItem && toItem &&
            fromItem.typeId === toItem.typeId &&
            fromItem.level === toItem.level) {
            heroState.mergeGrid[index] = {
                typeId: fromItem.typeId,
                level: fromItem.level + 1,
            };
            heroState.mergeGrid[fromIndex] = null;
            GameState.totalMerges++;
            updateQuestProgress('merges', 1);
            playSound('merge');
            showToast(`Lv.${fromItem.level + 1} 아이템!`);
        } else {
            // 위치 교환
            heroState.mergeGrid[index] = fromItem;
            heroState.mergeGrid[fromIndex] = toItem;
            playSound('move');
        }

        RuntimeState.draggedIndex = null;
        recalculateAllHeroStats();
        renderMergeGrid();
    }
}

/**
 * 토스트 메시지
 */
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * 모달 열기
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        RuntimeState.currentModal = modalId;

        switch (modalId) {
            case 'upgrade-modal':
                renderUpgrades();
                break;
            case 'shop-modal':
                renderShop();
                break;
            case 'achievement-modal':
                renderAchievements();
                break;
        }
    }
}

/**
 * 모달 닫기
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        RuntimeState.currentModal = null;
    }
}

/**
 * 업그레이드 렌더링
 */
function renderUpgrades() {
    const container = document.getElementById('upgrade-items');
    if (!container) return;

    let html = '';

    UPGRADES.forEach(upgrade => {
        const level = GameState.upgrades[upgrade.id] || 0;
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
        const currentBonus = (level * upgrade.baseBonus * 100).toFixed(0);

        html += `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-icon">${upgrade.icon}</span>
                    <div>
                        <div class="upgrade-name">${upgrade.name} Lv.${level}</div>
                        <div class="upgrade-bonus">+${currentBonus}%</div>
                    </div>
                </div>
                <button class="upgrade-btn" onclick="buyUpgrade('${upgrade.id}', ${cost})">
                    💰 ${formatNumber(cost)}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * 업그레이드 구매
 */
function buyUpgrade(upgradeId, cost) {
    if (GameState.gold < cost) {
        showToast('골드가 부족합니다!');
        playSound('error');
        return;
    }

    GameState.gold -= cost;
    GameState.upgrades[upgradeId]++;

    recalculateAllHeroStats();
    renderUpgrades();
    updateUI();
    playSound('upgrade');
    showToast('업그레이드 완료!');
}

/**
 * 상점 렌더링
 */
function renderShop() {
    const container = document.getElementById('shop-items');
    if (!container) return;

    let html = '';

    SHOP_ITEMS.forEach(item => {
        html += `
            <div class="shop-item">
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.desc}</div>
                </div>
                <button class="shop-buy-btn" onclick="buyShopItem('${item.id}')">
                    💎 ${item.cost.gems}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * 상점 아이템 구매
 */
function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (GameState.gems < item.cost.gems) {
        showToast('젬이 부족합니다!');
        playSound('error');
        return;
    }

    GameState.gems -= item.cost.gems;

    if (item.reward.gold) {
        GameState.gold += item.reward.gold;
        showToast(`+${item.reward.gold} 골드!`);
    }

    if (item.reward.item) {
        // 현재 선택된 히어로에 아이템 추가
        const heroState = GameState.heroes[RuntimeState.selectedHeroClass];
        const emptyIndex = heroState.mergeGrid.findIndex(s => s === null);

        if (emptyIndex !== -1) {
            const randomType = MERGE_ITEM_TYPES[Math.floor(Math.random() * MERGE_ITEM_TYPES.length)];
            heroState.mergeGrid[emptyIndex] = {
                typeId: randomType.id,
                level: item.reward.item,
            };
            showToast(`Lv.${item.reward.item} ${randomType.name} 획득!`);
            recalculateAllHeroStats();
            renderMergeGrid();
        } else {
            showToast('슬롯이 가득 찼습니다!');
            GameState.gems += item.cost.gems;  // 환불
            return;
        }
    }

    if (item.reward.skillReset) {
        Object.keys(RuntimeState.skillCooldowns).forEach(id => {
            RuntimeState.skillCooldowns[id] = 0;
        });
        showToast('모든 스킬 쿨다운 초기화!');
    }

    updateUI();
    playSound('purchase');
}

/**
 * 업적 렌더링
 */
function renderAchievements() {
    const container = document.getElementById('achievement-items');
    if (!container) return;

    let html = '';

    ACHIEVEMENTS.forEach(achievement => {
        const isUnlocked = GameState.achievementsUnlocked.includes(achievement.id);
        const progress = getAchievementProgress(achievement);

        html += `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : ''}">
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    ${!isUnlocked ? `<div class="achievement-progress">${progress}</div>` : ''}
                </div>
                <div class="achievement-reward">
                    ${isUnlocked ? '✅' : `💎 ${achievement.reward.gems}`}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * 업적 진행도
 */
function getAchievementProgress(achievement) {
    const condition = achievement.condition;
    let current = 0;

    switch (condition.type) {
        case 'kills': current = GameState.totalKills; break;
        case 'stage': current = GameState.bestStage; break;
        case 'classes': current = getUnlockedHeroIds().length; break;
        case 'merges': current = GameState.totalMerges; break;
        case 'bossKills': current = GameState.totalBossKills; break;
    }

    return `${current} / ${condition.value}`;
}

/**
 * 숫자 포맷
 */
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

/**
 * 골드 팩 구매
 */
function buyGoldPack() {
    if (GameState.gems < 10) {
        showToast('젬이 부족합니다!');
        playSound('error');
        return;
    }
    GameState.gems -= 10;
    GameState.gold += 1000;
    updateUI();
    playSound('purchase');
    showToast('+1000 골드!');
}

/**
 * 럭키 소환권 구매
 */
function buyLuckySummon() {
    if (GameState.gems < 20) {
        showToast('젬이 부족합니다!');
        playSound('error');
        return;
    }

    const heroState = GameState.heroes[RuntimeState.selectedHeroClass];
    if (!heroState || !heroState.unlocked) {
        showToast('먼저 히어로를 해금하세요!');
        playSound('error');
        return;
    }

    // 빈 슬롯 체크
    let addedCount = 0;
    for (let i = 0; i < 5; i++) {
        const emptyIndex = heroState.mergeGrid.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            const randomType = MERGE_ITEM_TYPES[Math.floor(Math.random() * MERGE_ITEM_TYPES.length)];
            heroState.mergeGrid[emptyIndex] = {
                typeId: randomType.id,
                level: 1,
            };
            addedCount++;
        }
    }

    if (addedCount === 0) {
        showToast('슬롯이 가득 찼습니다!');
        playSound('error');
        return;
    }

    GameState.gems -= 20;
    recalculateAllHeroStats();
    renderMergeGrid();
    updateUI();
    playSound('purchase');
    showToast(`${addedCount}개 아이템 획득!`);
}
