import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.error("배포를 위한 계정(지갑)을 찾을 수 없습니다. .env의 PRIVATE_KEY를 확인하세요.");
    process.exit(1);
  }

  console.log("다음 계정으로 배포를 시작합니다:", deployer.address);

  // 컨트랙트 팩토리 가져오기
  const MessageVault = await ethers.getContractFactory("MessageVault");
  
  // 컨트랙트 배포
  const vault = await MessageVault.deploy();
  
  console.log("트랜잭션 대기 중...");
  await vault.waitForDeployment();

  const contractAddress = await vault.getAddress();
  console.log("🎉 MessageVault 컨트랙트 배포 성공! 주소:", contractAddress);
  console.log("이 주소를 백엔드 .env 파일의 CONTRACT_ADDRESS 에 넣어주세요.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
