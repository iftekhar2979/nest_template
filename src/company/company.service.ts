import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './schema/company.schema';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto, actorId?: string): Promise<Company> {
    const existing = await this.companyRepo.findOne({
      where: { companyName: dto.companyName },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException('Company name already exists');
    }
    return this.companyRepo.save(
      this.companyRepo.create({ ...dto, createdBy: actorId ?? null }),
    );
  }

  findAll(): Promise<Company[]> {
    return this.companyRepo.find({ order: { companyName: 'ASC' } });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(
    id: string,
    dto: UpdateCompanyDto,
    actorId?: string,
  ): Promise<Company> {
    await this.findOne(id);
    await this.companyRepo.update({ id }, { ...dto, updatedBy: actorId ?? null });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.companyRepo.softDelete({ id });
    return { message: 'Company deleted successfully' };
  }
}
