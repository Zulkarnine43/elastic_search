import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../services/product.service';
import { ProductController } from './product.controller';
import { StorefrontController } from './storefront.controller';

describe('StorefrontController', () => {
  let controller: StorefrontController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [ProductService],
    }).compile();

    controller = module.get<StorefrontController>(StorefrontController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
