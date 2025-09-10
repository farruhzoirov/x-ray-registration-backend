import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateRegistrationDto,
  GetFilterdRegistrationsDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/get-list')
  async getFilteredRegistrations(
    @Body() getFilteredRegistrationsDto: GetFilterdRegistrationsDto,
  ) {
    const registrations =
      await this.registrationsService.getFileteredRegistrations(
        getFilteredRegistrationsDto,
      );
    return {
      message: 'Registrations...',
      data: registrations,
      success: true,
    };
  }

  @Post('create')
  async createRegistration(
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    await this.registrationsService.createRegistration(createRegistrationDto);
    return {
      message: 'Registration created successfully',
      success: true,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('update')
  async updateRegistration(
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    await this.registrationsService.updateRegistration(updateRegistrationDto);
    return {
      message: 'Registration updated successfully',
      success: true,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('delete')
  async deleteRegistration(@Body('id') id: string) {
    await this.registrationsService.deleteRegistration(id);
    return {
      message: 'Registration deleted successfully',
      success: true,
    };
  }
}
