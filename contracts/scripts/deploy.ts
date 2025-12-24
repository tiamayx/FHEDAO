import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FHEVoting...");
  
  const FHEVoting = await ethers.getContractFactory("FHEVoting");
  const voting = await FHEVoting.deploy();
  await voting.waitForDeployment();
  
  const address = await voting.getAddress();
  console.log("FHEVoting deployed to:", address);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

