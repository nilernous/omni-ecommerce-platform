import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

export interface MediaAsset {
  id: string;
  ownerId?: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnails: Record<string, string>;
  deletedAt?: string;
  createdAt: string;
}

@Injectable()
export class MediaService {
  private assets = new Map<string, MediaAsset>();
  private readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
  private readonly maxBytes = 10 * 1024 * 1024;

  async upload(data: { ownerId?: string; filename: string; mimeType: string; size: number }): Promise<MediaAsset> {
    if (!this.allowedMimeTypes.has(data.mimeType)) {
      throw new BadRequestException('Unsupported media type');
    }
    if (data.size > this.maxBytes) {
      throw new BadRequestException('Media file exceeds size limit');
    }

    const id = 'MED-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const asset: MediaAsset = {
      id,
      ownerId: data.ownerId,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      url: `/media/${id}/original.webp`,
      thumbnails: {
        small: `/media/${id}/150.webp`,
        medium: `/media/${id}/500.webp`,
        large: `/media/${id}/1200.webp`,
      },
      createdAt: new Date().toISOString(),
    };

    this.assets.set(id, asset);
    return asset;
  }

  async getMetadata(id: string): Promise<MediaAsset> {
    const asset = this.assets.get(id);
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Media asset not found');
    }
    return asset;
  }

  async delete(id: string): Promise<any> {
    const asset = await this.getMetadata(id);
    const deleted = { ...asset, deletedAt: new Date().toISOString() };
    this.assets.set(id, deleted);
    return { deleted: true, id };
  }
}
