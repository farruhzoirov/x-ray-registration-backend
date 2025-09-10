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
  CreateRegistrationDto,
  GetFilterdRegistrationsDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto';
import { getAgeHelper } from 'src/helpers/getAge.helper';
import { universalSearchQuery } from 'src/helpers/search.helper';
import { createDateRangeFilter } from 'src/helpers/dateRangeFilter.helper';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<RegistrationsDocument>,
  ) {}

  async getFileteredRegistrations(
    getFilteredRegistrationsDto: GetFilterdRegistrationsDto,
  ) {
    const page = getFilteredRegistrationsDto.page || 1;
    const limit = getFilteredRegistrationsDto.limit || 20;
    const skip = (page - 1) * limit;
    const pipeline: any[] = [];
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    if (getFilteredRegistrationsDto.search) {
      const search = await universalSearchQuery(
        getFilteredRegistrationsDto.search,
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

      pipeline.push({ $match: search });
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
        pipeline.push({ $match: { createdAt: createdAtFilter } });
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
        pipeline.push({ $match: { birthDate: birthDateFilter } });
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
      if (getFilteredRegistrationsDto.birthDateTo) {
        ageFilter.$lte = getFilteredRegistrationsDto.ageTo;
      }

      if (Object.keys(ageFilter).length > 0) {
        pipeline.push({ $match: { age: ageFilter } });
      }
    }

    if (getFilteredRegistrationsDto.address) {
      pipeline.push({
        $match: {
          $or: [
            { address: getFilteredRegistrationsDto.address },
            { otherAddress: getFilteredRegistrationsDto.address },
          ],
        },
      });
    }

    if (getFilteredRegistrationsDto.job) {
      pipeline.push({
        $match: {
          $or: [
            { job: getFilteredRegistrationsDto.job },
            { otherJob: getFilteredRegistrationsDto.job },
          ],
        },
      });
    }

    if (getFilteredRegistrationsDto.visitReason) {
      pipeline.push({
        $match: {
          $or: [
            { visitReason: getFilteredRegistrationsDto.visitReason },
            { otherVisitReason: getFilteredRegistrationsDto.visitReason },
          ],
        },
      });
    }

    const registrations = await this.registrationsModel
      .aggregate(pipeline)
      .exec();
    const countDocuments = await this.registrationsModel.countDocuments();

    return {
      data: registrations,
      totalPagesCount: Math.ceil(countDocuments / 20),
      totalCount: countDocuments,
      page,
      limit,
    };
  }

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto & {
      age?: number;
      cycleCount?: number;
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
          this.registrationsModel.findOne().sort({ createdAt: -1 }),
          this.registrationsModel
            .findOne({ createdAt: { $gte: today } })
            .sort({ dailyCount: -1 }),
        ]);

      if (countDocuments) {
        createRegistrationDto.cycleCount =
          (lastRegistration.cycleCount % 10000) + 1;
        createRegistrationDto.radiologyFilmNumber =
          (lastRegistration.radiologyFilmNumber % 1000) + 1;
        createRegistrationDto.dailyCount =
          (dailyRegistrationData?.dailyCount || 0) + 1;
      }

      await this.registrationsModel.create(createRegistrationDto);
      return {
        totalPagesCount: Math.ceil(countDocuments / 20),
        totalCount: countDocuments,
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
