import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  AuthDto,
  CreateRegistrationDto,
  GetFilteredRegistrationsDto,
  UpdateRegistrationDto,
} from './dto/registrations.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/auth')
  async authService(@Body() authDto: AuthDto) {
    const isValid = await this.registrationsService.authService(authDto);

    if (!isValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credential',
      });
    }

    return {
      success: true,
      message: 'Authorized successfully',
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/get-list')
  async getFilteredRegistrations(
    @Body() getFilteredRegistrationsDto: GetFilteredRegistrationsDto,
  ) {
    const { data, totalCount, totalPagesCount, page, limit } =
      await this.registrationsService.getFileteredRegistrations(
        getFilteredRegistrationsDto,
      );
    return {
      message: 'Registrations...',
      success: true,
      data,
      totalCount,
      totalPagesCount,
      page,
      limit,
    };
  }

  @Post('create')
  async createRegistration(
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    const { totalCount, totalPagesCount } =
      await this.registrationsService.createRegistration(createRegistrationDto);
    return {
      message: 'Registration created successfully',
      success: true,
      totalCount,
      totalPagesCount,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('update')
  async updateRegistration(
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    const { totalCount, totalPagesCount } =
      await this.registrationsService.updateRegistration(updateRegistrationDto);
    return {
      message: 'Registration updated successfully',
      success: true,
      totalCount,
      totalPagesCount,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('delete')
  async deleteRegistration(@Body('id') id: string) {
    const { totalCount, totalPagesCount } =
      await this.registrationsService.deleteRegistration(id);
    return {
      message: 'Registration deleted successfully',
      success: true,
      totalCount,
      totalPagesCount,
    };
  }
}
