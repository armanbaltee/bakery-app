import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: config.get<string>('UPLOAD_DEST', './uploads'),
          filename: (_req, file, cb) => {
            const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
            cb(null, uniqueName);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      }),
    }),
  ],
  providers: [UploadsService],
  exports: [UploadsService, MulterModule],
})
export class UploadsModule {}
