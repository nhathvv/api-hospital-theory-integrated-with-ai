# Redis Queue (BullMQ) - Hospital API

## Tổng quan

Dự án sử dụng **BullMQ** với Redis để xử lý các tác vụ bất đồng bộ, đảm bảo:
- **Reliability**: Tác vụ không bị mất khi server crash
- **Scalability**: Có thể scale worker độc lập
- **Retry mechanism**: Tự động retry khi thất bại
- **Delayed jobs**: Lên lịch tác vụ trong tương lai

---

## Cấu hình hiện tại

```typescript
// app.module.ts
BullModule.forRoot({
  connection: {
    host: envService.getRedisHost(),
    port: envService.getRedisPort(),
    username: envService.getRedisUsername(),
    password: envService.getRedisPassword(),
  },
})

// appointment.module.ts
BullModule.registerQueue({
  name: 'appointment',
})
```

---

## Các tính năng nên sử dụng Redis Queue

### 1. Appointment Notifications (Ưu tiên cao)

#### Use Cases
| Job Name | Trigger | Description |
|----------|---------|-------------|
| `send-appointment-confirmation` | Sau khi tạo appointment | Gửi SMS/Email xác nhận cho bệnh nhân |
| `send-appointment-reminder-24h` | Delayed job (24h trước) | Nhắc nhở lịch khám trước 24 giờ |
| `send-appointment-reminder-1h` | Delayed job (1h trước) | Nhắc nhở lịch khám trước 1 giờ |
| `send-appointment-cancellation` | Sau khi hủy appointment | Thông báo hủy cho bệnh nhân/bác sĩ |
| `notify-doctor-new-appointment` | Sau khi tạo appointment | Thông báo cho bác sĩ có lịch hẹn mới |

#### Flow Example
```
Patient đặt lịch → AppointmentService.create()
                        ↓
              Add job 'send-appointment-confirmation' (immediate)
              Add job 'send-appointment-reminder-24h' (delayed: appointmentDate - 24h)
              Add job 'send-appointment-reminder-1h' (delayed: appointmentDate - 1h)
                        ↓
              NotificationWorker processes jobs
                        ↓
              Send SMS/Email via external service
```

#### Implementation Structure
```
src/
├── queues/
│   ├── queues.module.ts
│   ├── constants/
│   │   └── queue-names.constant.ts
│   ├── appointment/
│   │   ├── appointment.producer.ts      # Add jobs to queue
│   │   ├── appointment.processor.ts     # Process jobs (Worker)
│   │   └── appointment.types.ts         # Job data interfaces
│   └── notification/
│       ├── notification.producer.ts
│       ├── notification.processor.ts
│       └── notification.types.ts
```

---

### 2. Payment Processing (Ưu tiên cao)

#### Use Cases
| Job Name | Trigger | Description |
|----------|---------|-------------|
| `process-payment-webhook` | Webhook từ SePay | Xử lý và validate payment |
| `send-payment-receipt` | Sau payment success | Gửi hóa đơn qua email |
| `confirm-appointment-after-payment` | Sau payment success | Cập nhật appointment PENDING → CONFIRMED |
| `handle-payment-timeout` | Delayed job (30 phút) | Auto-cancel nếu không thanh toán |

#### Benefits
- **Idempotent processing**: Tránh xử lý trùng lặp webhook
- **Retry on failure**: Tự động retry khi gọi external service thất bại
- **Audit trail**: Lưu lại lịch sử xử lý trong Redis

#### Flow Example
```
SePay gửi webhook → PaymentController.receiver()
                        ↓
              Add job 'process-payment-webhook' với jobId = transactionId
                        ↓
              PaymentWorker processes (idempotent by jobId)
                        ↓
              Update Payment status → Add job 'send-payment-receipt'
                                   → Add job 'confirm-appointment-after-payment'
```

---

### 3. Medicine Batch Management (Ưu tiên trung bình)

#### Use Cases
| Job Name | Schedule | Description |
|----------|----------|-------------|
| `check-medicine-expiry` | Daily 00:00 | Kiểm tra thuốc sắp hết hạn (7, 30 ngày) |
| `check-low-stock` | Daily 06:00 | Kiểm tra tồn kho dưới ngưỡng |
| `send-inventory-alert` | Event-triggered | Gửi cảnh báo cho admin/pharmacist |
| `update-batch-status` | Daily 00:00 | Cập nhật status EXPIRED cho lô hết hạn |

