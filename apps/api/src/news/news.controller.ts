import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/policies.guard';
import { NewsStatus } from '@prisma/client';

@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  findAll(
    @Query('status') status?: NewsStatus,
    @Query('tournamentId') tournamentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.findAll(
      status,
      tournamentId,
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.newsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'News' })
  create(@Body() dto: CreateNewsDto, @Request() req: any) {
    return this.newsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'News' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateNewsDto>) {
    return this.newsService.update(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'News' })
  publish(@Param('id') id: string) {
    return this.newsService.publish(id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'News' })
  archive(@Param('id') id: string) {
    return this.newsService.archive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'News' })
  delete(@Param('id') id: string) {
    return this.newsService.delete(id);
  }
}
