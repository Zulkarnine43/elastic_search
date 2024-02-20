import { Module, forwardRef } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { MongooseModule } from '@nestjs/mongoose';
import { Product } from '../product/entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from '../category/category.module';
import { Sku } from '../product/entities/sku.entity';
// import { ProductSchema } from 'src/schema/product.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, Sku,
    ]),
    forwardRef(() => CategoryModule),
    ConfigModule,
    // MongooseModule.forFeature([{ name: 'PRODUCTS', schema: ProductSchema }]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [ElasticsearchModule, SearchService],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule { }
