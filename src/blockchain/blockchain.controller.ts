import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { PaymentBlockchainService } from './payment-blockchain.service';
import { BlockchainService } from './blockchain.service';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly paymentBlockchainService: PaymentBlockchainService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain service status' })
  @ApiResponse({ status: 200, description: 'Blockchain status retrieved' })
  async getStatus() {
    const isEnabled = this.blockchainService.isBlockchainEnabled();
    const balance = isEnabled ? await this.blockchainService.getBalance() : '0';

    return {
      enabled: isEnabled,
      walletBalance: balance,
      network: isEnabled ? 'polygon' : null,
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get blockchain payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    return this.paymentBlockchainService.getBlockchainStatistics();
  }

  @Post('payments/:id/record')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Record payment on blockchain (Admin only)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment recorded on blockchain' })
  @ApiResponse({ status: 400, description: 'Failed to record payment' })
  async recordPayment(@Param('id') id: string) {
    return this.paymentBlockchainService.recordPaymentOnBlockchain(id);
  }

  @Get('payments/:id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify payment on blockchain' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  async verifyPayment(@Param('id') id: string) {
    return this.paymentBlockchainService.verifyPayment(id);
  }

  @Get('payments/:id/info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment blockchain info' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment blockchain info' })
  async getPaymentInfo(@Param('id') id: string) {
    return this.paymentBlockchainService.getPaymentBlockchainInfo(id);
  }
}

