import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { PaymentRpcController } from './controllers/payment.rpc.controller';
import { PaymentEventController } from './controllers/payment.event.controller';
import { PaymentService } from './services/payment.service';

@Module({
  controllers: [PaymentRpcController, PaymentEventController],
  providers: [PaymentService, PrismaService],
  exports: [PaymentService],
})
export class PaymentModule {}
