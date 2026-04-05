import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
