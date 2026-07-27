import { Controller, Get } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('home')
  async getHomeFeed() {
    return this.storeService.getHomeFeed();
  }
}
