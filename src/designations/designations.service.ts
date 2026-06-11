import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from './schema/designation.schema';
import {
  CreateDesignationDto,
  DesignationSortBy,
  QueryDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';
import { pagination } from '../common/pagination/pagination';
import { IPagination } from '../common/pagination/pagination.interface';
import { SortOrder } from '../shared/dto/pagination.dto';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(Designation)
    private readonly designationRepo: Repository<Designation>,
  ) {}

  create(dto: CreateDesignationDto, actorId?: string): Promise<Designation> {
    return this.designationRepo.save(
      this.designationRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  async findAll(
    query: QueryDesignationDto,
  ): Promise<{ data: Designation[]; pagination: IPagination }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? DesignationSortBy.TITLE;
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const qb = this.designationRepo.createQueryBuilder('designation');

    if (query.search) {
      qb.andWhere('designation.title LIKE :search', {
        search: `%${query.search}%`,
      });
    }
    if (query.departmentId) {
      qb.andWhere('designation.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    qb.orderBy(`designation.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, pagination: pagination(limit, page, total) };
  }

  async findOne(id: string): Promise<Designation> {
    const designation = await this.designationRepo.findOne({ where: { id } });
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }
    return designation;
  }

  async update(
    id: string,
    dto: UpdateDesignationDto,
    actorId?: string,
  ): Promise<Designation> {
    await this.findOne(id);
    await this.designationRepo.update(
      { id },
      { ...dto, updatedBy: actorId ?? null },
    );
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.designationRepo.softDelete({ id });
    return { message: 'Designation deleted successfully' };
  }
}
