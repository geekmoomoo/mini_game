/**
 * Infinity Merge Tower v3.0 - Combat System
 * 전투 시스템: 히어로 이동, 적 스폰, 공격, 데미지 처리
 */

/**
 * 적 스폰
 */
function spawnEnemy() {
    const stage = GameState.currentStage;
    const isBoss = RuntimeState.isBossWave && RuntimeState.waveEnemiesSpawned === 0;

    // 스폰 방향 (사방에서 랜덤)
    const angle = Math.random() * Math.PI * 2;
    const spawnRadius = RuntimeState.dynamicSpawnRadius || CONFIG.ENEMY_SPAWN_RADIUS;
    const spawnDistance = spawnRadius + 30;

    const spawnX = RuntimeState.centerX + Math.cos(angle) * spawnDistance;
    const spawnY = RuntimeState.centerY + Math.sin(angle) * spawnDistance;

    if (isBoss) {
        // 보스 스폰
        const bossType = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
        const baseHp = CONFIG.ENEMY_BASE_HP * Math.pow(CONFIG.ENEMY_HP_SCALING, stage) * CONFIG.BOSS_HP_MULTIPLIER;

        RuntimeState.enemies.push({
            id: Date.now(),
            type: bossType,
            x: spawnX,
            y: spawnY,
            hp: baseHp,
            maxHp: baseHp,
            speed: CONFIG.ENEMY_BASE_SPEED * 0.7,
            size: 40 * CONFIG.BOSS_SIZE_MULTIPLIER,
            isBoss: true,
            color: bossType.color,
            emoji: bossType.emoji,
        });

        RuntimeState.bossActive = true;
        RuntimeState.bossTimer = CONFIG.BOSS_TIME_LIMIT * 1000;
    } else {
        // 일반 적 스폰
        const enemyType = ENEMY_TYPES[Math.min(Math.floor(stage / 10), ENEMY_TYPES.length - 1)];
        const baseHp = CONFIG.ENEMY_BASE_HP * Math.pow(CONFIG.ENEMY_HP_SCALING, stage) * enemyType.hpMult;
        const speed = CONFIG.ENEMY_BASE_SPEED * enemyType.speedMult;

        RuntimeState.enemies.push({
            id: Date.now() + Math.random(),
            type: enemyType,
            x: spawnX,
            y: spawnY,
            hp: baseHp,
            maxHp: baseHp,
            speed: speed,
            size: 25,
            isBoss: false,
            color: enemyType.color,
            emoji: enemyType.emoji,
        });
    }

    RuntimeState.waveEnemiesSpawned++;
}

/**
 * 웨이브 업데이트
 */
function updateWave(deltaTime) {
    // 보스 타이머
    if (RuntimeState.bossActive) {
        RuntimeState.bossTimer -= deltaTime;
        if (RuntimeState.bossTimer <= 0) {
            // 보스 타임아웃 - 실패
            RuntimeState.bossActive = false;
            RuntimeState.enemies = RuntimeState.enemies.filter(e => !e.isBoss);
            showToast('보스 도망! 다음 기회에...');
        }
    }

    // 적 스폰
    const maxEnemies = RuntimeState.isBossWave ? 1 : CONFIG.ENEMIES_PER_WAVE;

    if (RuntimeState.waveEnemiesSpawned < maxEnemies) {
        RuntimeState.spawnTimer += deltaTime;
        if (RuntimeState.spawnTimer >= CONFIG.WAVE_SPAWN_INTERVAL) {
            RuntimeState.spawnTimer = 0;
            spawnEnemy();
        }
    }

    // 웨이브 완료 체크
    if (RuntimeState.waveEnemiesKilled >= maxEnemies) {
        completeWave();
    }
}

/**
 * 웨이브 완료
 */
function completeWave() {
    GameState.currentWave++;
    RuntimeState.waveEnemiesSpawned = 0;
    RuntimeState.waveEnemiesKilled = 0;

    // 5웨이브마다 보스
    if (GameState.currentWave % CONFIG.BOSS_WAVE_INTERVAL === 0) {
        RuntimeState.isBossWave = true;
        showToast('⚠️ 보스 웨이브!');
    } else {
        RuntimeState.isBossWave = false;
    }

    // 10웨이브마다 스테이지 증가
    if (GameState.currentWave % 10 === 0) {
        GameState.currentStage++;
        if (GameState.currentStage > GameState.bestStage) {
            GameState.bestStage = GameState.currentStage;
        }

        // 스테이지 클리어 퀘스트 진행
        updateQuestProgress('stageClears', 1);

        // 클래스 해금 체크
        const newUnlocks = checkAndUnlockHeroes();
        newUnlocks.forEach(heroClass => {
            showToast(`🎉 ${heroClass.name} 해금!`);
            initHeroInstances();  // 히어로 재배치
        });

        showToast(`스테이지 ${GameState.currentStage} 도달!`);
    }

    updateUI();
}

