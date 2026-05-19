import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'audit_logs', timestamps: { createdAt: 'createdAt', updatedAt: false } })
export class AuditLog extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  actorId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ required: true, trim: true })
  entityId: string;

  @Prop({ default: '' })
  payload: string;

  @Prop({ default: '' })
  ipAddress: string;

  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ actorId: 1 }, { name: 'idx_audit_actor_id' });
AuditLogSchema.index({ entityType: 1, entityId: 1 }, { name: 'idx_audit_entity_lookup' });
AuditLogSchema.index({ action: 1 }, { name: 'idx_audit_action' });
AuditLogSchema.index({ createdAt: -1 }, { name: 'idx_audit_created_at' });
