import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

class EnvironmentVariables {
  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string;

  @IsString()
  @IsNotEmpty()
  DEFAULT_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  PAYMENT_API_KEY: string;

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number;

  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET: string;

  @IsString()
  @IsOptional()
  MEDICAL_RECORD_REGISTRY_CONTRACT: string;
}
export default EnvironmentVariables;
