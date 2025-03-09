const { TonClient, signerKeys } = require('@tonclient/core');
const { libNode } = require('@tonclient/lib-node');
const fs = require('fs');

// TON 라이브러리 초기화
TonClient.useBinaryLibrary(libNode);
const client = new TonClient({
  network: {
    endpoints: ['https://net.ton.dev']  // 테스트넷 URL
  }
});

async function deployContract() {
  try {
    // 컴파일된 컨트랙트 코드 로드
    const contractCode = fs.readFileSync('./build/game.cell', 'base64');
    
    // 배포 키 생성
    const keys = await client.crypto.generate_random_sign_keys();
    
    // 초기 데이터 설정
    const initialData = {
      owner_address: "0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",  // 여러분의 TON 지갑 주소로 변경
      min_score: 20,
      reward_amount: 10000000  // 0.01 TON
    };
    
    // 배포 파라미터 설정
    const deployParams = {
      abi: {
        type: 'Contract',
        value: require('../build/game.abi.json')
      },
      deploy_set: {
        tvc: contractCode,
        initial_data: initialData
      },
      call_set: {
        function_name: 'constructor',
        input: {}
      },
      signer: {
        type: 'Keys',
        keys: keys
      }
    };
    
    // 배포 메시지 인코딩
    const encoded_message = await client.abi.encode_message(deployParams);
    
    // 계산된 컨트랙트 주소 표시
    console.log(`컨트랙트 주소: ${encoded_message.address}`);
    
    // TON을 전송하여 계정 활성화 (실제 배포 전에 필요)
    console.log("컨트랙트 주소로 최소 0.5 TON을 전송한 후 배포를 계속하세요.");
    
    // 배포 트랜잭션 처리
    const result = await client.processing.process_message({
      message_encode_params: deployParams,
      send_events: true
    });
    
    console.log("배포 완료!");
    console.log(result);
    
  } catch (error) {
    console.error("배포 오류:", error);
  } finally {
    client.close();
  }
}

deployContract();