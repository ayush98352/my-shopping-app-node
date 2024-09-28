import { Test, TestingModule } from '@nestjs/testing';
import { CommonLogicService } from './common-logic.service';

describe('CommonLogicService', () => {
  let service: CommonLogicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonLogicService],
    }).compile();

    service = module.get<CommonLogicService>(CommonLogicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
