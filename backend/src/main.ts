import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 프론트엔드 연동을 위해 CORS 허용
  
  // Base64 이미지 등 큰 용량의 데이터를 받기 위해 페이로드 제한을 늘립니다.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
