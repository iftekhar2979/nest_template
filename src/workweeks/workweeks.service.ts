import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, Repository } from 'typeorm';
import { Employee } from '../employees/schema/employee.schema';
import {
  AssignWorkWeekPatternDto,
  CreateDayOverrideDto,
  CreateWeekdaySwapDto,
  CreateWorkWeekPatternDto,
  QueryWorkWeekPatternDto,
  UpdateWorkWeekPatternDto,
  WorkWeekPatternSortBy,
} from './dto/work-week.dto';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import { SortOrder } from '../shared/dto/pagination.dto';
import {
  DayOverrideType,
  EmployeeDayOverride,
} from './schema/employee-day-override.schema';
import { EmployeeWorkWeekAssignment } from './schema/employee-work-week-assignment.schema';
import { Weekday, WorkWeekPattern } from './schema/work-week-pattern.schema';

export type ResolvedWorkDay = {
  isWeeklyOff: boolean;
  override?: EmployeeDayOverride | null;
  assignment?: EmployeeWorkWeekAssignment | null;
  pattern?: WorkWeekPattern | null;
};

@Injectable()
export class WorkweeksService {
  constructor(
    @InjectRepository(WorkWeekPattern)
    private readonly patternRepo: Repository<WorkWeekPattern>,
    @InjectRepository(EmployeeWorkWeekAssignment)
    private readonly assignmentRepo: Repository<EmployeeWorkWeekAssignment>,
    @InjectRepository(EmployeeDayOverride)
    private readonly overrideRepo: Repository<EmployeeDayOverride>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  async createPattern(
    dto: CreateWorkWeekPatternDto,
    actorId?: string,
  ): Promise<WorkWeekPattern> {
    this.validatePatternDays(dto.workingDays, dto.weeklyOffDays);
    return this.patternRepo.save(
      this.patternRepo.create({
        ...dto,
        companyId: dto.companyId ?? null,
        defaultShiftId: dto.defaultShiftId ?? null,
        description: dto.description ?? null,
        createdBy: actorId ?? null,
      }),
    );
  }

  async findPatterns(
    query: QueryWorkWeekPatternDto,
  ): Promise<{ data: WorkWeekPattern[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? WorkWeekPatternSortBy.NAME;
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const qb = this.patternRepo.createQueryBuilder('pattern');

    if (query.search) {
      qb.andWhere('pattern.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.companyId) {
      qb.andWhere('pattern.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    qb.orderBy(`pattern.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  async findPattern(id: string): Promise<WorkWeekPattern> {
    const pattern = await this.patternRepo.findOne({ where: { id } });
    if (!pattern) {
      throw new NotFoundException('Work week pattern not found');
    }
    return pattern;
  }

  async updatePattern(
    id: string,
    dto: UpdateWorkWeekPatternDto,
    actorId?: string,
  ): Promise<WorkWeekPattern> {
    const existing = await this.findPattern(id);
    this.validatePatternDays(
      dto.workingDays ?? existing.workingDays,
      dto.weeklyOffDays ?? existing.weeklyOffDays,
    );
    await this.patternRepo.update(
      { id },
      {
        ...dto,
        defaultShiftId: dto.defaultShiftId ?? existing.defaultShiftId,
        updatedBy: actorId ?? null,
      },
    );
    return this.findPattern(id);
  }

  async removePattern(id: string): Promise<{ message: string }> {
    await this.findPattern(id);
    await this.patternRepo.softDelete({ id });
    return { message: 'Work week pattern deleted successfully' };
  }

  async assignPattern(
    dto: AssignWorkWeekPatternDto,
    actorId?: string,
  ): Promise<EmployeeWorkWeekAssignment> {
    await this.findPattern(dto.workWeekPatternId);
    const employee = await this.findEmployeeByUserId(dto.userId);
    return this.assignmentRepo.save(
      this.assignmentRepo.create({
        userId: dto.userId,
        employeeId: employee.id,
        workWeekPatternId: dto.workWeekPatternId,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
        createdBy: actorId ?? null,
      }),
    );
  }

  findAssignmentsForUser(
    userId: string,
  ): Promise<EmployeeWorkWeekAssignment[]> {
    return this.assignmentRepo.find({
      where: { userId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async removeAssignment(id: string): Promise<{ message: string }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Work week assignment not found');
    }
    await this.assignmentRepo.softDelete({ id });
    return { message: 'Work week assignment deleted successfully' };
  }

  async createOverride(
    dto: CreateDayOverrideDto,
    actorId?: string,
  ): Promise<EmployeeDayOverride> {
    const employee = await this.findEmployeeByUserId(dto.userId);
    await this.ensureNoOverride(dto.userId, dto.date);
    return this.overrideRepo.save(
      this.overrideRepo.create({
        userId: dto.userId,
        employeeId: employee.id,
        date: dto.date,
        type: dto.type,
        linkedSwapId: dto.linkedSwapId ?? null,
        reason: dto.reason,
        createdBy: actorId ?? null,
      }),
    );
  }

  async createWeekdaySwap(
    dto: CreateWeekdaySwapDto,
    actorId?: string,
  ): Promise<{ swapId: string; overrides: EmployeeDayOverride[] }> {
    if (dto.workingDate === dto.weeklyOffDate) {
      throw new BadRequestException('Swap dates must be different');
    }

    const employee = await this.findEmployeeByUserId(dto.userId);
    await this.ensureNoOverride(dto.userId, dto.workingDate);
    await this.ensureNoOverride(dto.userId, dto.weeklyOffDate);

    const swapId = randomUUID();
    const overrides = await this.overrideRepo.save([
      this.overrideRepo.create({
        userId: dto.userId,
        employeeId: employee.id,
        date: dto.workingDate,
        type: DayOverrideType.WORKING_DAY,
        linkedSwapId: swapId,
        reason: dto.reason,
        createdBy: actorId ?? null,
      }),
      this.overrideRepo.create({
        userId: dto.userId,
        employeeId: employee.id,
        date: dto.weeklyOffDate,
        type: DayOverrideType.WEEKLY_OFF,
        linkedSwapId: swapId,
        reason: dto.reason,
        createdBy: actorId ?? null,
      }),
    ]);

    return { swapId, overrides };
  }

  findOverridesForUser(userId: string): Promise<EmployeeDayOverride[]> {
    return this.overrideRepo.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async removeOverride(id: string): Promise<{ message: string }> {
    const override = await this.overrideRepo.findOne({ where: { id } });
    if (!override) {
      throw new NotFoundException('Day override not found');
    }
    await this.overrideRepo.softDelete({ id });
    return { message: 'Day override deleted successfully' };
  }

  async resolveWorkDayForUser(
    userId: string,
    date: string,
  ): Promise<ResolvedWorkDay> {
    const override = await this.overrideRepo.findOne({
      where: { userId, date },
    });
    if (override) {
      return {
        isWeeklyOff: override.type === DayOverrideType.WEEKLY_OFF,
        override,
      };
    }

    const assignment = await this.resolveAssignment(userId, date);
    if (!assignment) {
      return { isWeeklyOff: false, assignment: null, pattern: null };
    }

    const pattern = await this.patternRepo.findOne({
      where: { id: assignment.workWeekPatternId },
    });
    if (!pattern) {
      return { isWeeklyOff: false, assignment, pattern: null };
    }

    const weekday = this.getWeekday(date);
    const isExplicitOff = pattern.weeklyOffDays.includes(weekday);
    const isExplicitWorking = pattern.workingDays.includes(weekday);

    return {
      isWeeklyOff: isExplicitOff || !isExplicitWorking,
      assignment,
      pattern,
    };
  }

  /**
   * Batch-resolve the active work-week pattern for many users on a given date.
   * Returns a map keyed by userId (null when a user has no active assignment).
   * Used by list endpoints to avoid N+1 lookups.
   */
  async resolveActivePatternsForUsers(
    userIds: string[],
    date: string,
  ): Promise<Map<string, WorkWeekPattern | null>> {
    const result = new Map<string, WorkWeekPattern | null>();
    userIds.forEach((id) => result.set(id, null));
    if (userIds.length === 0) {
      return result;
    }

    const assignments = await this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.userId IN (:...userIds)', { userIds })
      .andWhere('a.effectiveFrom <= :date', { date })
      .andWhere('(a.effectiveTo IS NULL OR a.effectiveTo >= :date)', { date })
      .orderBy('a.effectiveFrom', 'DESC')
      .getMany();

    // First (most recent effectiveFrom) wins per user.
    const activeByUser = new Map<string, EmployeeWorkWeekAssignment>();
    for (const assignment of assignments) {
      if (!activeByUser.has(assignment.userId)) {
        activeByUser.set(assignment.userId, assignment);
      }
    }

    const patternIds = [
      ...new Set(
        [...activeByUser.values()].map((a) => a.workWeekPatternId),
      ),
    ];
    if (patternIds.length === 0) {
      return result;
    }

    const patterns = await this.patternRepo.find({
      where: { id: In(patternIds) },
    });
    const patternById = new Map(patterns.map((p) => [p.id, p]));

    for (const [userId, assignment] of activeByUser) {
      result.set(userId, patternById.get(assignment.workWeekPatternId) ?? null);
    }
    return result;
  }

  private async resolveAssignment(
    userId: string,
    date: string,
  ): Promise<EmployeeWorkWeekAssignment | null> {
    return this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.userId = :userId', { userId })
      .andWhere('a.effectiveFrom <= :date', { date })
      .andWhere('(a.effectiveTo IS NULL OR a.effectiveTo >= :date)', { date })
      .orderBy('a.effectiveFrom', 'DESC')
      .getOne();
  }

  private async findEmployeeByUserId(userId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { userId } });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }
    return employee;
  }

  private async ensureNoOverride(userId: string, date: string): Promise<void> {
    const existing = await this.overrideRepo.findOne({
      where: { userId, date },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Day override already exists for this date');
    }
  }

  private validatePatternDays(
    workingDays: Weekday[],
    weeklyOffDays: Weekday[],
  ): void {
    const duplicate = workingDays.find((day) => weeklyOffDays.includes(day));
    if (duplicate) {
      throw new BadRequestException(
        `Weekday cannot be both working and weekly off: ${duplicate}`,
      );
    }
  }

  private getWeekday(date: string): Weekday {
    const dayIndex = new Date(`${date}T00:00:00`).getDay();
    return [
      Weekday.SUN,
      Weekday.MON,
      Weekday.TUE,
      Weekday.WED,
      Weekday.THU,
      Weekday.FRI,
      Weekday.SAT,
    ][dayIndex];
  }
}
