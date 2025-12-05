/**
 * Infinity Merge Tower - Audio System
 * 게임 사운드를 관리합니다.
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let isMuted = false;

/**
 * 오디오 컨텍스트 초기화
 */
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

/**
 * 음소거 토글
 */
function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

/**
 * 음소거 상태 확인
 */
function getMuteState() {
    return isMuted;
}

/**
 * 사운드 재생
 * @param {string} type - 사운드 타입
 */
function playSound(type) {
    if (!audioCtx || isMuted) return;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        switch(type) {
            case 'summon':
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);
                break;

            case 'merge':
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;

            case 'wave':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.2);
                oscillator.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.5);
                break;

            case 'purchase':
            case 'upgrade':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;

            case 'move':
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;

            case 'reward':
                oscillator.type = 'sine';
                const rewardNotes = [523, 659, 784, 1047];
                rewardNotes.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                });
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.5);
                break;

            case 'bossAppear':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.8);
                break;

            case 'bossVictory':
                oscillator.type = 'sine';
                const victoryNotes = [523, 659, 784, 1047, 1319];
                victoryNotes.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
                });
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 1);
                break;

            case 'bossDefeat':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.6);
                break;

            case 'achievement':
                oscillator.type = 'sine';
                const achievementNotes = [784, 988, 1175, 1568];
                achievementNotes.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
                });
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.6);
                break;

            case 'skill':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;

            case 'towerClear':
                oscillator.type = 'sine';
                const towerNotes = [523, 659, 784, 988, 1175];
                towerNotes.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                });
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.7);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.7);
                break;

            case 'error':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);
                break;

            case 'click':
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.05);
                break;

            case 'collection':
                oscillator.type = 'sine';
                const collectNotes = [659, 784, 988];
                collectNotes.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
                });
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;
        }
    } catch (error) {
        console.error('Audio playback failed:', error);
    }
}

/**
 * 배경 음악 재생 (루프)
 */
function playBackgroundMusic() {
    if (!audioCtx || isMuted) return;

    // 간단한 앰비언트 사운드 생성
    const createAmbient = () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(110, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();

        // 10초마다 음 변화
        setInterval(() => {
            if (!isMuted) {
                const notes = [110, 130.81, 146.83, 164.81];
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                oscillator.frequency.exponentialRampToValueAtTime(randomNote, audioCtx.currentTime + 2);
            }
        }, 10000);

        return { oscillator, gainNode };
    };

    return createAmbient();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAudio,
        toggleMute,
        getMuteState,
        playSound,
        playBackgroundMusic
    };
}
