import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { User } from './schema/users.schema';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn((dto: any) => dto),
      save: jest.fn().mockResolvedValue({
        id: '123abc',
        fullName: 'John Doe',
        email: 'john@example.com',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should validate and create a new user', async () => {
    const rawInput = {
      fullName: 'John Doe',
      userName: 'johnny',
      email: 'john@example.com',
      accessPin: '123456',
      dOB: '2000-01-01',
      height: '180',
      weight: '75',
      weightGoal: 70,
      caloryGoal: 2000,
      protienGoal: 150,
      carbsGoal: 250,
      fatGoal: 60,
      goal: 'lose weight',
      weightType: 'kg',
      heightType: 'cm',
      calorieType: 'cal',
      gender: 'male',
    };

    // 👇 convert plain object to class instance
    const createUserDto = plainToInstance(CreateUserDto, rawInput);

    // 👇 validate DTO manually
    const errors = await validate(createUserDto);
    expect(errors.length).toBe(0); // ✅ assert no validation errors

    // ACT: call service.create()
    const result = await service.create(createUserDto);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        fullName: 'John Doe',
        email: 'john@example.com',
      }),
    );

    // Also check that save was called
    expect(repo.save).toHaveBeenCalled();
  });
});
