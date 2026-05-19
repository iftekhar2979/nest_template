import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AnalyticsPeriod } from '../../common/enums/db-design.enum';

@Schema({ collection: 'analytics_snapshots', timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class AnalyticsSnapshot extends Document {
  @Prop({ required: true })
  snapshotDate: Date;

  @Prop({ required: true, enum: AnalyticsPeriod })
  period: AnalyticsPeriod;

  @Prop({ required: true, trim: true })
  scope: string;

  @Prop({ default: 0 })
  revenueTotal: number;

  @Prop({ default: 'USD', uppercase: true, trim: true })
  currency: string;

  @Prop({ default: 0 })
  projectsTotal: number;

  @Prop({ default: 0 })
  projectsPending: number;

  @Prop({ default: 0 })
  projectsActive: number;

  @Prop({ default: 0 })
  projectsOnHold: number;

  @Prop({ default: 0 })
  projectsComplete: number;

  @Prop({ default: 0 })
  projectsNew: number;

  @Prop({ default: 0 })
  subscriptionsNew: number;

  @Prop({ default: 0 })
  subscriptionsCancelled: number;

  @Prop({ default: 0 })
  subscriptionsActive: number;

  createdAt: Date;
}

export const AnalyticsSnapshotSchema = SchemaFactory.createForClass(AnalyticsSnapshot);

AnalyticsSnapshotSchema.index(
  { snapshotDate: 1, period: 1, scope: 1 },
  { unique: true, name: 'idx_analytics_snapshot_unique' },
);
AnalyticsSnapshotSchema.index({ scope: 1, period: 1 }, { name: 'idx_analytics_scope_period' });
