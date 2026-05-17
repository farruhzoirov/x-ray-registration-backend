import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model } from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import * as path from 'path';
import { Registrations } from '../registrations/schemas/registrations.schema';

const BACKUP_FIELDS: string[] = [
  '_id',
  'yearlyCount',
  'radiologyFilmNumber',
  'dailyCount',
  'fullName',
  'address',
  'otherAddress',
  'birthDate',
  'age',
  'gender',
  'job',
  'otherJob',
  'visitReason',
  'otherVisitReason',
  'radiationDose',
  'radiologyReport',
  'otherRadiologyReport',
  'phone',
  'createdAt',
  'updatedAt',
];

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private bot: TelegramBot;
  private userIds: string[];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<Registrations>,
  ) {
    this.bot = new TelegramBot(
      this.configService.get('BOT').TELEGRAM_BOT_TOKEN,
      { polling: false },
    );
    this.userIds = [
      this.configService.get('BOT').ADMIN_1_ID,
      this.configService.get('BOT').ADMIN_2_ID,
      this.configService.get('BOT').USER_ID,
    ];
  }

  private escapeCsvValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async handleCron() {
    const fileName = `backup-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(__dirname, '../../backups', fileName);

    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

      const docs = await this.registrationsModel
        .find()
        .lean<Record<string, unknown>[]>()
        .exec();

      const headers = BACKUP_FIELDS.join(',');
      const rows = docs.map((doc) =>
        BACKUP_FIELDS.map((field) => this.escapeCsvValue(doc[field])).join(','),
      );

      await fs.promises.writeFile(filePath, [headers, ...rows].join('\n'), 'utf8');

      for (const userId of this.userIds) {
        if (userId) {
          await this.bot.sendDocument(userId, fs.createReadStream(filePath));
        }
      }

      this.logger.log('✅ Backup done and sent to Telegram!');
    } catch (err) {
      this.logger.error('❌ Backup error:', err);
    } finally {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  }

  async sendWordFileToTelegram(wordFilePath: string, pdfFilePath: string) {
    for (const userId of this.userIds) {
      if (userId) {
        await this.bot.sendDocument(userId, fs.createReadStream(wordFilePath));
        await this.bot.sendDocument(userId, fs.createReadStream(pdfFilePath));
      }
    }
  }
}
