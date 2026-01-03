# Hospital Payment Blockchain

Smart contracts cho hệ thống thanh toán bệnh viện trên Polygon blockchain.

## Cài đặt

```bash
cd blockchain
npm install
```

## Compile Smart Contracts

```bash
npm run compile
```

## Chạy Tests

```bash
npm run test
```

## Chạy Local Node

```bash
npm run node
```

## Deploy

### Deploy to Local

```bash
npm run deploy:local
```

### Deploy to Mumbai Testnet

1. Thêm config vào `.env`:

```env
POLYGON_TESTNET_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY
BLOCKCHAIN_PRIVATE_KEY=your_private_key
```

2. Lấy test MATIC từ faucet: https://faucet.polygon.technology/

3. Deploy:

```bash
npm run deploy:mumbai
```

### Deploy to Polygon Mainnet

```bash
npm run deploy:polygon
```

## Smart Contract

### HospitalPaymentRegistry

Contract chính để quản lý thanh toán:

**Chức năng:**
- `recordPayment()` - Ghi nhận thanh toán mới
- `verifyPayment()` - Xác minh thanh toán
- `updatePaymentStatus()` - Cập nhật trạng thái
- `refundPayment()` - Hoàn tiền
- `getPayment()` - Lấy thông tin thanh toán
- `getStatistics()` - Thống kê

**Roles:**
- `ADMIN_ROLE` - Quản trị viên
- `RECORDER_ROLE` - Ghi nhận thanh toán

## Chi phí Gas ước tính

| Operation | Gas | Cost (MATIC) |
|-----------|-----|--------------|
| Record Payment | ~80,000 | ~0.002 |
| Verify Payment | 0 (view) | 0 |
| Update Status | ~30,000 | ~0.0006 |
| Refund | ~40,000 | ~0.001 |

