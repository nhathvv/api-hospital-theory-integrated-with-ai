import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { DepartmentModule } from './department';

@Module({
  imports: [PrismaModule, AuthModule, DepartmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
