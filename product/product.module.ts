import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediasoftProviderModule } from 'src/providers/mediasoft/provider.module';
import { Brand } from '../brand/entities/brand.entity';
import { CategoryModule } from '../category/category.module';
import { CategoryBinding } from '../category/entities/category-binding.entity';
import { Category } from '../category/entities/category.entity';
import { BulkProductController } from './controllers/bulk-product.controller';
import { CampaignController } from './controllers/campaign.controller';
import { MediasoftProductController } from './controllers/mediasoft-product.controller';
import { ProductController } from './controllers/product.controller';
import { StorefrontController } from './controllers/storefront.controller';
import { Campaign } from './entities/campaign.entity';
import { ProductLog } from './entities/product-log.entity';
import { Product } from './entities/product.entity';
import { ProductView } from './entities/product.view.entity';
import { SkuAttribute } from './entities/sku-attribute.entity';
import { SkuStock } from './entities/sku-stock.entity';
import { Sku } from './entities/sku.entity';
import { Specification } from './entities/specification.entity';
import { TaskScheduler } from './entities/task-scheduler.entity';
import { BulkProductService } from './services/bulk-product.service';
import { CampaignService } from './services/campaign.service';
import { MediasoftProductService } from './services/mediasoft-product.service';
import { ProductService } from './services/product.service';
import { StorefrontService } from './services/storefront.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      SkuAttribute,
      Specification,
      Sku,
      Category,
      CategoryBinding,
      Brand,
      TaskScheduler,
      ProductLog,
      SkuStock,
      ProductView,
      Campaign,
    ]),
    forwardRef(() => CategoryModule),
    MediasoftProviderModule,
    forwardRef(() => SearchModule),
  ],
  controllers: [
    MediasoftProductController,
    BulkProductController,
    StorefrontController,
    ProductController,
    CampaignController,
  ],
  providers: [
    BulkProductService,
    ProductService,
    StorefrontService,
    MediasoftProductService,
    CampaignService,
  ],
})
export class ProductModule {}
