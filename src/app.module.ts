import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { DepartmentModule } from './department';
import { SpecialtyModule } from './specialty';

@Module({
  imports: [PrismaModule, AuthModule, DepartmentModule, SpecialtyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
