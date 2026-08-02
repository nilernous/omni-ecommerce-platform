import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MediaService } from './media.service';

@Controller()
export class MediaRpcController {
  constructor(private readonly mediaService: MediaService) {}

  @MessagePattern('media.upload')
  async upload(@Payload() data: { ownerId?: string; filename: string; mimeType: string; size: number }) {
    return this.mediaService.upload(data);
  }

  @MessagePattern('media.get_metadata')
  async getMetadata(@Payload() data: { id: string }) {
    return this.mediaService.getMetadata(data.id);
  }

  @MessagePattern('media.delete')
  async delete(@Payload() data: { id: string }) {
    return this.mediaService.delete(data.id);
  }
}
