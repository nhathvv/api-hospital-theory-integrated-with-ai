import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserRole } from '@prisma/client';
import { TransactionClient } from '../common/utils';
import { PatientService } from '../patient';
import { DoctorService } from '../doctor';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PatientService))
    private readonly patientService: PatientService,
    @Inject(forwardRef(() => DoctorService))
    private readonly doctorService: DoctorService,
  ) {}

  async createUserInTransaction(
    tx: TransactionClient,
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

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        avatar: true,
        address: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getMe(userId: string, role: string) {
    const [user, profile] = await Promise.all([
      this.findById(userId),
      this.getProfileByRole(userId, role as UserRole),
    ]);
    return { user, profile };
  }

  private getProfileByRole(userId: string, role: UserRole) {
    const profileFetchers: Record<UserRole, () => Promise<unknown>> = {
      [UserRole.PATIENT]: () => this.patientService.getProfileByUserId(userId),
      [UserRole.DOCTOR]: () => this.doctorService.getProfileByUserId(userId),
      [UserRole.ADMIN]: () => Promise.resolve(null),
    };
    return profileFetchers[role]();
  }
}
