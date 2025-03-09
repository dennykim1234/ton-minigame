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
const connectButton = document.getElementById('connect-wallet-btn');
const disconnectButton = document.getElementById('disconnect-wallet-btn');
const walletConnectContainer = document.getElementById('wallet-connect-container');
const walletInfoContainer = document.getElementById('wallet-info-container');
const walletAddressElement = document.getElementById('wallet-address');
const tonBalanceElement = document.getElementById('ton-balance');

// 텔레그램 웹앱 API 초기화
const tgWebApp = window.Telegram?.WebApp;
if (tgWebApp) {
    // 텔레그램 앱 내에서 실행 중임
    tgWebApp.expand(); // 웹앱 화면 확장
    console.log("텔레그램 웹앱 환경에서 실행 중");
} else {
    console.log("일반 웹 브라우저에서 실행 중");
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

// 지갑 연결 상태 확인 (임시 함수)
function isWalletConnected() {
    // 실제로는 지갑 연결 상태를 확인하는 로직 필요
    return walletInfoContainer.style.display !== 'none';
}

// 임시 지갑 연결 함수 (실제 연동 전 테스트용)
function connectWallet() {
    walletConnectContainer.style.display = 'none';
    walletInfoContainer.style.display = 'block';
    walletAddressElement.textContent = 'EQ...ABCD'; // 실제 지갑 주소
    tonBalanceElement.textContent = '1.50';
    
    // 게임이 끝나고 점수가 충분하면 보상 버튼 활성화
    if (!gameActive && score > 20) {
        claimButton.disabled = false;
    }
}

// 지갑 연결 해제 함수
function disconnectWallet() {
    walletConnectContainer.style.display = 'block';
    walletInfoContainer.style.display = 'none';
    claimButton.disabled = true; // 지갑 연결 해제 시 보상 버튼 비활성화
}

// 보상 받기 함수 (임시)
function claimReward() {
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
connectButton.addEventListener('click', connectWallet);
disconnectButton.addEventListener('click', disconnectWallet);