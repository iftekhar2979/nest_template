import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as mongoose from 'mongoose';
import * as nodemailer from 'nodemailer';
import { S3Client, ListBucketsCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import Redis from 'ioredis';

export class ConnectivityValidator {
  private static readonly logger = new Logger('ConnectivityValidator');

  static async validate(configService: ConfigService) {
    this.logger.log('Starting connectivity validation...');

    await Promise.all([
      this.checkDatabase(configService),
      this.checkS3(configService),
      this.checkSMTP(configService),
      this.checkRedis(configService),
    ]);

    this.logger.log('All connectivity checks passed successfully!');
  }

  private static async checkDatabase(configService: ConfigService) {
    const dbUrl = configService.get<string>('DB_URL');
    try {
      this.logger.log('Checking Database connection...');
      const connection = await mongoose.connect(dbUrl);
      await connection.disconnect();
      this.logger.log('Database connection successful.');
    } catch (error) {
      this.logger.error(`Database connection failed: ${error.message}`);
      throw new Error(`DATABASE_CONNECTION_ERROR: ${error.message}`);
    }
  }

  private static async checkS3(configService: ConfigService) {
    const endpoint = configService.get<string>('MINIO_ENDPOINT');
    const region = configService.get<string>('AWS_REGION');
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucketName = configService.get<string>('AWS_PUBLIC_BUCKET_NAME');

    try {
      this.logger.log('Checking S3/MinIO connection...');
      const s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });

      // Check if we can list buckets (general connectivity)
      await s3Client.send(new ListBucketsCommand({}));

      // Check if specific bucket exists
      if (bucketName) {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        this.logger.log(`S3 connection successful. Bucket "${bucketName}" is accessible.`);
      } else {
        this.logger.log('S3 connection successful (no bucket specified for check).');
      }
    } catch (error) {
      this.logger.error(`S3/MinIO connection failed: ${error.message}`);
      throw new Error(`S3_CONNECTION_ERROR: ${error.message}`);
    }
  }

  private static async checkSMTP(configService: ConfigService) {
    const host = configService.get<string>('EMAIL_HOST');
    const port = configService.get<number>('EMAIL_PORT');
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASS');

    try {
      this.logger.log('Checking SMTP connection...');
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.verify();
      this.logger.log('SMTP connection successful.');
    } catch (error) {
      this.logger.error(`SMTP connection failed: ${error.message}`);
      throw new Error(`SMTP_CONNECTION_ERROR: ${error.message}`);
    }
  }

  private static async checkRedis(configService: ConfigService) {
    const host = configService.get<string>('REDIS_HOST');
    const port = configService.get<number>('REDIS_PORT');

    if (!host) {
      this.logger.warn('Redis host not provided, skipping Redis check.');
      return;
    }

    try {
      this.logger.log('Checking Redis connection...');
      const redis = new Redis({
        host,
        port,
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
      });

      await new Promise<void>((resolve, reject) => {
        redis.on('connect', () => {
          redis.disconnect();
          resolve();
        });
        redis.on('error', (err) => {
          redis.disconnect();
          reject(err);
        });
      });
      this.logger.log('Redis connection successful.');
    } catch (error) {
      this.logger.error(`Redis connection failed: ${error.message}`);
      throw new Error(`REDIS_CONNECTION_ERROR: ${error.message}`);
    }
  }
}
