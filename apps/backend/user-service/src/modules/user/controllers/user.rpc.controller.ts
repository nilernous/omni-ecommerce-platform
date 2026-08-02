import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from '../services/user.service';

@Controller()
export class UserRpcController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.find_by_id')
  @MessagePattern('user.get_by_id')
  @MessagePattern('user.get_profile')
  async findById(@Payload() data: { id: string }): Promise<any> {
    return this.userService.findById(data.id);
  }

  @MessagePattern('user.find_all')
  @MessagePattern('user.list_users')
  async findAll(): Promise<any> {
    return this.userService.findAll();
  }

  @MessagePattern('user.update_profile')
  async updateProfile(@Payload() data: { id?: string; userId?: string; dto?: any; [key: string]: any }): Promise<any> {
    return this.userService.updateProfile(data.id || data.userId || '', data.dto || data);
  }

  @MessagePattern('user.address.add')
  async addAddress(@Payload() data: { userId: string; dto?: any; [key: string]: any }): Promise<any> {
    return this.userService.addAddress(data.userId, data.dto || data);
  }

  @MessagePattern('user.address.update')
  async updateAddress(@Payload() data: { userId: string; addressId: string; dto?: any; [key: string]: any }): Promise<any> {
    return this.userService.updateAddress(data.userId, data.addressId, data.dto || data);
  }

  @MessagePattern('user.address.delete')
  async deleteAddress(@Payload() data: { userId: string; addressId: string }): Promise<any> {
    return this.userService.deleteAddress(data.userId, data.addressId);
  }

  @MessagePattern('user.preferences.update')
  async updatePreferences(@Payload() data: { userId: string; dto?: any; [key: string]: any }): Promise<any> {
    return this.userService.updatePreferences(data.userId, data.dto || data);
  }

  @MessagePattern('user.assign_role')
  async assignRole(@Payload() data: { userId: string; role: any }): Promise<any> {
    return this.userService.assignRole(data.userId, data.role);
  }
}
