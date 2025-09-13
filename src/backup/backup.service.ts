import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const execAsync = promisify(exec);
import * as crypto from 'crypto';
(global as any).crypto = crypto;

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private bot: TelegramBot;
  private chatId: string;
  private mongoUri: string;
  private userIds: string[];

  constructor(private readonly configService: ConfigService) {
    this.bot = new TelegramBot(
      this.configService.get('BOT').TELEGRAM_BOT_TOKEN,
      { polling: false },
    );
    this.mongoUri = this.configService.get('CONFIG_DATABASE').MONGODB_URI;
    this.userIds = [
      this.configService.get('BOT').ADMIN_1_ID,
      this.configService.get('BOT').ADMIN_2_ID,
      // this.configService.get('BOT').USER_ID,
    ];
  }

  @Cron('50 23 * * *')
  async handleCron() {
    const fileName = `backup-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(__dirname, '../../backups', fileName);

    try {
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      const command = `mongoexport --uri="${this.mongoUri}" --collection=registrations --type=csv --fields="_id,yearlyCount,radiologyFilmNumber,dailyCount,fullName,address,otherAddress,birthDate,age,gender,job,otherJob,visitReason,otherVisitReason,radiationDose,radiologyReport,otherRadiologyReport,phone,createdAt,updatedAt" --out="${filePath}"`;
      await execAsync(command);

      if (fs.existsSync(filePath)) {
        for (const userId of this.userIds) {
          await this.bot.sendDocument(userId, fs.createReadStream(filePath));
        }

        this.logger.log('✅ Backup done and sent to Telegram!');
      } else {
        this.logger.error('❌ Backup file not found after export!');
      }
    } catch (err) {
      this.logger.error('❌ Backup error:', err);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
