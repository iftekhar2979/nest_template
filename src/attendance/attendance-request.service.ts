import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceSource, AttendanceStatus } from './schema/attendance.schema';
import {
  AttendanceRequest,
  RequestStatus,
  RequestType,
} from './schema/attendance-request.schema';
import {
  AttendanceRequestQueryDto,
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

  async listAll(query: AttendanceRequestQueryDto): Promise<{
    data: AttendanceRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.requestRepo.createQueryBuilder('r');

    // Populate requester (with employee info) and reviewer with selective fields
    qb.leftJoin('r.user', 'u').addSelect([
      'u.id',
      'u.fullName',
      'u.email',
      'u.avatarUrl',
    ]);
    qb.leftJoin('u.employee', 'e').addSelect([
      'e.id',
      'e.employeeCode',
      'e.employeeName',
    ]);
    qb.leftJoin('r.reviewer', 'rv').addSelect([
      'rv.id',
      'rv.fullName',
      'rv.email',
    ]);

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where('u.fullName LIKE :term', { term })
            .orWhere('e.employeeName LIKE :term', { term })
            .orWhere('e.employeeCode LIKE :term', { term });
        }),
      );
    }

    if (query.status)
      qb.andWhere('r.requestStatus = :status', { status: query.status });
    if (query.type) qb.andWhere('r.type = :type', { type: query.type });
    if (query.userId)
      qb.andWhere('r.userId = :userId', { userId: query.userId });
    if (query.from) qb.andWhere('r.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('r.date <= :to', { to: query.to });

    const page = query.page || 1;
    const limit = query.limit || 10;

    const [data, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
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
