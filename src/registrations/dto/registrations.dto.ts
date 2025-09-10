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
  @IsString()
  birthDateFrom?: string;

  @IsOptional()
  @IsString()
  birthDateTo?: string;

  @IsOptional()
  @IsString()
  createdAtFrom?: string;

  @IsOptional()
  @IsString()
  createdAtTo?: string;

  @IsOptional()
  address?: string;

  @IsOptional()
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
  raditionDose: string;

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
  raditionDose?: string;

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
