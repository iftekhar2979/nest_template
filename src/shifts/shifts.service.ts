import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Employee } from '../employees/schema/employee.schema';
import { Shift } from './schema/shift.schema';
import { ShiftAssignment } from './schema/shift-assignment.schema';
import {
  AssignShiftDto,
  BulkAssignShiftDto,
  CreateShiftDto,
  QueryShiftDto,
  ShiftSortBy,
  UpdateShiftDto,
} from './dto/shift.dto';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import { SortOrder } from '../shared/dto/pagination.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepo: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepo: Repository<ShiftAssignment>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) {}

  // --- Shift CRUD ---

  create(dto: CreateShiftDto, actorId?: string): Promise<Shift> {
    const isOvernight = dto.isOvernight ?? dto.endTime <= dto.startTime;
    return this.shiftRepo.save(
      this.shiftRepo.create({
        ...dto,
        isOvernight,
        createdBy: actorId ?? null,
      }),
    );
  }

  async findAll(
    query: QueryShiftDto,
  ): Promise<{ data: Shift[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? ShiftSortBy.NAME;
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const qb = this.shiftRepo.createQueryBuilder('shift');

    if (query.search) {
      qb.andWhere('shift.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.type) {
      qb.andWhere('shift.type = :type', { type: query.type });
    }
    if (query.isOvernight !== undefined) {
      qb.andWhere('shift.isOvernight = :isOvernight', {
        isOvernight: query.isOvernight,
      });
    }

    qb.orderBy(`shift.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  async findOne(id: string): Promise<Shift> {
    const shift = await this.shiftRepo.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async update(
    id: string,
    dto: UpdateShiftDto,
    actorId?: string,
  ): Promise<Shift> {
    const shift = await this.findOne(id);
    const startTime = dto.startTime ?? shift.startTime;
    const endTime = dto.endTime ?? shift.endTime;
    const isOvernight = dto.isOvernight ?? endTime <= startTime;

    await this.shiftRepo.update(
      { id },
      { ...dto, isOvernight, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.shiftRepo.softDelete({ id });
    return { message: 'Shift deleted successfully' };
  }

  // --- Assignments ---

  async assign(
    dto: AssignShiftDto,
    actorId?: string,
  ): Promise<ShiftAssignment> {
    await this.findOne(dto.shiftId);
    await this.ensureEmployeesExist([dto.userId]);
    return this.assignmentRepo.save(
      this.assignmentRepo.create({
        userId: dto.userId,
        shiftId: dto.shiftId,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
        createdBy: actorId ?? null,
      }),
    );
  }

  async bulkAssign(
    dto: BulkAssignShiftDto,
    actorId?: string,
  ): Promise<{ assigned: number }> {
    await this.findOne(dto.shiftId);
    await this.ensureEmployeesExist(dto.userIds);
    const rows = dto.userIds.map((userId) =>
      this.assignmentRepo.create({
        userId,
        shiftId: dto.shiftId,
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo ?? null,
        createdBy: actorId ?? null,
      }),
    );
    await this.assignmentRepo.save(rows);
    return { assigned: rows.length };
  }

  findAssignmentsForUser(userId: string): Promise<ShiftAssignment[]> {
    return this.assignmentRepo.find({
      where: { userId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async removeAssignment(id: string): Promise<{ message: string }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Shift assignment not found');
    }
    await this.assignmentRepo.softDelete({ id });
    return { message: 'Shift assignment removed successfully' };
  }

  /**
   * Resolve the shift that applies to a user on a given date (YYYY-MM-DD).
   * Picks the most recent assignment whose date range covers the date, then
   * falls back to the employee's default shift.
   */
  async resolveShiftForUser(
    userId: string,
    date: string,
  ): Promise<Shift | null> {
    const assignment = await this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.userId = :userId', { userId })
      .andWhere('a.effectiveFrom <= :date', { date })
      .andWhere('(a.effectiveTo IS NULL OR a.effectiveTo >= :date)', { date })
      .orderBy('a.effectiveFrom', 'DESC')
      .getOne();

    if (assignment) {
      return this.shiftRepo.findOne({ where: { id: assignment.shiftId } });
    }

    const employee = await this.employeeRepo.findOne({
      where: { userId },
      select: ['defaultShiftId'],
    });
    if (!employee?.defaultShiftId) {
      return null;
    }
    return this.shiftRepo.findOne({ where: { id: employee.defaultShiftId } });
  }

  private async ensureEmployeesExist(userIds: string[]): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('At least one userId is required');
    }

    const employees = await this.employeeRepo.find({
      where: { userId: In(uniqueUserIds) },
      select: ['userId'],
    });
    const foundUserIds = new Set(employees.map((employee) => employee.userId));
    const missing = uniqueUserIds.filter((userId) => !foundUserIds.has(userId));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Employee profile not found for userId: ${missing.join(', ')}`,
      );
    }
  }
}
