import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Nhận webhook thanh toán từ cổng thanh toán' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Xử lý webhook thanh toán thành công',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Dữ liệu thanh toán không hợp lệ',
  })
  @ApiResponseSwagger({
    status: 401,
    description: 'API key không hợp lệ',
  })
  async receivePayment(@Body() data: WebhookPaymentBodyDto) {
    return this.paymentService.receiver(data);
  }
}
