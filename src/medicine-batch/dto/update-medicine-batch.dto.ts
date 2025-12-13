import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMedicineBatchDto } from './create-medicine-batch.dto';

/**
 * DTO for updating a medicine batch
 * - Excludes medicineId (cannot change the medicine a batch belongs to)
 * - Excludes categoryId (category is determined by the medicine)
 * - All other fields are optional for partial updates
 */
export class UpdateMedicineBatchDto extends PartialType(
  OmitType(CreateMedicineBatchDto, ['medicineId', 'categoryId'] as const),
) {}
