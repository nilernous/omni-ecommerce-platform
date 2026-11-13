import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'inventory-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
    }),
    InventoryModule,
  ],
})
export class AppModule {}
