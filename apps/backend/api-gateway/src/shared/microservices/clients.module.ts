import { Global, Module } from '@nestjs/common';
import { clientsProviders } from './clients.providers';

@Global()
@Module({
  providers: [...clientsProviders],
  exports: [...clientsProviders],
})
export class SharedClientsModule {}
