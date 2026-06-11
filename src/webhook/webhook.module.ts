import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { DeviceIpGuard } from '../shared/guards/device-ip.guard';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [AttendanceModule],
  controllers: [WebhookController],
  providers: [WebhookService, DeviceIpGuard],
})
export class WebhookModule {}
