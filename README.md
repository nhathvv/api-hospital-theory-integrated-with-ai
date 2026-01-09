# 🏥 Hospital Management System - Backend API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white" alt="Polygon" />
</p>

<p align="center">
  <b>Hệ thống quản lý bệnh viện tích hợp AI & Blockchain</b>
  <br />
  <i>Hospital Management System integrated with AI & Blockchain</i>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Blockchain Integration](#-blockchain-integration)
- [AI Integration](#-ai-integration)
- [WebSocket Events](#-websocket-events)
- [Deployment](#-deployment)

---

## 🌟 Overview

A comprehensive hospital management system that revolutionizes healthcare administration by combining modern web technologies with AI-powered doctor recommendations and blockchain-based data verification.

### Key Highlights

- 🤖 **AI-Powered Doctor Recommendations** - Analyzes patient symptoms using Google Gemini AI
- ⛓️ **Blockchain Verification** - Ensures data integrity for payments and medical records
- 💬 **Real-time Communication** - WebSocket-based chat and payment notifications
- 🔐 **Secure Authentication** - JWT-based auth with refresh token rotation
- 📱 **Multi-platform Ready** - RESTful API supporting web and mobile clients

---

## ✨ Features

### 👤 User Management
- Multi-role authentication (Admin, Doctor, Patient)
- JWT access & refresh token mechanism
- Profile management with avatar upload

### 👨‍⚕️ Doctor Management
- Doctor profiles with specialties, education, certifications, awards
- Flexible schedule management with time slots
- Department & specialty organization

### 🏥 Patient Management
- Patient health profiles (blood type, allergies, chronic diseases)
- Health insurance information
- Emergency contact details

### 📅 Appointment System
- Multi-step booking workflow
- Status tracking (Pending → Confirmed → In Progress → Completed)
- Cancellation with reason tracking
- Examination types: In-person & Online

### 💊 Prescription & Medicine
- Medicine inventory with batch management
- Prescription creation during consultation
- Automatic stock deduction
- Low stock & expiry alerts

### 💳 Payment System
- Multiple payment methods (Cash, Bank Transfer)
- QR Code payment with SePay integration
- Real-time payment confirmation via WebSocket
- Blockchain transaction recording

### 🔗 Blockchain Integration
- Payment verification on Polygon network
- Medical record integrity verification
- Smart contracts with Access Control

### 🤖 AI Integration
- Symptom analysis with Google Gemini
- Doctor recommendation based on:
  - Specialty matching (40%)
  - Experience & qualifications (25%)
  - Sub-specialty relevance (20%)
  - Years of experience (15%)
- Urgency level detection
- Follow-up questions for better accuracy

### 💬 Support System
- Real-time chat between patients and admin
- Conversation management with priority levels
- Message read status tracking

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | NestJS 11 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | JWT, Passport |
| **Real-time** | Socket.IO |
| **Blockchain** | Solidity, Hardhat, Ethers.js |
| **AI** | Google Gemini API |
| **File Upload** | Multer |
| **Validation** | class-validator, class-transformer |
| **Documentation** | Swagger/OpenAPI |
| **Containerization** | Docker, Docker Compose |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                    (Web App / Mobile App)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    (NestJS Application)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Auth     │  │   Doctor    │  │   Patient   │              │
│  │   Module    │  │   Module    │  │   Module    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Appointment │  │ Prescription│  │   Payment   │              │
│  │   Module    │  │   Module    │  │   Module    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    AI       │  │ Blockchain  │  │Conversation │              │
│  │   Module    │  │   Module    │  │   Module    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │   Polygon     │  │  Google AI    │
│   Database    │  │  Blockchain   │  │    Gemini     │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd api-hospital-theory-integrated-with-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Run database migrations**
```bash
npx prisma migrate dev
```

5. **Seed the database (optional)**
```bash
npx prisma db seed
```

6. **Start the development server**
```bash
npm run start:dev
```

### Using Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Application
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hospital_db"

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Blockchain
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=amoy
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
PAYMENT_CONTRACT_ADDRESS=0x...
MEDICAL_RECORD_CONTRACT_ADDRESS=0x...

# AI
GEMINI_API_KEY=your-gemini-api-key

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# SePay (Payment Gateway)
SEPAY_WEBHOOK_SECRET=your-webhook-secret
```

---

## 📊 Database Schema

### Core Entities

```
User (users)
├── Doctor (doctors)
│   ├── DoctorEducation
│   ├── DoctorCertification
│   ├── DoctorAward
│   └── DoctorSchedule
│       └── DoctorTimeSlot
└── Patient (patients)
    └── Conversation
        └── Message

Department (departments)
└── Specialty (specialties)
    └── Doctor

Appointment (appointments)
├── AppointmentDocument
├── PrescriptionItem
│   └── MedicineBatch
└── Payment
    └── BlockchainTransaction

MedicineCategory
└── Medicine
    └── MedicineBatch
```

### Key Enums

| Enum | Values |
|------|--------|
| `UserRole` | ADMIN, DOCTOR, PATIENT |
| `AppointmentStatus` | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| `PaymentStatus` | PENDING, SUCCESS, FAILED |
| `PaymentMethod` | CASH, BANK_TRANSFER |
| `ExaminationType` | IN_PERSON, ONLINE |
| `BatchStatus` | IN_STOCK, LOW_STOCK, OUT_OF_STOCK, EXPIRED, DISPOSED |

---

## 📚 API Documentation

API documentation is available via Swagger UI at:

```
http://localhost:3001/api/docs
```

### Main Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | `POST /auth/register` | User registration |
| | `POST /auth/login` | User login |
| | `POST /auth/refresh` | Refresh access token |
| **Doctor** | `GET /doctors` | List doctors |
| | `GET /doctors/:id` | Get doctor details |
| | `POST /doctors` | Create doctor (Admin) |
| **Patient** | `GET /patients` | List patients |
| | `GET /patients/me` | Get current patient profile |
| **Appointment** | `POST /appointments` | Create appointment |
| | `PATCH /appointments/:id/status` | Update status |
| | `POST /appointments/:id/prescription` | Add prescription |
| **Payment** | `POST /payments` | Create payment |
| | `GET /payments/:id/verify` | Verify on blockchain |
| **AI** | `POST /ai-recommendation/recommend` | Get doctor recommendations |
| | `POST /ai-recommendation/chat` | Chat with AI |

---

## ⛓ Blockchain Integration

### Smart Contracts

#### HospitalPaymentRegistry
Records and verifies payment transactions on the blockchain.

```solidity
function recordPayment(
    bytes32 _paymentId,
    bytes32 _appointmentId,
    bytes32 _dataHash,
    uint256 _amount,
    address _patient
) external;

function verifyPayment(
    bytes32 _paymentId,
    bytes32 _dataHash
) external view returns (bool isValid, PaymentStatus status, uint256 amount, uint256 timestamp);
```

#### HospitalMedicalRecordRegistry
Records and verifies medical documents/records.

### Deploying Contracts

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to Polygon Amoy testnet
npx hardhat run scripts/deploy-all.ts --network amoy
```

### Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Polygon Amoy (Testnet) | 80002 | https://rpc-amoy.polygon.technology |
| Polygon Mainnet | 137 | https://polygon-rpc.com |

---

## 🤖 AI Integration

### How It Works

1. **Patient describes symptoms** → System sends to Gemini AI
2. **AI analyzes symptoms** → May ask follow-up questions
3. **AI determines**:
   - Possible conditions
   - Recommended specialties
   - Urgency level (LOW, MODERATE, HIGH, EMERGENCY)
4. **System matches doctors** → Returns ranked recommendations

### AI Ranking Algorithm

| Factor | Weight |
|--------|--------|
| Specialty match | 40% |
| Professional qualifications | 25% |
| Sub-specialty relevance | 20% |
| Years of experience | 15% |

### Example Request

```json
POST /ai-recommendation/recommend
{
  "symptoms": "Tôi bị đau đầu kéo dài 3 ngày, kèm chóng mặt",
  "patientInfo": {
    "age": 35,
    "gender": "MALE"
  }
}
```

---

## 🔌 WebSocket Events

### Connection

```typescript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Payment Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `payment:success` | Server → Client | Payment confirmed |

### Chat Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_conversation` | Client → Server | Join a conversation room |
| `leave_conversation` | Client → Server | Leave a conversation room |
| `send_message` | Client → Server | Send a message |
| `new_message` | Server → Client | New message received |
| `typing` | Bidirectional | User is typing |
| `mark_read` | Client → Server | Mark messages as read |

---

## 🐳 Deployment

### Docker Production Build

```bash
# Build image
docker build -t hospital-api:latest .

# Run container
docker run -d \
  --name hospital-api \
  -p 3001:3001 \
  --env-file .env.production \
  hospital-api:latest
```

### Docker Compose (Full Stack)

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📁 Project Structure

```
src/
├── admin/              # Admin module
├── ai-recommendation/  # AI integration module
│   ├── gemini/        # Gemini AI service
│   └── prompts/       # AI system prompts
├── appointment/        # Appointment management
├── auth/              # Authentication & authorization
├── blockchain/        # Blockchain integration
├── common/            # Shared utilities, guards, decorators
├── configs/           # Configuration files
├── conversation/      # Chat/Support system
├── department/        # Department management
├── doctor/            # Doctor management
├── doctor-schedule/   # Doctor scheduling
├── medicine/          # Medicine management
├── medicine-batch/    # Inventory management
├── medicine-category/ # Medicine categories
├── patient/           # Patient management
├── payment/           # Payment processing
├── prescription/      # Prescription management
├── prisma/            # Prisma client
├── specialty/         # Medical specialties
├── upload/            # File upload handling
└── user/              # User management

blockchain/
├── contracts/         # Solidity smart contracts
├── scripts/           # Deployment scripts
├── test/              # Contract tests
└── typechain-types/   # Generated TypeScript types

prisma/
├── migrations/        # Database migrations
└── schema.prisma      # Database schema
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Hoang Van Nhat**

---

<p align="center">
  Made with ❤️ using NestJS, Blockchain & AI
</p>
