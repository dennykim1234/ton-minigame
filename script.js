// 지갑 연동 기능 가져오기
import { initWalletConnection, isWalletConnected, getWalletInfo } from './wallet.js';

// 게임 변수
let score = 0;
let timeLeft = 30;
let gameActive = false;
let timerInterval;

// DOM 요소
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const clickArea = document.getElementById('clickArea');
const startButton = document.getElementById('startGame');
const claimButton = document.getElementById('claimReward');

// 텔레그램 웹앱 API 초기화
const tgWebApp = window.Telegram?.WebApp;
if (tgWebApp) {
    tgWebApp.expand(); // 웹앱 화면 확장
}

// 게임 시작 함수
function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;
    
    // UI 업데이트
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    startButton.disabled = true;
    claimButton.disabled = true;
    
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
    
    alert(`게임 종료! 최종 점수: ${score}`);
}

// 보상 받기 함수 (임시)
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
    
    // 실제로는 스마트 컨트랙트 호출이 필요합니다.
    // 지금은 임시로 성공 메시지만 표시합니다.
    alert(`축하합니다! ${(score * 0.01).toFixed(2)} TON이 지급될 예정입니다.`);
    claimButton.disabled = true;
}

// 이벤트 리스너
clickArea.addEventListener('click', () => {
    if (gameActive) {
        score++;
        scoreElement.textContent = score;
    }
});

startButton.addEventListener('click', startGame);
claimButton.addEventListener('click', claimReward);

// 페이지 로드 시 지갑 연결 초기화
document.addEventListener('DOMContentLoaded', () => {
    initWalletConnection();
});