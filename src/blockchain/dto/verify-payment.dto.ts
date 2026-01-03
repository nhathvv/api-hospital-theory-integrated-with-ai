import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Payment ID to verify' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;
}