/**
 * 히어로 이동 및 타겟팅
 */
function updateHeroes(deltaTime) {
    const dt = deltaTime / 1000;

    RuntimeState.heroInstances.forEach(hero => {
        // 가장 가까운 적 찾기
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

        hero.currentTarget = closestEnemy;

        // 이동 로직
        if (closestEnemy) {
            const dx = closestEnemy.x - hero.x;
            const dy = closestEnemy.y - hero.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > hero.stats.range) {
                // 적에게 접근
                const moveX = (dx / dist) * hero.stats.moveSpeed * dt;
                const moveY = (dy / dist) * hero.stats.moveSpeed * dt;

                hero.x += moveX;
                hero.y += moveY;
            } else {
                // 사정거리 내 - 공격 위치 유지하며 약간 이동
                hero.wanderTimer += deltaTime;
                if (hero.wanderTimer > 1000) {
                    hero.wanderTimer = 0;
                    hero.moveAngle += (Math.random() - 0.5) * 0.5;
                }
            }
        } else {
            // 적이 없을 때 - 중앙 근처에서 배회
            hero.wanderTimer += deltaTime;

            if (hero.wanderTimer > 2000) {
                hero.wanderTimer = 0;
                hero.moveAngle += (Math.random() - 0.5) * 1;

                // 타겟 위치 설정 (동적 반경 사용)
                const centerRadius = RuntimeState.dynamicCenterRadius || CONFIG.CANVAS_CENTER_RADIUS;
                const wanderRadius = centerRadius * 0.3;
                hero.targetX = RuntimeState.centerX + Math.cos(hero.moveAngle) * wanderRadius;
                hero.targetY = RuntimeState.centerY + Math.sin(hero.moveAngle) * wanderRadius;
            }

            // 타겟으로 이동
            const dx = hero.targetX - hero.x;
            const dy = hero.targetY - hero.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                hero.x += (dx / dist) * hero.stats.moveSpeed * dt * 0.5;
                hero.y += (dy / dist) * hero.stats.moveSpeed * dt * 0.5;
            }
        }

        // 캔버스 경계 제한
        const margin = 30;
        hero.x = Math.max(margin, Math.min(RuntimeState.canvasWidth - margin, hero.x));
        hero.y = Math.max(margin, Math.min(RuntimeState.canvasHeight - margin, hero.y));
    });
}

/**
 * 히어로 공격
 */
function heroAttack(deltaTime) {
    const now = performance.now();

    RuntimeState.heroInstances.forEach(hero => {
        if (!hero.currentTarget) return;

        const target = hero.currentTarget;
        const dx = target.x - hero.x;
        const dy = target.y - hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 사정거리 체크
        if (dist > hero.stats.range + target.size) return;

        // 공격 쿨다운 체크
        const attackInterval = 1000 / hero.stats.atkSpeed;
        if (now - hero.lastAttackTime < attackInterval) return;

        hero.lastAttackTime = now;

        // 크리티컬 체크
        const isCrit = Math.random() < hero.stats.critChance;
        let damage = hero.stats.attack;
        if (isCrit) {
            damage *= hero.stats.critDamage;
        }

        // 원거리 공격은 투사체 생성
        if (hero.stats.attackType === 'ranged') {
            createProjectile(hero, target, damage, isCrit);
        } else {
            // 근접 공격은 즉시 데미지
            dealDamage(target, damage, isCrit, hero);
        }

        // DPS 기록
        RuntimeState.damageDealt += damage;
    });
}

/**
 * 투사체 생성
 */
function createProjectile(hero, target, damage, isCrit) {
    const dx = target.x - hero.x;
    const dy = target.y - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    RuntimeState.projectiles.push({
        x: hero.x,
        y: hero.y,
        targetId: target.id,
        vx: (dx / dist) * 300,
        vy: (dy / dist) * 300,
        damage: damage,
        isCrit: isCrit,
        heroClassId: hero.classId,
        color: hero.class.color,
        size: 6,
    });
}

/**
 * 투사체 업데이트
 */
function updateProjectiles(deltaTime) {
    const dt = deltaTime / 1000;

    RuntimeState.projectiles = RuntimeState.projectiles.filter(proj => {
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // 타겟 찾기
        const target = RuntimeState.enemies.find(e => e.id === proj.targetId);

        if (target) {
            const dx = target.x - proj.x;
            const dy = target.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 충돌 체크
            if (dist < target.size) {
                dealDamage(target, proj.damage, proj.isCrit);
                return false;
            }
        }

        // 화면 밖으로 나가면 제거
        if (proj.x < -50 || proj.x > RuntimeState.canvasWidth + 50 ||
            proj.y < -50 || proj.y > RuntimeState.canvasHeight + 50) {
            return false;
        }

        return true;
    });
}

/**
 * 데미지 처리
 */
