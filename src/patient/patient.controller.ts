import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as ApiResponseSwagger, ApiBearerAuth } from '@nestjs/swagger';
import { PatientService } from './patient.service';
import { UpdatePatientDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse } from '../common/dto';

@ApiTags('Patient - Profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponseSwagger({ status: 200, description: 'Patient profile updated successfully' })
  @ApiResponseSwagger({ status: 400, description: 'Bad request - validation error' })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 404, description: 'Patient profile not found' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientService.updateMyProfile(userId, updatePatientDto);
    return ApiResponse.success(patient, 'Patient profile updated successfully');
  }
}
