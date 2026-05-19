import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { BookingStatus } from '../../common/enums/db-design.enum';

@Schema({ collection: 'bookings' })
export class Booking extends Base {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true })
  clientId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  salesMemberId: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null })
  projectId: mongoose.Schema.Types.ObjectId;

  @Prop({ default: undefined })
  zoomMeetingId: string;

  @Prop({ default: '' })
  zoomJoinUrl: string;

  @Prop({ default: '' })
  zoomHostUrl: string;

  @Prop({ default: '' })
  zoomPassword: string;

  @Prop({ enum: BookingStatus, default: BookingStatus.REQUESTED })
  status: BookingStatus;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop({ default: 30 })
  durationMinutes: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

Booking.applyBaseHooks(BookingSchema);

BookingSchema.index(
  { zoomMeetingId: 1 },
  {
    unique: true,
    name: 'idx_bookings_zoom_meeting_id',
    partialFilterExpression: { zoomMeetingId: { $type: 'string' } },
  },
);
BookingSchema.index({ status: 1 }, { name: 'idx_bookings_status' });
BookingSchema.index({ scheduledAt: 1 }, { name: 'idx_bookings_time_slot' });
BookingSchema.index({ clientId: 1, status: 1 }, { name: 'idx_bookings_client_lookup' });
BookingSchema.index({ salesMemberId: 1, status: 1 }, { name: 'idx_bookings_sales_triage' });
