import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Employee } from '../employees/schema/employee.schema';
import { HolidaysService } from '../holidays/holidays.service';
import { Shift } from '../shifts/schema/shift.schema';
import { ShiftsService } from '../shifts/shifts.service';
import { WorkweeksService } from '../workweeks/workweeks.service';
import {
  AttendanceRecord,
  AttendanceSource,
  AttendanceStatus,
} from './schema/attendance.schema';
import {
  AttendancePunch,
  PunchSource,
  PunchType,
} from './schema/attendance-punch.schema';
import {
  AttendanceQueryDto,
  BulkCorrectionDto,
  CheckInOutDto,
  ManualCorrectionDto,
  PunchDto,
  ZktecoPunchDto,
} from './dto/attendance.dto';

type ComputedMetrics = {
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  derivedStatus: AttendanceStatus;
};

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(AttendancePunch)
    private readonly punchRepo: Repository<AttendancePunch>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly shiftsService: ShiftsService,
    private readonly holidaysService: HolidaysService,
    private readonly workweeksService: WorkweeksService,
  ) {}

  // --- Punch ingestion (device-agnostic) ---

  async recordPunch(dto: PunchDto): Promise<AttendanceRecord> {
    const punchedAt = new Date(dto.punchedAt);
    await this.savePunch(dto, punchedAt);
    return this.recomputeRecord(dto.userId, this.toDateString(punchedAt));
  }

  async recordBatchPunches(
    punches: PunchDto[],
  ): Promise<{ accepted: number; duplicates: number; recomputed: number }> {
    let accepted = 0;
    let duplicates = 0;
    const affected = new Set<string>();
    const seenExternalIds = new Set<string>();

    for (const dto of punches) {
      if (dto.externalId) {
        if (seenExternalIds.has(dto.externalId)) {
          duplicates += 1;
          continue;
        }
        seenExternalIds.add(dto.externalId);
      }
      const punchedAt = new Date(dto.punchedAt);
      const saved = await this.savePunch(dto, punchedAt);
      if (!saved) {
        duplicates += 1;
        continue;
      }
      accepted += 1;
      affected.add(`${dto.userId}|${this.toDateString(punchedAt)}`);
    }

    for (const key of affected) {
      const [userId, date] = key.split('|');
      await this.recomputeRecord(userId, date);
    }

    return { accepted, duplicates, recomputed: affected.size };
  }

  // --- ZKTeco device ingestion (PIN = employeeNumber, order-based in/out) ---

  /**
   * Ingest raw punches forwarded by the ZKTeco push bridge. Resolves each
   * device PIN to the employee's userId via employeeNumber, dedupes on the
   * device's SN+index, then derives check-in/out from punch order (the
   * device's inoutstatus flag is unreliable, so it is ignored).
   */
  async recordDevicePunches(items: ZktecoPunchDto[]): Promise<{
    accepted: number;
    duplicates: number;
    unmatched: string[];
    recomputed: number;
  }> {
    const result = {
      accepted: 0,
      duplicates: 0,
      unmatched: [] as string[],
      recomputed: 0,
    };

    const pins = [...new Set(items.map((i) => i.pin))];
    const employees = await this.employeeRepo.find({
      where: { employeeNumber: In(pins) },
      select: ['userId', 'employeeNumber'],
    });
    const pinToUser = new Map(
      employees.map((e) => [e.employeeNumber, e.userId]),
    );

    const affected = new Set<string>();
    const seenExternalIds = new Set<string>();

    for (const item of items) {
      const userId = pinToUser.get(item.pin);
      if (!userId) {
        if (!result.unmatched.includes(item.pin)) {
          result.unmatched.push(item.pin);
        }
        continue;
      }

      const externalId = this.buildDeviceExternalId(item);
      if (seenExternalIds.has(externalId)) {
        result.duplicates += 1;
        continue;
      }
      seenExternalIds.add(externalId);

      const punchedAt = this.parseDeviceTime(item.time);
      const saved = await this.savePunch(
        {
          userId,
          // provisional; corrected by relabelDevicePunchesByOrder below
          punchType: PunchType.IN,
          punchedAt: punchedAt.toISOString(),
          source: PunchSource.BIOMETRIC,
          deviceId: item.sn ?? null,
          externalId,
        },
        punchedAt,
      );
      if (!saved) {
        result.duplicates += 1;
        continue;
      }
      result.accepted += 1;
      affected.add(`${userId}|${this.toDateString(punchedAt)}`);
    }

    for (const key of affected) {
      const [userId, date] = key.split('|');
      await this.relabelDevicePunchesByOrder(userId, date);
      await this.recomputeRecord(userId, date);
    }
    result.recomputed = affected.size;

    return result;
  }

  // Stable dedupe key per device record: SN+index when available, else
  // SN+pin+time so a re-pushed log is never double-counted.
  private buildDeviceExternalId(item: ZktecoPunchDto): string {
    const sn = item.sn ?? 'na';
    if (item.index) {
      return `zk:${sn}:${item.index}`;
    }
    return `zk:${sn}:${item.pin}:${item.time}`;
  }

  // Device sends local "YYYY-MM-DD HH:MM:SS"; parse it in the server's local
  // timezone (bridge and server are assumed co-located / same TZ).
  private parseDeviceTime(time: string): Date {
    const iso = time.includes('T') ? time : time.replace(' ', 'T');
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid device punch time: ${time}`);
    }
    return parsed;
  }

  // Re-label a day's biometric punches by chronological order so recompute
  // reads a sensible span: earliest = check-in, everything after = check-out.
  private async relabelDevicePunchesByOrder(
    userId: string,
    date: string,
  ): Promise<void> {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    const punches = await this.punchRepo.find({
      where: {
        userId,
        source: PunchSource.BIOMETRIC,
        punchedAt: Between(dayStart, dayEnd),
      },
      order: { punchedAt: 'ASC' },
    });

    for (let i = 0; i < punches.length; i += 1) {
      const desired = i === 0 ? PunchType.IN : PunchType.OUT;
      if (punches[i].punchType !== desired) {
        await this.punchRepo.update({ id: punches[i].id }, { punchType: desired });
      }
    }
  }

  private async savePunch(
    dto: PunchDto,
    punchedAt: Date,
  ): Promise<AttendancePunch | null> {
    if (dto.externalId) {
      const existing = await this.punchRepo.findOne({
        where: { externalId: dto.externalId },
        withDeleted: true,
      });
      if (existing) {
        return null;
      }
    }
    return this.punchRepo.save(
      this.punchRepo.create({
        userId: dto.userId,
        punchType: dto.punchType,
        punchedAt,
        source: dto.source ?? PunchSource.BIOMETRIC,
        deviceId: dto.deviceId ?? null,
        externalId: dto.externalId ?? null,
      }),
    );
  }

  // --- Employee self check-in / check-out ---

  checkIn(userId: string, dto: CheckInOutDto): Promise<AttendanceRecord> {
    return this.recordPunch({
      userId,
      punchType: PunchType.IN,
      punchedAt: dto.at ?? new Date().toISOString(),
      source: dto.source ?? PunchSource.WEB,
    });
  }

  checkOut(userId: string, dto: CheckInOutDto): Promise<AttendanceRecord> {
    return this.recordPunch({
      userId,
      punchType: PunchType.OUT,
      punchedAt: dto.at ?? new Date().toISOString(),
      source: dto.source ?? PunchSource.WEB,
    });
  }

  // --- Self-service queries ---

  getMyAttendance(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<AttendanceRecord[]> {
    const qb = this.recordRepo
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId });
    if (from) qb.andWhere('r.date >= :from', { from });
    if (to) qb.andWhere('r.date <= :to', { to });
    return qb.orderBy('r.date', 'DESC').getMany();
  }

  getToday(userId: string): Promise<AttendanceRecord | null> {
    return this.recordRepo.findOne({
      where: { userId, date: this.toDateString(new Date()) },
    });
  }

  // --- Admin oversight ---

  async findAll(query: AttendanceQueryDto): Promise<AttendanceRecord[]> {
    const qb = this.recordRepo.createQueryBuilder('r');

    if (query.userId)
      qb.andWhere('r.userId = :userId', { userId: query.userId });
    if (query.shiftId)
      qb.andWhere('r.shiftId = :shiftId', { shiftId: query.shiftId });
    if (query.status)
      qb.andWhere('r.attendanceStatus = :status', { status: query.status });
    if (query.from) qb.andWhere('r.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('r.date <= :to', { to: query.to });

    if (query.departmentId) {
      const employees = await this.employeeRepo.find({
        where: { departmentId: query.departmentId },
        select: ['userId'],
      });
      const ids = employees.map((employee) => employee.userId);
      if (ids.length === 0) {
        return [];
      }
      qb.andWhere('r.userId IN (:...ids)', { ids });
    }

    return qb.orderBy('r.date', 'DESC').addOrderBy('r.userId', 'ASC').getMany();
  }

  async manualCorrection(
    dto: ManualCorrectionDto,
    actorId?: string,
  ): Promise<AttendanceRecord> {
    return this.applyRecord({
      userId: dto.userId,
      date: dto.date,
      attendanceStatus: dto.attendanceStatus,
      checkInAt: dto.checkInAt ? new Date(dto.checkInAt) : null,
      checkOutAt: dto.checkOutAt ? new Date(dto.checkOutAt) : null,
      source: AttendanceSource.MANUAL,
      remarks: dto.reason,
      actorId,
    });
  }

  async bulkCorrection(
    dto: BulkCorrectionDto,
    actorId?: string,
  ): Promise<{ updated: number }> {
    for (const item of dto.items) {
      await this.applyRecord({
        userId: item.userId,
        date: item.date,
        attendanceStatus: item.attendanceStatus,
        source: AttendanceSource.MANUAL,
        remarks: dto.reason,
        actorId,
      });
    }
    return { updated: dto.items.length };
  }

  async exportCsv(query: AttendanceQueryDto): Promise<string> {
    const records = await this.findAll(query);
    const header = [
      'date',
      'userId',
      'status',
      'checkInAt',
      'checkOutAt',
      'workedMinutes',
      'overtimeMinutes',
      'lateMinutes',
      'earlyLeaveMinutes',
      'shiftId',
      'source',
      'remarks',
    ];
    const rows = records.map((r) =>
      [
        r.date,
        r.userId,
        r.attendanceStatus,
        r.checkInAt ? r.checkInAt.toISOString() : '',
        r.checkOutAt ? r.checkOutAt.toISOString() : '',
        r.workedMinutes,
        r.overtimeMinutes,
        r.lateMinutes,
        r.earlyLeaveMinutes,
        r.shiftId ?? '',
        r.source,
        this.csvEscape(r.remarks ?? ''),
      ].join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  // --- Shared write path (used by corrections + request approvals) ---

  /**
   * Create or update the attendance record for a user/day from explicit
   * values. Used by admin corrections and approved regularization requests.
   */
  async applyRecord(params: {
    userId: string;
    date: string;
    attendanceStatus?: AttendanceStatus;
    checkInAt?: Date | null;
    checkOutAt?: Date | null;
    source: AttendanceSource;
    remarks?: string;
    actorId?: string;
  }): Promise<AttendanceRecord> {
    const shift = await this.resolveShiftForAttendance(
      params.userId,
      params.date,
    );
    const existing = await this.recordRepo.findOne({
      where: { userId: params.userId, date: params.date },
    });

    const checkInAt =
      params.checkInAt !== undefined
        ? params.checkInAt
        : (existing?.checkInAt ?? null);
    const checkOutAt =
      params.checkOutAt !== undefined
        ? params.checkOutAt
        : (existing?.checkOutAt ?? null);

    const metrics = this.computeMetrics(
      params.date,
      checkInAt,
      checkOutAt,
      shift,
    );
    const derivedStatus = await this.resolveDerivedStatusForDay(
      params.userId,
      params.date,
      metrics.derivedStatus,
      Boolean(checkInAt || checkOutAt),
    );

    return this.upsert(params.userId, params.date, {
      shiftId: shift?.id ?? null,
      checkInAt,
      checkOutAt,
      attendanceStatus: params.attendanceStatus ?? derivedStatus,
      workedMinutes: metrics.workedMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      lateMinutes: metrics.lateMinutes,
      earlyLeaveMinutes: metrics.earlyLeaveMinutes,
      source: params.source,
      remarks: params.remarks ?? existing?.remarks ?? null,
      updatedBy: params.actorId ?? null,
    });
  }

  // --- Core computation ---

  /**
   * Rebuild a day's record from raw punches. Skips records that were set by an
   * admin correction or an approved regularization so those decisions stick.
   */
  async recomputeRecord(
    userId: string,
    date: string,
  ): Promise<AttendanceRecord> {
    const existing = await this.recordRepo.findOne({
      where: { userId, date },
    });
    if (
      existing &&
      (existing.source === AttendanceSource.MANUAL ||
        existing.source === AttendanceSource.REGULARIZATION)
    ) {
      return existing;
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    const punches = await this.punchRepo.find({
      where: { userId, punchedAt: Between(dayStart, dayEnd) },
      order: { punchedAt: 'ASC' },
    });

    const ins = punches.filter((p) => p.punchType === PunchType.IN);
    const outs = punches.filter((p) => p.punchType === PunchType.OUT);
    const checkInAt = ins.length ? ins[0].punchedAt : null;
    const checkOutAt = outs.length ? outs[outs.length - 1].punchedAt : null;

    const shift = await this.resolveShiftForAttendance(userId, date);
    const metrics = this.computeMetrics(date, checkInAt, checkOutAt, shift);
    const derivedStatus = await this.resolveDerivedStatusForDay(
      userId,
      date,
      metrics.derivedStatus,
      punches.length > 0,
    );
    const source = punches.length
      ? this.mapPunchSource(punches[punches.length - 1].source)
      : AttendanceSource.SYSTEM;

    return this.upsert(userId, date, {
      shiftId: shift?.id ?? null,
      checkInAt,
      checkOutAt,
      attendanceStatus: derivedStatus,
      workedMinutes: metrics.workedMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      lateMinutes: metrics.lateMinutes,
      earlyLeaveMinutes: metrics.earlyLeaveMinutes,
      source,
    });
  }

  private computeMetrics(
    date: string,
    checkInAt: Date | null,
    checkOutAt: Date | null,
    shift: Shift | null,
  ): ComputedMetrics {
    let workedMinutes = 0;
    let overtimeMinutes = 0;
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;

    if (checkInAt && checkOutAt) {
      workedMinutes = Math.max(
        0,
        Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000) -
          (shift?.breakMinutes ?? 0),
      );
    }

    if (shift) {
      const overnight = shift.isOvernight || shift.endTime <= shift.startTime;
      const shiftStart = this.buildDateTime(date, shift.startTime);
      const shiftEnd = this.buildDateTime(date, shift.endTime, overnight);

      if (checkInAt) {
        const allowedIn = shiftStart.getTime() + shift.graceInMinutes * 60000;
        lateMinutes = Math.max(
          0,
          Math.round((checkInAt.getTime() - allowedIn) / 60000),
        );
      }
      if (checkOutAt) {
        const allowedOut = shiftEnd.getTime() - shift.graceOutMinutes * 60000;
        earlyLeaveMinutes = Math.max(
          0,
          Math.round((allowedOut - checkOutAt.getTime()) / 60000),
        );
      }
      if (workedMinutes > shift.fullDayMinutes) {
        overtimeMinutes = workedMinutes - shift.fullDayMinutes;
      }
    }

    const fullDay = shift?.fullDayMinutes ?? 480;
    let derivedStatus: AttendanceStatus;
    if (!checkInAt && !checkOutAt) {
      derivedStatus = AttendanceStatus.ABSENT;
    } else if (checkInAt && checkOutAt) {
      derivedStatus =
        workedMinutes >= fullDay
          ? AttendanceStatus.PRESENT
          : AttendanceStatus.HALF_DAY;
    } else {
      derivedStatus = AttendanceStatus.HALF_DAY;
    }

    return {
      workedMinutes,
      overtimeMinutes,
      lateMinutes,
      earlyLeaveMinutes,
      derivedStatus,
    };
  }

  private async upsert(
    userId: string,
    date: string,
    data: Partial<AttendanceRecord>,
  ): Promise<AttendanceRecord> {
    const existing = await this.recordRepo.findOne({
      where: { userId, date },
    });
    if (existing) {
      await this.recordRepo.update({ id: existing.id }, data);
      return this.recordRepo.findOne({ where: { id: existing.id } });
    }
    return this.recordRepo.save(
      this.recordRepo.create({ userId, date, ...data }),
    );
  }

  // --- Helpers ---

  private buildDateTime(date: string, time: string, nextDay = false): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(`${date}T00:00:00`);
    result.setHours(hours, minutes, 0, 0);
    if (nextDay) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }

  private async resolveDerivedStatusForDay(
    userId: string,
    date: string,
    baseStatus: AttendanceStatus,
    hasWorkEvidence: boolean,
  ): Promise<AttendanceStatus> {
    if (hasWorkEvidence) {
      return baseStatus;
    }

    const employee = await this.employeeRepo.findOne({
      where: { userId },
      select: ['holidayListId', 'location'],
    });
    const region = employee?.location?.trim() || 'global';
    const isHoliday = await this.holidaysService.isHolidayForEmployee(
      date,
      employee?.holidayListId,
      region,
    );
    if (isHoliday) {
      return AttendanceStatus.HOLIDAY;
    }

    const workDay = await this.workweeksService.resolveWorkDayForUser(
      userId,
      date,
    );
    return workDay.isWeeklyOff ? AttendanceStatus.WEEKLY_OFF : baseStatus;
  }

  private async resolveShiftForAttendance(
    userId: string,
    date: string,
  ): Promise<Shift | null> {
    const assignedShift = await this.shiftsService.resolveShiftForUser(
      userId,
      date,
    );
    if (assignedShift) {
      return assignedShift;
    }

    const workDay = await this.workweeksService.resolveWorkDayForUser(
      userId,
      date,
    );
    if (!workDay.pattern?.defaultShiftId) {
      return null;
    }
    return this.shiftsService.findOne(workDay.pattern.defaultShiftId);
  }

  private toDateString(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapPunchSource(source: PunchSource): AttendanceSource {
    switch (source) {
      case PunchSource.BIOMETRIC:
        return AttendanceSource.BIOMETRIC;
      case PunchSource.MOBILE:
        return AttendanceSource.MOBILE;
      // 'manual'/'web' web-entered punches map to WEB so auto-compute never
      // collides with admin MANUAL corrections (which are preserved).
      default:
        return AttendanceSource.WEB;
    }
  }

  private csvEscape(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
