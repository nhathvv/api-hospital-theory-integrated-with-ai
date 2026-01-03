import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type TransactionClient = Prisma.TransactionClient;

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
}

const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  maxWait: 10000,
  timeout: 15000,
};

export class TransactionUtils {
  private static readonly logger = new Logger(TransactionUtils.name);

  static async executeInTransaction<T>(
    prisma: PrismaService,
    callback: (tx: TransactionClient) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    const transactionOptions = {
      ...DEFAULT_TRANSACTION_OPTIONS,
      ...options,
    };

    try {
      return await prisma.$transaction(
        async (tx) => {
          return await callback(tx);
        },
        transactionOptions,
      );
    } catch (error) {
      this.logger.error(
        'Transaction failed',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
