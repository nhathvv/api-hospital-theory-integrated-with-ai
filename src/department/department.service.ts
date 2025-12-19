import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  QueryDepartmentDto,
} from './dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existingByName = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });
    if (existingByName) {
      throw new ConflictException('Department name already exists');
    }
    if (createDepartmentDto.code) {
      const existingByCode = await this.prisma.department.findUnique({
        where: { code: createDepartmentDto.code },
      });
      if (existingByCode) {
        throw new ConflictException('Department code already exists');
      }
    }
    if (createDepartmentDto.headId) {
      await this.validateHead(createDepartmentDto.headId);
    }
    return this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        head: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  async findAll(query: QueryDepartmentDto) {
    const { search, isActive } = query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        include: {
          head: {
            include: {
              user: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
      }),
      this.prisma.department.count({ where }),
    ]);
    return {
      data: departments,
      total,
      query,
    };
  }
  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);
    if (updateDepartmentDto.name) {
      const existingByName = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException('Department name already exists');
      }
    }
    if (updateDepartmentDto.code) {
      const existingByCode = await this.prisma.department.findUnique({
        where: { code: updateDepartmentDto.code },
      });
      if (existingByCode && existingByCode.id !== id) {
        throw new ConflictException('Department code already exists');
      }
    }
    if (updateDepartmentDto.headId) {
      await this.validateHead(updateDepartmentDto.headId, id);
    }
    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        head: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.department.delete({
      where: { id },
    });
  }

  private async validateHead(headId: string, excludeDepartmentId?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: headId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    const existingHead = await this.prisma.department.findFirst({
      where: { headId },
    });
    if (existingHead && existingHead.id !== excludeDepartmentId) {
      throw new ConflictException(
        'This doctor is already head of another department',
      );
    }
  }
}
