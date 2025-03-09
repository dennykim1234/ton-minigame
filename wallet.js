import { TonConnect } from '@tonconnect/sdk';

// TonConnect 인스턴스 생성
const tonConnect = new TonConnect({
    manifestUrl: 'https://yourgame.com/tonconnect-manifest.json' // 실제 배포 시 변경
});

// 지갑 상태 변수
let walletConnectionStatus = {
    connected: false,
    wallet: null,
    account: null
};

// 지갑 연결 상태 변경 감지 함수
export function initWalletConnection() {
    // UI 요소
    const connectButton = document.getElementById('connect-wallet-btn');
    const disconnectButton = document.getElementById('disconnect-wallet-btn');
    const walletConnectContainer = document.getElementById('wallet-connect-container');
    const walletInfoContainer = document.getElementById('wallet-info-container');
    const walletAddressElement = document.getElementById('wallet-address');
    const tonBalanceElement = document.getElementById('ton-balance');
    const claimButton = document.getElementById('claimReward');
    
    // 연결 상태 감지
    tonConnect.onStatusChange((wallet) => {
        if (wallet) {
            // 지갑 연결됨
            walletConnectionStatus = {
                connected: true,
                wallet: wallet,
                account: wallet.account
            };
            
            // UI 업데이트
            walletConnectContainer.style.display = 'none';
            walletInfoContainer.style.display = 'block';
            
            // 지갑 주소 표시 (축약형)
            const address = wallet.account.address;
            const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
            walletAddressElement.textContent = shortAddress;
            
            // TON 잔액 표시 (나노TON을 TON으로 변환)
            const balanceInTon = parseInt(wallet.account.balance) / 1000000000;
            tonBalanceElement.textContent = balanceInTon.toFixed(2);
            
            // 게임이 끝나고 점수가 충분하면 보상 버튼 활성화
            const score = parseInt(document.getElementById('score').textContent);
            const gameActive = startButton.disabled;
            if (!gameActive && score > 20) {
                claimButton.disabled = false;
            }
        } else {
            // 지갑 연결 해제됨
            walletConnectionStatus = {
                connected: false,
                wallet: null,
                account: null
            };
            
            // UI 업데이트
            walletConnectContainer.style.display = 'block';
            walletInfoContainer.style.display = 'none';
            claimButton.disabled = true;
        }
    });
    
    // 연결 버튼 클릭 이벤트
    connectButton.addEventListener('click', async () => {
        try {
            // 가능한 지갑 목록 가져오기
            const wallets = await tonConnect.getWallets();
            showWalletSelection(wallets);
        } catch (error) {
            console.error('지갑 목록 가져오기 오류:', error);
            alert('지갑 목록을 가져오는데 실패했습니다.');
        }
    });
    
    // 연결 해제 버튼 클릭 이벤트
    disconnectButton.addEventListener('click', () => {
        tonConnect.disconnect();
    });
    
    // 저장된 연결 복원 시도
    tonConnect.restoreConnection();
}

// 지갑 선택 UI 표시
function showWalletSelection(wallets) {
    // 이미 있는 선택 창 제거
    const existingModal = document.querySelector('.wallet-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // 모달 컨테이너 생성
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // 모달 내용 생성
    const modalContent = document.createElement('div');
    modalContent.className = 'wallet-modal-content';
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        width: 300px;
        max-width: 80%;
    `;
    
    // 제목 추가
    const title = document.createElement('h3');
    title.textContent = '지갑 선택';
    title.style.marginTop = '0';
    modalContent.appendChild(title);
    
    // 닫기 버튼 추가
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    modalContent.appendChild(closeButton);
    
    // 지갑 목록 컨테이너
    const walletList = document.createElement('div');
    walletList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 15px;
    `;
    
    // 텔레그램 지갑을 우선 표시
    const sortedWallets = [...wallets].sort((a, b) => {
        if (a.name.toLowerCase().includes('telegram')) return -1;
        if (b.name.toLowerCase().includes('telegram')) return 1;
        return 0;
    });
    
    // 각 지갑 옵션 추가
    sortedWallets.forEach(wallet => {
        const walletButton = document.createElement('button');
        walletButton.className = 'wallet-option';
        walletButton.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: none;
            cursor: pointer;
            text-align: left;
        `;
        
        // 지갑 아이콘
        const walletIcon = document.createElement('img');
        walletIcon.src = wallet.imageUrl;
        walletIcon.alt = wallet.name;
        walletIcon.style.cssText = `
            width: 32px;
            height: 32px;
            margin-right: 10px;
        `;
        
        // 지갑 이름
        const walletName = document.createElement('span');
        walletName.textContent = wallet.name;
        
        walletButton.appendChild(walletIcon);
        walletButton.appendChild(walletName);
        
        walletButton.addEventListener('click', () => {
            connectToWallet(wallet);
            document.body.removeChild(modal);
        });
        
        walletList.appendChild(walletButton);
    });
    
    modalContent.appendChild(walletList);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// 선택한 지갑에 연결
function connectToWallet(wallet) {
    const universalLink = tonConnect.connect({
        universalLink: wallet.universalLink,
        bridgeUrl: wallet.bridgeUrl
    });
    
    // 모바일 환경이면 지갑 앱으로 리디렉션
    if (isMobile() && universalLink) {
        window.location.href = universalLink;
    }
}

// 모바일 기기 확인
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 지갑 연결 상태 반환 함수 (다른 스크립트에서 사용)
export function isWalletConnected() {
    return walletConnectionStatus.connected;
}

// 현재 연결된 지갑 정보 반환
export function getWalletInfo() {
    return walletConnectionStatus;
}