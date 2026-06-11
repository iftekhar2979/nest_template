import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Brackets, In, Repository } from 'typeorm';
import { Employee, EmployeeStatus } from '../employees/schema/employee.schema';
import {
  LeaveLedgerEntry,
  LeaveLedgerType,
} from '../leave/schema/leave-ledger-entry.schema';
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
  AttendanceOverviewQueryDto,
  AttendanceOverviewStatus,
  AttendanceQueryDto,
  BulkCorrectionDto,
  CheckInOutDto,
  ManualCorrectionDto,
  PunchDto,
  PunchQueryDto,
  SortOrder,
  ZktecoPunchDto,
} from './dto/attendance.dto';
import { pagination } from '../shared/utils/pagination';

type ComputedMetrics = {
  workedMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  derivedStatus: AttendanceStatus;
};

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // How many past days each catch-up run will (re)finalize. Bounded so the
  // hourly job stays cheap while still self-healing recent server downtime.
  private static readonly FINALIZE_LOOKBACK_DAYS = 3;

  // Guards against overlapping runs if a finalize pass outlasts the interval.
  private finalizing = false;

  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(AttendancePunch)
    private readonly punchRepo: Repository<AttendancePunch>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(LeaveLedgerEntry)
    private readonly leaveLedgerRepo: Repository<LeaveLedgerEntry>,
    private readonly shiftsService: ShiftsService,
    private readonly holidaysService: HolidaysService,
    private readonly workweeksService: WorkweeksService,
  ) {}

  // --- Punch ingestion (device-agnostic) ---

  async recordPunch(dto: PunchDto): Promise<AttendanceRecord> {
    const punchedAt = new Date(dto.punchedAt);
    if (!(await this.isPunchWithinShiftWindow(dto.userId, punchedAt))) {
      throw new BadRequestException(
        'Punch rejected: time is outside the shift window (startTime - graceInMinutes to endTime + graceOutMinutes)',
      );
    }
    await this.savePunch(dto, punchedAt);
    return this.recomputeRecord(dto.userId, this.toDateString(punchedAt));
  }

  async recordBatchPunches(punches: PunchDto[]): Promise<{
    accepted: number;
    duplicates: number;
    rejected: number;
    recomputed: number;
  }> {
    let accepted = 0;
    let duplicates = 0;
    let rejected = 0;
    const affected = new Set<string>();
    const seenExternalIds = new Set<string>();
    const shiftCache = new Map<string, Shift | null>();

    for (const dto of punches) {
      if (dto.externalId) {
        if (seenExternalIds.has(dto.externalId)) {
          duplicates += 1;
          continue;
        }
        seenExternalIds.add(dto.externalId);
      }
      const punchedAt = new Date(dto.punchedAt);
      if (
        !(await this.isPunchWithinShiftWindow(dto.userId, punchedAt, shiftCache))
      ) {
        rejected += 1;
        continue;
      }
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

    return { accepted, duplicates, rejected, recomputed: affected.size };
  }

  // --- ZKTeco device ingestion (PIN = employeeNumber, order-based in/out) ---

  /**
   * Ingest raw punches forwarded by the ZKTeco push bridge. Resolves each
   * device PIN to the employee's userId via employeeNumber, dedupes on the
   * device's SN+index, rejects punches outside the shift window (start/end
   * extended by grace), then derives check-in/out from punch order (the
   * device's inoutstatus flag is unreliable, so it is ignored).
   */
  async recordDevicePunches(items: ZktecoPunchDto[]): Promise<{
    accepted: number;
    duplicates: number;
    rejected: number;
    unmatched: string[];
    recomputed: number;
  }> {
    const result = {
      accepted: 0,
      duplicates: 0,
      rejected: 0,
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
    const shiftCache = new Map<string, Shift | null>();

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
      if (
        !(await this.isPunchWithinShiftWindow(userId, punchedAt, shiftCache))
      ) {
        result.rejected += 1;
        continue;
      }
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

  private getFindAllQueryBuilder(query: AttendanceQueryDto) {
    const qb = this.recordRepo.createQueryBuilder('r');

    // Populate user and shift info with selective fields
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
      'e.departmentId',
      'e.designationId',
    ]);
    qb.leftJoin('e.department', 'd').addSelect(['d.id', 'd.departmentName']);
    qb.leftJoin('e.designation', 'dg').addSelect(['dg.id', 'dg.title']);
    qb.leftJoin('r.shift', 's').addSelect([
      's.id',
      's.name',
      's.startTime',
      's.endTime',
      's.type',
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

    if (query.userId)
      qb.andWhere('r.userId = :userId', { userId: query.userId });
    if (query.departmentId)
      qb.andWhere('e.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    if (query.shiftId)
      qb.andWhere('r.shiftId = :shiftId', { shiftId: query.shiftId });
    if (query.status)
      qb.andWhere('r.attendanceStatus = :status', { status: query.status });
    if (query.from) qb.andWhere('r.date >= :from', { from: query.from });
    if (query.to) qb.andWhere('r.date <= :to', { to: query.to });

    return qb;
  }

  async findAll(query: AttendanceQueryDto): Promise<{
    data: AttendanceRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.getFindAllQueryBuilder(query);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sort = query.sort === SortOrder.ASC ? 'ASC' : 'DESC';

    const [data, total] = await qb
      .orderBy('r.date', sort)
      .addOrderBy('r.userId', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Paginated raw-punch listing for admins. Joins user/employee/department so
   * results can be searched by name/code and filtered by department, and
   * ordered by the punch timestamp.
   */
  async findAllPunches(query: PunchQueryDto): Promise<{
    data: AttendancePunch[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.punchRepo.createQueryBuilder('p');

    qb.leftJoin('p.user', 'u').addSelect([
      'u.id',
      'u.fullName',
      'u.email',
      'u.avatarUrl',
    ]);
    qb.leftJoin('u.employee', 'e').addSelect([
      'e.id',
      'e.employeeCode',
      'e.employeeName',
      'e.departmentId',
    ]);
    qb.leftJoin('e.department', 'd').addSelect(['d.id', 'd.departmentName']);

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

    if (query.userId)
      qb.andWhere('p.userId = :userId', { userId: query.userId });
    if (query.departmentId)
      qb.andWhere('e.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    if (query.punchType)
      qb.andWhere('p.punchType = :punchType', { punchType: query.punchType });
    if (query.source)
      qb.andWhere('p.source = :source', { source: query.source });
    if (query.from)
      qb.andWhere('p.punchedAt >= :from', {
        from: new Date(`${query.from}T00:00:00`),
      });
    if (query.to)
      qb.andWhere('p.punchedAt <= :to', {
        to: new Date(`${query.to}T23:59:59.999`),
      });

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const sort = query.sort === SortOrder.ASC ? 'ASC' : 'DESC';

    const [data, total] = await qb
      .orderBy('p.punchedAt', sort)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Daily attendance overview for admins: headline counts (present / on-time /
   * late / absent) plus a paginated per-employee list with check-in/out times
   * and worked hours. Built from the active-employee roster LEFT JOINed onto
   * the day's record, so employees with no punch at all are surfaced as absent
   * (a record is only created once a punch or correction exists).
   */
  async getOverview(query: AttendanceOverviewQueryDto): Promise<{
    date: string;
    summary: {
      total: number;
      present: number;
      onTime: number;
      late: number;
      absent: number;
    };
    data: Array<{
      userId: string;
      employeeCode: string;
      employeeName: string;
      fullName: string | null;
      departmentName: string | null;
      checkInAt: Date | null;
      checkOutAt: Date | null;
      status: AttendanceStatus;
      workedMinutes: number;
      workingHours: number;
    }>;
    pagination: ReturnType<typeof pagination>;
  }> {
    const date = query.date ?? this.toDateString(new Date());

    // Active-employee roster joined to the day's record; search + department
    // filters are shared by both the summary aggregate and the list.
    const baseQb = () => {
      const qb = this.employeeRepo
        .createQueryBuilder('e')
        .leftJoin('e.user', 'u')
        .leftJoin('e.department', 'd')
        .leftJoin(
          AttendanceRecord,
          'r',
          'r.userId = e.userId AND r.date = :date',
          { date },
        )
        .where('e.employeeStatus = :active', {
          active: EmployeeStatus.ACTIVE,
        });

      if (query.search) {
        const term = `%${query.search}%`;
        qb.andWhere(
          new Brackets((inner) => {
            inner
              .where('e.employeeName LIKE :term', { term })
              .orWhere('e.employeeCode LIKE :term', { term })
              .orWhere('u.fullName LIKE :term', { term });
          }),
        );
      }
      if (query.departmentId) {
        qb.andWhere('e.departmentId = :departmentId', {
          departmentId: query.departmentId,
        });
      }
      return qb;
    };

    const summaryRaw = await baseQb()
      .select('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN r.attendanceStatus IN ('present','late','half_day') THEN 1 ELSE 0 END)",
        'present',
      )
      .addSelect(
        "SUM(CASE WHEN r.attendanceStatus = 'present' THEN 1 ELSE 0 END)",
        'onTime',
      )
      .addSelect(
        "SUM(CASE WHEN r.attendanceStatus = 'late' THEN 1 ELSE 0 END)",
        'late',
      )
      .addSelect(
        "SUM(CASE WHEN (r.id IS NULL OR r.attendanceStatus = 'absent') THEN 1 ELSE 0 END)",
        'absent',
      )
      .getRawOne();

    const summary = {
      total: Number(summaryRaw?.total) || 0,
      present: Number(summaryRaw?.present) || 0,
      onTime: Number(summaryRaw?.onTime) || 0,
      late: Number(summaryRaw?.late) || 0,
      absent: Number(summaryRaw?.absent) || 0,
    };

    const listQb = baseQb();
    if (query.status === AttendanceOverviewStatus.PRESENT) {
      listQb.andWhere(
        "r.attendanceStatus IN ('present','late','half_day')",
      );
    } else if (query.status === AttendanceOverviewStatus.LATE) {
      listQb.andWhere("r.attendanceStatus = 'late'");
    } else if (query.status === AttendanceOverviewStatus.ABSENT) {
      listQb.andWhere("(r.id IS NULL OR r.attendanceStatus = 'absent')");
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const total = await listQb.clone().getCount();

    const rows = await listQb
      .select('e.userId', 'userId')
      .addSelect('e.employeeCode', 'employeeCode')
      .addSelect('e.employeeName', 'employeeName')
      .addSelect('u.fullName', 'fullName')
      .addSelect('d.departmentName', 'departmentName')
      .addSelect('r.checkInAt', 'checkInAt')
      .addSelect('r.checkOutAt', 'checkOutAt')
      .addSelect('r.attendanceStatus', 'status')
      .addSelect('r.workedMinutes', 'workedMinutes')
      .orderBy('e.employeeName', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const data = rows.map((row) => {
      const workedMinutes = Number(row.workedMinutes) || 0;
      return {
        userId: row.userId,
        employeeCode: row.employeeCode,
        employeeName: row.employeeName,
        fullName: row.fullName ?? null,
        departmentName: row.departmentName ?? null,
        checkInAt: row.checkInAt ?? null,
        checkOutAt: row.checkOutAt ?? null,
        status: (row.status as AttendanceStatus) ?? AttendanceStatus.ABSENT,
        workedMinutes,
        workingHours: Math.round((workedMinutes / 60) * 100) / 100,
      };
    });

    return {
      date,
      summary,
      data,
      pagination: pagination({ page, limit, total }),
    };
  }

  // --- Scheduled finalization ---

  /**
   * Hourly self-healing finalizer. For each of the last
   * FINALIZE_LOOKBACK_DAYS completed days, every active employee who still has
   * no record for that day gets one created from their calendar: HOLIDAY,
   * WEEKLY_OFF, ON_LEAVE, or ABSENT (resolved via resolveDerivedStatusForDay,
   * which also accounts for shift swaps through the shift resolver). Employees
   * who already punched own a record and are left untouched, so the job is
   * idempotent — once a day is fully finalized later runs do almost nothing.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async finalizeRecentAttendance(): Promise<{ finalized: number }> {
    if (this.finalizing) {
      return { finalized: 0 };
    }
    this.finalizing = true;
    let finalized = 0;
    try {
      const today = new Date();
      for (let i = 1; i <= AttendanceService.FINALIZE_LOOKBACK_DAYS; i += 1) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);
        finalized += await this.finalizeDay(this.toDateString(day));
      }
      if (finalized > 0) {
        this.logger.log(
          `Attendance finalizer created ${finalized} record(s)`,
        );
      }
    } catch (err) {
      this.logger.error('Attendance finalizer failed', err as Error);
    } finally {
      this.finalizing = false;
    }
    return { finalized };
  }

  /**
   * Create missing records for one completed day. Only active employees with
   * no record yet are touched; the status for each is resolved from holiday /
   * weekly-off / leave, defaulting to ABSENT.
   */
  private async finalizeDay(date: string): Promise<number> {
    const missing = await this.employeeRepo
      .createQueryBuilder('e')
      .leftJoin(
        AttendanceRecord,
        'r',
        'r.userId = e.userId AND r.date = :date',
        { date },
      )
      .where('e.employeeStatus = :active', { active: EmployeeStatus.ACTIVE })
      .andWhere('r.id IS NULL')
      .select('e.userId', 'userId')
      .getRawMany<{ userId: string }>();

    for (const { userId } of missing) {
      await this.applyRecord({
        userId,
        date,
        checkInAt: null,
        checkOutAt: null,
        source: AttendanceSource.SYSTEM,
      });
    }
    return missing.length;
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
        // undefined keeps the existing punch times; only override when sent
        checkInAt: item.checkInAt ? new Date(item.checkInAt) : undefined,
        checkOutAt: item.checkOutAt ? new Date(item.checkOutAt) : undefined,
        source: AttendanceSource.MANUAL,
        remarks: dto.reason,
        actorId,
      });
    }
    return { updated: dto.items.length };
  }

  async exportCsv(query: AttendanceQueryDto): Promise<string> {
    const qb = this.getFindAllQueryBuilder(query);

    const records = await qb
      .orderBy('r.date', 'DESC')
      .addOrderBy('r.userId', 'ASC')
      .getMany();
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
    const halfDay = shift?.halfDayMinutes ?? fullDay / 2;
    let derivedStatus: AttendanceStatus;
    if (!checkInAt && !checkOutAt) {
      derivedStatus = AttendanceStatus.ABSENT;
    } else if (checkInAt && checkOutAt) {
      if (workedMinutes < halfDay) {
        // Punched but below the half-day minimum
        derivedStatus = AttendanceStatus.ABSENT;
      } else if (workedMinutes < fullDay && earlyLeaveMinutes > 0) {
        derivedStatus = AttendanceStatus.HALF_DAY;
      } else {
        // Full day covered; late/early minutes already exclude grace
        derivedStatus =
          lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      }
    } else {
      // Single punch: day still in progress, judge by check-in time only
      derivedStatus =
        lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
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
    if (workDay.isWeeklyOff) {
      return AttendanceStatus.WEEKLY_OFF;
    }
    if (await this.isUserOnLeave(userId, date)) {
      return AttendanceStatus.ON_LEAVE;
    }
    return baseStatus;
  }

  // Treats a leave-ledger USAGE entry dated this day as "on leave". Best-effort:
  // the ledger has no per-day expansion, so multi-day leave booked as a single
  // entry only marks its entryDate.
  private async isUserOnLeave(userId: string, date: string): Promise<boolean> {
    const count = await this.leaveLedgerRepo.count({
      where: { userId, entryType: LeaveLedgerType.USAGE, entryDate: date },
    });
    return count > 0;
  }

  /**
   * A punch is only valid inside the shift window extended by the grace
   * times: [startTime - graceInMinutes, endTime + graceOutMinutes]. An
   * early-morning punch is also checked against the previous day's shift when
   * that shift is overnight (it may be the check-out of yesterday's shift).
   * Users with no resolvable shift are not validated.
   */
  private async isPunchWithinShiftWindow(
    userId: string,
    punchedAt: Date,
    shiftCache?: Map<string, Shift | null>,
  ): Promise<boolean> {
    const date = this.toDateString(punchedAt);
    const shift = await this.resolveShiftCached(userId, date, shiftCache);
    console.log(shift)
    if (!shift) {
      return true;
    }
    if (this.isInsideShiftWindow(punchedAt, date, shift)) {
      return true;
    }

    const previous = new Date(punchedAt);
    previous.setDate(previous.getDate() - 1);
    const previousDate = this.toDateString(previous);
    const previousShift = await this.resolveShiftCached(
      userId,
      previousDate,
      shiftCache,
    );
    return Boolean(
      previousShift &&
        (previousShift.isOvernight ||
          previousShift.endTime <= previousShift.startTime) &&
        this.isInsideShiftWindow(punchedAt, previousDate, previousShift),
    );
  }

  private isInsideShiftWindow(
    punchedAt: Date,
    date: string,
    shift: Shift,
  ): boolean {
    const overnight = shift.isOvernight || shift.endTime <= shift.startTime;
    const windowStart =
      this.buildDateTime(date, shift.startTime).getTime() -
      shift.graceInMinutes * 60000;
    const windowEnd =
      this.buildDateTime(date, shift.endTime, overnight).getTime() +
      shift.graceOutMinutes * 60000;
    return (
      punchedAt.getTime() >= windowStart && punchedAt.getTime() <= windowEnd
    );
  }

  // Avoids re-resolving the same user/day shift for every punch in a batch.
  private async resolveShiftCached(
    userId: string,
    date: string,
    cache?: Map<string, Shift | null>,
  ): Promise<Shift | null> {
    const key = `${userId}|${date}`;
    if (cache?.has(key)) {
      return cache.get(key) ?? null;
    }
    const shift = await this.resolveShiftForAttendance(userId, date);
    cache?.set(key, shift);
    return shift;
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
