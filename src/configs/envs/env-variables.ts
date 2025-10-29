import { IsNotEmpty, IsNumber } from "class-validator";

class EnvironmentVariables {
  @IsNumber()
  @IsNotEmpty()
  PORT: number;
}
export default EnvironmentVariables;