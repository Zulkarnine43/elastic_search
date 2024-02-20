import { Test, TestingModule } from '@nestjs/testing';
import { BulkProductService } from '../services/bulk-product.service';
import { BulkProductController } from './bulk-product.controller';

describe('BulkProductController', () => {
  let controller: BulkProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BulkProductController],
      providers: [BulkProductService],
    }).compile();

    controller = module.get<BulkProductController>(BulkProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
