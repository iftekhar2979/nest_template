import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsSnapshot, AnalyticsSnapshotSchema } from './schema/analytics-snapshots.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsSnapshot.name, schema: AnalyticsSnapshotSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class AnalyticsModule {}
