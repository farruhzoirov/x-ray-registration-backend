import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  Registrations,
  RegistrationsDocument,
} from './schemas/registrations.schema';
import {
  AuthDto,
  CreateRegistrationDto,
  GetFilteredRegistrationsDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto';
import { getAgeHelper } from 'src/helpers/getAge.helper';
import { universalSearchQuery } from 'src/helpers/search.helper';
import { createDateRangeFilter } from 'src/helpers/dateRangeFilter.helper';
import { ConfigService } from '@nestjs/config';
import { formatDate } from 'src/helpers/formatDate.helper';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<RegistrationsDocument>,
    private readonly configService: ConfigService,
  ) {}

  async auth(authDto: AuthDto): Promise<boolean> {
    const userName = this.configService.get('AUTH').LOGIN;
    const password = this.configService.get('AUTH').PASSWORD;

    if (!userName) {
      throw new Error('Username is not found');
    }

    if (!password) {
      throw new Error('Username is not found');
    }

    if (authDto.username === userName && authDto.password === password) {
      return true;
    }

    return false;
  }

  async getFilteredRegistrations(dto: GetFilteredRegistrationsDto) {
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 20;
    const skip = (page - 1) * limit;

    const filters: Record<string, any> = {};

    if (dto.search?.trim()) {
      Object.assign(
        filters,
        await universalSearchQuery(dto.search.trim(), [
          'fullName',
          'phone',
          'address',
          'otherAddress',
          'job',
          'otherJob',
          'visitReason',
          'otherVisitReason',
          'radiologyReport',
          'otherRadiologyReport',
        ]),
      );
    }

    if (dto.createdAtFrom || dto.createdAtTo) {
      const createdAtFilter = createDateRangeFilter(
        dto.createdAtFrom,
        dto.createdAtTo,
      );
      if (createdAtFilter) filters.createdAt = createdAtFilter;
    }

    if (dto.birthDateFrom || dto.birthDateTo) {
      filters.birthDate = {};
      if (dto.birthDateFrom) filters.birthDate.$gte = dto.birthDateFrom;
      if (dto.birthDateTo) filters.birthDate.$lte = dto.birthDateTo;
    }

    if (dto.ageFrom || dto.ageTo) {
      filters.age = {};
      if (dto.ageFrom) filters.age.$gte = dto.ageFrom;
      if (dto.ageTo) filters.age.$lte = dto.ageTo;
    }

    if (dto.gender) filters.gender = dto.gender;

    const addRegexFilter = (field: string, value?: string) => {
      if (value?.trim()) {
        filters[field] = { $regex: value.trim(), $options: 'i' };
      }
    };

    addRegexFilter('address', dto.address);
    addRegexFilter('otherAddress', dto.otherAddress);
    addRegexFilter('job', dto.job);
    addRegexFilter('otherJob', dto.otherJob);
    addRegexFilter('visitReason', dto.visitReason);
    addRegexFilter('otherVisitReason', dto.otherVisitReason);
    addRegexFilter('radiologyReport', dto.radiologyReport);
    addRegexFilter('otherRadiologyReport', dto.otherRadiologyReport);

    const pipeline: any[] = [
      { $match: filters },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const [registrations, totalCount, lastRegistration] = await Promise.all([
      this.registrationsModel.aggregate(pipeline).exec(),
      this.registrationsModel.countDocuments(filters),
      this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
    ]);

    if (lastRegistration) {
      const idx = registrations.findIndex(
        (reg) => String(reg._id) === String(lastRegistration._id),
      );
      if (idx !== -1) {
        registrations[idx] = {
          ...registrations[idx],
          isDeletable: true,
        };
      }
    }

    return {
      data: registrations,
      totalPagesCount: Math.ceil(totalCount / limit),
      totalCount,
      page,
      limit,
    };
  }

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto & {
      age?: number;
      yearlyCount?: number;
      radiologyFilmNumber?: number;
      dailyCount?: number;
    },
  ): Promise<{ totalCount: number; totalPagesCount: number }> {
    try {
      const today = new Date();
      if (createRegistrationDto.birthDate) {
        createRegistrationDto.age = await getAgeHelper(
          createRegistrationDto.birthDate,
        );
      }

      const [countDocuments, lastRegistration] = await Promise.all([
        this.registrationsModel.countDocuments(),
        this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
      ]);

      if (countDocuments && lastRegistration) {
        const currentYear = new Date().getFullYear();
        if (
          new Date(Object(lastRegistration).createdAt).getFullYear() ===
          currentYear
        ) {
          createRegistrationDto.yearlyCount =
            (lastRegistration.yearlyCount || 0) + 1;
        } else {
          createRegistrationDto.yearlyCount = 1;
        }

        createRegistrationDto.radiologyFilmNumber =
          (lastRegistration.radiologyFilmNumber % 1000) + 1;

        const [formatCreatedAt, formatToday] = await Promise.all([
          formatDate(Object(lastRegistration).createdAt),
          formatDate(today),
        ]);

        if (formatCreatedAt === formatToday) {
          createRegistrationDto.dailyCount =
            Object(lastRegistration)?.dailyCount + 1;
        } else {
          createRegistrationDto.dailyCount = 1;
        }
      }

      await this.registrationsModel.create(createRegistrationDto);
      const countRegistrationDocuments =
        await this.registrationsModel.countDocuments();
      return {
        totalPagesCount: Math.ceil(countRegistrationDocuments / 20),
        totalCount: countRegistrationDocuments,
      };
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException('Error in createRegistration', err.message);
    }
  }

  async updateRegistration(
    updateRegistrationDto: UpdateRegistrationDto & { age?: number },
  ) {
    try {
      const findRegistrationData = await this.registrationsModel.findById(
        updateRegistrationDto.id,
      );

      if (!findRegistrationData) {
        throw new NotFoundException('Registration data not found');
      }

      if (updateRegistrationDto.birthDate) {
        updateRegistrationDto.age = await getAgeHelper(
          updateRegistrationDto.birthDate,
        );
      }

      await this.registrationsModel.findByIdAndUpdate(
        updateRegistrationDto.id,
        updateRegistrationDto,
      );

      const countDocuments = await this.registrationsModel.countDocuments();
      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Error in updateRegistration', err.message);
    }
  }

  async deleteRegistration(id: string) {
    try {
      const [findRegistrationData, lastRegistrationData] = await Promise.all([
        this.registrationsModel.findById(id),
        this.registrationsModel.findOne().sort({ createdAt: -1 }),
      ]);

      if (!findRegistrationData) {
        throw new NotFoundException('Registration data not found');
      }

      if (
        findRegistrationData.id.toString() !==
        lastRegistrationData.id.toString()
      ) {
        throw new BadRequestException(
          "Can't delete it, it must be latest registration",
        );
      }

      await this.registrationsModel.findByIdAndDelete(id);
      const countDocuments = await this.registrationsModel.countDocuments();
      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
      };
    } catch (err) {
      console.error('Error in deleteRegistration', err.message);
      throw new BadRequestException({
        success: false,
        message: err.message,
      });
    }
  }
}
