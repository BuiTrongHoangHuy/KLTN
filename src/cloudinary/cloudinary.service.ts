import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'media-uploads',
        },
        (error, result) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                'Could not upload file to Cloudinary',
              ),
            );
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          resolve(result);
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
