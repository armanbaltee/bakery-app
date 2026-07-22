import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadsService {
  constructor(private config: ConfigService) {}

  async saveFile(file: Express.Multer.File): Promise<string> {
    // Returns the public URL for the uploaded file
    const baseUrl =
      this.config.get<string>('BACKEND_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${file.filename}`;
  }
}
