import { Module } from '@nestjs/common';
import { NotificationRpcController } from './notification.rpc.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationRpcController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
