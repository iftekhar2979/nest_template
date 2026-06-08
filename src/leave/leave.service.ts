import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmployeesService } from '../employees/employees.service';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import {
  LeaveAccrualMethod,
  LeaveType,
} from './schema/leave-type.schema';
import { LeaveAllocation } from './schema/leave-allocation.schema';
import {
  LeaveLedgerEntry,
  LeaveLedgerType,
} from './schema/leave-ledger-entry.schema';
import {
  AllocateLeaveDto,
  CreateLeaveTypeDto,
  LeaveBalanceDto,
  LeaveTransactionDto,
  LeaveTransactionType,
  QueryAllocationDto,
  QueryLedgerDto,
  RunAccrualDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';

const TXN_TYPE_MAP: Record<LeaveTransactionType, LeaveLedgerType> = {
  [LeaveTransactionType.USAGE]: LeaveLedgerType.USAGE,
  [LeaveTransactionType.ENCASHMENT]: LeaveLedgerType.ENCASHMENT,
  [LeaveTransactionType.ADJUSTMENT]: LeaveLedgerType.ADJUSTMENT,
};

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveType)
    private readonly typeRepo: Repository<LeaveType>,
    @InjectRepository(LeaveAllocation)
    private readonly allocationRepo: Repository<LeaveAllocation>,
    @InjectRepository(LeaveLedgerEntry)
    private readonly ledgerRepo: Repository<LeaveLedgerEntry>,
    private readonly employeesService: EmployeesService,
  ) {}

  // --- Leave types ---

  async createType(dto: CreateLeaveTypeDto, actorId?: string): Promise<LeaveType> {
    const existing = await this.typeRepo.findOne({
      where: { code: dto.code },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Leave type code already exists');
    }
    return this.typeRepo.save(
      this.typeRepo.create({
        ...dto,
        annualEntitlementDays: this.toDecimal(dto.annualEntitlementDays),
        maxCarryForwardDays:
          dto.maxCarryForwardDays === undefined
            ? null
            : this.toDecimal(dto.maxCarryForwardDays),
        createdBy: actorId ?? null,
      }),
    );
  }

  findTypes(): Promise<LeaveType[]> {
    return this.typeRepo.find({ order: { name: 'ASC' } });
  }

  async findType(id: string): Promise<LeaveType> {
    const type = await this.typeRepo.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundException('Leave type not found');
    }
    return type;
  }

  async updateType(
    id: string,
    dto: UpdateLeaveTypeDto,
    actorId?: string,
  ): Promise<LeaveType> {
    await this.findType(id);
    const patch: Partial<LeaveType> = { updatedBy: actorId ?? null };
    Object.assign(patch, dto);
    if (dto.annualEntitlementDays !== undefined) {
      patch.annualEntitlementDays = this.toDecimal(dto.annualEntitlementDays);
    }
    if (dto.maxCarryForwardDays !== undefined) {
      patch.maxCarryForwardDays = this.toDecimal(dto.maxCarryForwardDays);
    }
    await this.typeRepo.update({ id }, patch);
    return this.findType(id);
  }

  async removeType(id: string): Promise<{ message: string }> {
    await this.findType(id);
    await this.typeRepo.softDelete({ id });
    return { message: 'Leave type deleted successfully' };
  }

  // --- Allocation ---

  async allocate(dto: AllocateLeaveDto, actorId?: string): Promise<LeaveAllocation> {
    const type = await this.findType(dto.leaveTypeId);
    const employee = await this.employeesService.findOne(dto.employeeId);

    const existing = await this.allocationRepo.findOne({
      where: {
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        year: dto.year,
      },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(
        'Allocation already exists for this employee, leave type and year',
      );
    }

    const total =
      dto.totalAllocatedDays ?? Number(type.annualEntitlementDays);

    const allocation = await this.allocationRepo.save(
      this.allocationRepo.create({
        employeeId: dto.employeeId,
        userId: employee.userId,
        leaveTypeId: dto.leaveTypeId,
        year: dto.year,
        totalAllocatedDays: this.toDecimal(total),
        fromDate: dto.fromDate ?? null,
        toDate: dto.toDate ?? null,
        createdBy: actorId ?? null,
      }),
    );

    // annual_lump credits the full entitlement immediately; monthly_accrual is
    // credited month-by-month by runMonthlyAccrual().
    if (type.accrualMethod === LeaveAccrualMethod.ANNUAL_LUMP && total > 0) {
      await this.ledgerRepo.save(
        this.ledgerRepo.create({
          employeeId: dto.employeeId,
          userId: employee.userId,
          leaveTypeId: dto.leaveTypeId,
          entryType: LeaveLedgerType.ALLOCATION,
          amountDays: this.toDecimal(total),
          entryDate: dto.fromDate ?? `${dto.year}-01-01`,
          year: dto.year,
          referenceId: allocation.id,
          note: 'Annual allocation',
          createdBy: actorId ?? null,
        }),
      );
    }

    return allocation;
  }

  async getAllocations(
    query: QueryAllocationDto,
  ): Promise<{ data: LeaveAllocation[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.allocationRepo.createQueryBuilder('alloc');

    if (query.employeeId) {
      qb.andWhere('alloc.employeeId = :employeeId', {
        employeeId: query.employeeId,
      });
    }
    if (query.leaveTypeId) {
      qb.andWhere('alloc.leaveTypeId = :leaveTypeId', {
        leaveTypeId: query.leaveTypeId,
      });
    }
    if (query.year) {
      qb.andWhere('alloc.year = :year', { year: query.year });
    }

    qb.orderBy('alloc.year', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  // --- Accrual ---

  /**
   * Credit one month of entitlement (annual / 12) for every monthly-accrual
   * allocation in the given year. Idempotent per (allocation, year-month).
   */
  async runMonthlyAccrual(
    dto: RunAccrualDto,
    actorId?: string,
  ): Promise<{ accrued: number }> {
    const monthlyTypes = await this.typeRepo.find({
      where: { accrualMethod: LeaveAccrualMethod.MONTHLY_ACCRUAL },
    });
    if (monthlyTypes.length === 0) {
      return { accrued: 0 };
    }
    const typeIds = monthlyTypes.map((t) => t.id);

    const allocations = await this.allocationRepo.find({
      where: { year: dto.year, leaveTypeId: In(typeIds) },
    });

    const monthTag = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
    const entryDate = `${monthTag}-01`;
    let accrued = 0;

    for (const allocation of allocations) {
      const referenceId = `${allocation.id}:${monthTag}`;
      const already = await this.ledgerRepo.findOne({
        where: { referenceId, entryType: LeaveLedgerType.ACCRUAL },
        withDeleted: true,
      });
      if (already) {
        continue;
      }
      const monthly = Number(allocation.totalAllocatedDays) / 12;
      if (monthly <= 0) {
        continue;
      }
      await this.ledgerRepo.save(
        this.ledgerRepo.create({
          employeeId: allocation.employeeId,
          userId: allocation.userId,
          leaveTypeId: allocation.leaveTypeId,
          entryType: LeaveLedgerType.ACCRUAL,
          amountDays: this.toDecimal(monthly),
          entryDate,
          year: dto.year,
          referenceId,
          note: `Monthly accrual ${monthTag}`,
          createdBy: actorId ?? null,
        }),
      );
      accrued += 1;
    }

    return { accrued };
  }

  // --- Manual transactions (usage / encashment / adjustment) ---

  async transact(
    dto: LeaveTransactionDto,
    actorId?: string,
  ): Promise<LeaveLedgerEntry> {
    await this.findType(dto.leaveTypeId);
    const employee = await this.employeesService.findOne(dto.employeeId);

    return this.ledgerRepo.save(
      this.ledgerRepo.create({
        employeeId: dto.employeeId,
        userId: employee.userId,
        leaveTypeId: dto.leaveTypeId,
        entryType: TXN_TYPE_MAP[dto.type],
        amountDays: this.toDecimal(dto.amountDays),
        entryDate: dto.entryDate,
        year: Number(dto.entryDate.slice(0, 4)),
        note: dto.note ?? null,
        createdBy: actorId ?? null,
      }),
    );
  }

  // --- Balance & ledger reads ---

  async getBalances(employeeId: string): Promise<LeaveBalanceDto[]> {
    const rows = await this.ledgerRepo
      .createQueryBuilder('l')
      .select('l.leaveTypeId', 'leaveTypeId')
      .addSelect('SUM(l.amountDays)', 'balance')
      .where('l.employeeId = :employeeId', { employeeId })
      .groupBy('l.leaveTypeId')
      .getRawMany<{ leaveTypeId: string; balance: string }>();

    if (rows.length === 0) {
      return [];
    }

    const types = await this.typeRepo.find({
      where: { id: In(rows.map((r) => r.leaveTypeId)) },
    });
    const typeMap = new Map(types.map((t) => [t.id, t]));

    return rows.map((r) => {
      const type = typeMap.get(r.leaveTypeId);
      return {
        leaveTypeId: r.leaveTypeId,
        code: type?.code ?? 'unknown',
        name: type?.name ?? 'Unknown',
        balanceDays: this.round(Number(r.balance)),
      };
    });
  }

  async getLedger(
    employeeId: string,
    query: QueryLedgerDto,
  ): Promise<{ data: LeaveLedgerEntry[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.ledgerRepo
      .createQueryBuilder('l')
      .where('l.employeeId = :employeeId', { employeeId });

    if (query.leaveTypeId) {
      qb.andWhere('l.leaveTypeId = :leaveTypeId', {
        leaveTypeId: query.leaveTypeId,
      });
    }
    if (query.year) {
      qb.andWhere('l.year = :year', { year: query.year });
    }

    qb.orderBy('l.entryDate', 'DESC')
      .addOrderBy('l.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  async resolveEmployeeIdByUser(userId: string): Promise<string> {
    const employee = await this.employeesService.findByUserId(userId);
    return employee.id;
  }

  private toDecimal(value: number): string {
    return value.toFixed(2);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
