import { expect } from 'chai';
import { ethers } from 'hardhat';
import { HospitalPaymentRegistry } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('HospitalPaymentRegistry', function () {
  let paymentRegistry: HospitalPaymentRegistry;
  let owner: SignerWithAddress;
  let recorder: SignerWithAddress;
  let patient: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const RECORDER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('RECORDER_ROLE'));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));

  beforeEach(async function () {
    [owner, recorder, patient, unauthorized] = await ethers.getSigners();

    const PaymentRegistryFactory = await ethers.getContractFactory('HospitalPaymentRegistry');
    paymentRegistry = await PaymentRegistryFactory.deploy();
    await paymentRegistry.waitForDeployment();

    await paymentRegistry.grantRecorderRole(recorder.address);
  });

  describe('Deployment', function () {
    it('Should set the deployer as admin', async function () {
      expect(await paymentRegistry.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it('Should set the deployer as recorder', async function () {
      expect(await paymentRegistry.hasRole(RECORDER_ROLE, owner.address)).to.be.true;
    });

    it('Should have zero initial statistics', async function () {
      const [totalPayments, totalAmount] = await paymentRegistry.getStatistics();
      expect(totalPayments).to.equal(0);
      expect(totalAmount).to.equal(0);
    });
  });

  describe('recordPayment', function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes('PAY-2024-001'));
    const appointmentId = ethers.keccak256(ethers.toUtf8Bytes('APT-2024-001'));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('payment-data-hash'));
    const amount = 500000;

    it('Should record a new payment successfully', async function () {
      await expect(
        paymentRegistry
          .connect(recorder)
          .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address)
      )
        .to.emit(paymentRegistry, 'PaymentRecorded')
        .withArgs(
          paymentId,
          appointmentId,
          dataHash,
          amount,
          await getBlockTimestamp(),
          recorder.address
        );

      const payment = await paymentRegistry.getPayment(paymentId);
      expect(payment.dataHash).to.equal(dataHash);
      expect(payment.amount).to.equal(amount);
      expect(payment.recorder).to.equal(recorder.address);
      expect(payment.status).to.equal(1); // SUCCESS
    });

    it('Should update statistics after recording', async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);

      const [totalPayments, totalAmount] = await paymentRegistry.getStatistics();
      expect(totalPayments).to.equal(1);
      expect(totalAmount).to.equal(amount);
    });

    it('Should add payment to patient payments list', async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);

      const patientPaymentsList = await paymentRegistry.getPatientPayments(patient.address);
      expect(patientPaymentsList).to.include(paymentId);
    });

    it('Should link payment to appointment', async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);

      const linkedPayment = await paymentRegistry.getPaymentByAppointment(appointmentId);
      expect(linkedPayment).to.equal(paymentId);
    });

    it('Should reject duplicate payment', async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);

      await expect(
        paymentRegistry
          .connect(recorder)
          .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address)
      ).to.be.revertedWith('Payment already exists');
    });

    it('Should reject zero amount', async function () {
      await expect(
        paymentRegistry
          .connect(recorder)
          .recordPayment(paymentId, appointmentId, dataHash, 0, patient.address)
      ).to.be.revertedWith('Amount must be greater than 0');
    });

    it('Should reject empty data hash', async function () {
      await expect(
        paymentRegistry
          .connect(recorder)
          .recordPayment(paymentId, appointmentId, ethers.ZeroHash, amount, patient.address)
      ).to.be.revertedWith('Invalid data hash');
    });

    it('Should reject unauthorized caller', async function () {
      await expect(
        paymentRegistry
          .connect(unauthorized)
          .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address)
      ).to.be.reverted;
    });
  });

  describe('verifyPayment', function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes('PAY-2024-002'));
    const appointmentId = ethers.keccak256(ethers.toUtf8Bytes('APT-2024-002'));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('payment-data-hash-2'));
    const amount = 750000;

    beforeEach(async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);
    });

    it('Should verify valid payment with correct hash', async function () {
      const result = await paymentRegistry.verifyPayment(paymentId, dataHash);
      expect(result.isValid).to.be.true;
      expect(result.status).to.equal(1); // SUCCESS
      expect(result.amount).to.equal(amount);
    });

    it('Should reject verification with incorrect hash', async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes('wrong-hash'));
      const result = await paymentRegistry.verifyPayment(paymentId, wrongHash);
      expect(result.isValid).to.be.false;
    });

    it('Should reject verification for non-existent payment', async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes('NON-EXISTENT'));
      await expect(paymentRegistry.verifyPayment(nonExistentId, dataHash)).to.be.revertedWith(
        'Payment does not exist'
      );
    });
  });

  describe('updatePaymentStatus', function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes('PAY-2024-003'));
    const appointmentId = ethers.keccak256(ethers.toUtf8Bytes('APT-2024-003'));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('payment-data-hash-3'));
    const amount = 1000000;

    beforeEach(async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);
    });

    it('Should update payment status by admin', async function () {
      await expect(paymentRegistry.connect(owner).updatePaymentStatus(paymentId, 4)) // VERIFIED
        .to.emit(paymentRegistry, 'PaymentStatusUpdated')
        .withArgs(paymentId, 1, 4, await getBlockTimestamp()); // SUCCESS -> VERIFIED

      const payment = await paymentRegistry.getPayment(paymentId);
      expect(payment.status).to.equal(4); // VERIFIED
    });

    it('Should reject same status update', async function () {
      await expect(
        paymentRegistry.connect(owner).updatePaymentStatus(paymentId, 1) // Already SUCCESS
      ).to.be.revertedWith('Status unchanged');
    });

    it('Should reject unauthorized status update', async function () {
      await expect(
        paymentRegistry.connect(unauthorized).updatePaymentStatus(paymentId, 4)
      ).to.be.reverted;
    });
  });

  describe('refundPayment', function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes('PAY-2024-004'));
    const appointmentId = ethers.keccak256(ethers.toUtf8Bytes('APT-2024-004'));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('payment-data-hash-4'));
    const amount = 2000000;

    beforeEach(async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);
    });

    it('Should refund successful payment', async function () {
      const reason = 'Patient requested refund';
      await expect(paymentRegistry.connect(owner).refundPayment(paymentId, reason))
        .to.emit(paymentRegistry, 'PaymentRefunded')
        .withArgs(paymentId, amount, await getBlockTimestamp(), reason);

      const payment = await paymentRegistry.getPayment(paymentId);
      expect(payment.status).to.equal(3); // REFUNDED
    });

    it('Should reject refund for already refunded payment', async function () {
      await paymentRegistry.connect(owner).refundPayment(paymentId, 'First refund');

      await expect(
        paymentRegistry.connect(owner).refundPayment(paymentId, 'Second refund')
      ).to.be.revertedWith('Can only refund successful payments');
    });

    it('Should reject unauthorized refund', async function () {
      await expect(
        paymentRegistry.connect(unauthorized).refundPayment(paymentId, 'Unauthorized')
      ).to.be.reverted;
    });
  });

  describe('Role Management', function () {
    it('Should grant recorder role', async function () {
      const newRecorder = unauthorized;
      await paymentRegistry.connect(owner).grantRecorderRole(newRecorder.address);
      expect(await paymentRegistry.hasRole(RECORDER_ROLE, newRecorder.address)).to.be.true;
    });

    it('Should revoke recorder role', async function () {
      await paymentRegistry.connect(owner).revokeRecorderRole(recorder.address);
      expect(await paymentRegistry.hasRole(RECORDER_ROLE, recorder.address)).to.be.false;
    });

    it('Should reject non-admin role management', async function () {
      await expect(
        paymentRegistry.connect(unauthorized).grantRecorderRole(patient.address)
      ).to.be.reverted;
    });
  });

  describe('Payment History', function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes('PAY-2024-005'));
    const appointmentId = ethers.keccak256(ethers.toUtf8Bytes('APT-2024-005'));
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes('payment-data-hash-5'));
    const amount = 500000;

    it('Should track payment hash in history', async function () {
      await paymentRegistry
        .connect(recorder)
        .recordPayment(paymentId, appointmentId, dataHash, amount, patient.address);

      const history = await paymentRegistry.getPaymentHistory(paymentId);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(dataHash);
    });
  });

  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    return block ? block.timestamp + 1 : Math.floor(Date.now() / 1000);
  }
});

