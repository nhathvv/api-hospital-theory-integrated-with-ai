import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
}
export default EnvironmentVariables;
