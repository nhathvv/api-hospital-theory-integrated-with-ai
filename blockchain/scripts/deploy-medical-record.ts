import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying HospitalMedicalRecordRegistry...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log(
    'Account balance:',
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    'MATIC\n',
  );

  const MedicalRecordRegistry = await ethers.getContractFactory(
    'HospitalMedicalRecordRegistry',
  );
  const medicalRecordRegistry = await MedicalRecordRegistry.deploy();
  await medicalRecordRegistry.waitForDeployment();

  const address = await medicalRecordRegistry.getAddress();
  console.log('✅ HospitalMedicalRecordRegistry deployed to:', address);
  console.log('\n📋 Add this to your .env file:');
  console.log(`MEDICAL_RECORD_REGISTRY_CONTRACT=${address}`);

  console.log('\n📊 Deployment Summary:');
  console.log('------------------------');
  console.log('Contract:', 'HospitalMedicalRecordRegistry');
  console.log('Address:', address);
  console.log('Deployer:', deployer.address);
  console.log('Network:', (await ethers.provider.getNetwork()).name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

