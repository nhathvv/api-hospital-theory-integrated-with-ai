import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ApiResponse } from '../common/dto';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponseSwagger({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponseSwagger({ status: 401, description: 'Unauthorized' })
  @ApiResponseSwagger({ status: 404, description: 'User not found' })
  async getMe(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    const data = await this.userService.getMe(userId, role);
    return ApiResponse.success(data, 'User profile retrieved successfully');
  }
}
