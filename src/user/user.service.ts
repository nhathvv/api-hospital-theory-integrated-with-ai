import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUserInTransaction(
    tx: Prisma.TransactionClient,
    data: {
      email: string;
      password: string;
      username: string;
      phone: string;
      fullName?: string;
      avatar?: string;
      address?: string;
      role: UserRole;
    },
  ) {
    return tx.user.create({
      data,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
