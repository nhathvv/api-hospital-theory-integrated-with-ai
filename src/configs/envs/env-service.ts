import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import EnvironmentVariables from 'src/configs/envs/env-variables';
import {
  parseExpirationToSeconds,
  parseExpirationToMs,
} from 'src/common/utils';

export class EnvService {
  private static _instance: EnvService;
  constructor() {}

  static getInstance(): EnvService {
    if (!EnvService._instance) {
      EnvService._instance = new EnvService();
    }
    return EnvService._instance;
  }

  validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig);
    if (errors.length > 0) {
      console.log(
        errors.map((error) => {
          return {
            property: error.property,
            constraints: error.constraints,
            value: error.value,
          };
        }),
      );
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
  getJwtAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || '';
  }
  getJwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || '';
  }
  getJwtAccessExpiration(): string {
    return process.env.JWT_ACCESS_EXPIRATION || '15m';
  }
  getJwtAccessExpirationSeconds(): number {
    return parseExpirationToSeconds(this.getJwtAccessExpiration());
  }
  getJwtRefreshExpiration(): string {
    return process.env.JWT_REFRESH_EXPIRATION || '7d';
  }
  getJwtRefreshExpirationSeconds(): number {
    return parseExpirationToSeconds(this.getJwtRefreshExpiration());
  }
  getJwtRefreshExpirationMs(): number {
    return parseExpirationToMs(this.getJwtRefreshExpiration());
  }
  getDefaultPassword(): string {
    return process.env.DEFAULT_PASSWORD || '';
  }
  getPaymentApiKey(): string {
    return process.env.PAYMENT_API_KEY || '';
  }
  getThrottleTtl(): number {
    return Number(process.env.THROTTLE_TTL) || 60000;
  }
  getThrottleLimit(): number {
    return Number(process.env.THROTTLE_LIMIT) || 10;
  }
  getRedisHost(): string {
    return process.env.REDIS_HOST || 'localhost';
  }
  getRedisPort(): number {
    return Number(process.env.REDIS_PORT) || 6379;
  }
  getRedisUsername(): string {
    return process.env.REDIS_USERNAME || '';
  }
  getRedisPassword(): string {
    return process.env.REDIS_PASSWORD || '';
  }
  getGeminiApiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }
  getGeminiModel(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  }
  getGeminiMaxTokens(): number {
    return Number(process.env.GEMINI_MAX_TOKENS) || 2048;
  }
  getGeminiTemperature(): number {
    return Number(process.env.GEMINI_TEMPERATURE) || 0.7;
  }
  getPolygonRpcUrl(): string {
    return process.env.POLYGON_RPC_URL || '';
  }
  getPolygonTestnetRpcUrl(): string {
    return process.env.POLYGON_TESTNET_RPC_URL || '';
  }
  getBlockchainPrivateKey(): string {
    return process.env.BLOCKCHAIN_PRIVATE_KEY || '';
  }
  getPaymentRegistryContract(): string {
    return process.env.PAYMENT_REGISTRY_CONTRACT || '';
  }
  getPolygonscanApiKey(): string {
    return process.env.POLYGONSCAN_API_KEY || '';
  }
  getCloudinaryCloudName(): string {
    return process.env.CLOUDINARY_CLOUD_NAME || '';
  }
  getCloudinaryApiKey(): string {
    return process.env.CLOUDINARY_API_KEY || '';
  }
  getCloudinaryApiSecret(): string {
    return process.env.CLOUDINARY_API_SECRET || '';
  }
  getMedicalRecordRegistryContract(): string {
    return process.env.MEDICAL_RECORD_REGISTRY_CONTRACT || '';
  }
}