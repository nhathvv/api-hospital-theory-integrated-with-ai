import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from '../../patient/patient.service';
import { QueryPatientDto } from '../../patient/dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../common/constants';
import { ApiResponse, PaginatedResponse } from '../../common/dto';

@ApiTags('Admin - Patient Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/patients')
export class AdminPatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients with filters' })
  @ApiResponseSwagger({ status: 200, description: 'Patients retrieved successfully' })
  async findAll(@Query() query: QueryPatientDto) {
    const result = await this.patientService.findAll(query);
    return PaginatedResponse.create(result.data, result.total, query, 'Patients retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient detail by ID' })
  @ApiResponseSwagger({ status: 200, description: 'Patient retrieved successfully' })
  @ApiResponseSwagger({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id') id: string) {
    const patient = await this.patientService.findOne(id);
    return ApiResponse.success(patient, 'Patient retrieved successfully');
  }
}
