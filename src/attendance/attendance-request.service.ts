import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceSource, AttendanceStatus } from './schema/attendance.schema';
import {
  AttendanceRequest,
  RequestStatus,
  RequestType,
} from './schema/attendance-request.schema';
import {
  CreateAttendanceRequestDto,
  ReviewRequestDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceRequestService {
  constructor(
    @InjectRepository(AttendanceRequest)
    private readonly requestRepo: Repository<AttendanceRequest>,
    private readonly attendanceService: AttendanceService,
  ) {}

  create(
    userId: string,
    dto: CreateAttendanceRequestDto,
  ): Promise<AttendanceRequest> {
    return this.requestRepo.save(
      this.requestRepo.create({
        userId,
        type: dto.type,
        date: dto.date,
        requestedCheckInAt: dto.requestedCheckInAt
          ? new Date(dto.requestedCheckInAt)
          : null,
        requestedCheckOutAt: dto.requestedCheckOutAt
          ? new Date(dto.requestedCheckOutAt)
          : null,
        requestedStatus: dto.requestedStatus ?? null,
        reason: dto.reason,
        evidenceUrl: dto.evidenceUrl ?? null,
        requestStatus: RequestStatus.PENDING,
        createdBy: userId,
      }),
    );
  }

  listMine(userId: string, status?: RequestStatus): Promise<AttendanceRequest[]> {
    return this.requestRepo.find({
      where: { userId, ...(status ? { requestStatus: status } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  listAll(status?: RequestStatus): Promise<AttendanceRequest[]> {
    return this.requestRepo.find({
      where: status ? { requestStatus: status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async cancel(userId: string, id: string): Promise<AttendanceRequest> {
    const request = await this.getOwned(userId, id);
    if (request.requestStatus !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    request.requestStatus = RequestStatus.CANCELLED;
    return this.requestRepo.save(request);
  }

  async review(
    id: string,
    dto: ReviewRequestDto,
    reviewerId: string,
  ): Promise<AttendanceRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.requestStatus !== RequestStatus.PENDING) {
      throw new BadRequestException('Request has already been reviewed');
    }

    request.requestStatus =
      dto.action === 'approve'
        ? RequestStatus.APPROVED
        : RequestStatus.REJECTED;
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.reviewNote = dto.reviewNote ?? null;

    const saved = await this.requestRepo.save(request);

    if (saved.requestStatus === RequestStatus.APPROVED) {
      await this.applyApprovedRequest(saved, reviewerId);
    }

    return saved;
  }

  private async applyApprovedRequest(
    request: AttendanceRequest,
    reviewerId: string,
  ): Promise<void> {
    // Overtime claims don't change the day's punches/status.
    if (request.type === RequestType.OVERTIME) {
      return;
    }

    const params: Parameters<AttendanceService['applyRecord']>[0] = {
      userId: request.userId,
      date: request.date,
      source: AttendanceSource.REGULARIZATION,
      remarks: request.reason,
      actorId: reviewerId,
    };

    if (
      request.type === RequestType.MISSED_CHECK_IN ||
      request.type === RequestType.MANUAL_ATTENDANCE
    ) {
      if (request.requestedCheckInAt) {
        params.checkInAt = request.requestedCheckInAt;
      }
    }
    if (
      request.type === RequestType.MISSED_CHECK_OUT ||
      request.type === RequestType.MANUAL_ATTENDANCE
    ) {
      if (request.requestedCheckOutAt) {
        params.checkOutAt = request.requestedCheckOutAt;
      }
    }
    if (request.type === RequestType.ABSENCE) {
      params.attendanceStatus =
        request.requestedStatus ?? AttendanceStatus.ABSENT;
    } else if (request.requestedStatus) {
      params.attendanceStatus = request.requestedStatus;
    }

    await this.attendanceService.applyRecord(params);
  }

  private async getOwned(
    userId: string,
    id: string,
  ): Promise<AttendanceRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.userId !== userId) {
      throw new ForbiddenException('You can only manage your own requests');
    }
    return request;
  }
}
