import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid';

export enum FileType {
  AUDIO = 'audio',
  IMAGE = 'image',
}

@Injectable()
export class FileService {
  createFile(type: FileType, file: Express.Multer.File): string {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = uuid.v4() + '.' + fileExtension;
      const filePath = path.resolve(__dirname, '..', 'static', type);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }
      fs.writeFileSync(path.resolve(filePath, fileName), file.buffer);
      return type + '/' + fileName;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  deleteFile(relativePath: string): void {
    const normalized = relativePath.replace(/\\/g, '/');
    if (!/^(audio|image)\/[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(normalized))
      return;
    const absolutePath = path.resolve(__dirname, '..', 'static', normalized);
    const staticRoot = path.resolve(__dirname, '..', 'static') + path.sep;
    if (!absolutePath.startsWith(staticRoot)) return;
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  }
}
