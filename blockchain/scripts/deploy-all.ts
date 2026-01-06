import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying All Hospital Contracts...\n');
  console.log('='.repeat(60));

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error('❌ ERROR: No signer found!');
    console.error('');
    console.error('Kiểm tra BLOCKCHAIN_PRIVATE_KEY trong file .env:');
    console.error('- Private key phải có 64 hex characters (không tính 0x)');
    console.error('- Ví dụ: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.error('');
    console.error('Cách lấy private key từ MetaMask:');
    console.error('1. Click vào Account → ⋮ → Account details');
    console.error('2. Click "Show private key"');
    console.error('3. Nhập password MetaMask');
    console.error('4. Copy private key (bắt đầu bằng 0x, dài 66 ký tự)');
    process.exit(1);
  }

  const [deployer] = signers;
  console.log('Deploying with account:', deployer.address);
  console.log(
    'Account balance:',
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    'MATIC\n',
  );

  console.log('1️⃣ Deploying HospitalPaymentRegistry...');
  const PaymentRegistry = await ethers.getContractFactory(
    'HospitalPaymentRegistry',
  );
  const paymentRegistry = await PaymentRegistry.deploy();
  await paymentRegistry.waitForDeployment();
  const paymentAddress = await paymentRegistry.getAddress();
  console.log('   ✅ Deployed to:', paymentAddress);

  console.log('\n2️⃣ Deploying HospitalMedicalRecordRegistry...');
  const MedicalRecordRegistry = await ethers.getContractFactory(
    'HospitalMedicalRecordRegistry',
  );
  const medicalRecordRegistry = await MedicalRecordRegistry.deploy();
  await medicalRecordRegistry.waitForDeployment();
  const medicalRecordAddress = await medicalRecordRegistry.getAddress();
  console.log('   ✅ Deployed to:', medicalRecordAddress);

  console.log('\n' + '='.repeat(60));
  console.log('📋 Add these to your .env file:');
  console.log('='.repeat(60));
  console.log(`PAYMENT_REGISTRY_CONTRACT=${paymentAddress}`);
  console.log(`MEDICAL_RECORD_REGISTRY_CONTRACT=${medicalRecordAddress}`);

  console.log('\n📊 Deployment Summary:');
  console.log('-'.repeat(60));
  console.log('| Contract                       | Address');
  console.log('-'.repeat(60));
  console.log(`| HospitalPaymentRegistry        | ${paymentAddress}`);
  console.log(`| HospitalMedicalRecordRegistry  | ${medicalRecordAddress}`);
  console.log('-'.repeat(60));
  console.log('| Deployer:', deployer.address);
  console.log('| Network:', (await ethers.provider.getNetwork()).name);
  console.log('-'.repeat(60));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

