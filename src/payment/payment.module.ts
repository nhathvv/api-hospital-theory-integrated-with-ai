import { Module } from "@nestjs/common";
import { PaymentController } from "./payment.controller";
import { PaymentRepository } from "./repository/payment.repository";
import { PrismaModule } from "src/prisma";
import { PaymentService } from "src/payment/payment.service";

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {}