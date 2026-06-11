import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './schema/department.schema';
import {
  CreateDepartmentDto,
  DepartmentSortBy,
  QueryDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import { SortOrder } from '../shared/dto/pagination.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async create(
    dto: CreateDepartmentDto,
    actorId?: string,
  ): Promise<Department> {
    const existing = await this.departmentRepo.findOne({
      where: { departmentName: dto.departmentName },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Department name already exists');
    }
    return this.departmentRepo.save(
      this.departmentRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  async findAll(
    query: QueryDepartmentDto,
  ): Promise<{ data: Department[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? DepartmentSortBy.DEPARTMENT_NAME;
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const qb = this.departmentRepo.createQueryBuilder('department');

    if (query.search) {
      qb.andWhere('department.departmentName LIKE :search', {
        search: `%${query.search}%`,
      });
    }
    if (query.parentDepartment) {
      qb.andWhere('department.parentDepartment = :parentDepartment', {
        parentDepartment: query.parentDepartment,
      });
    }
    if (query.isGroup !== undefined) {
      qb.andWhere('department.isGroup = :isGroup', { isGroup: query.isGroup });
    }
    if (query.disabled !== undefined) {
      qb.andWhere('department.disabled = :disabled', {
        disabled: query.disabled,
      });
    }

    qb.orderBy(`department.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async update(
    id: string,
    dto: UpdateDepartmentDto,
    actorId?: string,
  ): Promise<Department> {
    await this.findOne(id);
    await this.departmentRepo.update(
      { id },
      { ...dto, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.departmentRepo.softDelete({ id });
    return { message: 'Department deleted successfully' };
  }
}
