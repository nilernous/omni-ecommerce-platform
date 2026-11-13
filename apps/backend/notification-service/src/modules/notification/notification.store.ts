import { Injectable, NotFoundException } from '@nestjs/common';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED_OPT_OUT';

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  userId?: string;
  to?: string;
  subject?: string;
  template?: string;
  body?: string;
  payload?: unknown;
  status: NotificationStatus;
  attempts: number;
  errorMessage?: string;
  readAt: string | null;
  createdAt: string;
  sentAt?: string;
}

/**
 * Notification log. In-memory until notification_db is wired (phase "database per service");
 * the shape mirrors the NotificationLog Prisma model.
 */
@Injectable()
export class NotificationStore {
  private readonly records = new Map<string, NotificationRecord>();

  create(data: Omit<NotificationRecord, 'id' | 'createdAt' | 'readAt' | 'attempts' | 'status'> & { status?: NotificationStatus }): NotificationRecord {
    const record: NotificationRecord = {
      id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 100000),
      status: 'PENDING',
      attempts: 0,
      readAt: null,
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.records.set(record.id, record);
    return record;
  }

  get(id: string): NotificationRecord {
    const record = this.records.get(id);
    if (!record) {
      throw new NotFoundException('Notification not found');
    }
    return record;
  }

  find(id: string): NotificationRecord | undefined {
    return this.records.get(id);
  }

  update(id: string, changes: Partial<NotificationRecord>): NotificationRecord {
    const updated = { ...this.get(id), ...changes };
    this.records.set(id, updated);
    return updated;
  }

  listByUser(userId: string): NotificationRecord[] {
    return [...this.records.values()].filter((record) => record.userId === userId);
  }
}
