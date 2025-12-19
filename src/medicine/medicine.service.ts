import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateMedicineDto, QueryMedicineDto } from './dto';

@Injectable()
export class MedicineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new medicine
   * @param dto - Create medicine data
   * @returns Created medicine
   */
  async create(dto: CreateMedicineDto) {
    await this.validateUniqueCode(dto.code);

    if (dto.categoryId) {
      await this.validateCategoryExists(dto.categoryId);
    }

    return this.prisma.medicine.create({
      data: dto,
      include: {
        category: true,
      },
    });
  }

  /**
   * Find all medicines without pagination
   * @param query - Query parameters for filtering
   * @returns List of medicines
   */
  async findAll(query: QueryMedicineDto) {
    const where = this.buildWhereClause(query);

    return this.prisma.medicine.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Build where clause for Prisma query
   * @param query - Query parameters
   * @returns Prisma where clause object
   */
  private buildWhereClause(query: QueryMedicineDto) {
    const { search, categoryId, unit, requiresPrescription, isActive } = query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { activeIngredient: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (unit) {
      where.unit = unit;
    }

    if (requiresPrescription !== undefined) {
      where.requiresPrescription = requiresPrescription;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return where;
  }

  /**
   * Validate that medicine code is unique
   * @param code - Medicine code to validate
   * @param excludeId - Optional ID to exclude from check (for updates)
   */
  private async validateUniqueCode(code: string, excludeId?: string) {
    const existing = await this.prisma.medicine.findUnique({
      where: { code },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Medicine code already exists');
    }
  }

  /**
   * Validate that category exists
   * @param categoryId - Category ID to validate
   */
  private async validateCategoryExists(categoryId: string) {
    const category = await this.prisma.medicineCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Medicine category not found');
    }
  }
}
