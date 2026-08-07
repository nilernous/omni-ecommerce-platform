import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UserService } from '../services/user.service';

@Controller()
export class UserEventController {
  constructor(private readonly userService: UserService) {}

  @EventPattern('user.updated')
  async handleUserUpdated(@Payload() data: any) {
    // Event handler placeholder
  }
}
