// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HospitalPaymentRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    enum PaymentStatus {
        PENDING,
        SUCCESS,
        FAILED,
        REFUNDED,
        VERIFIED
    }

    struct Payment {
        bytes32 dataHash;
        uint256 amount;
        uint256 timestamp;
        address recorder;
        PaymentStatus status;
        bool exists;
    }

    mapping(bytes32 => Payment) public payments;
    mapping(address => bytes32[]) public patientPayments;
    mapping(bytes32 => bytes32) public appointmentPayments;
    mapping(bytes32 => bytes32[]) public paymentHistory;

    uint256 public totalPaymentsRecorded;
    uint256 public totalAmountRecorded;

    event PaymentRecorded(
        bytes32 indexed paymentId,
        bytes32 indexed appointmentId,
        bytes32 dataHash,
        uint256 amount,
        uint256 timestamp,
        address recorder
    );

    event PaymentVerified(
        bytes32 indexed paymentId,
        bytes32 dataHash,
        uint256 timestamp,
        address verifier
    );

    event PaymentStatusUpdated(
        bytes32 indexed paymentId,
        PaymentStatus oldStatus,
        PaymentStatus newStatus,
        uint256 timestamp
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        uint256 refundAmount,
        uint256 timestamp,
        string reason
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    modifier paymentExists(bytes32 _paymentId) {
        require(payments[_paymentId].exists, "Payment does not exist");
        _;
    }

    modifier paymentNotExists(bytes32 _paymentId) {
        require(!payments[_paymentId].exists, "Payment already exists");
        _;
    }

    function recordPayment(
        bytes32 _paymentId,
        bytes32 _appointmentId,
        bytes32 _dataHash,
        uint256 _amount,
        address _patient
    ) external onlyRole(RECORDER_ROLE) paymentNotExists(_paymentId) nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_dataHash != bytes32(0), "Invalid data hash");

        payments[_paymentId] = Payment({
            dataHash: _dataHash,
            amount: _amount,
            timestamp: block.timestamp,
            recorder: msg.sender,
            status: PaymentStatus.SUCCESS,
            exists: true
        });

        patientPayments[_patient].push(_paymentId);
        appointmentPayments[_appointmentId] = _paymentId;
        paymentHistory[_paymentId].push(_dataHash);

        totalPaymentsRecorded++;
        totalAmountRecorded += _amount;

        emit PaymentRecorded(
            _paymentId,
            _appointmentId,
            _dataHash,
            _amount,
            block.timestamp,
            msg.sender
        );
    }

    function verifyPayment(
        bytes32 _paymentId,
        bytes32 _dataHash
    )
        external
        view
        paymentExists(_paymentId)
        returns (bool isValid, PaymentStatus status, uint256 amount, uint256 timestamp)
    {
        Payment memory p = payments[_paymentId];
        isValid = (p.dataHash == _dataHash);
        status = p.status;
        amount = p.amount;
        timestamp = p.timestamp;
    }

    function updatePaymentStatus(
        bytes32 _paymentId,
        PaymentStatus _newStatus
    ) external onlyRole(ADMIN_ROLE) paymentExists(_paymentId) {
        Payment storage p = payments[_paymentId];
        PaymentStatus oldStatus = p.status;

        require(oldStatus != _newStatus, "Status unchanged");

        p.status = _newStatus;

        emit PaymentStatusUpdated(_paymentId, oldStatus, _newStatus, block.timestamp);
    }

    function refundPayment(
        bytes32 _paymentId,
        string calldata _reason
    ) external onlyRole(ADMIN_ROLE) paymentExists(_paymentId) nonReentrant {
        Payment storage p = payments[_paymentId];
        require(p.status == PaymentStatus.SUCCESS, "Can only refund successful payments");

        uint256 refundAmount = p.amount;
        p.status = PaymentStatus.REFUNDED;

        emit PaymentRefunded(_paymentId, refundAmount, block.timestamp, _reason);
    }

    function getPayment(
        bytes32 _paymentId
    )
        external
        view
        returns (
            bytes32 dataHash,
            uint256 amount,
            uint256 timestamp,
            address recorder,
            PaymentStatus status
        )
    {
        Payment memory p = payments[_paymentId];
        return (p.dataHash, p.amount, p.timestamp, p.recorder, p.status);
    }

    function getPatientPayments(address _patient) external view returns (bytes32[] memory) {
        return patientPayments[_patient];
    }

    function getPaymentByAppointment(bytes32 _appointmentId) external view returns (bytes32) {
        return appointmentPayments[_appointmentId];
    }

    function getPaymentHistory(bytes32 _paymentId) external view returns (bytes32[] memory) {
        return paymentHistory[_paymentId];
    }

    function getStatistics() external view returns (uint256 totalPayments, uint256 totalAmount) {
        return (totalPaymentsRecorded, totalAmountRecorded);
    }

    function grantRecorderRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RECORDER_ROLE, account);
    }

    function revokeRecorderRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(RECORDER_ROLE, account);
    }
}

