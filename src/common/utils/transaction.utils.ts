import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export class TransactionUtils {
  private static readonly logger = new Logger(TransactionUtils.name);

  static async executeInTransaction<T>(
    prisma: PrismaService,
    callback: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx);
      });
    } catch (error) {
      this.logger.error(
        'Transaction failed',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
