import { Test, TestingModule } from '@nestjs/testing';
import { UserBadgesService } from './user_badges.service';

describe('UserBadgesService', () => {
  let service: UserBadgesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserBadgesService],
    }).compile();

    service = module.get<UserBadgesService>(UserBadgesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
