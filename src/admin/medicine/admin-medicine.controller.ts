import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
import { MedicineService } from '../../medicine/medicine.service';
import { CreateMedicineDto, QueryMedicineDto } from '../../medicine/dto';
import { ApiResponse } from '../../common/dto';
import { UserRole } from '../../common/constants';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';

@ApiTags('Admin - Medicine Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/medicines')
export class AdminMedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new medicine' })
  @ApiResponseSwagger({ status: 201, description: 'Medicine created successfully' })
  @ApiResponseSwagger({ status: 409, description: 'Medicine code already exists' })
  @ApiResponseSwagger({ status: 404, description: 'Medicine category not found' })
  async create(@Body() dto: CreateMedicineDto) {
    const medicine = await this.medicineService.create(dto);
    return ApiResponse.success(medicine, 'Medicine created successfully', 201);
  }

  @Get()
  @ApiOperation({ summary: 'Get all medicines (no pagination)' })
  @ApiResponseSwagger({ status: 200, description: 'Medicines retrieved successfully' })
  async findAll(@Query() query: QueryMedicineDto) {
    const medicines = await this.medicineService.findAll(query);
    return ApiResponse.success(medicines, 'Medicines retrieved successfully');
  }
}
