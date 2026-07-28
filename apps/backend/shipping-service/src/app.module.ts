import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app/app.config';
import { HealthModule } from './health/health.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    HealthModule,
    ShippingModule,
  ],
})
export class AppModule {}
