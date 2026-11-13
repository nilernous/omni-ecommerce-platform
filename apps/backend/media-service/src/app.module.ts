import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'media-service' }),
    MediaModule,
  ],
})
export class AppModule {}
