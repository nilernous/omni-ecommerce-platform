import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { PaymentController } from './presentation/controllers/payment.controller';
import { PaymentService } from './application/services/payment.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService, JwtStrategy],
})
export class PaymentModule {}
