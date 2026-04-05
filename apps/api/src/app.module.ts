import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';
import { GeoModule } from './geo/geo.module';
import { StatisticsModule } from './statistics/statistics.module';
import { CaslModule } from './casl/casl.module';
import { SanctionsModule } from './sanctions/sanctions.module';
import { NewsModule } from './news/news.module';
import { UploadsModule } from './uploads/uploads.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TournamentsModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
    GeoModule,
    StatisticsModule,
    CaslModule,
    SanctionsModule,
    NewsModule,
    UploadsModule,
    RolesModule,
  ],
})
export class AppModule {}
