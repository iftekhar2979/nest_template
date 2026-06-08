import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftsModule } from '../shifts/shifts.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { Employee } from '../employees/schema/employee.schema';
import { WorkweeksModule } from '../workweeks/workweeks.module';
import { AttendanceRecord } from './schema/attendance.schema';
import { AttendancePunch } from './schema/attendance-punch.schema';
import { AttendanceRequest } from './schema/attendance-request.schema';
import { AttendanceService } from './attendance.service';
import { AttendanceRequestService } from './attendance-request.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceRequestController } from './attendance-request.controller';
import { DeviceApiKeyGuard } from '../shared/guards/device-api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecord,
      AttendancePunch,
      AttendanceRequest,
      Employee,
    ]),
    ShiftsModule,
    HolidaysModule,
    WorkweeksModule,
  ],
  controllers: [AttendanceController, AttendanceRequestController],
  providers: [AttendanceService, AttendanceRequestService, DeviceApiKeyGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
