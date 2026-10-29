import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';

import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('summary')
  getSummary() {
    return this.monitoringService.getSummary();
  }

  @Get('recent-queries')
  getRecentQueries(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
  ) {
    return this.monitoringService.getRecentQueries(limit);
  }

  @Get('slow-queries')
  getSlowQueries(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.monitoringService.getSlowQueries(limit);
  }

  @Get('top-queries')
  getTopQueries(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.monitoringService.getTopQueries(limit);
  }
}
