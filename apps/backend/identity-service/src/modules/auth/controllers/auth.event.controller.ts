import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';

@Controller()
export class AuthEventController {
  constructor(private readonly authService: AuthService) {}

  @EventPattern('auth.user_created')
  async handleUserCreated(@Payload() data: any) {
    // Event handler placeholder
  }
}
