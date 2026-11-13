import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'notification-service' }),
    NotificationModule,
  ],
})
export class AppModule {}
