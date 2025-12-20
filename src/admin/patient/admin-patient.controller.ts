import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lấy danh sách bệnh nhân với bộ lọc' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy danh sách bệnh nhân thành công',
  })
  async findAll(@Query() query: QueryPatientDto) {
    const result = await this.patientService.findAll(query);
    return PaginatedResponse.create(
      result.data,
      result.total,
      query,
      'Lấy danh sách bệnh nhân thành công',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bệnh nhân' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Lấy thông tin bệnh nhân thành công',
  })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy bệnh nhân' })
  async findOne(@Param('id') id: string) {
    const patient = await this.patientService.findOne(id);
    return ApiResponse.success(patient, 'Lấy thông tin bệnh nhân thành công');
  }
}
