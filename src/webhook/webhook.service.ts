import { Injectable } from '@nestjs/common';
import { AttendanceService } from '../attendance/attendance.service';
import { ZktecoPunchDto } from '../attendance/dto/attendance.dto';

/**
 * Receives punch payloads forwarded by external device servers (the ZKTeco
 * push bridge) and hands them to the attendance punch-ingestion API.
 */
@Injectable()
export class WebhookService {
  constructor(private readonly attendanceService: AttendanceService) {}

  handleZktecoPunches(punches: ZktecoPunchDto[]) {
    return this.attendanceService.recordDevicePunches(punches);
  }
}
