import { Controller, Get, Query } from '@nestjs/common';

import { MonitoringService } from './monitoring.service';
import { PaginationDto } from 'src/common/utils/pagination.dto';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('summary')
  getSummary() {
    return this.monitoringService.getSummary();
  }

  @Get('recent-queries')
  getRecentQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getRecentQueries(paginationDto);
  }

  // Slow Queries
  @Get('slow-queries')
  getSlowQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getSlowQueries(paginationDto);
  }

  // Top Queries
  @Get('top-queries')
  getTopQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getTopQueries(paginationDto);
  }
}
