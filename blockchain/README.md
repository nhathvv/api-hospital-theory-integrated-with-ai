# Hospital Payment Blockchain

Smart contracts cho hệ thống thanh toán bệnh viện trên Polygon blockchain.

## 📋 Mục lục

- [Cài đặt](#cài-đặt)
- [Commands](#commands)
- [Testing](#testing)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Smart Contract](#smart-contract)
- [Gas Report](#gas-report)

## 🔧 Cài đặt

```bash
cd blockchain
npm install
```

## 📦 Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Chạy test suite |
| `npm run test:coverage` | Chạy test với coverage report |
| `npm run node` | Khởi chạy local Hardhat node |
| `npm run deploy:local` | Deploy lên local node |
| `npm run deploy:amoy` | Deploy lên Polygon Amoy testnet |
| `npm run deploy:polygon` | Deploy lên Polygon mainnet |
| `npm run clean` | Xóa artifacts và cache |

## 🧪 Testing

### Chạy Tests

```bash
# Chạy tất cả tests
npm run test

# Chạy với verbose output
npx hardhat test --verbose

# Chạy test coverage
npm run test:coverage
```

### Test Suites

| Suite | Tests | Description |
|-------|-------|-------------|
| **Deployment** | 3 | Kiểm tra khởi tạo contract |
| **recordPayment** | 8 | Ghi nhận thanh toán |
| **verifyPayment** | 3 | Xác minh thanh toán |
| **updatePaymentStatus** | 3 | Cập nhật trạng thái |
| **refundPayment** | 3 | Hoàn tiền |
| **Role Management** | 3 | Quản lý quyền |
| **Payment History** | 1 | Lịch sử thanh toán |

**Total: 24 test cases**

### Test Coverage

```
├── Deployment
│   ├── ✔ Should set the deployer as admin
│   ├── ✔ Should set the deployer as recorder
│   └── ✔ Should have zero initial statistics
│
├── recordPayment
│   ├── ✔ Should record a new payment successfully
│   ├── ✔ Should update statistics after recording
│   ├── ✔ Should add payment to patient payments list
│   ├── ✔ Should link payment to appointment
│   ├── ✔ Should reject duplicate payment
│   ├── ✔ Should reject zero amount
│   ├── ✔ Should reject empty data hash
│   └── ✔ Should reject unauthorized caller
│
├── verifyPayment
│   ├── ✔ Should verify valid payment with correct hash
│   ├── ✔ Should reject verification with incorrect hash
│   └── ✔ Should reject verification for non-existent payment
│
├── updatePaymentStatus
│   ├── ✔ Should update payment status by admin
│   ├── ✔ Should reject same status update
│   └── ✔ Should reject unauthorized status update
│
├── refundPayment
│   ├── ✔ Should refund successful payment
│   ├── ✔ Should reject refund for already refunded payment
│   └── ✔ Should reject unauthorized refund
│
├── Role Management
│   ├── ✔ Should grant recorder role
│   ├── ✔ Should revoke recorder role
│   └── ✔ Should reject non-admin role management
│
└── Payment History
    └── ✔ Should track payment hash in history
```

## 🖥️ Local Development

### Khởi chạy Hardhat Node

```bash
npm run node
```

Node sẽ chạy tại:
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: 31337
- **Network**: localhost

### Test Accounts

Hardhat cung cấp 20 accounts với 10,000 ETH mỗi account:

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

> ⚠️ **Warning**: Private keys này là PUBLIC - chỉ dùng cho development. KHÔNG gửi ETH thật vào các địa chỉ này!

### Deploy to Local Node

```bash
# Terminal 1: Khởi chạy node
npm run node

# Terminal 2: Deploy contract
npm run deploy:local
```

## 🚀 Deployment

### Deploy to Polygon Amoy Testnet

1. Tạo file `.env`:

```env
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your_private_key
```

2. Lấy test MATIC từ faucet: https://faucet.polygon.technology/

3. Deploy:

```bash
npm run deploy:amoy
```

### Deploy to Polygon Mainnet

```bash
npm run deploy:polygon
```

## 📄 Smart Contract

### HospitalPaymentRegistry

Contract chính để quản lý thanh toán trên blockchain.

#### Payment Status

| Status | Value | Description |
|--------|-------|-------------|
| PENDING | 0 | Đang chờ xử lý |
| SUCCESS | 1 | Thanh toán thành công |
| FAILED | 2 | Thanh toán thất bại |
| REFUNDED | 3 | Đã hoàn tiền |
| VERIFIED | 4 | Đã xác minh |

#### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `recordPayment()` | RECORDER_ROLE | Ghi nhận thanh toán mới |
| `verifyPayment()` | Public (view) | Xác minh thanh toán |
| `updatePaymentStatus()` | ADMIN_ROLE | Cập nhật trạng thái |
| `refundPayment()` | ADMIN_ROLE | Hoàn tiền |
| `getPayment()` | Public (view) | Lấy thông tin thanh toán |
| `getPatientPayments()` | Public (view) | Lấy danh sách payment của bệnh nhân |
| `getPaymentByAppointment()` | Public (view) | Lấy payment theo appointment |
| `getPaymentHistory()` | Public (view) | Lấy lịch sử payment |
| `getStatistics()` | Public (view) | Thống kê tổng quan |
| `grantRecorderRole()` | ADMIN_ROLE | Cấp quyền recorder |
| `revokeRecorderRole()` | ADMIN_ROLE | Thu hồi quyền recorder |

#### Roles

| Role | Description |
|------|-------------|
| `DEFAULT_ADMIN_ROLE` | Quản trị viên mặc định |
| `ADMIN_ROLE` | Quản trị viên |
| `RECORDER_ROLE` | Quyền ghi nhận thanh toán |

#### Events

| Event | Description |
|-------|-------------|
| `PaymentRecorded` | Khi thanh toán được ghi nhận |
| `PaymentVerified` | Khi thanh toán được xác minh |
| `PaymentStatusUpdated` | Khi trạng thái thay đổi |
| `PaymentRefunded` | Khi hoàn tiền |

## ⛽ Gas Report

| Method | Min Gas | Max Gas | Avg Gas |
|--------|---------|---------|---------|
| `recordPayment` | 275,782 | 275,806 | 275,799 |
| `grantRecorderRole` | - | - | 53,478 |
| `refundPayment` | 37,753 | 37,897 | 37,849 |
| `updatePaymentStatus` | - | - | 32,198 |
| `revokeRecorderRole` | - | - | 31,481 |

**Contract Deployment**: ~1,234,990 gas (~4.1% block limit)

### Estimated Costs (Polygon)

| Operation | Gas | Cost (MATIC @ 30 gwei) |
|-----------|-----|------------------------|
| Deploy Contract | ~1,234,990 | ~0.037 |
| Record Payment | ~275,799 | ~0.008 |
| Update Status | ~32,198 | ~0.001 |
| Refund Payment | ~37,849 | ~0.001 |
| Grant Role | ~53,478 | ~0.002 |

## 📁 Project Structure

```
blockchain/
├── contracts/
│   └── HospitalPaymentRegistry.sol    # Main smart contract
├── scripts/
│   └── deploy.ts                       # Deployment script
├── test/
│   └── HospitalPaymentRegistry.test.ts # Test suite
├── artifacts/                          # Compiled contracts
├── cache/                              # Hardhat cache
├── typechain-types/                    # TypeScript types
├── hardhat.config.ts                   # Hardhat configuration
├── package.json
└── README.md
```

## 🔗 Integration with Backend

Backend NestJS tích hợp với blockchain qua module `src/blockchain/`:

```typescript
// Ghi nhận thanh toán lên blockchain
await blockchainService.recordPayment(paymentId, appointmentId, dataHash, amount, patientAddress);

// Xác minh thanh toán
const result = await blockchainService.verifyPayment(paymentId, dataHash);
```

## 📚 References

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Polygon Documentation](https://docs.polygon.technology/)
