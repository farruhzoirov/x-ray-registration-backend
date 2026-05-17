import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Registrations,
  RegistrationsSchema,
} from '../registrations/schemas/registrations.schema';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Registrations.name, schema: RegistrationsSchema },
    ]),
  ],
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}
