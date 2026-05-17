import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackupModule } from 'src/backup/backup.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import {
  Registrations,
  RegistrationsSchema,
} from './schemas/registrations.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Registrations.name,
        schema: RegistrationsSchema,
      },
    ]),
    BackupModule,
  ],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
