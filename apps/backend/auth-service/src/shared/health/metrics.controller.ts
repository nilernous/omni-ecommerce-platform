import { Controller, Get } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  @Get()
  getMetrics() {
    return '# HELP service_up Service status\n# TYPE service_up gauge\nservice_up 1\n';
  }
}
