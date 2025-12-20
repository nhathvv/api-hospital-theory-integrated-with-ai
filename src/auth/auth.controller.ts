import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponseSwagger({
    status: 201,
    description: 'Đăng ký thành công',
  })
  @ApiResponseSwagger({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponseSwagger({
    status: 409,
    description: 'Email đã tồn tại',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiResponseSwagger({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponseSwagger({
    status: 401,
    description: 'Thông tin đăng nhập không hợp lệ',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiResponseSwagger({
    status: 200,
    description: 'Làm mới token thành công',
  })
  @ApiResponseSwagger({
    status: 401,
    description: 'Refresh token không hợp lệ',
  })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất và vô hiệu hóa refresh token' })
  @ApiResponseSwagger({ status: 200, description: 'Đăng xuất thành công' })
  @ApiResponseSwagger({
    status: 401,
    description: 'Refresh token không hợp lệ',
  })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }
}
