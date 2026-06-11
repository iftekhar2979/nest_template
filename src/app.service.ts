import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger('Database');

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (this.dataSource?.isInitialized) {
      this.logger.log('MySQL is connected');
    } else {
      this.logger.warn('MySQL is not connected');
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
