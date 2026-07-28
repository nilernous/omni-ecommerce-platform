import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  constructor(@Inject(USER_SERVICE) private readonly userClient: ClientProxy) {}

  getProfile(userId: string) {
    return lastValueFrom(this.userClient.send(PATTERNS.USER.GET_PROFILE, { userId }));
  }

  updateProfile(userId: string, data: any) {
    return lastValueFrom(this.userClient.send(PATTERNS.USER.UPDATE_PROFILE, { userId, ...data }));
  }

  getUserById(id: string) {
    return lastValueFrom(this.userClient.send(PATTERNS.USER.GET_BY_ID, { id }));
  }

  listUsers(query: any) {
    return lastValueFrom(this.userClient.send(PATTERNS.USER.LIST_USERS, query));
  }
}
