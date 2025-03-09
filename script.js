// 게임 변수
let score = 0;
let timeLeft = 10;
let gameActive = false;
let timerInterval;

// DOM 요소
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const clickArea = document.getElementById('clickArea');
const startButton = document.getElementById('startGame');

// 텔레그램 웹앱 API 초기화
const tgWebApp = window.Telegram?.WebApp;
if (tgWebApp) {
    tgWebApp.expand(); // 웹앱 화면 확장
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
    
    alert(`게임 종료! 최종 점수: ${score}`);
}

// 클릭 이벤트 처리
clickArea.addEventListener('click', () => {
    if (gameActive) {
        score++;
        scoreElement.textContent = score;
    }
});

// 게임 시작 버튼 이벤트
startButton.addEventListener('click', startGame);

console.log("게임 로드 완료!");