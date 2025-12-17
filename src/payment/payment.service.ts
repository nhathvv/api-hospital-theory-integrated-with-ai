import { WebhookPaymentBodyDto } from "src/payment/dto";
import { PaymentRepository } from "src/payment/repository/payment.repository";

export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async receiver(data: WebhookPaymentBodyDto) {
    return await this.paymentRepository.receiver(data);
  }
} 