function dealDamage(enemy, damage, isCrit, hero) {
    enemy.hp -= damage;

    // 데미지 숫자 표시
    RuntimeState.damageNumbers.push({
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y - enemy.size,
        damage: Math.floor(damage),
        isCrit: isCrit,
        alpha: 1,
        vy: -50,
    });

    // 적 처치
    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

/**
 * 적 처치
 */
function killEnemy(enemy) {
    const index = RuntimeState.enemies.indexOf(enemy);
    if (index === -1) return;

    // 보상 지급
    const goldReward = Math.floor(
        CONFIG.GOLD_PER_ENEMY *
        Math.pow(CONFIG.GOLD_SCALING, GameState.currentStage) *
        getGoldBonus() *
        (enemy.isBoss ? 10 : 1)
    );

    GameState.gold += goldReward;
    GameState.totalGoldEarned += goldReward;

    // 젬 드랍
    if (enemy.isBoss) {
        GameState.gems += CONFIG.BOSS_GEM_REWARD;
        showFloatingText(enemy.x, enemy.y - 30, `+${CONFIG.BOSS_GEM_REWARD}💎`, '#e94560');
    } else if (Math.random() < CONFIG.GEM_DROP_CHANCE) {
        GameState.gems += 1;
        showFloatingText(enemy.x, enemy.y - 30, '+1💎', '#e94560');
    }

    // 통계
    GameState.totalKills++;
    if (enemy.isBoss) {
        GameState.totalBossKills++;
        RuntimeState.bossActive = false;
    }

    // 퀘스트 진행도 업데이트
    updateQuestProgress('kills', 1);
    if (enemy.isBoss) {
        updateQuestProgress('bossKills', 1);
    }

    // 몬스터 도감 등록
    discoverEnemy(enemy.type, enemy.isBoss);

    // 상자 드랍 (보스는 무조건, 일반 적은 낮은 확률)
    const droppedBox = getBossDropBox(enemy.isBoss);
    if (droppedBox) {
        const boxType = LOOT_BOX_TYPES.find(b => b.id === droppedBox);
        if (boxType) {
            showFloatingText(enemy.x, enemy.y - 50, `${boxType.emoji}`, boxType.color);
        }
    }

    // 도전 모드 처리
    if (RuntimeState.challengeMode) {
        if (RuntimeState.challengeData) {
            if (RuntimeState.challengeMode === 'infiniteTower') {
                RuntimeState.challengeData.enemiesKilled++;
            } else if (RuntimeState.challengeMode === 'timeAttack') {
                RuntimeState.challengeData.kills++;
            }
        }
    }

    // 파티클 효과
    spawnDeathParticles(enemy.x, enemy.y, enemy.isBoss);

    // 제거
    RuntimeState.enemies.splice(index, 1);
    RuntimeState.waveEnemiesKilled++;

    // 플로팅 텍스트
    showFloatingText(enemy.x, enemy.y, `+${goldReward}💰`, '#ffd700');

    updateUI();
}

/**
 * 적 이동 (중앙으로)
 */
function updateEnemies(deltaTime) {
    const dt = deltaTime / 1000;

    RuntimeState.enemies.forEach(enemy => {
        // 중앙으로 이동
        const dx = RuntimeState.centerX - enemy.x;
        const dy = RuntimeState.centerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        }
    });
}

/**
 * 파티클 효과
 */
function spawnDeathParticles(x, y, isBoss) {
    const count = isBoss ? 20 : 8;
    const baseSize = isBoss ? 8 : 4;

    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 50 + Math.random() * 100;

        RuntimeState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: baseSize + Math.random() * 3,
            color: isBoss ? '#ffd700' : '#4ecdc4',
            alpha: 1,
            life: 500,
        });
    }
}

/**
 * 파티클 업데이트
 */
function updateParticles(deltaTime) {
    const dt = deltaTime / 1000;

    RuntimeState.particles = RuntimeState.particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt;  // 중력
        p.life -= deltaTime;
        p.alpha = p.life / 500;
        return p.life > 0;
    });

    // 데미지 숫자 업데이트
    RuntimeState.damageNumbers = RuntimeState.damageNumbers.filter(d => {
        d.y += d.vy * dt;
        d.alpha -= dt * 2;
        return d.alpha > 0;
    });

    // 플로팅 텍스트 업데이트
    RuntimeState.floatingTexts = RuntimeState.floatingTexts.filter(t => {
        t.y -= 30 * dt;
        t.alpha -= dt;
        return t.alpha > 0;
    });
}

/**
 * 플로팅 텍스트 표시
 */
function showFloatingText(x, y, text, color) {
    RuntimeState.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        alpha: 1,
    });
}

/**
 * DPS 계산
 */
function updateDPS(deltaTime) {
    RuntimeState.dpsUpdateTimer += deltaTime;

    if (RuntimeState.dpsUpdateTimer >= 1000) {
        RuntimeState.currentDPS = RuntimeState.damageDealt;
        RuntimeState.damageDealt = 0;
        RuntimeState.dpsUpdateTimer = 0;
    }
}
