import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import {
  Registrations,
  RegistrationsSchema,
} from './schemas/registrations.schema';
import { BackupService } from 'src/backup/backup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Registrations.name,
        schema: RegistrationsSchema,
      },
    ]),
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, BackupService],
})
export class RegistrationsModule {}
