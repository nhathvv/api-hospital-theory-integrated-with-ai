import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from '../../payment/payment.service';
import { QueryPaymentDto } from '../../payment/dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../common/constants';
import { ApiResponse, PaginatedResponse } from '../../common/dto';

@ApiTags('Admin - Payment Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thanh toán với bộ lọc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách thanh toán thành công',
  })
  async findAll(@Query() query: QueryPaymentDto) {
    const result = await this.paymentService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách thanh toán thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết thanh toán' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin thanh toán thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy thanh toán' })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findOne(id);
    return ApiResponse.success(payment, 'Lấy thông tin thanh toán thành công');
  }
}