#### Repeatable Jobs Configuration
```typescript
// Cron expression: Chạy hàng ngày lúc 00:00
await this.medicineQueue.add(
  'check-medicine-expiry',
  {},
  {
    repeat: {
      pattern: '0 0 * * *', // Daily at midnight
    },
  }
);
```

---

### 4. Appointment Auto-Status Updates (Ưu tiên trung bình)

#### Use Cases
| Job Name | Trigger | Description |
|----------|---------|-------------|
| `auto-cancel-unpaid` | Delayed (30 phút sau tạo) | Hủy lịch PENDING chưa thanh toán |
| `mark-no-show` | Cron (mỗi 30 phút) | Đánh dấu NO_SHOW nếu không đến |
| `complete-appointment` | Manual trigger | Hoàn thành lịch khám |

#### Auto-Cancel Flow
```
Patient đặt lịch (PENDING) → Add delayed job 'auto-cancel-unpaid' (30 min)
                                    ↓
                        [Nếu Payment SUCCESS trước 30 min]
                                    ↓
                        Remove/Cancel delayed job
                                    ↓
                        [Nếu không thanh toán sau 30 min]
                                    ↓
                        Worker executes → Cancel appointment
```

---

### 5. AI Integration Tasks (Tương lai)

#### Use Cases
| Job Name | Trigger | Description |
|----------|---------|-------------|
| `analyze-symptoms` | Sau khi tạo appointment | AI phân tích triệu chứng |
| `process-medical-image` | Upload document | Xử lý ảnh X-ray, MRI |
| `generate-diagnosis-suggestion` | Bác sĩ request | AI gợi ý chẩn đoán |

#### Considerations
- Sử dụng **separate queue** với concurrency thấp (AI tasks nặng)
- Implement **priority queue** cho urgent cases
- Set **longer timeout** cho AI processing

---

### 6. Report Generation (Ưu tiên thấp)

#### Use Cases
| Job Name | Trigger | Description |
|----------|---------|-------------|
| `generate-revenue-report` | Admin request | Báo cáo doanh thu |
| `generate-appointment-report` | Scheduled weekly | Thống kê lịch khám |
| `export-patient-data` | Admin request | Xuất dữ liệu bệnh nhân |

---

## Best Practices

### 1. Job Naming Convention
```typescript
// Format: <action>-<resource>-<detail>
'send-appointment-confirmation'
'process-payment-webhook'
'check-medicine-expiry'
```

### 2. Job Options
```typescript
await queue.add('job-name', data, {
  attempts: 3,                    // Retry 3 lần
  backoff: {
    type: 'exponential',
    delay: 1000,                  // 1s, 2s, 4s
  },
  removeOnComplete: 100,          // Giữ 100 completed jobs
  removeOnFail: 1000,             // Giữ 1000 failed jobs
});
```

### 3. Error Handling in Processor
```typescript
@Processor('appointment')
export class AppointmentProcessor {
  @Process('send-confirmation')
  async handleSendConfirmation(job: Job<SendConfirmationData>) {
    try {
      await this.notificationService.send(job.data);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error; // Re-throw để BullMQ retry
    }
  }
}
```

### 4. Monitoring
- Sử dụng **Bull Board** hoặc **Arena** để monitor queues
- Setup **alerts** cho failed jobs
- Track **job processing time** metrics

---

## Queue Priority Matrix

| Queue Name | Priority | Concurrency | Use Case |
|------------|----------|-------------|----------|
| `payment` | Critical | 5 | Payment processing |
| `notification` | High | 10 | SMS/Email notifications |
| `appointment` | High | 5 | Appointment status updates |
| `medicine` | Medium | 3 | Inventory management |
| `ai-processing` | Low | 2 | AI tasks (heavy) |
| `report` | Low | 1 | Report generation |

---

## Implementation Checklist

- [ ] Tạo queue module structure (`src/queues/`)
- [ ] Implement Notification Producer & Processor
- [ ] Implement Payment Queue với idempotent processing
- [ ] Setup Medicine Batch cron jobs
- [ ] Implement Appointment auto-cancel delayed jobs
- [ ] Integrate Bull Board for monitoring
- [ ] Add error handling và logging
- [ ] Setup alerts cho failed jobs
- [ ] Write unit tests cho processors

---

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS BullMQ Integration](https://docs.nestjs.com/techniques/queues)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
