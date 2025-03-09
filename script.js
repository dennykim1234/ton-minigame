// 지갑 연동 기능 가져오기
import { initWalletConnection, isWalletConnected, getWalletInfo } from './wallet.js';

// 게임 변수
let score = 0;
let timeLeft = 10;
let gameActive = false;
let timerInterval;
let playerName = "플레이어"; // 플레이어 이름 기본값

// DOM 요소
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const clickArea = document.getElementById('clickArea');
const startButton = document.getElementById('startGame');
const claimButton = document.getElementById('claimReward');
const submitScoreButton = document.getElementById('submitScore');
const leaderboardButton = document.getElementById('showLeaderboard');
const virtualBalanceElement = document.getElementById('virtual-ton-balance');

// 텔레그램 웹앱 API 초기화
const tgWebApp = window.Telegram?.WebApp;
if (tgWebApp) {
    tgWebApp.expand(); // 웹앱 화면 확장
    // 텔레그램 사용자 이름 가져오기
    if (tgWebApp.initDataUnsafe?.user) {
        playerName = tgWebApp.initDataUnsafe.user.username || "텔레그램 사용자";
    }
}

// 게임 초기화
function initGame() {
    // 가상 TON 잔액 로드
    loadVirtualBalance();
    
    // 리더보드 버튼 이벤트 리스너
    if (leaderboardButton) {
        leaderboardButton.addEventListener('click', showLeaderboard);
    }
    
    // 점수 제출 버튼 이벤트 리스너
    if (submitScoreButton) {
        submitScoreButton.addEventListener('click', submitScore);
    }
}

// 가상 TON 잔액 로드
function loadVirtualBalance() {
    const virtualTonBalance = localStorage.getItem('virtualTonBalance') || '0';
    if (virtualBalanceElement) {
        virtualBalanceElement.textContent = parseFloat(virtualTonBalance).toFixed(2);
    }
}

// 게임 시작 함수
function startGame() {
    score = 0;
    timeLeft = 10;
    gameActive = true;
    
    // UI 업데이트
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    startButton.disabled = true;
    claimButton.disabled = true;
    if (submitScoreButton) submitScoreButton.disabled = true;
    
    // 타이머 시작
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// 게임 종료 함수
function endGame() {
    clearInterval(timerInterval);
    gameActive = false;
    startButton.disabled = false;
    
    // 최소 점수 이상이면 보상 버튼 활성화 (지갑 연결 필요)
    if (score > 20 && isWalletConnected()) {
        claimButton.disabled = false;
    }
    
    // 점수 제출 버튼 활성화
    if (submitScoreButton) submitScoreButton.disabled = false;
    
    alert(`게임 종료! 최종 점수: ${score}`);
}

// 1. 가상 보상 시스템 - 보상 받기 함수
function claimReward() {
    // 지갑 연결 상태 확인
    if (!isWalletConnected()) {
        alert('보상을 받으려면 지갑을 연결해야 합니다.');
        return;
    }
    
    // 점수 확인
    if (score < 20) {
        alert('보상을 받으려면 최소 20점이 필요합니다.');
        return;
    }
    
    // 가상 보상 지급
    const rewardAmount = (score * 0.01).toFixed(2);
    let virtualTonBalance = parseFloat(localStorage.getItem('virtualTonBalance') || '0');
    virtualTonBalance += parseFloat(rewardAmount);
    localStorage.setItem('virtualTonBalance', virtualTonBalance);
    
    // UI 업데이트
    if (virtualBalanceElement) {
        virtualBalanceElement.textContent = virtualTonBalance.toFixed(2);
    }
    
    // 실제 서버에도 보상 신청
    requestRealReward();
    
    alert(`축하합니다! ${rewardAmount} 가상 TON이 지급되었습니다.`);
    claimButton.disabled = true;
}

// 2. 백엔드 서버 사용 - 실제 보상 신청
async function requestRealReward() {
    try {
        // 지갑 정보 확인
        if (!isWalletConnected()) return;
        const walletInfo = getWalletInfo();
        
        // 서버에 점수 전송
        const response = await fetch('https://yourgameserver.com/api/claim-reward', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: walletInfo.wallet?.account?.address || '',
                score: score,
                gameId: 'ton-click-game',
                playerName: playerName
            })
        }).catch(err => {
            console.log('서버 연결 오류 (개발 중에는 무시됨):', err);
            // 개발 중에는 에러를 무시하고 넘어감
            return { ok: true, json: () => Promise.resolve({ success: true }) };
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                console.log('서버에 보상 신청 완료. 24시간 이내에 지급됩니다.');
            }
        }
    } catch (error) {
        console.error('보상 신청 오류:', error);
        // 개발 중에는 오류를 무시하고 가상 보상만 제공
    }
}

