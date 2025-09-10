import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationError, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = 7000;

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     exceptionFactory: (errors: ValidationError[]) => {
  //       const formattedErrors = errors.map((err: ValidationError) => ({
  //         field: err.property,
  //         message: Object.values(err.constraints || {}).join(', '),
  //       }));
  //       return {
  //         success: false,
  //         message: formattedErrors,
  //       };
  //     },
  //   }),
  // );

  await app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
}
bootstrap();
