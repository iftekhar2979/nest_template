import * as AWS from 'aws-sdk';
import * as multerS3 from 'multer-s3';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    
    destination: 'public/uploads', 
    filename: (req, file, callback) => {
      console.log('ON MULTER', file);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      callback(
        null,
        file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
      );
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'video/ogg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          'Invalid file type. Only image, audio, and video files are allowed',
        ),
        false,
      );
    }
  },
};


export const s3 = new AWS.S3({
  accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')  ,
  secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY') ,
  endpoint: configService.get<string>('AWS_ENDPOINT') ,
  s3ForcePathStyle: true, // 
  signatureVersion: 'v4',
})
export const multerS3Config = multerS3({
  s3: s3, 
  bucket: configService.get<string>('AWS_S3_BUCKET_NAME') || "whippedcream" ,
  acl: 'public-read',
  metadata: (req, file, callback) => {
    callback(null, { fieldName: file.fieldname  });
  },
  key: (req, file, callback) => {
    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    callback(null, uniqueFileName);
  },
});
