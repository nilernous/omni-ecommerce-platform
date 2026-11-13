import { Module } from '@nestjs/common';
import { NotificationRpcController } from './notification.rpc.controller';
import { NotificationEventController } from './notification.event.controller';
import { NotificationService } from './notification.service';
import { NotificationStore } from './notification.store';
import { NotificationDispatcher } from './notification.dispatcher';
import { LoggingNotificationProvider, NOTIFICATION_PROVIDER } from './notification.providers';
import { RecipientResolver, recipientClientProviders } from './recipient.resolver';

@Module({
  controllers: [NotificationRpcController, NotificationEventController],
  providers: [
    NotificationService,
    NotificationStore,
    NotificationDispatcher,
    { provide: NOTIFICATION_PROVIDER, useClass: LoggingNotificationProvider },
    RecipientResolver,
    ...recipientClientProviders,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
