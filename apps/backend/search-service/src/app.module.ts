import { Module } from '@nestjs/common';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [SearchModule],
})
export class AppModule {}
