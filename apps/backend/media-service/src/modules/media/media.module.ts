import { Module } from '@nestjs/common';
import { MediaRpcController } from './media.rpc.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaRpcController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
