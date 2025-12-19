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
  @ApiOperation({ summary: 'Get all payments/transactions with filters' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Payments retrieved successfully',
  })
  async findAll(@Query() query: QueryPaymentDto) {
    const result = await this.paymentService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Payments retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment detail by ID' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Payment retrieved successfully',
  })
  @ApiResponseSwagger({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentService.findOne(id);
    return ApiResponse.success(payment, 'Payment retrieved successfully');
  }
}
