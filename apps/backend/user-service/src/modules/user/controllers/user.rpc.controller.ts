import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from '../services/user.service';

@Controller()
export class UserRpcController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.find_by_id')
  async findById(@Payload() data: { id: string }): Promise<any> {
    return this.userService.findById(data.id);
  }

  @MessagePattern('user.find_all')
  async findAll(): Promise<any> {
    return this.userService.findAll();
  }
}
