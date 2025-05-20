import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { User } from './users.schema';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';

describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;

  beforeEach(async () => {
    const mockSave = jest.fn().mockResolvedValue({
      _id: '123abc',
      fullName: 'John Doe',
      email: 'john@example.com',
    });

    const mockModel = function (this: any, dto: any) {
      Object.assign(this, dto);
      this.save = mockSave;
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<User>>(getModelToken(User.name));
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
        _id: expect.any(String),
        fullName: 'John Doe',
        email: 'john@example.com',
      }),
    );

    // Also check that save was called
    expect(model.prototype.save).toHaveBeenCalled();
  });
});
