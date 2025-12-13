import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma';
import { CreateMedicineBatchDto, QueryMedicineBatchDto, UpdateMedicineBatchDto } from './dto';

@Injectable()
export class MedicineBatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all medicine batches with filtering and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of medicine batches with total count
   */
  async findAll(query: QueryMedicineBatchDto) {
    const where = this.buildWhereClause(query);

    const [data, total] = await Promise.all([
      this.prisma.medicineBatch.findMany({
        where,
        include: {
          medicine: {
            include: {
              category: true,
            },
          },
        },
        ...query.getPrismaParams(),
        orderBy: query.getPrismaSortParams(),
      }),
      this.prisma.medicineBatch.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Build where clause for Prisma query
   * @param query - Query parameters
   * @returns Prisma where clause object
   */
  private buildWhereClause(
    query: QueryMedicineBatchDto,
  ): Prisma.MedicineBatchWhereInput {
    const { search, medicineId, categoryId, status, expiryDateBefore, expiryDateAfter } =
      query;
    const where: Prisma.MedicineBatchWhereInput = {
      deletedAt: null, // Exclude soft-deleted records
    };

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { medicine: { name: { contains: search, mode: 'insensitive' } } },
        { medicine: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (medicineId) {
      where.medicineId = medicineId;
    }

    if (categoryId) {
      where.medicine = {
        ...((where.medicine as Prisma.MedicineWhereInput) || {}),
        categoryId,
      };
    }

    if (status) {
      where.status = status;
    }

    // Build expiryDate filter
    if (expiryDateBefore || expiryDateAfter) {
      where.expiryDate = {};
      if (expiryDateBefore) {
        where.expiryDate.lte = new Date(expiryDateBefore);
      }
      if (expiryDateAfter) {
        where.expiryDate.gte = new Date(expiryDateAfter);
      }
    }

    return where;
  }

  /**
   * Create a new medicine batch
   * @param dto - Create medicine batch data
   * @returns Created medicine batch
   */
  async create(dto: CreateMedicineBatchDto) {
    await this.validateMedicineAndCategory(dto.medicineId, dto.categoryId);
    await this.validateUniqueBatchNumber(dto.medicineId, dto.batchNumber);

    // Exclude categoryId from data since it's not a column in MedicineBatch
    const { categoryId, ...batchData } = dto;

    return this.prisma.medicineBatch.create({
      data: {
        ...batchData,
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
        expiryDate: new Date(dto.expiryDate),
        currentStock: dto.quantity, // Set current stock to initial quantity
      },
      include: {
        medicine: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Find a medicine batch by ID
   * @param id - Medicine batch ID
   * @returns Medicine batch with related data
   * @throws NotFoundException if batch not found or soft-deleted
   */
  async findOne(id: string) {
    const batch = await this.prisma.medicineBatch.findFirst({
      where: { id, deletedAt: null },
      include: {
        medicine: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Không tìm thấy lô thuốc');
    }

    return batch;
  }

  /**
   * Update a medicine batch
   * @param id - Medicine batch ID
   * @param dto - Update medicine batch data
   * @returns Updated medicine batch
   * @throws NotFoundException if batch not found
   * @throws ConflictException if batch number already exists
   */
  async update(id: string, dto: UpdateMedicineBatchDto) {
    const existingBatch = await this.findOne(id);

    // Validate unique batch number if being updated
    if (dto.batchNumber && dto.batchNumber !== existingBatch.batchNumber) {
      await this.validateUniqueBatchNumber(existingBatch.medicineId, dto.batchNumber, id);
    }

    // Build update data with proper date handling
    const data: Prisma.MedicineBatchUpdateInput = {
      ...dto,
      ...(dto.manufactureDate !== undefined && {
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
      }),
      ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
    };

    return this.prisma.medicineBatch.update({
      where: { id },
      data,
      include: {
        medicine: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete a medicine batch
   * @param id - Medicine batch ID
   * @returns Updated medicine batch with deletedAt timestamp
   * @throws NotFoundException if batch not found
   */
  async softDelete(id: string) {
    await this.findOne(id);

    return this.prisma.medicineBatch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Validate that medicine exists and optionally belongs to the specified category
   * @param medicineId - Medicine ID to validate
   * @param categoryId - Optional category ID to validate
   */
  private async validateMedicineAndCategory(medicineId: string, categoryId?: string) {
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      throw new NotFoundException('Không tìm thấy thuốc');
    }

    if (categoryId && medicine.categoryId !== categoryId) {
      throw new BadRequestException('Thuốc không thuộc nhóm thuốc đã chọn');
    }
  }

  /**
   * Validate that batch number is unique for the medicine
   * @param medicineId - Medicine ID
   * @param batchNumber - Batch number to validate
   * @param excludeId - Optional ID to exclude from check (for updates)
   */
  private async validateUniqueBatchNumber(
    medicineId: string,
    batchNumber: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.medicineBatch.findUnique({
      where: {
        medicineId_batchNumber: { medicineId, batchNumber },
      },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Số lô đã tồn tại cho thuốc này');
    }
  }
}
