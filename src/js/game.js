/**
 * Infinity Merge Tower v3.0 - Main Game Controller
 * 게임 메인 로직
 */

/**
 * 게임 초기화
 */
function init() {
    // 캔버스 설정
    RuntimeState.canvas = document.getElementById('battle-canvas');
    RuntimeState.ctx = RuntimeState.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 저장 데이터 로드
    loadGame();

    // 상태 초기화
    initGameState();

    // 리텐션 기능 초기화
    initRetentionFeatures();

    // UI 초기화
    renderHeroTabs();
    renderMergeGrid();
    updateUI();

    // 이벤트 리스너
    setupEventListeners();

    // 게임 루프 시작
    requestAnimationFrame(gameLoop);

    // 자동 저장
    startAutoSave();

    // 로딩 화면 숨기기
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1000);

    console.log('Infinity Merge Tower v3.0 initialized');
}

/**
 * 캔버스 크기 조정
 */
function resizeCanvas() {
    const battleArea = document.getElementById('battle-area');
    RuntimeState.canvas.width = battleArea.clientWidth;
    RuntimeState.canvas.height = battleArea.clientHeight;

    // 중심 좌표 업데이트
    RuntimeState.canvasWidth = RuntimeState.canvas.width;
    RuntimeState.canvasHeight = RuntimeState.canvas.height;
    RuntimeState.centerX = RuntimeState.canvasWidth / 2;
    RuntimeState.centerY = RuntimeState.canvasHeight / 2;

    // 화면 크기에 따라 동적 반경 계산
    const minDimension = Math.min(RuntimeState.canvasWidth, RuntimeState.canvasHeight);
    RuntimeState.dynamicCenterRadius = Math.max(40, minDimension * 0.25);  // 히어로 영역
    RuntimeState.dynamicSpawnRadius = Math.max(80, minDimension * 0.45);   // 적 스폰 거리

    // 히어로 위치 재조정
    if (RuntimeState.heroInstances.length > 0) {
        initHeroInstances();
    }
}

/**
 * 게임 루프
 */
function gameLoop(timestamp) {
    // 첫 프레임이거나 탭 복귀 시 deltaTime 제한
    let rawDeltaTime = timestamp - RuntimeState.lastTime;

    // 최대 100ms로 제한 (탭 비활성화 후 복귀 시 큰 값 방지)
    if (rawDeltaTime > 100 || RuntimeState.lastTime === 0) {
        rawDeltaTime = 16; // 약 60fps
    }

    RuntimeState.lastTime = timestamp;

    // 게임 속도 적용
    const deltaTime = rawDeltaTime * RuntimeState.gameSpeed;

    if (!RuntimeState.isPaused) {
        // 플레이 타임
        GameState.playTime += rawDeltaTime / 1000;

        // DPS 계산
        updateDPS(deltaTime);

        // 웨이브 업데이트
        updateWave(deltaTime);

        // 히어로 업데이트
        updateHeroes(deltaTime);

        // 히어로 공격
        heroAttack(deltaTime);

        // 투사체 업데이트
        updateProjectiles(deltaTime);

        // 적 이동
        updateEnemies(deltaTime);

        // 파티클 업데이트
        updateParticles(deltaTime);

        // 스킬 쿨다운 업데이트
        updateSkillCooldowns(deltaTime);

        // 도전 모드 업데이트
        if (RuntimeState.challengeMode) {
            updateChallenge(deltaTime);
        }

        // 스킬 버튼 UI 업데이트 (1초마다)
        if (Math.floor(timestamp / 500) !== Math.floor((timestamp - rawDeltaTime) / 500)) {
            renderSkillButtons();
        }

        // 자동 머지
        if (GameState.autoMergeEnabled) {
            RuntimeState.autoMergeTimer += deltaTime;
            if (RuntimeState.autoMergeTimer >= CONFIG.AUTO_MERGE_INTERVAL) {
                RuntimeState.autoMergeTimer = 0;
                performAutoMerge();
            }
        }

        // 업적 체크 (1초마다)
        if (Math.floor(timestamp / 1000) !== Math.floor((timestamp - rawDeltaTime) / 1000)) {
            const newAchievements = checkAchievements();
            newAchievements.forEach(achievement => {
                showToast(`🏆 업적 달성: ${achievement.name}`);
            });
        }

        // 렌더링
        render();
    }

    requestAnimationFrame(gameLoop);
}

/**
 * 자동 머지 수행
 */
