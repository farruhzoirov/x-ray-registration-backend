import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../schemas/registrations.schema';

export class GetFilterdRegistrationsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  birthDateFrom?: string;

  @IsOptional()
  @IsDateString()
  birthDateTo?: string;

  @IsOptional()
  @IsDateString()
  createdAtFrom?: string;

  @IsOptional()
  @IsDateString()
  createdAtTo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  visitReason?: string;
}

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  otherAddress?: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsString()
  @IsOptional()
  job?: string;

  @IsString()
  @IsOptional()
  otherJob?: string;

  @IsString()
  @IsOptional()
  visitReason?: string;

  @IsString()
  @IsOptional()
  otherVisitReason?: string;

  @IsString()
  @IsNotEmpty()
  radiationDose: string;

  @IsString()
  @IsOptional()
  radiologyReport?: string;

  @IsString()
  @IsOptional()
  otherRadiologyReport?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class UpdateRegistrationDto {
  @IsMongoId()
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  otherAddress?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsOptional()
  job?: string;

  @IsString()
  @IsOptional()
  otherJob?: string;

  @IsString()
  @IsOptional()
  visitReason?: string;

  @IsString()
  @IsOptional()
  otherVisitReason?: string;

  @IsString()
  @IsOptional()
  radiationDose?: string;

  @IsString()
  @IsOptional()
  radiologyReport?: string;

  @IsString()
  @IsOptional()
  otherRadiologyReport?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class DeleteRegistrationDto {
  @IsMongoId()
  @IsString()
  id: string;
}
