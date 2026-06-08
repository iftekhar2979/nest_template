import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from './schema/users.schema';
import { pagination } from 'src/common/pagination/pagination';
import { IPagination } from 'src/common/pagination/pagination.interface';
import { CreateUserDto } from './dto/createUser.dto';
import { RoleType } from './schema/users.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepo.save(
      this.userRepo.create(createUserDto as Partial<User>),
    );
  }

  async createUser(user): Promise<User> {
    return this.userRepo.save(this.userRepo.create(user as Partial<User>));
  }

  async updateProfilePicture(id: string, url: string): Promise<User> {
    await this.userRepo.update({ id }, { avatarUrl: url });
    return this.userRepo.findOne({ where: { id } });
  }

  async checkUserExistWiththeName(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepo.findOne({
      where: { fullName: createUserDto.fullName },
    });
  }

  async checkUserExistWiththeEmail(
    createUserDto: CreateUserDto,
  ): Promise<User> {
    return this.userRepo.findOne({ where: { email: createUserDto.email } });
  }

  async findAll(query: {
    term: string;
    page: string;
    limit: string;
  }): Promise<{ data: User[]; pagination: IPagination }> {
    const page = parseFloat(query.page);
    const limit = parseFloat(query.limit);
    const skip = (page - 1) * limit;

    const term = query.term ?? '';
    const where = [
      { fullName: ILike(`%${term}%`), role: RoleType.CLIENT },
      { email: ILike(`%${term}%`), role: RoleType.CLIENT },
    ];

    const [data, total] = await this.userRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, pagination: pagination(limit, page, total) };
  }

  // Find a user by ID
  findOne(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  count() {
    return this.userRepo.count();
  }

  // Update a user by ID
  async update(id: string, updateUserDto: any): Promise<User> {
    const protectedFields = [
      'password',
      'passwordHash',
      'role',
      'status',
      'isActive',
      'deletedAt',
      'createdBy',
      'updatedBy',
      'isEmailVerified',
      'emailVerifiedAt',
      'activePlanId',
      'subscriptionStatus',
      'accessExpiresAt',
      'lastLoginAt',
      'departmentId',
      'teamId',
    ];

    for (const field of protectedFields) {
      delete updateUserDto[field];
    }

    await this.userRepo.update({ id }, updateUserDto);
    return this.userRepo.findOne({ where: { id } });
  }

  async syncEmployeeMetadata(
    id: string,
    data: Pick<Partial<User>, 'departmentId' | 'fullName' | 'phoneNumber'>,
  ): Promise<User> {
    await this.userRepo.update({ id }, data);
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByEmailIncludingInactive(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase().trim() },
      withDeleted: true,
    });
  }

  async delete(id: string): Promise<any> {
    return this.userRepo.delete({ id });
  }

  async uploadProfilePicture(user: User, file): Promise<any> {
    await this.updateProfilePicture(
      user.id,
      `${file.location.split('/').slice(3, 5).join('/')}`,
    );
    return {
      message: 'Profile Picture Uploaded Successfully',
      data: { url: file.location.split('/').slice(3, 5).join('/') },
    };
  }
}
