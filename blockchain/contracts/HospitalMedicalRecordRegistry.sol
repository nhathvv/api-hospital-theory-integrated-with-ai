// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HospitalMedicalRecordRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    enum RecordType {
        LAB_RESULT,
        X_RAY,
        MRI,
        CT_SCAN,
        ULTRASOUND,
        PRESCRIPTION,
        MEDICAL_REPORT,
        OTHER
    }

    struct MedicalRecord {
        bytes32 dataHash;
        bytes32 appointmentId;
        address uploader;
        RecordType recordType;
        uint256 timestamp;
        bool exists;
        bool isRevoked;
    }

    mapping(bytes32 => MedicalRecord) public records;
    mapping(bytes32 => bytes32[]) public appointmentRecords;
    mapping(address => bytes32[]) public uploaderRecords;

    uint256 public totalRecords;

    event RecordCreated(
        bytes32 indexed recordId,
        bytes32 indexed appointmentId,
        bytes32 dataHash,
        RecordType recordType,
        uint256 timestamp,
        address uploader
    );

    event RecordVerified(
        bytes32 indexed recordId,
        bytes32 dataHash,
        bool isValid,
        uint256 timestamp,
        address verifier
    );

    event RecordRevoked(
        bytes32 indexed recordId,
        uint256 timestamp,
        address revoker,
        string reason
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    modifier recordExists(bytes32 _recordId) {
        require(records[_recordId].exists, "Record does not exist");
        _;
    }

    modifier recordNotExists(bytes32 _recordId) {
        require(!records[_recordId].exists, "Record already exists");
        _;
    }

    modifier recordNotRevoked(bytes32 _recordId) {
        require(!records[_recordId].isRevoked, "Record has been revoked");
        _;
    }

    function createRecord(
        bytes32 _recordId,
        bytes32 _appointmentId,
        bytes32 _dataHash,
        RecordType _recordType
    ) external onlyRole(RECORDER_ROLE) recordNotExists(_recordId) nonReentrant {
        require(_dataHash != bytes32(0), "Invalid data hash");

        records[_recordId] = MedicalRecord({
            dataHash: _dataHash,
            appointmentId: _appointmentId,
            uploader: msg.sender,
            recordType: _recordType,
            timestamp: block.timestamp,
            exists: true,
            isRevoked: false
        });

        appointmentRecords[_appointmentId].push(_recordId);
        uploaderRecords[msg.sender].push(_recordId);
        totalRecords++;

        emit RecordCreated(
            _recordId,
            _appointmentId,
            _dataHash,
            _recordType,
            block.timestamp,
            msg.sender
        );
    }

    function verifyRecord(
        bytes32 _recordId,
        bytes32 _dataHash
    )
        external
        view
        recordExists(_recordId)
        returns (
            bool isValid,
            bool isRevoked,
            RecordType recordType,
            uint256 timestamp
        )
    {
        MedicalRecord memory r = records[_recordId];
        isValid = (r.dataHash == _dataHash && !r.isRevoked);
        isRevoked = r.isRevoked;
        recordType = r.recordType;
        timestamp = r.timestamp;
    }

    function revokeRecord(
        bytes32 _recordId,
        string calldata _reason
    ) external onlyRole(ADMIN_ROLE) recordExists(_recordId) recordNotRevoked(_recordId) {
        records[_recordId].isRevoked = true;

        emit RecordRevoked(_recordId, block.timestamp, msg.sender, _reason);
    }

    function getRecord(
        bytes32 _recordId
    )
        external
        view
        returns (
            bytes32 dataHash,
            bytes32 appointmentId,
            address uploader,
            RecordType recordType,
            uint256 timestamp,
            bool isRevoked
        )
    {
        MedicalRecord memory r = records[_recordId];
        return (
            r.dataHash,
            r.appointmentId,
            r.uploader,
            r.recordType,
            r.timestamp,
            r.isRevoked
        );
    }

    function getAppointmentRecords(bytes32 _appointmentId) external view returns (bytes32[] memory) {
        return appointmentRecords[_appointmentId];
    }

    function getUploaderRecords(address _uploader) external view returns (bytes32[] memory) {
        return uploaderRecords[_uploader];
    }

    function getStatistics() external view returns (uint256) {
        return totalRecords;
    }

    function grantRecorderRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RECORDER_ROLE, account);
    }

    function revokeRecorderRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(RECORDER_ROLE, account);
    }
}