function performAutoMerge() {
    const heroId = RuntimeState.selectedHeroClass;
    const heroState = GameState.heroes[heroId];
    if (!heroState || !heroState.unlocked) return;

    const grid = heroState.mergeGrid;

    for (let i = 0; i < grid.length; i++) {
        for (let j = i + 1; j < grid.length; j++) {
            const a = grid[i];
            const b = grid[j];

            if (a && b && a.typeId === b.typeId && a.level === b.level) {
                grid[j] = { typeId: a.typeId, level: a.level + 1 };
                grid[i] = null;
                GameState.totalMerges++;
                recalculateAllHeroStats();
                renderMergeGrid();
                return;
            }
        }
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 소환 버튼
    document.getElementById('summon-btn').addEventListener('click', summonItem);

    // 업그레이드 버튼
    document.getElementById('upgrade-btn').addEventListener('click', () => openModal('upgrade-modal'));

    // 상점 버튼
    document.getElementById('shop-btn').addEventListener('click', () => openModal('shop-modal'));

    // 업적 버튼
    document.getElementById('achievement-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('achievement-modal');
    });

    // 설정 버튼
    document.getElementById('settings-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('settings-modal');
    });

    // 새 기능 버튼들
    document.getElementById('daily-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('daily-modal');
        renderDailyReward();
    });
    document.getElementById('quest-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('quest-modal');
        renderQuests();
    });
    document.getElementById('lootbox-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('lootbox-modal');
        renderLootBoxes();
    });
    document.getElementById('challenge-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('challenge-modal');
        renderChallenges();
    });
    document.getElementById('codex-btn')?.addEventListener('click', () => {
        toggleSideMenu();
        openModal('codex-modal');
        renderCodex();
    });

    // 배속 버튼
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.dataset.speed);
            setGameSpeed(speed);
        });
    });

    // 자동 머지 버튼
    document.getElementById('auto-merge-btn')?.addEventListener('click', toggleAutoMerge);

    // 모달 외부 클릭 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 첫 상호작용 시 오디오 초기화
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    // 페이지 떠날 때 저장
    window.addEventListener('beforeunload', saveGame);

    // 탭 비활성화/활성화 처리
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveGame();
        } else {
            // 탭 복귀 시 lastTime 리셋 (큰 deltaTime 방지)
            RuntimeState.lastTime = 0;
        }
    });

    // 초기 배속 버튼 상태
    updateSpeedButtons();

    // 스와이프 제스처 (히어로 탭 전환)
    setupSwipeGestures();
}

/**
 * 게임 속도 변경
 */
function setGameSpeed(speed) {
    RuntimeState.gameSpeed = speed;
    updateSpeedButtons();
    showToast(`게임 속도: ${speed}x`);
}

/**
 * 배속 버튼 UI 업데이트
 */
function updateSpeedButtons() {
    document.querySelectorAll('.speed-btn').forEach(btn => {
        const speed = parseInt(btn.dataset.speed);
        btn.classList.toggle('active', speed === RuntimeState.gameSpeed);
    });
}

/**
 * 자동 머지 토글
 */
function toggleAutoMerge() {
    GameState.autoMergeEnabled = !GameState.autoMergeEnabled;
    const btn = document.getElementById('auto-merge-btn');
    btn.classList.toggle('active', GameState.autoMergeEnabled);
    showToast(GameState.autoMergeEnabled ? '자동 머지 ON' : '자동 머지 OFF');
}

/**
 * 자동 저장 시작
 */
function startAutoSave() {
    setInterval(() => {
        saveGame();
    }, 30000);  // 30초마다
}

/**
 * 설정 함수들
 */
function toggleSound() {
    GameState.soundEnabled = !GameState.soundEnabled;
    document.getElementById('sound-toggle-btn').textContent = GameState.soundEnabled ? 'ON' : 'OFF';
    showToast(GameState.soundEnabled ? '사운드 ON' : '사운드 OFF');
}

function manualSave() {
    saveGame();
    showToast('저장 완료!');
    playSound('reward');
}

function confirmReset() {
    if (confirm('정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!')) {
        if (confirm('마지막 확인입니다.\n모든 진행 상황이 삭제됩니다.')) {
            resetGameData();
            location.reload();
        }
    }
}

/**
 * 스와이프 제스처 설정
 */
function setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const heroSection = document.getElementById('hero-section');
    if (!heroSection) return;

    heroSection.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    heroSection.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // 수평 스와이프만 감지 (최소 50px 이동, 수직 이동은 30px 미만)
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
            const unlockedHeroes = getUnlockedHeroIds();
            const currentIndex = unlockedHeroes.indexOf(RuntimeState.selectedHeroClass);

            if (deltaX < 0) {
                // 왼쪽 스와이프 -> 다음 히어로
                const nextIndex = (currentIndex + 1) % unlockedHeroes.length;
                selectHeroTab(unlockedHeroes[nextIndex]);
                hapticFeedback('light');
            } else {
                // 오른쪽 스와이프 -> 이전 히어로
                const prevIndex = (currentIndex - 1 + unlockedHeroes.length) % unlockedHeroes.length;
                selectHeroTab(unlockedHeroes[prevIndex]);
                hapticFeedback('light');
            }
        }
    }

    // 배틀 영역에서 더블 탭 = 스킬 사용
    const battleArea = document.getElementById('battle-area');
    if (battleArea) {
        let lastTap = 0;
        battleArea.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                // 더블 탭 감지 -> 첫 번째 사용 가능한 스킬 발동
                const heroId = RuntimeState.selectedHeroClass;
                if (heroId && !RuntimeState.skillCooldowns[heroId]) {
                    useSkill(heroId);
                    hapticFeedback('medium');
                }
                e.preventDefault();
            }
            lastTap = currentTime;
        }, { passive: false });
    }
}

/**
 * 풀스크린 토글
 */
function toggleFullscreen() {
    const container = document.getElementById('game-container');

    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// 시작
window.addEventListener('load', init);
