import { Module } from '@nestjs/common';
import { SearchEventController } from './search.event.controller';
import { SearchRpcController } from './search.rpc.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchRpcController, SearchEventController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
