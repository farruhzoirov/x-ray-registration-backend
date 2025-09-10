import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../schemas/registrations.schema';

export class GetFilteredRegistrationsDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  limit: number;

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
  @IsNumber()
  ageFrom?: string;

  @IsOptional()
  @IsNumber()
  ageTo?: string;

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

  @IsOptional()
  @IsEnum(Gender)
  gender?: string;
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
