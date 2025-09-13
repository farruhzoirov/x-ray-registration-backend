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

  async getFileteredRegistrations(
    getFilteredRegistrationsDto: GetFilteredRegistrationsDto,
  ) {
    const page = getFilteredRegistrationsDto.page || 1;
    const limit = getFilteredRegistrationsDto.limit || 20;
    const skip = (page - 1) * limit;
    const filters: any = {};

    if (getFilteredRegistrationsDto.search) {
      const search = await universalSearchQuery(
        getFilteredRegistrationsDto.search.trim(),
        [
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
        ],
      );
      Object.assign(filters, search);
    }

    if (
      getFilteredRegistrationsDto.createdAtFrom ||
      getFilteredRegistrationsDto.createdAtTo
    ) {
      const createdAtFilter = createDateRangeFilter(
        getFilteredRegistrationsDto.createdAtFrom,
        getFilteredRegistrationsDto.createdAtTo,
      );
      if (createdAtFilter) {
        filters.createdAt = createdAtFilter;
      }
    }

    if (
      getFilteredRegistrationsDto.birthDateFrom ||
      getFilteredRegistrationsDto.birthDateTo
    ) {
      const birthDateFilter: any = {};
      if (getFilteredRegistrationsDto.birthDateFrom) {
        birthDateFilter.$gte = getFilteredRegistrationsDto.birthDateFrom;
      }
      if (getFilteredRegistrationsDto.birthDateTo) {
        birthDateFilter.$lte = getFilteredRegistrationsDto.birthDateTo;
      }
      if (Object.keys(birthDateFilter).length > 0) {
        filters.birthDate = birthDateFilter;
      }
    }

    if (
      getFilteredRegistrationsDto.ageFrom ||
      getFilteredRegistrationsDto.ageTo
    ) {
      const ageFilter: any = {};
      if (getFilteredRegistrationsDto.ageFrom) {
        ageFilter.$gte = getFilteredRegistrationsDto.ageFrom;
      }
      if (getFilteredRegistrationsDto.ageTo) {
        ageFilter.$lte = getFilteredRegistrationsDto.ageTo;
      }
      if (Object.keys(ageFilter).length > 0) {
        filters.age = ageFilter;
      }
    }

    if (getFilteredRegistrationsDto.gender) {
      filters.gender = getFilteredRegistrationsDto.gender;
    }

    if (
      getFilteredRegistrationsDto.address ||
      getFilteredRegistrationsDto.otherAddress
    ) {
      if (getFilteredRegistrationsDto.address) {
        filters.address = {
          $regex: getFilteredRegistrationsDto.address.trim(),
          $options: 'i',
        };
      }
      if (getFilteredRegistrationsDto.otherAddress) {
        filters.otherAddress = {
          $regex: getFilteredRegistrationsDto.otherAddress.trim(),
          $options: 'i',
        };
      }
    }

    if (
      getFilteredRegistrationsDto.job ||
      getFilteredRegistrationsDto.otherAddress
    ) {
      if (getFilteredRegistrationsDto.job) {
        filters.job = {
          $regex: getFilteredRegistrationsDto.job.trim(),
          $options: 'i',
        };
      }
      if (getFilteredRegistrationsDto.otherJob) {
        filters.otherJob = {
          $regex: getFilteredRegistrationsDto.otherJob.trim(),
          $options: 'i',
        };
      }
    }

    if (
      getFilteredRegistrationsDto.visitReason ||
      getFilteredRegistrationsDto.otherVisitReason
    ) {
      if (getFilteredRegistrationsDto.visitReason) {
        filters.visitReason = {
          $regex: getFilteredRegistrationsDto.visitReason.trim(),
          $option: 'i',
        };
      }

      if (getFilteredRegistrationsDto.otherVisitReason) {
        filters.otherVisitReason = {
          $regex: getFilteredRegistrationsDto.otherVisitReason.trim(),
          $option: 'i',
        };
      }
    }

    if (
      getFilteredRegistrationsDto.radiologyReport ||
      getFilteredRegistrationsDto.otherRadiologyReport
    ) {
      if (getFilteredRegistrationsDto.radiologyReport) {
        filters.radiologyReport = {
          $regex: getFilteredRegistrationsDto.radiologyReport.trim(),
          $option: 'i',
        };
      }

      if (getFilteredRegistrationsDto.otherRadiologyReport) {
        filters.otherRadiologyReport = {
          $regex: getFilteredRegistrationsDto.otherRadiologyReport.trim(),
          $option: 'i',
        };
      }
    }
    const pipeline: any[] = [
      { $match: filters },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];
    const [registrations, countDocuments, lastRegistration] = await Promise.all(
      [
        this.registrationsModel.aggregate(pipeline).exec(),
        this.registrationsModel.countDocuments(filters),
        this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
      ],
    );

    if (lastRegistration) {
      const index = registrations.findIndex(
        (reg) => String(reg._id) === String(lastRegistration._id),
      );

      if (index !== -1) {
        registrations[index] = {
          ...registrations[index],
          isDeletable: true,
        };
      }
    }

    return {
      data: registrations,
      totalPagesCount: Math.ceil(countDocuments / limit),
      totalCount: countDocuments,
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
      today.setHours(0, 0, 0, 0);
      if (createRegistrationDto.birthDate) {
        createRegistrationDto.age = await getAgeHelper(
          createRegistrationDto.birthDate,
        );
      }

      const [countDocuments, lastRegistration, dailyRegistrationData] =
        await Promise.all([
          this.registrationsModel.countDocuments(),
          this.registrationsModel.findOne().sort({ createdAt: -1 }).lean(),
          this.registrationsModel
            .findOne({ createdAt: { $gte: today } })
            .sort({ dailyCount: -1 }),
        ]);

      if (countDocuments) {
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
        createRegistrationDto.dailyCount =
          (dailyRegistrationData?.dailyCount || 0) + 1;
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
