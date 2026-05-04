import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

/*const validators: any = {};

function MinLength(length: number) {
  return function (target: any, propertyKey: string) {
    if (!validators[target.constructor.name]) {
      validators[target.constructor.name] = {};
    }

    validators[target.constructor.name][propertyKey] = length;
  };
}
*/
