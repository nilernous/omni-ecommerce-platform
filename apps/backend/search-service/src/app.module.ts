import { Module } from '@nestjs/common';
import { EventBusModule } from '@omnicommerce/events';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    EventBusModule.forRoot({ serviceName: 'search-service' }),
    SearchModule,
  ],
})
export class AppModule {}
