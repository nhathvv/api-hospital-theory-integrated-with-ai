import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger } from '@nestjs/swagger';
import { PaymentApiKeyGuard } from '../auth/guards';
import { WebhookPaymentBodyDto } from './dto';
import { PaymentService } from './payment.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PaymentApiKeyGuard)
  @ApiOperation({ summary: 'Receive payment webhook from payment gateway' })
  @ApiResponseSwagger({ status: 200, description: 'Payment webhook processed successfully' })
  @ApiResponseSwagger({ status: 400, description: 'Bad request - invalid payment data' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized - invalid API key' })
  async receivePayment(@Body() data: WebhookPaymentBodyDto) {
    return this.paymentService.receiver(data);
  }
}
