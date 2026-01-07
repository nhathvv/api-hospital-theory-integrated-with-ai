import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EnvService } from 'src/configs/envs/env-service';

@Injectable()
export class PaymentApiKeyGuard implements CanActivate {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = EnvService.getInstance().getPaymentApiKey();
  }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = (request.headers['Authorization'] as string)?.split(' ')[1] as string;
    if (!apiKey || apiKey !== this.apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
