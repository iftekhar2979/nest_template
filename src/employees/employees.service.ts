import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './schema/employee.schema';
import {
  BiometricEnrollDto,
  EnrollEmployeeDto,
  EmployeeSortBy,
  QueryEmployeeDto,
  SortOrder,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { UserService } from '../users/users.service';
import { RoleType, User } from '../users/schema/users.schema';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import { WorkweeksService } from '../workweeks/workweeks.service';

type EmployeeNameParts = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  employeeName: string;
};

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly userService: UserService,
    private readonly workweeksService: WorkweeksService,
  ) {}

  /**
   * Enroll a person: provisions the User login (role=employee) and the
   * linked Employee record. Attendance/shifts key on the resulting userId.
   */
  async enroll(dto: EnrollEmployeeDto, actorId?: string): Promise<Employee> {
    const name = this.resolveEmployeeName(dto);
    const existingUser = await this.userService.findByEmailIncludingInactive(
      dto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingCode = await this.employeeRepo.findOne({
      where: { employeeCode: dto.employeeCode },
      withDeleted: true,
    });
    if (existingCode) {
      throw new ConflictException('Employee code already exists');
    }
    await this.ensureAttendanceDeviceIdAvailable(dto.attendanceDeviceId);
    const user = await this.userService.createUser({
      email: dto.email,
      fullName: name.employeeName,
      passwordHash: dto.password, // hashed by User @BeforeInsert
      phoneNumber: dto.phoneNumber ?? null,
      role: RoleType.EMPLOYEE,
      departmentId: dto.departmentId ?? null,
      isEmailVerified: true, // admin-vouched account, can log in immediately
      isTcPpAccepted: true,
    } as Partial<User>);

    return this.employeeRepo.save(
      this.employeeRepo.create({
        userId: user.id,
        employeeCode: dto.employeeCode,
        namingSeries: dto.namingSeries ?? 'HR-EMP-',
        employeeNumber: dto.employeeNumber ?? dto.employeeCode,
        firstName: name.firstName,
        middleName: name.middleName ?? null,
        lastName: name.lastName ?? null,
        employeeName: name.employeeName,
        gender: dto.gender ?? null,
        dateOfBirth: dto.dateOfBirth ?? null,
        employeeStatus: dto.employeeStatus ?? undefined,
        companyId: dto.companyId ?? null,
        departmentId: dto.departmentId ?? null,
        designationId: dto.designationId ?? null,
        reportsToEmployeeId: dto.reportsToEmployeeId ?? null,
        branchId: dto.branchId ?? null,
        gradeId: dto.gradeId ?? null,
        location: dto.location ?? null,
        employmentType: dto.employmentType ?? null,
        joiningDate: dto.joiningDate ?? null,
        offerDate: dto.offerDate ?? null,
        confirmationDate: dto.confirmationDate ?? null,
        contractEndDate: dto.contractEndDate ?? null,
        noticeNumberOfDays: dto.noticeNumberOfDays ?? null,
        dateOfRetirement: dto.dateOfRetirement ?? null,
        defaultShiftId: dto.defaultShiftId ?? null,
        holidayListId: dto.holidayListId ?? null,
        attendanceDeviceId: dto.attendanceDeviceId ?? null,
        cellNumber: dto.phoneNumber ?? null,
        companyEmail: dto.companyEmail ?? dto.email,
        personalEmail: dto.personalEmail ?? null,
        preferredContactEmail: dto.preferredContactEmail ?? 'Company Email',
        preferredEmail: dto.email,
        createdBy: actorId ?? null,
      }),
    );
  }

  async findAll(
    query: QueryEmployeeDto,
  ): Promise<{ data: Employee[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? EmployeeSortBy.CREATED_AT;
    const sortOrder = query.sortOrder ?? SortOrder.DESC;

    const qb = this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .leftJoinAndSelect('employee.defaultShift', 'defaultShift');

    if (query.search) {
      qb.andWhere(
        '(employee.employeeName LIKE :search OR employee.employeeCode LIKE :search OR employee.companyEmail LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.companyId) {
      qb.andWhere('employee.companyId = :companyId', {
        companyId: query.companyId,
      });
    }
    if (query.branchId) {
      qb.andWhere('employee.branchId = :branchId', { branchId: query.branchId });
    }
    if (query.departmentId) {
      qb.andWhere('employee.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }
    if (query.designationId) {
      qb.andWhere('employee.designationId = :designationId', {
        designationId: query.designationId,
      });
    }
    if (query.employeeStatus) {
      qb.andWhere('employee.employeeStatus = :employeeStatus', {
        employeeStatus: query.employeeStatus,
      });
    }
    if (query.employmentType) {
      qb.andWhere('employee.employmentType = :employmentType', {
        employmentType: query.employmentType,
      });
    }
    if (query.reportsToEmployeeId) {
      qb.andWhere('employee.reportsToEmployeeId = :reportsToEmployeeId', {
        reportsToEmployeeId: query.reportsToEmployeeId,
      });
    }
    if (query.gradeId) {
      qb.andWhere('employee.gradeId = :gradeId', { gradeId: query.gradeId });
    }
    if (query.defaultShiftId) {
      qb.andWhere('employee.defaultShiftId = :defaultShiftId', {
        defaultShiftId: query.defaultShiftId,
      });
    }
    if (query.joinedFrom) {
      qb.andWhere('employee.joiningDate >= :joinedFrom', {
        joinedFrom: query.joinedFrom,
      });
    }
    if (query.joinedTo) {
      qb.andWhere('employee.joiningDate <= :joinedTo', {
        joinedTo: query.joinedTo,
      });
    }

    // sortBy is constrained by the EmployeeSortBy enum, so the column is safe
    qb.orderBy(`employee.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    // Attach each employee's currently-active work-week pattern (weekday info).
    const today = new Date().toISOString().slice(0, 10);
    const patternByUser = await this.workweeksService.resolveActivePatternsForUsers(
      data.map((employee) => employee.userId),
      today,
    );
    for (const employee of data) {
      employee.workWeekPattern = patternByUser.get(employee.userId) ?? null;
    }

    return { data, pagination: pagination(limit, page, total) };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async findByUserId(userId: string): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({ where: { userId } });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }
    return employee;
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
    actorId?: string,
  ): Promise<Employee> {
    const employee = await this.findOne(id);
    if (dto.employeeCode) {
      const clash = await this.employeeRepo.findOne({
        where: { employeeCode: dto.employeeCode },
        withDeleted: true,
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('Employee code already exists');
      }
    }

    if (dto.attendanceDeviceId) {
      await this.ensureAttendanceDeviceIdAvailable(dto.attendanceDeviceId, id);
    }

    const update: Partial<Employee> = { ...dto, updatedBy: actorId ?? null };
    if (this.hasNameChange(dto)) {
      const name = this.resolveEmployeeName({
        firstName: dto.firstName ?? employee.firstName,
        middleName:
          dto.middleName === undefined ? employee.middleName : dto.middleName,
        lastName: dto.lastName === undefined ? employee.lastName : dto.lastName,
        fullName: employee.employeeName,
      });
      update.firstName = name.firstName;
      update.middleName = name.middleName ?? null;
      update.lastName = name.lastName ?? null;
      update.employeeName = name.employeeName;
    }

    await this.employeeRepo.update({ id }, update);
    const userMetadata: Pick<
      Partial<User>,
      'departmentId' | 'fullName' | 'phoneNumber'
    > = {};
    if (Object.prototype.hasOwnProperty.call(dto, 'departmentId')) {
      userMetadata.departmentId = dto.departmentId ?? null;
    }
    if (update.employeeName) {
      userMetadata.fullName = update.employeeName;
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'cellNumber')) {
      userMetadata.phoneNumber = dto.cellNumber ?? null;
    }
    if (Object.keys(userMetadata).length > 0) {
      await this.userService.syncEmployeeMetadata(
        employee.userId,
        userMetadata,
      );
    }
    return this.findOne(id);
  }

  async enrollBiometric(
    id: string,
    dto: BiometricEnrollDto,
    actorId?: string,
  ): Promise<Employee> {
    await this.findOne(id);
    await this.employeeRepo.update(
      { id },
      {
        biometricModality: dto.biometricModality,
        biometricTemplateRef: dto.biometricTemplateRef,
        biometricDeviceVendor: dto.biometricDeviceVendor ?? null,
        biometricEnrolledAt: new Date(),
        updatedBy: actorId ?? null,
      },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.employeeRepo.softDelete({ id });
    return { message: 'Employee deleted successfully' };
  }

  private async ensureAttendanceDeviceIdAvailable(
    attendanceDeviceId?: string,
    ignoreEmployeeId?: string,
  ): Promise<void> {
    if (!attendanceDeviceId) {
      return;
    }
    const existing = await this.employeeRepo.findOne({
      where: { attendanceDeviceId },
      withDeleted: true,
    });
    if (existing && existing.id !== ignoreEmployeeId) {
      throw new ConflictException('Attendance device ID already exists');
    }
  }

  private hasNameChange(dto: UpdateEmployeeDto): boolean {
    return ['firstName', 'middleName', 'lastName'].some((field) =>
      Object.prototype.hasOwnProperty.call(dto, field),
    );
  }

  private resolveEmployeeName(dto: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
  }): EmployeeNameParts {
    const fullName = dto.fullName?.trim();
    const firstName =
      dto.firstName?.trim() ?? (fullName ? fullName.split(/\s+/)[0] : '');

    if (!firstName) {
      throw new BadRequestException('firstName or fullName is required');
    }

    const middleName = dto.middleName?.trim() || undefined;
    const lastName = dto.lastName?.trim() || undefined;
    const employeeName =
      [firstName, middleName, lastName].filter(Boolean).join(' ') || fullName;

    return {
      firstName,
      middleName,
      lastName,
      employeeName,
    };
  }
}
