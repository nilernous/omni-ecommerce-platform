import { Module } from '@nestjs/common';
import { StoreController } from './store/store.controller';
import { StoreService } from './store/store.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService],
})
export class AppModule {}