// 3. 리더보드 시스템 - 점수 제출
async function submitScore() {
    if (!isWalletConnected()) {
        alert('점수를 등록하려면 TON 지갑을 연결해주세요.');
        return;
    }
    
    try {
        // 지갑 정보 확인
        const walletInfo = getWalletInfo();
        
        // 플레이어 이름 요청
        const inputName = prompt('리더보드에 표시할 이름을 입력하세요:', playerName);
        if (inputName === null) return; // 취소 시 중단
        playerName = inputName || playerName; // 빈 값이면 기존 이름 유지
        
        // 서버에 점수 전송
        const response = await fetch('https://yourgameserver.com/api/leaderboard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress: walletInfo.wallet?.account?.address || '',
                playerName: playerName,
                score: score
            })
        }).catch(err => {
            console.log('서버 연결 오류 (개발 중에는 무시됨):', err);
            // 개발 중에는 에러를 무시하고 넘어감
            return { ok: true, json: () => Promise.resolve({ success: true, rank: 1 }) };
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                alert(`점수가 리더보드에 등록되었습니다! 현재 순위: ${data.rank || '집계 중'}`);
                // 리더보드 표시
                showLeaderboard();
            } else {
                alert(`오류: ${data.message || '알 수 없는 오류'}`);
            }
        }
    } catch (error) {
        console.error('점수 제출 오류:', error);
        // 개발 중에는 임시 리더보드 표시
        showOfflineLeaderboard();
    }
}

// 리더보드 표시
async function showLeaderboard() {
    try {
        // 리더보드 모달 요소 가져오기
        const leaderboardModal = document.getElementById('leaderboard-modal');
        const leaderboardBody = document.getElementById('leaderboard-body');
        
        // 테이블 내용 비우기
        leaderboardBody.innerHTML = '';
        
        // 로컬 스토리지에서 리더보드 데이터 가져오기
        let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        
        // 데이터가 없으면 새 데이터 만들기
        if (leaderboard.length === 0) {
            // 임시 데이터
            leaderboard = [
                { playerName: '최고의 플레이어', score: 120 },
                { playerName: '톤마스터', score: 95 },
                { playerName: '게임왕', score: 75 },
                { playerName: '클릭의신', score: 60 }
            ];
            
            // 현재 플레이어 점수도 추가
            if (score > 0) {
                leaderboard.push({ playerName: playerName, score: score });
            }
            
            // 점수 순으로 정렬
            leaderboard.sort((a, b) => b.score - a.score);
            
            // 로컬 스토리지에 저장
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        }
        
        // 리더보드 데이터를 테이블에 추가
        leaderboard.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // 현재 플레이어 강조 표시
            if (item.playerName === playerName && item.score === score) {
                row.classList.add('highlight-row');
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.playerName}</td>
                <td>${item.score}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
        
        // 모달 표시
        leaderboardModal.style.display = 'block';
        
    } catch (error) {
        console.error('리더보드 로딩 오류:', error);
        alert('리더보드를 불러오는 중 오류가 발생했습니다.');
    }
}

// 점수 제출 함수
function submitScore() {
    if (!isWalletConnected()) {
        alert('점수를 등록하려면 TON 지갑을 연결해주세요.');
        return;
    }
    
    // 플레이어 이름 입력 받기
    const inputName = prompt('리더보드에 표시할 이름을 입력하세요:', playerName);
    if (inputName === null) return; // 취소 시 중단
    
    playerName = inputName || playerName; // 빈 값이면 기존 이름 유지
    
    // 기존 리더보드 데이터 가져오기
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    
    // 새 점수 추가
    leaderboard.push({
        playerName: playerName,
        score: score,
        date: new Date().toISOString()
    });
    
    // 점수 순으로 정렬
    leaderboard.sort((a, b) => b.score - a.score);
    
    // 최대 100개 유지
    if (leaderboard.length > 100) {
        leaderboard = leaderboard.slice(0, 100);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    
    alert(`${playerName}님의 점수 ${score}점이 리더보드에 등록되었습니다!`);
    submitScoreButton.disabled = true;
    
    // 리더보드 표시
    showLeaderboard();
}

// 리더보드 닫기 함수
function closeLeaderboard() {
    const leaderboardModal = document.getElementById('leaderboard-modal');
    leaderboardModal.style.display = 'none';
}

// DOM이 로드된 후 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
    initWalletConnection();
    initGame();
    
    // 리더보드 닫기 버튼에 이벤트 리스너 추가
    const closeLeaderboardButton = document.getElementById('close-leaderboard');
    if (closeLeaderboardButton) {
        closeLeaderboardButton.addEventListener('click', closeLeaderboard);
    }
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        const leaderboardModal = document.getElementById('leaderboard-modal');
        if (event.target === leaderboardModal) {
            closeLeaderboard();
        }
    });
});

startButton.addEventListener('click', startGame);
claimButton.addEventListener('click', claimReward);

// 페이지 로드 시 지갑 연결 초기화 및 게임 초기화
document.addEventListener('DOMContentLoaded', () => {
    initWalletConnection();
    initGame();
});