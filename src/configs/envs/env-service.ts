import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import EnvironmentVariables from "src/configs/envs/env-variables";

export class EnvService {
  private static _instance: EnvService;
  constructor(){}

  static getInstance(): EnvService {
    if (!EnvService._instance) {
      EnvService._instance = new EnvService();
    }
    return EnvService._instance;
  }

  validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
    const errors = validateSync(validatedConfig);
    if (errors.length > 0) {
      console.log(errors.map((error) => {
        return {
          property: error.property,
          constraints: error.constraints,
          value: error.value,
        }
      }));
      process.exit(1);
    }
    return validatedConfig;
  }
  getPort(): number {
    return Number(process.env.PORT) || 3000;
  }

  getDatabaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }
}