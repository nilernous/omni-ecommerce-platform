import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { UserRpcController } from './controllers/user.rpc.controller';
import { UserEventController } from './controllers/user.event.controller';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserRpcController, UserEventController],
  providers: [UserService, PrismaService],
  exports: [UserService],
})
export class UserModule {}
