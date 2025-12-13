import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateMedicineCategoryDto, QueryMedicineCategoryDto } from './dto';

@Injectable()
export class MedicineCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new medicine category
   * @param dto - Create medicine category data
   * @returns Created medicine category
   */
  async create(dto: CreateMedicineCategoryDto) {
    await this.validateUniqueName(dto.name);
    await this.validateUniqueCode(dto.code);
    return this.prisma.medicineCategory.create({
      data: dto,
    });
  }

  /**
   * Find all medicine categories without pagination
   * @param query - Query parameters for filtering
   * @returns List of medicine categories
   */
  async findAll(query: QueryMedicineCategoryDto) {
    const where = this.buildWhereClause(query);

    return this.prisma.medicineCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Build where clause for Prisma query
   * @param query - Query parameters
   * @returns Prisma where clause object
   */
  private buildWhereClause(query: QueryMedicineCategoryDto) {
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
    return where;
  }

  /**
   * Validate that medicine category name is unique
   * @param name - Category name to validate
   * @param excludeId - Optional ID to exclude from check (for updates)
   */
  private async validateUniqueName(name: string, excludeId?: string) {
    const existing = await this.prisma.medicineCategory.findUnique({
      where: { name },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Medicine category name already exists');
    }
  }

  /**
   * Validate that medicine category code is unique
   * @param code - Category code to validate
   * @param excludeId - Optional ID to exclude from check (for updates)
   */
  private async validateUniqueCode(code: string, excludeId?: string) {
    const existing = await this.prisma.medicineCategory.findUnique({
      where: { code },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Medicine category code already exists');
    }
  }
}
