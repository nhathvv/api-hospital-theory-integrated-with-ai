import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { PaymentApiKeyGuard } from "src/auth/guards";
import { WebhookPaymentBodyDto } from "src/payment/dto";
import { PaymentService } from "src/payment/payment.service";
import { ApiOperation, ApiResponse as ApiResponseSwagger } from "@nestjs/swagger";

@Controller('payment')

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('receiver')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PaymentApiKeyGuard)
  @ApiOperation({ summary: 'Receiver payment' })
  @ApiResponseSwagger({ status: 200, description: 'Payment received successfully' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized - invalid API key' })
  async receiver(@Body() data: WebhookPaymentBodyDto) {
    return this.paymentService.receiver(data);
  }
} 