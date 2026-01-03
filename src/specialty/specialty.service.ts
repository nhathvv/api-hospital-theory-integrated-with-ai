import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
  QuerySpecialtyDto,
  QuerySpecialtyDoctorsDto,
} from './dto';
import { DoctorStatus } from '@prisma/client';

@Injectable()
export class SpecialtyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSpecialtyDto: CreateSpecialtyDto) {
    await this.validateUniqueName(createSpecialtyDto.name);

    if (createSpecialtyDto.departmentId) {
      await this.validateDepartmentExists(createSpecialtyDto.departmentId);
    }

    return this.prisma.specialty.create({
      data: createSpecialtyDto,
      include: { department: true },
    });
  }

  async findAll(query: QuerySpecialtyDto) {
    const where = this.buildWhereClause(query);

    const [specialties, total] = await Promise.all([
      this.prisma.specialty.findMany({
        where,
        include: { department: true },
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
      }),
      this.prisma.specialty.count({ where }),
    ]);

    return {
      data: specialties,
      total,
      query,
    };
  }

  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return specialty;
  }

  async findDoctorsBySpecialty(specialtyId: string, query: QuerySpecialtyDoctorsDto) {
    await this.findOne(specialtyId);

    const where: any = {
      primarySpecialtyId: specialtyId,
      status: DoctorStatus.ACTIVE,
      deletedAt: null,
    };

    if (query.name) {
      where.user = {
        fullName: { contains: query.name, mode: 'insensitive' },
      };
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where,
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              avatar: true,
            },
          },
          primarySpecialty: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.doctor.count({ where }),
    ]);

    return { data: doctors, total };
  }

  async update(id: string, updateSpecialtyDto: UpdateSpecialtyDto) {
    await this.findOne(id);

    if (updateSpecialtyDto.name) {
      await this.validateUniqueName(updateSpecialtyDto.name, id);
    }

    if (updateSpecialtyDto.departmentId) {
      await this.validateDepartmentExists(updateSpecialtyDto.departmentId);
    }

    return this.prisma.specialty.update({
      where: { id },
      data: updateSpecialtyDto,
      include: { department: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.specialty.delete({
      where: { id },
      include: { department: true },
    });
  }

  private buildWhereClause(query: QuerySpecialtyDto) {
    const { search, isActive, departmentId } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    return where;
  }

  private async validateUniqueName(name: string, excludeId?: string) {
    const existing = await this.prisma.specialty.findUnique({
      where: { name },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Specialty name already exists');
    }
  }

  private async validateDepartmentExists(departmentId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new BadRequestException('Department not found');
    }
  }
}
