import { IsNotEmpty, IsNumber, IsString } from "class-validator";

class EnvironmentVariables {
  @IsNumber()
  @IsNotEmpty()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;
}
export default EnvironmentVariables;