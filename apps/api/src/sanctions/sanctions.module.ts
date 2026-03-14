import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SanctionsService } from './sanctions.service';
import { SanctionsController } from './sanctions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SanctionsController],
  providers: [SanctionsService],
  exports: [SanctionsService],
})
export class SanctionsModule {}
