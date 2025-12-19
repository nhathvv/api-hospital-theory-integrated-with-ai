import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvService } from '../../configs/envs/env-service';
import { PrismaService } from '../../prisma';
import { TokenPayload } from '../auth.service';
import { UserRole } from '../../common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: EnvService.getInstance().getJwtAccessSecret(),
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        patient: { select: { id: true, deletedAt: true } },
        doctor: { select: { id: true, deletedAt: true } },
      },
    });

    console.log('JWT Validate - User ID:', payload.sub);
    console.log('JWT Validate - User patient:', user?.patient);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const patientId = user.patient && !user.patient.deletedAt ? user.patient.id : null;
    const doctorId = user.doctor && !user.doctor.deletedAt ? user.doctor.id : null;

    console.log('JWT Validate - patientId:', patientId);

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      patientId,
      doctorId,
    };
  }
}

