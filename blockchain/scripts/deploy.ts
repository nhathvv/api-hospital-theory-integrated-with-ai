import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying HospitalPaymentRegistry...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  const PaymentRegistry = await ethers.getContractFactory('HospitalPaymentRegistry');
  const paymentRegistry = await PaymentRegistry.deploy();
  await paymentRegistry.waitForDeployment();

  const address = await paymentRegistry.getAddress();
  console.log('✅ HospitalPaymentRegistry deployed to:', address);
  console.log('\n📋 Add this to your .env file:');
  console.log(`PAYMENT_REGISTRY_CONTRACT=${address}`);

  console.log('\n📊 Deployment Summary:');
  console.log('------------------------');
  console.log('Contract:', 'HospitalPaymentRegistry');
  console.log('Address:', address);
  console.log('Deployer:', deployer.address);
  console.log('Network:', (await ethers.provider.getNetwork()).name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

