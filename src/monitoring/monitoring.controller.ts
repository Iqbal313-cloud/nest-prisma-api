import { Controller, Get, Query } from '@nestjs/common';

import { MonitoringService } from './monitoring.service';
import { PaginationDto } from 'src/common/utils/pagination.dto';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('summary')
  @UserHasPermission({
    permission: {
      monitoring: ['read'],
    },
  })
  getSummary() {
    return this.monitoringService.getSummary();
  }

  @Get('recent-queries')
  @UserHasPermission({
    permission: {
      monitoring: ['read'],
    },
  })
  getRecentQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getRecentQueries(paginationDto);
  }

  // Slow Queries
  @Get('slow-queries')
  @UserHasPermission({
    permission: {
      monitoring: ['read'],
    },
  })
  getSlowQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getSlowQueries(paginationDto);
  }

  // Top Queries
  @Get('top-queries')
  @UserHasPermission({
    permission: {
      monitoring: ['read'],
    },
  })
  getTopQueries(@Query() paginationDto: PaginationDto) {
    return this.monitoringService.getTopQueries(paginationDto);
  }
}
