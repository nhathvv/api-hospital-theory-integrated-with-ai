import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma';
import { PatientModule } from '../patient';
import { DoctorModule } from '../doctor';
import { AuthModule } from '../auth';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PatientModule),
    forwardRef(() => DoctorModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

