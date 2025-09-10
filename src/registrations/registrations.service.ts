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

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectModel(Registrations.name)
    private readonly registrationsModel: Model<RegistrationsDocument>,
  ) {}

  async getFileteredRegistrations(
    getFilteredRegistrationsDto: GetFilterdRegistrationsDto,
  ) {
    if (getFilteredRegistrationsDto.search) {
    }
  }

  async createRegistration(
    createRegistrationDto: CreateRegistrationDto & {
      age?: number;
      cycleCount?: number;
      shortCycleCount?: number;
      dailyCount?: number;
    },
  ) {
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
        createRegistrationDto.shortCycleCount =
          (lastRegistration.shortCycleCount % 1000) + 1;
        createRegistrationDto.dailyCount =
          (dailyRegistrationData?.dailyCount || 0) + 1;
      }

      await this.registrationsModel.create(createRegistrationDto);
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
    } catch (err) {
      console.error('Error in deleteRegistration', err.message);
      throw new BadRequestException({
        success: false,
        message: err.message,
      });
    }
  }
}
