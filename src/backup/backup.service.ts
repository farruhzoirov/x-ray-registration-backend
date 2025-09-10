import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import TelegramBot from 'node-telegram-bot-api';
import * as fs from 'fs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private bot = new TelegramBot(
    '8275777854:AAHyyIylq2G0Q0I_5uSRF6W2Dzruh3KEk38',
    { polling: false },
  );
  private chatId = 8189683531;
  @Cron('55 22 * * *')
  async handleCron() {
    try {
      const fileName = `backup-${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `./${fileName}`;
      const command = `mongoexport --uri="${'mongodb://superAdmin:Xf93%21qLz8%40VnRp2%23@62.171.170.212:27017/dynamics-market?authSource=admin'}" --collection=products --type=csv --fields="_id,nameUz,nameRu,nameEn" --out="${filePath}"`;
      await execAsync(command);
      await this.bot.sendDocument(this.chatId, fs.createReadStream(filePath));
      console.log('✅ Backup done and sent to Telegram!');
    } catch (err) {
      console.error('❌ Backup error:', err);
    }
  }
}
